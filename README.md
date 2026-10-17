# BeyondFlow: Autonomous Treasury & Intent Vault Governed by ArmorIQ

An autonomous AI treasury and voice support agent. ElevenLabs handles the call, and ArmorIQ decides what the agent is allowed to do.

*Submitted to the ArmorIQ Flow State – Global AI Hackathon (October 2026).*

## Quick links
- **Live app and supervisor console**: https://flowguard-treasury.vercel.app
- **Explainer video (03:49)**: https://flowguard-treasury.vercel.app/video
- **Judges' evaluation page**: https://flowguard-treasury.vercel.app/judges
- **How it works**: https://flowguard-treasury.vercel.app/how-it-works
- **Live MCP endpoint**: https://flowguard-treasury.vercel.app/mcp (JSON-RPC 2.0 over SSE, spec 2024-11-05)
- **Repository**: https://github.com/vikassharma270907-alt/flowguard-treasury
- **ArmorIQ docs**: https://docs.armoriq.ai

## 1. Summary
Connecting a language model directly to payment systems invites prompt injection, unauthorized payout changes, and hallucinated actions. BeyondFlow places ArmorIQ between an ElevenLabs voice agent and a treasury MCP server. Every tool call is planned, signed, and checked against stored policy before it reaches the tool.

```text
Caller (voice)
   │
   ▼
ElevenLabs Conversational AI agent
   │  webhook tool call (BeyondFlow_<tool>)
   ▼
BeyondFlow gateway
   │  1. capturePlan()        2. getIntentToken()
   ▼
ArmorIQ policy proxy (proxy.armoriq.ai)
   │
   ├── ALLOWED  lookup_order
   ├── BLOCKED  change_payout      (tool_not_in_allowlist, HTTP 403)
   └── HELD     issue_refund       (delegation pending, two supervisor approvals)
   │
   ▼
Treasury MCP server (/mcp)
```

### The 45-second call
- **Allowed:** A caller asks about order `ORD-1001`. The agent calls `lookup_order`. ArmorIQ matches policy `flowguard-treasury-allowlist`, verifies the intent token, and allows the read. The agent reads out the status.
- **Blocked:** The caller tries prompt injection: they ask for future vendor payouts to be redirected to an external account. The agent calls `change_payout`. ArmorIQ blocks it before it reaches the tool, returning `PolicyBlockedException: tool_not_in_allowlist (HTTP 403)`. Nothing is changed.
- **Held:** The caller asks for an $89 refund. Refunds are outbound money, so ArmorIQ holds the call through the delegation API (`POST /delegation/request`). On the supervisor console, Deny makes the agent refuse the refund. Approve counts toward two approvals, and the second approval releases the payout.

*All data is synthetic sandbox data (`ORD-1001` to `ORD-1004`, mock accounts). No real customer data or production payment rails are used.*

## 2. Hackathon rules compliance

| Rule | Requirement | How BeyondFlow meets it | Status |
|---|---|---|---|
| 1 | Functional ArmorIQ integration | `capturePlan`, `getIntentToken`, and enforcement through proxy.armoriq.ai | Pass |
| 2 | ElevenLabs does not replace ArmorIQ | ElevenLabs is the voice layer only. ArmorIQ governs every tool call. | Pass |
| 3 | Any framework or language | TypeScript/Node.js gateway, Express, Vite and React frontend, ElevenLabs Conversational SDK | Pass |
| 4 | At least one MCP server | Treasury MCP server, spec 2024-11-05, at `/mcp` | Pass |
| 5 | Core development in the hackathon window | Gateway, ArmorIQ integration, supervisor quorum, and explainer video built in the window. Pre-window code is listed in Section 8. | Pass (see Section 8) |
| 6 | Pre-existing code disclosed | Listed in `DISCLOSURES.md` and on `/judges` | Pass |
| 7 | Sandbox data only | Synthetic orders and accounts. No real PII or production banking rails. | Pass |
| 8 | Real ArmorIQ enforcement | Allow, block, and hold results come from ArmorIQ responses. The gateway has no allow/deny rules for MCP tools. | Pass (see Section 9) |
| 9 | No attacks on infrastructure | All tests run against our own agent, MCP server, and ArmorIQ workspace | Pass |
| 10 | Platform onboarding and API keys | Organization, agent, MCP server, and policy set up on platform.armoriq.ai | Pass |

## 3. Required deliverables

### Allowed: `lookup_order`
- **Route:** ElevenLabs → gateway → ArmorIQ proxy → MCP server
- **Result:** ALLOWED, returns `{"found":true,"order":{"order_id":"ORD-1001","status":"delivered","total":89,"currency":"USD"}}`
- **Latency:** 887 ms (from the JSON raw run capture)
- **Plan hash:** `b3e6889f…`

### Blocked: `change_payout`
- **Route:** ElevenLabs → gateway → ArmorIQ proxy
- **Result:** BLOCKED, `PolicyBlockedException`, HTTP 403, reason `tool_not_in_allowlist`, matched policy `flowguard-treasury-allowlist`
- **Latency:** 764 ms (from the JSON raw run capture)
- **Effect:** the call stops at the proxy, so no payout changes.

### Held: `issue_refund`
- **Route:** ElevenLabs → gateway → ArmorIQ delegation API
- **Result:** HELD, delegation status pending
- **Delegation ID:** `eb63aac7-349a-4cf0-a156-a2f3c469f427` (from the JSON raw run capture)
- **Release:** after two supervisor approvals. The approval counter runs in the gateway (see Section 9).

## 4. ArmorIQ platform records
- **Organization:** Workspace on platform.armoriq.ai
- **Agent:** `flowguard-agent` (UUID c8bcbe51-dea4-4459-9fd8-38f88ebc714e)
- **MCP server:** `flowguard-treasury-mcp` (UUID 7540cd0a-7d76-414a-a849-96b337a0c6ed), public endpoint `https://flowguard-treasury.vercel.app/mcp`, tools `lookup_order`, `change_payout`, `issue_refund`
- **Policy:** `flowguard-treasury-allowlist` (UUID 23f8f304-0f6b-44a0-9bba-fa9886ca611b), allowed tools `lookup_order` and `issue_refund`, default action block, priority 100

## 5. Architecture
```text
CALLER & VOICE
  Caller speech → ElevenLabs agent (speech-to-intent, webhook tool calls)

BEYONDFLOW GATEWAY (port: 8790)
  1. Strip tool prefix (BeyondFlow_<tool> → <tool>)
  2. Reply to ElevenLabs quickly so the call keeps moving
  3. capturePlan(llm, goal, steps)
  4. getIntentToken(planId, policyContext)

ARMORIQ POLICY PROXY (proxy.armoriq.ai)
  • Validates token signature and Merkle inclusion proof
  • Evaluates stored policy (flowguard-treasury-allowlist)
  • Returns ALLOW / BLOCK / DELEGATE

TREASURY MCP SERVER (flowguard-treasury.vercel.app/mcp)
  • MCP 2024-11-05, SSE responses (event: message, data: {...})
  • Synthetic sandbox data: orders, balances, vendor routing
```

## 6. Voice-specific engineering notes
- **Sub-5-second tool window:** ElevenLabs times out tool webhooks at roughly five seconds. Held calls get an immediate reply: "A supervisor has been notified to review your refund. One moment please." The gateway keeps the call state and passes the final decision back through `check_supervisor_decision`, so the caller hears the result without the call dropping. Measured full E2E latency for lookups is ~3.2–3.6s (as noted in DX_NOTES), staying under the 5s ElevenLabs threshold. ArmorIQ specific processing latency is much smaller (~887ms for lookup, ~764ms for block).
- **Tool-name prefixes:** ElevenLabs namespaces tools (`BeyondFlow_<tool>`). Passing those names to ArmorIQ breaks policy matching. The gateway strips the prefix before planning and dispatch.

## 7. Explainer video
**Page:** https://flowguard-treasury.vercel.app/video
**Length:** 03:49 (229 s), 1080p, H.264/AAC (MP4); VP9/Opus (WebM)
**Narration:** ElevenLabs voiceover

| Scene | Time | Title | Content |
|---|---|---|---|
| 1 | 0:00–0:17 | The problem | Why voice AI needs guardrails before it touches money |
| 2 | 0:17–0:30 | Meet BeyondFlow | ElevenLabs interface governed by ArmorIQ |
| 3 | 0:30–0:56 | Architecture | Caller → ElevenLabs → gateway → ArmorIQ → MCP |
| 4 | 0:56–1:22 | ElevenLabs usage | Hold pattern, parameter extraction, voiceover |
| 5 | 1:22–1:55 | ArmorIQ usage | `capturePlan`, `getIntentToken`, proxy invoke, quorum |
| 6 | 1:55–2:54 | Setup | Seven-step setup: onboarding, policies, env, webhooks, tests |
| 7 | 2:54–3:23 | Boundary test | Live terminal recording: ALLOWED, BLOCKED, HELD |
| 8 | 3:23–3:45 | Differences | Cryptographic enforcement vs post-hoc evaluation and blanket keys |
| 9 | 3:45–3:58 | Close | Sandbox disclosure, licenses, platform references |

## 8. Lineage and disclosures
- **Pre-window and reused code:** The gateway and MCP tool structure reuse adapted components from the author's earlier MIT-licensed IntentGate prototype. The ArmorIQ integration, policy enforcement, ElevenLabs agent wiring, and audit ledger work were built for this hackathon. The following were built before the hackathon window and are listed in `DISCLOSURES.md`:
  - The IntentGate prototype components
  - The India-focused header and footer system
  - The 3D and light/dark theme components
- **Sandbox:** All orders, accounts, and customer names are synthetic. No real money or PII is processed.
- **Licenses:** Application code MIT. Typography under the SIL Open Font License (Inter, JetBrains Mono, Noto Sans Devanagari).

## 9. Known limitations
- **Direct MCP access:** The `/mcp` endpoint currently runs without an auth token because the ArmorIQ proxy needs to reach it. **Therefore, the strict `change_payout` policy block is enforced solely on the ArmorIQ proxy path.** Bypassing the proxy allows the call to go through, demonstrating that the security mechanism is reliant on the proxy gating.
- **Intent binding is partial:** In our mismatch test, a token for one action is refused for a different action, and expired tokens are refused. A swapped amount was not refused. Parameter-level binding is not claimed.
- **Quorum is gateway-side:** ArmorIQ decides the call is held and records the delegation. The gateway counts the two supervisor approvals before release.
- **Settlement module uses local rules:** The duplicate and reserve checks in `server/armorPayService.js` are our own code, not ArmorIQ's ArmorPay product or policy engine.
- **Local supervisor playground:** The playground runs at `http://localhost:8790/playground` in development. The video shows it in use.

## 10. Reproduce it
```bash
git clone https://github.com/vikassharma270907-alt/flowguard-treasury.git
cd flowguard-treasury
npm install
npm test                                     # unit tests
node scripts/verify-keyboard.mjs             # keyboard accessibility checks
cp .env.example .env                         # add ARMORIQ_API_KEY from platform.armoriq.ai
node --env-file=.env scripts/test-enforcement.mjs        # allowed / blocked / held
node --env-file=.env scripts/test-intent-mismatch.mjs    # intent binding
```

Query the live MCP endpoint:
```bash
curl -X POST https://flowguard-treasury.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected output of `test-enforcement.mjs` (confirm against the raw capture before submitting):
```text
  lookup_order     ALLOWED
  change_payout    BLOCKED  (reason: tool_not_in_allowlist)
  issue_refund     HELD     (status: pending)
```

## 11. Evidence
- `docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json`: raw run capture
- `docs/evidence/` and `EVIDENCE.md`: audit logs and Merkle proof outputs
- `DX_NOTES.md`: timeout pattern, prefixes, measured latencies, approval counter
- `DISCLOSURES.md`: all pre-existing code, AI assistants, open-source packages
- `ARMORIQ_ONBOARDING.md`: platform onboarding walkthrough
- `docs/BeyondFlow_Overview.pdf` and `docs/USER_GUIDE.pdf`
- **License:** MIT.
