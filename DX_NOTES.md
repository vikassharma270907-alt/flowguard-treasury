# Developer Experience (DX) Notes & ArmorIQ Integration Findings

This document records the developer experience findings, architectural decisions, and production gotchas encountered while building the ArmorIQ-governed Voice Support Agent.

---

## 1. ElevenLabs Voice Agent Gotchas & Solutions

### Gotcha 1: The ~5-Second Tool Call Timeout & Async Holding Utterance
- **The Challenge**: The ElevenLabs Conversational Voice platform enforces an aggressive ~5-second timeout on tool call webhooks. If an external service hangs while awaiting human review or performing complex multi-party authorization, ElevenLabs times out the tool call, speaks an error utterance, or drops the context.
- **Our Solution**:
  - The gateway responds immediately within the ~5-second window.
  - When a high-risk action such as `issue_refund` enters the hold path, the gateway registers a real ArmorIQ platform delegation and responds with an informative holding message:
    > *"Thanks — that needs a supervisor to approve it. I have notified them and will let you know as soon as they respond."*
  - The pending case is stored in the gateway's supervisor queue with its `case_id`, canonical plan hash, and ArmorIQ token ID.
  - The agent is equipped with a follow-up tool (`check_supervisor_decision`), allowing it to check back and relay the supervisor's decision to the caller once rendered.

### Gotcha 2: Tool Name Prefix Normalization (`BeyondFlow_<tool>`)
- **The Challenge**: To prevent namespace collisions across multiple tool providers in ElevenLabs, tool definitions are presented to LLMs with namespaces or prefixes such as `BeyondFlow_<tool>` (e.g. `BeyondFlow_orderLookup`, `BeyondFlow_payoutChange`, `BeyondFlow_issueRefund`).
- **Our Solution**:
  - The ArmorIQ plan must match the exact onboarded MCP tool names (`lookup_order`, `change_payout`, `issue_refund`). If the plan is captured with the raw prefixed name, Merkle tree verification against the onboarded MCP schema will fail.
  - The gateway applies transparent prefix normalization via `canonicalToolName(raw)`:
    ```javascript
    export const TOOL_PREFIXES = ['BeyondFlow_', 'IntentGate_'];
    export function canonicalToolName(raw) {
      for (const prefix of TOOL_PREFIXES) {
        if (raw.startsWith(prefix)) return raw.slice(prefix.length);
      }
      return raw;
    }
    ```
  - This ensures cryptographic plan signatures match the registered tools on the platform.

---

## 2. Latency Measurements (Allowed Path vs Budget)

ElevenLabs requires tool execution well under 5 seconds. All operations were tested against the live ArmorIQ platform (`https://iap.armoriq.ai` and `https://proxy.armoriq.ai`) over public HTTPS.

| Action | ArmorIQ Step | Measured Latency | ElevenLabs Budget | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`lookup_order`** | Plan Capture | ~0.5 ms | — | Fast |
| **`lookup_order`** | Intent Token Mint (CSRG-IAP) | 2,400 – 2,600 ms | — | Verified |
| **`lookup_order`** | Proxy Invocation (`proxy.armoriq.ai`) | 600 – 900 ms | — | Verified |
| **`lookup_order` (Total Allowed)** | **Full End-to-End Roundtrip** | **3,200 – 3,600 ms** | **< 5,000 ms** | **PASS** |
| **`change_payout` (Blocked)** | Token Mint + Proxy Policy Block | **3,200 – 3,600 ms** | **< 5,000 ms** | **PASS** |
| **`issue_refund` (Hold Initial)** | Token Mint + Delegation Hold | **3,000 – 3,400 ms** | **< 5,000 ms** | **PASS** |
| **`issue_refund` (Release)** | Delegation release after 2 approvals | **Async (outside the voice turn budget)** | **N/A (Async)** | **Documented** |

> **Key Takeaway**: Both the allowed path (`lookup_order`) and the blocked path (`change_payout`) consistently complete within ~3.0s – 3.6s, honoring the ~5-second voice turn constraint.

---

## 3. Human Supervisor Approvals & Multi-Signer Quorum Approach

### Platform Capability vs Gateway Logic
- **ArmorIQ Platform Capability**: The `@armoriq/sdk` supports delegation creation (`POST /delegation/request`), approval polling (`session.awaitApproval()`), and execution tracking (`client.markDelegationExecuted()`); proxy enforcement responses are classified by action (`enforcement.action` → `PolicyBlockedException` / `PolicyHoldException`).
- **Multi-Approver Quorum**: The current ArmorIQ platform documentation does not specify a multi-signer threshold parameter (e.g. $N$-of-$M$ approvers) at the policy schema level.
- **Our Implementation**:
  - When `issue_refund` is requested, the gateway registers a real delegation hold with ArmorIQ (`/delegation/request`), returning a pending `delegationId` directly from the platform.
  - The gateway acts as a multi-signature gatekeeper: it requires **two distinct supervisor approvals** in the Supervisor Playground before releasing the held execution.
  - Once the 2nd approval is recorded, the gateway initiates the release: ArmorIQ verifies the intent plan, and `client.invoke(MCP, 'issue_refund', token, params)` executes the transaction through `proxy.armoriq.ai`.
  - If any supervisor clicks **Deny**, the hold is immediately terminated, and the voice agent relays the refusal to the caller.

---

## 4. ArmorIQ SDK Findings & Gotchas

### Finding 1: SDK Exception Subtyping on Invoke (`instanceof` Gotcha)
- In `@armoriq/sdk` (Node.js v0.6.10), when `client.invoke()` receives an HTTP 403 policy enforcement response from `proxy.armoriq.ai`, the internal Axios catch handler wraps the error as:
  ```javascript
  const enrichedError = new Error(errorDetail.message || 'Enforcement action');
  enrichedError.name = errorDetail.enforcement.action === 'block' ? 'PolicyBlockedException' : 'PolicyHoldException';
  throw enrichedError;
  ```
- Because it constructs a standard JavaScript `new Error()`, standard `instanceof PolicyBlockedException` evaluates to `false`!
- **Solution**: Always classify errors using `err.name === 'PolicyBlockedException' || err instanceof PolicyBlockedException` and read structured reasons from `err.response?.data?.enforcement`.

### Finding 2: Python 3.14 Incompatibility
- Python 3.14 is explicitly unsupported by the ArmorIQ SDK (`Python 3.10-3.13 or Node 18+`). The gateway and MCP server are implemented in Node.js (Node v24.18.0) using `@armoriq/sdk` v0.6.10 for full platform parity and native SSE streaming support.

### Finding 3: Intent Binding vs Policy Enforcement
- ArmorIQ provides cryptographic intent binding through CSRG-IAP Merkle inclusion proofs (`X-CSRG-Proof`, `X-CSRG-Path`, `X-CSRG-Value-Digest`).
- Testing confirmed that even if a policy would permit an action, presenting a token whose canonical plan only authorized `lookup_order` to call `issue_refund` is immediately rejected with `IntentMismatchException: Action 'issue_refund' not found in the original plan`.
- Action binding covers the declared action set and token freshness; call arguments are not bound end-to-end today — a swapped amount reaches the upstream tool, which enforces its own bounds (see `docs/evidence/README.md`).
