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

## 2. Latency Measurements (ArmorIQ Proxy Only vs End-to-End Gateway)

ElevenLabs mandates that tool webhooks return well within ~5 seconds. To understand where time is spent, we measured both:
1. **ArmorIQ platform/proxy call only** (direct SDK call to `proxy.armoriq.ai` or `delegation/request`).
2. **End-to-end through the Gateway** (HTTP `POST /tools/BeyondFlow_<tool>`, including body parsing, `capturePlan`, token minting at `iap.armoriq.ai`, proxy execution/delegation, and speakable formatting).

All numbers below are from **10 benchmark runs executed on October 17, 2026**:

| Tool & Verdict | ArmorIQ Proxy Call Only (Point 1)<br>min / median / max | End-to-End Through Gateway (Point 2)<br>min / median / max | ElevenLabs Budget | Status |
| :--- | :--- | :--- | :--- | :--- |
| **`lookup_order`** (ALLOWED) | 818 ms / **921 ms** / 1,433 ms | 2,719 ms / **3,118 ms** / 4,897 ms | < 5,000 ms | **PASS** |
| **`change_payout`** (BLOCKED) | 626 ms / **769 ms** / 878 ms | 2,652 ms / **2,982 ms** / 4,493 ms | < 5,000 ms | **PASS** |
| **`issue_refund`** (HELD) | 631 ms / **761 ms** / 987 ms | 2,816 ms / **2,931 ms** / 3,609 ms | < 5,000 ms | **PASS** |
| **`issue_refund`** (RELEASE) | Async release via supervisor quorum | Outside webhook turn | N/A (Async) | **PASS** |

> **ElevenLabs Budget Verification**: The ~5-second window applies to the **end-to-end gateway round trip (Point 2)**. The held-call reply for `issue_refund` completes in a median of **2,931 ms** (maximum 3,609 ms across 10 runs), safely below the 5-second deadline and preventing any voice drop.

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
