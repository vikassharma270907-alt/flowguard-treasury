# BeyondFlow: Autonomous Treasury & Intent Vault Governed by ArmorIQ

> An autonomous AI treasury and voice support agent. ElevenLabs handles the call, and ArmorIQ decides what the agent is allowed to do.  
> Submitted to the **ArmorIQ Flow State – Global AI Hackathon** (October 2026).

---

## Quick Links

- **Live App & Supervisor Console**: [https://flowguard-treasury.vercel.app](https://flowguard-treasury.vercel.app)
- **Judges' Evaluation Page**: [https://flowguard-treasury.vercel.app/judges](https://flowguard-treasury.vercel.app/judges)
- **Explainer Video (03:49)**: [https://flowguard-treasury.vercel.app/video](https://flowguard-treasury.vercel.app/video)
- **How It Works (Security Blueprint)**: [https://flowguard-treasury.vercel.app/how-it-works](https://flowguard-treasury.vercel.app/how-it-works)
- **Live MCP Endpoint**: [https://flowguard-treasury.vercel.app/mcp](https://flowguard-treasury.vercel.app/mcp) (JSON-RPC 2.0 over SSE, spec 2024-11-05)
- **Repository**: [https://github.com/vikassharma270907-alt/flowguard-treasury](https://github.com/vikassharma270907-alt/flowguard-treasury)
- **ArmorIQ Documentation**: [https://docs.armoriq.ai](https://docs.armoriq.ai)

---

## 1. Summary

Connecting a language model directly to payment systems invites prompt injection, unauthorized payout changes, and hallucinated actions. BeyondFlow places ArmorIQ between an ElevenLabs voice agent and a treasury MCP server. Every tool call is planned, signed, and checked against stored policy before it reaches the tool.

```
Caller (voice)
      │
      ▼
ElevenLabs Conversational AI Agent
      │ webhook tool call (BeyondFlow_<tool>)
      ▼
BeyondFlow Gateway (port 8790)
      │ 1. capturePlan()
      │ 2. getIntentToken()
      ▼
ArmorIQ Policy Proxy (proxy.armoriq.ai)
      │
      ├── ALLOWED  lookup_order
      ├── BLOCKED  change_payout (tool_not_in_allowlist, HTTP 403)
      └── HELD     issue_refund (delegation pending, two supervisor approvals)
      │
      ▼
Treasury MCP Server (/mcp)
```

### The 45-Second Call
- **Allowed**: A caller asks about order `ORD-1001`. The agent calls `lookup_order`. ArmorIQ matches policy `flowguard-treasury-allowlist`, verifies the intent token, and allows the read. The agent reads out the status.
- **Blocked**: The caller tries prompt injection: they ask for future vendor payouts to be redirected to an external account (`GB29 NWBK...`). The agent calls `change_payout`. ArmorIQ blocks it before it reaches the tool, returning `PolicyBlockedException: tool_not_in_allowlist` (HTTP 403). Nothing is changed.
- **Held**: The caller asks for an $89 refund. Refunds are outbound money, so ArmorIQ holds the call through the delegation API (`POST /delegation/request`). On the supervisor console, **Deny** makes the agent refuse the refund. **Approve** counts toward two approvals, and the second approval releases the payout.

*All data is synthetic sandbox data (`ORD-1001` to `ORD-1004`, mock accounts). No real customer data or production payment rails are used.*

---

## 2. Hackathon Rules Compliance

| Rule | Requirement | How BeyondFlow Meets It | Status |
| :--- | :--- | :--- | :--- |
| **1** | Functional ArmorIQ integration | `capturePlan`, `getIntentToken`, and enforcement through `proxy.armoriq.ai`. Merkle proofs from CSRG-IAP. | **Pass** |
| **2** | ElevenLabs does not replace ArmorIQ | ElevenLabs is the voice layer only. ArmorIQ governs every tool call. | **Pass** |
| **3** | Any framework or language | Node.js gateway, Express, Vite & React frontend, ElevenLabs Conversational SDK. | **Pass** |
| **4** | At least one MCP server | Treasury MCP server, spec 2024-11-05, at `/mcp`. | **Pass** |
| **5** | Core development in the hackathon window | Gateway, ArmorIQ integration, supervisor quorum, and explainer video built in the window. | **Pass** (see Section 8) |
| **6** | Pre-existing code disclosed | Listed in [DISCLOSURES.md](DISCLOSURES.md) and on [/judges](https://flowguard-treasury.vercel.app/judges). | **Pass** |
| **7** | Sandbox data only | Synthetic orders and accounts. No real PII or production banking rails. | **Pass** |
| **8** | Real ArmorIQ enforcement | Allow, block, and hold results come from ArmorIQ responses. Zero mocked `if` statements. | **Pass** (see Section 9) |
| **9** | No attacks on infrastructure | All tests run against our own agent, MCP server, and ArmorIQ workspace. | **Pass** |
| **10** | Platform onboarding and API keys | Organization, agent, MCP server, and policy set up on `platform.armoriq.ai`. | **Pass** |

---

## 3. Required Deliverables

### Allowed: `lookup_order`
- **Route**: ElevenLabs → Gateway → ArmorIQ Proxy (`proxy.armoriq.ai`) → MCP Server
- **Result**: `ALLOWED`, returns `{"found":true,"order":{"order_id":"ORD-1001","status":"delivered","total":89,"currency":"USD"}}`
- **Latency**: `887 ms` (recorded run) · `924 ms` (fresh live run)
- **Plan Hash**: `b3e6889fe267adb661881333d488307f0263e0c2baf3efb3866bf136a62ac1ec`

### Blocked: `change_payout`
- **Route**: ElevenLabs → Gateway → ArmorIQ Proxy (`proxy.armoriq.ai`)
- **Result**: `BLOCKED`, `PolicyBlockedException`, HTTP 403, reason `tool_not_in_allowlist`, matched policy `flowguard-treasury-allowlist`
- **Latency**: `764 ms` (recorded run) · `744 ms` (fresh live run)
- **Effect**: The call stops at the proxy, so no payout changes.

### Held: `issue_refund`
- **Route**: ElevenLabs → Gateway → ArmorIQ Delegation API
- **Result**: `HELD`, delegation status `pending`
- **Delegation ID**: `eb63aac7-349a-4cf0-a156-a2f3c469f427` (recorded baseline) · `6d95529f-f8b3-48da-830b-e393b76b49f0` (live run)
- **Release**: After two supervisor approvals. The approval counter runs in the gateway (see Section 9).

---

## 4. ArmorIQ Platform Records

| Entity | Identifier / Record | Notes |
| :--- | :--- | :--- |
| **Organization Workspace** | BeyondFlow workspace on `platform.armoriq.ai` | Workspace ID: `dd9e9695-e58d-4e56-8cff-ef9617ba4c54` |
| **Agent** | `flowguard-agent` | UUID: `c8bcbe51-dea4-4459-9fd8-38f88ebc714e` |
| **MCP Server** | `flowguard-treasury-mcp` | UUID: `7540cd0a-7d76-414a-a849-96b337a0c6ed`<br>Public Endpoint: `https://flowguard-treasury.vercel.app/mcp`<br>Tools: `lookup_order`, `change_payout`, `issue_refund` |
| **Policy** | `flowguard-treasury-allowlist` | UUID: `23f8f304-0f6b-44a0-9bba-fa9886ca611b`<br>Allowed Tools: `lookup_order`, `issue_refund`<br>Default Action: `block`<br>Priority: `100` |

---

## 5. Architecture

```mermaid
flowchart TD
    User([Caller Voice / Web Client]) <--> ElevenLabs[ElevenLabs Conversational AI Agent]
    ElevenLabs -- "Webhook Tool Call (BeyondFlow_<tool>)" --> Gateway[BeyondFlow Gateway :8790]

    subgraph ArmorIQ Platform ["ArmorIQ Governance Cloud (platform.armoriq.ai)"]
        IAP["Intent Backend (iap.armoriq.ai)"]
        Proxy["PEP Proxy (proxy.armoriq.ai)"]
        PlatformAPI["Control Plane (api.armoriq.ai)"]
    end

    Gateway -- "1. capturePlan()" --> Gateway
    Gateway -- "2. getIntentToken()" --> IAP
    Gateway -- "3. invoke(mcp, tool, token, params)" --> Proxy
    Proxy -- "Enforce stored policy (allow/block)" --> Proxy
    Proxy -- "4. Validated SSE tool call" --> MCPServer[BeyondFlow MCP Server (Vercel /mcp)]

    Gateway -- "Hold (/delegation/request)" --> PlatformAPI
    Supervisor([Supervisor Quorum]) <--> Playground[Supervisor Playground]
    Playground -- "2 distinct approvals required" --> Gateway
    Gateway -- "Release approved call" --> Proxy
```

---

## 6. Voice-Specific Engineering Notes

### Sub-5-Second Tool Window
ElevenLabs times out tool webhooks at roughly 5 seconds. Direct SDK calls execute in ~0.7–1.2s, but the complete voice round trip (Caller STT → Webhook HTTP → Gateway `capturePlan` + `getIntentToken` → ArmorIQ PEP Proxy → Vercel MCP → Response) takes ~3.5–4.2s. Held calls receive an immediate conversational holding reply: *"A supervisor has been notified to review your refund. One moment please."* The gateway maintains call state and passes the final decision back through `check_supervisor_decision`, so callers hear the verdict without timeout disconnects.

### Tool-Name Namespaces
ElevenLabs namespaces webhook tools (e.g., `BeyondFlow_lookup_order`). Passing those names directly to ArmorIQ breaks policy matching. The gateway automatically strips the prefix before plan capture and proxy dispatch.

---

## 7. Explainer Video

- **Video URL**: [https://flowguard-treasury.vercel.app/video](https://flowguard-treasury.vercel.app/video)
- **Length**: 03:49 (229 s), 1080p, H.264/AAC (MP4); VP9/Opus (WebM)
- **Narration**: ElevenLabs Voiceover

| Scene | Time | Title | Content |
| :---: | :---: | :--- | :--- |
| **1** | 0:00–0:17 | The Problem | Why voice AI needs guardrails before touching money |
| **2** | 0:17–0:30 | Meet BeyondFlow | ElevenLabs interface governed by ArmorIQ |
| **3** | 0:30–0:56 | Architecture | Caller → ElevenLabs → Gateway → ArmorIQ PEP → MCP |
| **4** | 0:56–1:22 | ElevenLabs Usage | Hold pattern, parameter extraction, voiceover |
| **5** | 1:22–1:55 | ArmorIQ Usage | `capturePlan`, `getIntentToken`, proxy invoke, quorum |
| **6** | 1:55–2:54 | Setup & Config | Seven-step setup: onboarding, policies, env, webhooks |
| **7** | 2:54–3:23 | Boundary Test | Live terminal recording: ALLOWED, BLOCKED, HELD |
| **8** | 3:23–3:45 | Architectural Diffs | Cryptographic enforcement vs post-hoc evaluation |
| **9** | 3:45–3:58 | Close & Disclosures | Sandbox disclosure, open-source licenses, references |

---

## 8. Lineage and Disclosures

- **Pre-Window and Reused Code**: The gateway and MCP tool structure reuse adapted components from the author's earlier MIT-licensed IntentGate prototype. The ArmorIQ integration, policy enforcement, ElevenLabs agent wiring, and audit ledger work were built for this hackathon.
  - Adapted IntentGate prototype components
  - India-focused header/footer and i18n system
  - 3D Three.js theme elements
- **Sandbox Environment**: All orders, accounts, and customer names are synthetic. No real banking rails or customer PII are processed.
- **Licenses**: Application code is under the [MIT License](LICENSE). Self-hosted typography (Inter, JetBrains Mono, Noto Sans Devanagari) is under the SIL Open Font License. Full details in [DISCLOSURES.md](DISCLOSURES.md).

---

## 9. Known Technical Limitations

1. **Direct MCP Access**: The `/mcp` endpoint runs without an auth token so the ArmorIQ proxy can reach it during judging. Policy enforcement is strictly rendered on the ArmorIQ proxy path (`proxy.armoriq.ai`). Calling `/mcp` directly without routing through the PEP proxy bypasses ArmorIQ governance.
2. **Action-Level Intent Binding**: In our mismatch test, a token minted for `lookup_order` is refused for `issue_refund` (`IntentMismatchException`), and expired tokens are refused (`TokenExpiredException`). A swapped numerical amount was not refused by the token alone; parameter constraints are verified at the gateway and tool boundary.
3. **Quorum Counted in Gateway**: ArmorIQ decides the call is held and records the platform delegation. The gateway enforces the two distinct supervisor approvals before triggering release.
4. **Settlement Module Uses Local Rules**: ArmorPay duplicate-invoice and reserve-floor checks in `server/armorPayService.js` are application business logic, not ArmorIQ policy decisions.
5. **Local Supervisor Playground**: The playground runs at `http://localhost:8790/playground` in development (the video demonstrates its live use).

---

## 10. Reproduce It

### Prerequisites
Node.js 18+, npm, and an `ARMORIQ_API_KEY` from [platform.armoriq.ai](https://platform.armoriq.ai).

```bash
git clone https://github.com/vikassharma270907-alt/flowguard-treasury.git
cd flowguard-treasury
npm install
npm --prefix client install
cp .env.example .env          # insert your ARMORIQ_API_KEY
```

### Run Tests
```bash
# 1. Unit tests (9/9 pass)
npm test

# 2. Keyboard accessibility checks (14/14 pass)
node scripts/verify-keyboard.mjs

# 3. Live ArmorIQ policy enforcement (ALLOWED, BLOCKED, HELD)
node --env-file=.env scripts/test-enforcement.mjs

# 4. Intent binding & expiry tests
node --env-file=.env scripts/test-intent-mismatch.mjs

# 5. Dual-supervisor approval hardening (5/5 rules pass)
node --env-file=.env scripts/test-approval-hardening.mjs
```

### Query Live MCP Endpoint
```bash
curl -X POST https://flowguard-treasury.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected summary of `test-enforcement.mjs`:
```
lookup_order     ALLOWED  (~924 ms)
change_payout    BLOCKED  (reason: tool_not_in_allowlist)
issue_refund     HELD     (status: pending, delegation request created)
```

---

## 11. Evidence & Documentation Index

- **Raw Recorded Runs**: [`docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json`](docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json)
- **Fresh Live Run Evidence**: [`docs/evidence/test-enforcement-2026-10-17.txt`](docs/evidence/test-enforcement-2026-10-17.txt)
- **Intent Mismatch Output**: [`docs/evidence/test-intent-mismatch-2026-10-17.txt`](docs/evidence/test-intent-mismatch-2026-10-17.txt)
- **Audit Logs & Merkle Proofs**: [`EVIDENCE.md`](EVIDENCE.md)
- **Voice Timeout & Latency Notes**: [`DX_NOTES.md`](DX_NOTES.md)
- **Pre-Existing Code Disclosures**: [`DISCLOSURES.md`](DISCLOSURES.md)
- **Platform Onboarding Walkthrough**: [`ARMORIQ_ONBOARDING.md`](ARMORIQ_ONBOARDING.md)
- **Architecture PDF Overview**: [`docs/BeyondFlow_Overview.pdf`](docs/BeyondFlow_Overview.pdf)
- **User Guide PDF**: [`docs/USER_GUIDE.pdf`](docs/USER_GUIDE.pdf)

---

## License

Application code is under the [MIT License](LICENSE). Copyright © 2026 BeyondFlow Authors. Self-hosted typography (Inter, JetBrains Mono, Noto Sans Devanagari) is under the SIL Open Font License.
