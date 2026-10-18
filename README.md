# BeyondFlow: Autonomous Treasury & Intent Vault Governed by ArmorIQ

> An autonomous voice support agent whose MCP tool calls are allowed, blocked, or held by ArmorIQ before they can touch money.  
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

> [!NOTE]
> **Naming & Platform Object Mapping**: 
> - **Product Brand**: **BeyondFlow** (unified user-facing application name).
> - **Platform Agent & Policy**: `flowguard-agent` (UUID `c8bcbe51-dea4-4459-9fd8-38f88ebc714e`) governed by policy `flowguard-treasury-allowlist` (UUID `23f8f304-0f6b-44a0-9bba-fa9886ca611b`).
> - **Governed MCP Server**: Registered on ArmorIQ platform as UUID `7540cd0a-7d76-414a-a849-96b337a0c6ed` under name `intentgate-treasury-mcp` (aliased as `flowguard-treasury-mcp`), deployed at `https://flowguard-treasury.vercel.app/mcp`.
> - **Repository & Vercel**: `github.com/vikassharma270907-alt/flowguard-treasury` and `https://flowguard-treasury.vercel.app`.

---

## 1. What the Three Tools Do

BeyondFlow places ArmorIQ between an ElevenLabs conversational voice agent and an autonomous treasury MCP server. Every tool call is planned, signed with an intent token, and verified by ArmorIQ before reaching execution.

### Allowed: `lookup_order`
- **Action**: Routine order and delivery inquiry (synthetic order `ORD-1001`).
- **Verdict**: **`ALLOWED`** by stored policy (`flowguard-treasury-allowlist`).
- **What happens**: The agent reads out the verified status to the caller.
- **Measured Latency** (October 17, 2026 — 10 benchmark runs):
  - *ArmorIQ proxy call only*: **921 ms median** (min 818 ms, max 1,433 ms).
  - *End-to-end through gateway*: **3,118 ms median** (min 2,719 ms, max 4,897 ms).
- **Plan Hash**: `b3e6889fe267adb661881333d488307f0263e0c2baf3efb3866bf136a62ac1ec`

### Blocked: `change_payout`
- **Action**: Social engineering / prompt injection attack attempting to divert supplier payouts to an external account (`GB29 NWBK...`).
- **Verdict**: **`BLOCKED`** by ArmorIQ PEP proxy with `PolicyBlockedException` (HTTP 403, reason `tool_not_in_allowlist`).
- **What happens**: Execution halts at the policy enforcement point. The bank routing is never modified, and $0.00 is lost.
- **Measured Latency** (October 17, 2026 — 10 benchmark runs):
  - *ArmorIQ proxy call only*: **769 ms median** (min 626 ms, max 878 ms).
  - *End-to-end through gateway*: **2,982 ms median** (min 2,652 ms, max 4,493 ms).

### Held: `issue_refund`
- **Action**: High-value outbound money movement ($89 refund on `ORD-1001`).
- **Verdict**: **`HELD`** via platform delegation (`POST /delegation/request`).
- **What happens**: Outbound money triggers a cryptographic hold. The voice agent replies immediately with a holding statement: *"A supervisor has been notified to review your refund."* The disbursement is released only after two distinct human supervisors approve on the supervisor playground.
- **Measured Latency** (October 17, 2026 — 10 benchmark runs):
  - *ArmorIQ delegation creation*: **761 ms median** (min 631 ms, max 987 ms).
  - *End-to-end through gateway*: **2,931 ms median** (min 2,816 ms, max 3,609 ms).
  - *Timeout safety*: Fully replies inside ElevenLabs' ~5-second webhook timeout window.

*All data is synthetic sandbox data (`ORD-1001` to `ORD-1004`, mock accounts). No real customer data or production banking rails are used.*

---

## 2. Architecture

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

## 3. How to Run the Verification Scripts

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

# 4. Intent binding & expiry tests (Case 1 refused, Case 2 limitation, Case 3 expired)
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

---

## 4. Known Limitations

1. **Parameter-Swap Gap (Action vs Parameter Binding)**:
   - **What is bound**: The tool/action name is cryptographically bound into the intent token leaf (`/steps/[i]/action`). If a token minted for `lookup_order` is reused to call `issue_refund`, ArmorIQ SDK throws `IntentMismatchException` before network transmission. Expired tokens are rejected with `TokenExpiredException`.
   - **What is not bound**: Parameter values (e.g. refund amount or destination IBAN) are not bound into the Merkle leaf verified by the ArmorIQ proxy. (Confirmed in `@armoriq/sdk` `client.js:870-873`: Merkle leaf covers action name only).
   - **What an attacker could do**: An attacker who obtains an authorized `issue_refund` intent token minted for $89 could attempt to submit the same token with amount `$5000`. The token itself is not refused by the proxy.
   - **Current mitigations in code**:
     - *Dual-supervisor hold*: All refunds trigger a platform delegation hold. The gateway replays strictly the original parameters stored at plan-capture time (`record.args`), ignoring any caller-tampered arguments.
     - *Upstream tool bounds check*: The MCP tool validates that the requested refund does not exceed the order's remaining balance ($89 on `ORD-1001`).
     - *Reserve floor safeguard*: Application business rules prevent disbursements that would breach the $15,000 cash floor.
2. **Direct MCP Access**: The `/mcp` endpoint runs without an auth token for hackathon judging convenience. Governance applies when invoking through the ArmorIQ proxy (`proxy.armoriq.ai`). Calling `/mcp` directly bypasses ArmorIQ governance.
3. **Quorum Counted in Gateway**: ArmorIQ decides the call is held and records the platform delegation; the gateway counts the two distinct supervisor approvals before releasing execution.
4. **Settlement Module Uses Local Rules**: ArmorPay duplicate-invoice and reserve-floor checks in `server/armorPayService.js` are application business logic, not ArmorIQ policy decisions.
5. **Local Supervisor Playground**: The supervisor playground runs locally at `http://localhost:8790/playground` in development (see the explainer video for live demonstration).

---

## 5. Links to Docs and Evidence

- **Development Guide**: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — Running locally, regenerating PDF guide, and script reference.
- **Audit Logs & Merkle Proofs**: [`EVIDENCE.md`](EVIDENCE.md) — CSRG-IAP Merkle proofs, token IDs, and ledger entries.
- **Voice Latency & DX Notes**: [`DX_NOTES.md`](DX_NOTES.md) — Breakdown of proxy latencies, gateway overhead, and ElevenLabs sub-5s budget.
- **Pre-Existing Code Disclosures**: [`DISCLOSURES.md`](DISCLOSURES.md) — Lineage of components and open-source licenses.
- **Platform Onboarding Walkthrough**: [`ARMORIQ_ONBOARDING.md`](ARMORIQ_ONBOARDING.md) — Step-by-step onboarding on `platform.armoriq.ai`.
- **Live Evidence Captures**: [`docs/evidence/test-enforcement-2026-10-17.txt`](docs/evidence/test-enforcement-2026-10-17.txt) and [`docs/evidence/test-intent-mismatch-2026-10-17.txt`](docs/evidence/test-intent-mismatch-2026-10-17.txt).
- **User Guide PDF**: [`docs/USER_GUIDE.pdf`](docs/USER_GUIDE.pdf)
- **Explainer Video**: [https://flowguard-treasury.vercel.app/video](https://flowguard-treasury.vercel.app/video)

---

## License

Application code is under the [MIT License](LICENSE). Copyright © 2026 BeyondFlow Authors. Self-hosted typography (Inter, JetBrains Mono, Noto Sans Devanagari) is under the SIL Open Font License.
