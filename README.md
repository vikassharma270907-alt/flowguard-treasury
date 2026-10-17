# BeyondFlow: A Voice Support Agent That Can Move Money, Governed by ArmorIQ

> **Tagline**: *A voice AI agent whose every MCP tool call is checked by ArmorIQ before it can touch money.*  
> **What it is**: An ElevenLabs voice agent takes customer calls. Every tool call it makes goes through the ArmorIQ Policy Enforcement Point (PEP). Read-only lookups are allowed, payout changes are blocked, and refunds are held for human approval. The allow, block, and hold decisions come from ArmorIQ, not from code in this repo.  
> **Live Production**: [flowguard-treasury.vercel.app](https://flowguard-treasury.vercel.app/) · **Judge Dashboard**: [/judges](https://flowguard-treasury.vercel.app/judges) · **Demo Video**: [/video](https://flowguard-treasury.vercel.app/video) · **MCP Endpoint**: [https://flowguard-treasury.vercel.app/mcp](https://flowguard-treasury.vercel.app/mcp) · **Architecture**: [docs/ARMORIQ_MCP_INTEGRATION.md](docs/ARMORIQ_MCP_INTEGRATION.md)

---

## ⚡ Judge Quick Start (2 Minutes, No Local Setup)

1. **Watch the demo video**: [flowguard-treasury.vercel.app/video](https://flowguard-treasury.vercel.app/video) (03:49 explainer). Observe **Allow**, **Block**, and **Hold**, in order, with live terminal recording in Scene 7.
2. **Open the Judge Dashboard**: [flowguard-treasury.vercel.app/judges](https://flowguard-treasury.vercel.app/judges) for the live inspection dashboard and the interactive **Boundary Test**.
3. **Supervisor playground** (approve or deny held refunds): The local supervisor playground runs at `http://localhost:8790/playground` alongside the voice gateway, and is reflected live on the web console at [flowguard-treasury.vercel.app](https://flowguard-treasury.vercel.app) (see video for live dual-supervisor approval flow).
4. **Evidence**: Raw captures from real production runs are indexed in [docs/evidence/README.md](docs/evidence/README.md) and [EVIDENCE.md](EVIDENCE.md).
5. **Run the checks yourself** with an ArmorIQ API key: see [Verify It Yourself](#-verify-it-yourself).
6. **Live Telephony Gateway Note**: *The voice gateway runs on the team's machine (`:8790`) for live ElevenLabs telephony webhook demos; the recorded runs and raw captures show the identical end-to-end flow against production ArmorIQ.*

---

## ⚖️ What ArmorIQ Decides vs. What BeyondFlow Code Decides

*This table is deliberate. Judges can tell at a glance which decisions are real ArmorIQ enforcement vs. local application logic.*

| Behavior | Decided by | Notes |
| :--- | :--- | :--- |
| `lookup_order` **ALLOWED** | **ArmorIQ PEP** (`proxy.armoriq.ai`) | Stored policy `flowguard-treasury-allowlist` |
| `change_payout` **BLOCKED** | **ArmorIQ PEP** | HTTP 403 `tool_not_in_allowlist` |
| `issue_refund` **HELD** | **ArmorIQ** (platform delegation request) | Pending delegation created via `POST /delegation/request` |
| **2-supervisor quorum before release** | **BeyondFlow gateway** | ArmorIQ creates the hold; the gateway tallies two approvals before proxy release. See [Known Limitations](#-known-limitations). |
| **Intent token mismatch / expiry** | **ArmorIQ SDK** | `IntentMismatchException`, `TokenExpiredException` |
| **ArmorPay duplicate-invoice shield, reserve floor** | **BeyondFlow business rules** | Deterministic app logic in `server/armorPayService.js`. *Not an ArmorIQ decision, and not part of the core enforcement demo.* |

> **Crucial Guarantee**: The MCP server contains **zero allow/deny logic**. The gateway contains **zero allow/deny rules** for the three voice tools.

---

## 🏆 Acceptance Checklist & Requirements Verification

| Requirement | Implementation and Evidence | Status |
| :--- | :--- | :--- |
| **Setup order followed** | 1. API key created on `platform.armoriq.ai`.<br>2. Public MCP deployed and registered (`flowguard-treasury-mcp`, UUID `7540cd0a-7d76-414a-a849-96b337a0c6ed`, at `https://flowguard-treasury.vercel.app/mcp`).<br>3. Agent onboarded (`flowguard-agent`).<br>4. Policy authored on the platform (`flowguard-treasury-allowlist`). | **PASS** |
| **Policies verified with 3-result test script** | `scripts/test-enforcement.mjs` makes real live calls (latest run 16 Oct 2026):<br>• `lookup_order`: **ALLOWED** (`verified: true`, 887 ms)<br>• `change_payout`: **BLOCKED** (`PolicyBlockedException`, HTTP 403 `tool_not_in_allowlist`, 764 ms)<br>• `issue_refund`: **HELD** (real pending delegation `eb63aac7-…`, 604 ms). | **PASS** |
| **Two-approval approach documented** | ArmorIQ creates the hold via `POST /delegation/request`. The BeyondFlow gateway tallies two supervisor approvals before release. Documented in [DX_NOTES.md](DX_NOTES.md) and in [Known Limitations](#-known-limitations). | **PASS** *(quorum counted in gateway)* |
| **MCP reachable via ArmorIQ proxy** | `POST /mcp` (JSON-RPC 2.0, SSE responses) over HTTPS, invoked through `https://proxy.armoriq.ai/invoke`. | **PASS** |
| **One action ALLOWED, one BLOCKED in audit logs** | `lookup_order` **ALLOWED** and `change_payout` **BLOCKED**, both visible in the `proxy.armoriq.ai` audit ledger. | **PASS** |
| **Intent binding demonstrated** | `scripts/test-intent-mismatch.mjs`:<br>• Wrong action: refused (`IntentMismatchException`)<br>• Expired token: refused (`TokenExpiredException`)<br>• Swapped amount: not refused by token (reaches upstream tool boundary; binding is action-level, not argument-level). | **PASS** *(action binding & expiry; argument-level binding is a known limitation)* |
| **Decisions from ArmorIQ, not code `if` statements** | For the three voice tools, every allow, block, and hold is returned by the ArmorIQ proxy or platform. See decision table above. | **PASS** |
| **Held calls answer within ElevenLabs' ~5 s window** | Held calls reply immediately with a conversational holding message; final decision relayed via `check_supervisor_decision`. See [Latency](#-latency). | **PASS** *(thin margin on `lookup_order`)* |
| **Prefix mapping and zero real data** | The gateway strips the `BeyondFlow_` prefix from ElevenLabs tool names. All data is synthetic (`ORD-1001`, `ORD-1002`, `ACC-4471`). | **PASS** |
| **No secrets, complete disclosures** | `.env` is gitignored; `.env.example` provided. See [DISCLOSURES.md](DISCLOSURES.md) and [DX_NOTES.md](DX_NOTES.md). | **PASS** |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User([Caller Voice / Web Client]) <--> ElevenLabs[ElevenLabs Conversational AI Agent]
    ElevenLabs -- "Webhook Tool Call (BeyondFlow_<tool>)" --> Gateway[BeyondFlow Gateway Service :8790]
    
    subgraph ArmorIQ Platform ["ArmorIQ Governance Cloud (platform.armoriq.ai)"]
        IAP["CSRG-IAP Intent Backend (iap.armoriq.ai)"]
        Proxy["ArmorIQ PEP Proxy (proxy.armoriq.ai)"]
        PlatformAPI["ArmorIQ Control Plane (api.armoriq.ai)"]
    end
    
    Gateway -- "1. capturePlan() -> Canonical Plan" --> Gateway
    Gateway -- "2. getIntentToken() -> Ed25519 Token" --> IAP
    Gateway -- "3. invoke(mcp, tool, token, params)" --> Proxy
    
    Proxy -- "Enforce Stored Policies (allow/block)" --> Proxy
    Proxy -- "4. Validated SSE Tool Call" --> MCPServer[BeyondFlow MCP Server (Vercel /mcp, SSE)]
    
    Gateway -- "Hold Escalation (/delegation/request)" --> PlatformAPI
    Supervisor([Supervisor]) <--> Playground[Supervisor Playground UI /api/pending]
    Playground -- "2 Approvals Required for Refund" --> Gateway
    Gateway -- "Release Approved Call" --> Proxy
```

---

## 🧩 Components

1. **Voice Agent**: ElevenLabs Conversational AI. Tools exposed through the gateway: `BeyondFlow_orderLookup`, `BeyondFlow_payoutChange`, `BeyondFlow_issueRefund`, `check_supervisor_decision`. The `BeyondFlow_` prefix is mapped back to canonical MCP tool names.
2. **MCP Server (`mcp-server/server.mjs`)**: JSON-RPC 2.0 over `POST /mcp`, with Server-Sent Events (SSE) responses. Contains no policy logic.
   - `lookup_order(order_id)`: Read-only (allowed by ArmorIQ policy).
   - `change_payout(account_id, new_destination)`: Destination change (blocked by ArmorIQ policy).
   - `issue_refund(order_id, amount)`: Disbursement (held by ArmorIQ policy; needs 2 supervisor approvals).
3. **Gateway (`gateway/server.mjs`)**: For every tool call, executes `capturePlan` → `getIntentToken` → `invoke` through `proxy.armoriq.ai`. Held calls reply: *"Thanks, that needs a supervisor to approve it. I have notified them and will let you know as soon as they respond."* Relays the final decision after supervisor review.
4. **Supervisor Playground (`playground/index.html`)**: Live view of pending holds with caller context, matched policy, and plan hash, plus Approve and Deny actions. Two approvals are required before a refund is released. Local URL: `http://localhost:8790/playground`; live status reflected on `https://flowguard-treasury.vercel.app`.
5. **ArmorPay (`server/armorPayService.js`)**: Supporting treasury module (duplicate-invoice checks, reserve floor, Airwallex sandbox rails, signed receipts). Its blocks are BeyondFlow business rules, not ArmorIQ decisions. See the decision table above.

---

## 🧪 Verify It Yourself

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v24), npm
- An `ARMORIQ_API_KEY` from [platform.armoriq.ai](https://platform.armoriq.ai/)

```bash
npm install
npm --prefix client install
cp .env.example .env
# Edit .env and set your ARMORIQ_API_KEY
```

### 1. Policy Verification (Allowed / Blocked / Held)
```bash
node --env-file=.env scripts/test-enforcement.mjs
```
*Expected summary*: `lookup_order` **ALLOWED**, `change_payout` **BLOCKED**, `issue_refund` **HELD**.

### 2. Cryptographic Intent Binding
```bash
node --env-file=.env scripts/test-intent-mismatch.mjs
```
*Expected*: Wrong action → `IntentMismatchException`; swapped amount → `NOT REFUSED` (reaches upstream; see limitations); expired token → `TokenExpiredException`.

### 3. Run the Stack and the 45-Second Demo
```bash
# Terminal 1: MCP Server
node --env-file=.env mcp-server/server.mjs

# Terminal 2: Voice Gateway & Playground
node --env-file=.env gateway/server.mjs

# Terminal 3: Web Dashboard
npm run dev

# Terminal 4: Run Demo
node --env-file=.env scripts/run-demo.mjs
```
*The demo flow*: `lookup_order` allowed → `change_payout` blocked → `issue_refund` held, two supervisor approvals in the playground, then released through ArmorIQ and relayed to the caller by the voice agent.

---

## ⏱️ Latency

ElevenLabs gives tool calls about 5 seconds. Two different measurements appear in this repo, and they measure different things:

| Measurement | `lookup_order` | What It Covers |
| :--- | :--- | :--- |
| `test-enforcement.mjs` | ~0.9 s | Direct SDK call to the ArmorIQ proxy |
| **Full gateway path (live voice)** | **3.7 to 4.3 s** | Webhook + `capturePlan` + token mint + proxy + MCP cold or warm |

- **Other tools through the gateway**: `change_payout` ~2.7 s, `issue_refund` ~2.8 to 3.9 s.
- **The margin on `lookup_order` is thin**. Before any live demo, warm up the MCP (one throwaway call) so a Vercel serverless cold start does not push execution past the window:
  ```bash
  curl -s -X POST https://flowguard-treasury.vercel.app/mcp \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
  ```

---

## 📂 Evidence

All raw captures from real runs are committed in the repository:
- [docs/evidence/README.md](docs/evidence/README.md): Index of raw captures.
- [docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json](docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json): Full execution run capture.
- [EVIDENCE.md](EVIDENCE.md): Audit log excerpts and Merkle proof outputs.
- **Platform Records**:
  - Agent: `flowguard-agent` (`c8bcbe51-dea4-4459-9fd8-38f88ebc714e`)
  - MCP: `flowguard-treasury-mcp` (`7540cd0a-7d76-414a-a849-96b337a0c6ed`)
  - Policy: `flowguard-treasury-allowlist` (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`)

---

## ⚖️ Hackathon Compliance and Disclosures

### Development Window
The hackathon window was October 10 to 17, 2026. All commits in this repository are dated Oct 16 to 17, 2026.

### Pre-Existing Code (see [DISCLOSURES.md](DISCLOSURES.md))
BeyondFlow builds on an earlier MIT-licensed IntentGate prototype and on pre-existing UI and 3D components. Exact scope:

| Pre-existing Item | Where It Lives | Source and License |
| :--- | :--- | :--- |
| Voice gateway webhook routing basics | `gateway/server.mjs` | IntentGate prototype, MIT |
| Airwallex sandbox simulation adapter | `server/armorPayService.js` | IntentGate prototype, MIT |
| Responsive UI subsystems (Header, Footer, i18n skeleton) | `client/src/components/Navbar.jsx`, `client/src/components/Footer.jsx`, `client/src/locales/` | IntentGate prototype, MIT |
| Three.js 3D visual components | `client/src/components/3d/` | IntentGate prototype, MIT |
| First commit importing pre-existing code | Commit `7486e92` (initial hackathon baseline) | n/a |

**Built Fresh During Hackathon Window**: ArmorIQ plan capture and intent-token flow, PEP enforcement for the three MCP tools, the ElevenLabs holding pattern, the dual-supervisor quorum, the verification scripts, and the explainer video.

---

## 🔍 Known Limitations

1. **Action-level intent binding, not argument-level**: The token binds the declared action set and token expiration. Changing an argument such as an amount does not invalidate the token; arguments are evaluated at the upstream tool boundary. (Platform policy governs action dispatch; argument-level constraints are reserved for upcoming platform parameter rules).
2. **Quorum counted in the gateway**: ArmorIQ creates the hold (`POST /delegation/request`). The two-approval tally is BeyondFlow gateway code; once quorum is reached, the approved call is released through the ArmorIQ proxy (`proxy.armoriq.ai`).
3. **Open sandbox endpoint by design**: `/mcp` accepts unauthenticated requests so `proxy.armoriq.ai` can reach it without static credentials. Calling `/mcp` directly bypasses ArmorIQ governance; enforcement applies to traffic that routes through the proxy.
4. **Local business rules**: ArmorPay's duplicate-invoice and reserve-floor checks are application logic, not ArmorIQ decisions.
5. **Synthetic data only**: All customers, orders, accounts, and balances are mock entities. No real money moves.

---

<details>
<summary><strong>✨ Additional Features (Not Part of the Core ArmorIQ Demo)</strong></summary>

### 3D Interactive Elements (Three.js)
`RotatingHeroVault.jsx`, `ParticleBackgroundField.jsx`, and `InteractiveIntentGyroscope.jsx` in `client/src/components/3d/`. Lazy-loaded, GPU resources disposed on unmount, `prefers-reduced-motion` respected, SVG fallback when WebGL is unavailable, light and dark theme aware.

### Light and Dark Theme System
CSS design tokens in `client/src/index.css` for `:root`, `[data-theme="dark"]`, and `[data-theme="light"]`. Accessible toggle in the nav, zero flash on first load.

### Language Support
English and Hindi (हिन्दी) UI toggle.

### PDF Technical Guides
- [docs/BeyondFlow_Overview.pdf](docs/BeyondFlow_Overview.pdf): Technical overview of the ElevenLabs + ArmorIQ integration.
- [docs/USER_GUIDE.pdf](docs/USER_GUIDE.pdf): Operator guide.
- Regenerate with `npm run docs:overview` and `npm run docs:pdf`.

</details>

---

## 📖 Further Reading

- [DX_NOTES.md](DX_NOTES.md): 5s timeout pattern, prefix normalization, latencies, quorum approach, SDK error typing gotchas.
- [DISCLOSURES.md](DISCLOSURES.md): Complete disclosures and attribution.
- [ARMORIQ_ONBOARDING.md](ARMORIQ_ONBOARDING.md): Step-by-step onboarding walkthrough for `platform.armoriq.ai`.
- [LICENSE](LICENSE): MIT Open Source License.

---

## 📄 License & Attribution

- **Application Code**: [MIT License](LICENSE), Copyright © 2026 BeyondFlow Authors.
- **Typography**: SIL Open Font License (self-hosted Inter, JetBrains Mono, Noto Sans Devanagari).
- **Issues & Inquiries**: [GitHub Issues](https://github.com/vikassharma270907-alt/flowguard-treasury/issues) · `vikas.sharma270907@gmail.com`
