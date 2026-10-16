# FlowGuard — MCP Servers & ArmorIQ Governance Architecture

> **Official Technical Specification & Architecture Blueprint**  
> Covers: Model Context Protocol (MCP) server implementations, tool schemas, and end-to-end cryptographic intent governance with ArmorIQ.

---

## 1. Executive Summary

This prototype architecture establishes a policy-enforced security layer between autonomous conversational agents (ElevenLabs Conversational AI and Treasury Automation Bots) and financial APIs (Airwallex sandbox banking rails and payout gateways).

Rather than trusting LLMs to invoke sensitive financial tools directly or relying on fragile prompt engineering and code-level `if` statements, this system routes **every action through ArmorIQ's cryptographic intent verification pipeline** and governs tools over the standardized **Model Context Protocol (MCP spec 2024-11-05)**.

---

## 2. Active Model Context Protocol (MCP) Servers

The repository contains two prototype MCP server implementations:

```
                                  +---------------------------------------+
                                  |         Autonomous Agent              |
                                  | (ElevenLabs / Claude / Treasury Bot)  |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       ArmorIQ Governance SDK          |
                                  |    (capturePlan -> getIntentToken)   |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        ArmorIQ PEP Proxy Cloud        |
                                  |       (https://proxy.armoriq.ai)      |
                                  +---------+-------------------+---------+
                                            |                   |
                        (Allowed via SSE)   |                   |   (Stdio / REST)
                                            v                   v
+-------------------------------------------------+   +-------------------------------------------------+
| 1. intentgate-support-mcp (Port 8791)           |   | 2. flowguard-treasury-mcp (Port 3001)           |
| Server ID: cd7deb69-adb3-45f7-977b-f0d0e7235ba2 |   | Standard: MCP 2024-11-05 Stdio + JSON-RPC       |
| Transport: JSON-RPC 2.0 HTTP + SSE Stream       |   | Endpoints: POST /mcp, POST /api/mcp             |
| File: mcp-server/server.mjs                     |   | File: server/mcpServer.js                       |
+-------------------------------------------------+   +-------------------------------------------------+
```

### A. `intentgate-support-mcp` (Voice Support & Enclave MCP)
* **Registered UUID on ArmorIQ Platform**: `cd7deb69-adb3-45f7-977b-f0d0e7235ba2`
* **Source File**: [`mcp-server/server.mjs`](../mcp-server/server.mjs)
* **Transport**: HTTP POST (`/mcp`) accepting JSON-RPC 2.0 payloads and replying via Server-Sent Events (`Content-Type: text/event-stream; event: message\ndata: {json}\n\n`).
* **Tunnel URL**: Accessible to ArmorIQ's PEP proxy via public HTTPS tunnel (`https://avi-england-vessel-touched.trycloudflare.com/mcp`).
* **Authentication**: Enforces bearer token verification via `Authorization` / `X-Armoriq-MCP-Auth`.

### B. `flowguard-treasury-mcp` (Treasury Controller MCP)
* **Source File**: [`server/mcpServer.js`](../server/mcpServer.js)
* **Transports**:
  * **Stdio Transport**: Compatible with Claude Desktop, Cursor, and IDEs via `npm run mcp` (`node server/mcpServer.js --stdio`).
  * **JSON-RPC 2.0 HTTP Endpoint**: `POST /mcp` and `POST /api/mcp` on port 3001.
  * **Interactive REST Discovery**: `GET /api/mcp/status`, `GET /api/mcp/tools`, and `POST /api/mcp/execute`.

---

## 3. Governed MCP Tool Definitions & Schemas

| Tool Name | Risk Level | Target Action | ArmorIQ Stored Policy | Real Outcome |
| :--- | :--- | :--- | :--- | :--- |
| `lookup_order` / `order_lookup` | **Low (Read-only)** | Query order status, invoice date, delivery details | `allow_read_policy` | **ALLOWED** (~1,700 ms) |
| `change_payout` / `payout_change` | **Critical Security Risk** | Modifies beneficiary ABA routing / bank account | `block_payout_override` | **BLOCKED** (`PolicyBlockedException`) |
| `issue_refund` | **High Financial Risk** | Authorizes monetary disbursement / refund | `dual_approval_quorum` | **HELD** (`PolicyHoldException`, 2 Approvals) |
| `assert_reserve_floor` | **Treasury Invariant** | Asserts total wallet balance >= $15,000 USD reserve | `reserve_floor_check` | **EVALUATED** against ledger |
| `verify_audit_merkle` | **Zero-Trust Audit** | Calculates SHA-256 Merkle root across all events | `audit_integrity` | **VERIFIED** cryptographically |

### Detailed Tool Input Schemas

#### 1. `lookup_order` (or `order_lookup`)
```json
{
  "name": "lookup_order",
  "description": "Look up customer order status, scheduled payout date, and delivery details. Allowed automatically by ArmorIQ read policy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "order_id": {
        "type": "string",
        "description": "Unique order identifier (e.g., ORD-1001, ORD-84920)"
      }
    },
    "required": ["order_id"]
  }
}
```

#### 2. `change_payout` (or `payout_change`)
```json
{
  "name": "change_payout",
  "description": "Attempts to modify destination ABA routing or recipient account number. Intercepted and blocked by ArmorIQ policy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "account_id": { "type": "string", "description": "Target account ID" },
      "new_destination": { "type": "string", "description": "New bank account or IBAN destination" }
    },
    "required": ["account_id", "new_destination"]
  }
}
```

#### 3. `issue_refund`
```json
{
  "name": "issue_refund",
  "description": "Issues financial disbursement against an order. High financial risk; held by ArmorIQ for dual supervisor quorum.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "order_id": { "type": "string", "description": "Order reference number" },
      "amount": { "type": "number", "description": "Refund amount in USD" }
    },
    "required": ["order_id", "amount"]
  }
}
```

---

## 4. How the Agent Calls ArmorIQ: End-to-End Execution Flow

The communication flow between the agent, the gateway, ArmorIQ Cloud, and the MCP server follows a strict 3-phase cryptographic protocol:

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Customer Voice / User
    participant Agent as ElevenLabs Agent
    participant Gateway as IntentGate Gateway (:8790)
    participant SDK as @armoriq/sdk Client
    participant IAP as ArmorIQ IAP (iap.armoriq.ai)
    participant PEP as ArmorIQ Proxy (proxy.armoriq.ai)
    participant MCP as MCP Server (:8791)
    actor Supervisor as Supervisor Playground

    Caller->>Agent: "Where is my order ORD-1001?"
    Agent->>Gateway: POST /webhook (IntentGate_lookup_order)
    
    rect rgb(240, 248, 255)
        note over Gateway,SDK: Phase 1: Canonical Intent Capture
        Gateway->>Gateway: Strip "IntentGate_" prefix -> "lookup_order"
        Gateway->>SDK: capturePlan('elevenlabs-voice-agent', prompt, canonicalPlan)
    end

    rect rgb(255, 250, 240)
        note over SDK,IAP: Phase 2: Cryptographic Token Minting
        SDK->>IAP: POST /intent/token (capture)
        IAP-->>SDK: Ed25519 IntentToken (tokenId, planHash, stepProofs)
    end

    rect rgb(240, 255, 240)
        note over SDK,MCP: Phase 3: Governed Proxy Invocation
        SDK->>PEP: POST /invoke (MCP_ID, 'lookup_order', token, params)
        PEP->>PEP: Check Stored Policies on ArmorIQ Platform
        alt Allowed Policy (lookup_order)
            PEP->>MCP: POST /mcp (JSON-RPC 2.0 tools/call)
            MCP-->>PEP: SSE text/event-stream (Order Data)
            PEP-->>SDK: Verified Result Payload
            SDK-->>Gateway: { decision: 'ALLOWED', result: {...} }
            Gateway-->>Agent: 200 OK (Order Status)
            Agent-->>Caller: "Your order ORD-1001 is scheduled for delivery."
        else Blocked Policy (change_payout)
            PEP-->>SDK: PolicyBlockedException (tool_not_in_allowlist)
            SDK-->>Gateway: { decision: 'BLOCKED', reason: 'PolicyBlockedException' }
            Gateway-->>Agent: 200 OK ("I cannot change banking destinations.")
            Agent-->>Caller: "Policy prevents modifying wire destinations."
        else Held Policy (issue_refund)
            SDK->>IAP: createDelegationRequest(tool, amount, planId)
            Gateway-->>Agent: Immediate holding reply (<5s): "Supervisor notified..."
            Gateway->>Supervisor: Case pending in /playground (Awaiting 2 Approvals)
            Supervisor->>Gateway: Supervisor 1 + 2 approve
            Gateway->>SDK: releaseHeldCall() with approved token
            SDK->>PEP: Retried invoke -> MCP executes refund
        end
    end
```

---

## 5. Deep-Dive: The 3 Core Stages in Code

### Phase 1: Canonical Plan Capture
Before executing, the gateway canonicalizes the agent's intent into a structured execution plan.

```javascript
// from gateway/armoriq-gateway.mjs
const plan = {
  goal: goal || `Handle caller request for ${tool}`,
  steps: [{
    action: tool,
    tool: tool,
    mcp: process.env.ARMORIQ_MCP_ID,
    inputs: args ?? {}
  }]
};

// Captures intent with metadata
const capture = client.capturePlan('elevenlabs-voice-agent', prompt, plan);
```

### Phase 2: Intent Token Minting via ArmorIQ IAP (`iap.armoriq.ai`)
The SDK dispatches the captured plan to the ArmorIQ Identity & Assurance Platform:

```javascript
// from gateway/armoriq-gateway.mjs
const token = await client.getIntentToken(capture);
// Generated token contains:
// - tokenId: 'aiq_tok_...'
// - planHash: Deterministic SHA-256 hash of the execution steps
// - signature: Ed25519 signature from ArmorIQ's platform authority
// - stepProofs: Cryptographic proofs binding each individual tool step
```

#### Cryptographic Intent Mismatch Protection
If an agent mints a token declaring intent to query order status (`lookup_order`), but then attempts to call `issue_refund`, ArmorIQ's SDK and platform reject the invocation locally and upstream before any network traffic reaches the MCP server:
```
Refused by: IntentMismatchException
Reason: Action 'issue_refund' does not match declared plan 'lookup_order'
```

### Phase 3: Governed Proxy Invocation (`proxy.armoriq.ai`)
The tool call is transmitted to ArmorIQ's cloud Policy Enforcement Point (PEP):

```javascript
// from gateway/armoriq-gateway.mjs
const result = await client.invoke(MCP_ID, tool, token, args ?? {});
```

The PEP proxy verifies:
1. **Signature Integrity**: Token was signed by the official ArmorIQ platform authority.
2. **Plan Immutability**: Tool arguments strictly match the hashed canonical plan steps.
3. **Freshness**: Current timestamp < `token.expiresAt`.
4. **Stored Organization Policies**: Evaluates policies stored in your ArmorIQ organization:
   * **ALLOWED**: Invocation is forwarded over HTTPS to the registered MCP endpoint.
   * **BLOCKED**: Returns `PolicyBlockedException` with policy metadata.
   * **HELD**: Requires human approval via delegation before execution can release.

---

## 6. Real-World Safeguards & Operational Best Practices

### A. Sub-5-Second Holding Pattern for Conversational Voice
ElevenLabs conversational voice agents time out webhooks after approximately 5 seconds. High-stakes financial operations requiring human intervention cannot complete in 5 seconds.

**Solution implemented in [`gateway/server.mjs`](../gateway/server.mjs)**:
1. When `issue_refund` triggers a `PolicyHoldException`, the gateway registers the delegation on ArmorIQ.
2. The gateway replies to ElevenLabs **in under 3.5 seconds**:
   > *"Thanks — that refund needs a supervisor to approve it. I have notified them and will let you know as soon as they respond."*
3. The call session remains open while the user is prompted to check status via `check_supervisor_decision`.

### B. Dual-Supervisor Quorum (Multi-Sig Human-in-the-Loop)
* High-risk tools like `issue_refund` enforce a minimum of **2 distinct supervisor approvals**.
* Handled in [`playground/index.html`](../playground/index.html) and [`gateway/server.mjs`](../gateway/server.mjs):
  * Supervisor 1 approves: State changes to `awaiting_approvals (1/2)`.
  * Supervisor 2 approves: Quorum satisfied -> Gateway triggers `releaseHeldCall()` through ArmorIQ with a freshly minted, supervisor-backed token.

### C. Zero Hardcoded Code `if` Statements
No allow, block, or hold decisions are hardcoded in application logic. Every decision represents the live verdict rendered by ArmorIQ's policy evaluation engine.

---

## 7. Verification & Testing Commands

To verify this architecture locally:

```bash
# 1. Test 3 Expected Policy Results (Allowed, Blocked, Held)
node --env-file=.env scripts/test-enforcement.mjs

# 2. Test Cryptographic Intent Mismatch Protection
node --env-file=.env scripts/test-intent-mismatch.mjs

# 3. Run MCP Server in Isolation (Port 8791)
npm run mcp:server

# 4. Run Gateway & Supervisor Playground (Port 8790)
npm run gateway

# 5. Run Live 45-Second End-to-End Demo
npm run demo
```
