# BeyondFlow — Autonomous Treasury & Intent Vault Governed by ArmorIQ

> **Tagline**: *Autonomous treasury operations and MCP tools, cryptographically governed by ArmorIQ.*
> **Naming note**: Some infrastructure identifiers still say `flowguard` because they are registered on external platforms.

An autonomous AI treasury and voice support agent. ElevenLabs handles the call, and ArmorIQ decides what the agent is allowed to do.

## What the tools do
1. **`lookup_order` (ALLOWED)**: A caller asks about an order. The agent calls `lookup_order`. ArmorIQ matches policy, verifies the intent token, and allows the read.
2. **`change_payout` (BLOCKED)**: The caller tries prompt injection to redirect payouts. The agent calls `change_payout`. ArmorIQ blocks it before it reaches the tool (HTTP 403, `tool_not_in_allowlist`).
3. **`issue_refund` (HELD)**: The caller asks for an $89 refund. ArmorIQ holds the call through the delegation API. In the supervisor console, two approvals are required to release the payout.

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

## 🚀 How to run the verification scripts

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.18.0)
- npm

### 2. Verify ArmorIQ Policies (Setup Checklist Step 5)
Run the 3-result verification test script:
```bash
node --env-file=.env scripts/test-enforcement.mjs
```

### 3. Verify Cryptographic Intent Binding (Intent Mismatch)
Run the intent mismatch test:
```bash
node --env-file=.env scripts/test-intent-mismatch.mjs
```

## Known limitations
- **Parameter Binding (The Parameter-Swap Gap)**: Currently, the ArmorIQ intent token binds the declared tool/action, but it does *not* bind the specific parameter values (like the refund amount). An attacker who intercepts a valid `issue_refund` token could theoretically swap the parameters and attempt a larger refund.
  - *Mitigations in place*: We mitigate this via the dual-supervisor approval flow (where the exact parameters are held and displayed before release) and the hardcoded Reserve Floor check in the settlement logic.
- **Direct MCP access**: The `/mcp` endpoint currently runs without an auth token because the ArmorIQ proxy needs to reach it.
- **Quorum is gateway-side**: ArmorIQ decides the call is held, but the gateway counts the approvals before requesting release.
- **Settlement module uses local rules**: The duplicate and reserve checks are our own code, not ArmorIQ's ArmorPay product.
- **Local supervisor playground**: The playground runs at `http://localhost:8790/playground` in development.

## 📚 Deliverables & Documentation
- [docs/BeyondFlow_Overview.pdf](docs/BeyondFlow_Overview.pdf): Technical overview.
- [docs/USER_GUIDE.pdf](docs/USER_GUIDE.pdf): Complete operator manual.
- [DX_NOTES.md](DX_NOTES.md): Comprehensive notes on latency and patterns.
- [DISCLOSURES.md](DISCLOSURES.md): Complete disclosures.
- [EVIDENCE.md](EVIDENCE.md): Raw audit log evidence and proofs.
- [ARMORIQ_ONBOARDING.md](ARMORIQ_ONBOARDING.md): Onboarding walkthrough.
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): Build and setup configurations.
