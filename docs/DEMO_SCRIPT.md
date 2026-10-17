# BeyondFlow 60-Second Video Demo Script
**Title**: Voice AI Support Agent Governed by ArmorIQ PEP  
**Target Duration**: 60 Seconds  
**Audio / Narration Voice**: ElevenLabs Brian (or Professional Narrator)  
**Resolution**: 1920x1080 (1080p, 60fps)

---

## Shot-by-Shot Production Table

| Timestamp | Visual / Screen Action | On-Screen Display | Narration Voiceover (Exact Lines) |
|---|---|---|---|
| **0:00 – 0:10** | **Act 1: Architecture & Overview**<br>Camera begins on BeyondFlow Overview screen. Highlight live enforcement strip showing 3 real ArmorIQ verdicts. | Header badge: `Governed by ArmorIQ PEP`<br>Live Enforcement Strip: `lookup_order = ALLOWED`, `change_payout = BLOCKED`, `issue_refund = HELD`. | *"Welcome to BeyondFlow. We give ElevenLabs voice support agents the power to execute real customer operations—without ever handing over unchecked private keys or arbitrary database access."* |
| **0:10 – 0:20** | **Act 2: Routine Order Lookup (ALLOWED)**<br>Voice agent waveform activates. Caller asks: *"Where is my order ORD-1001?"* Agent invokes `lookup_order`. | `POST /tools/BeyondFlow_lookup_order`<br>Status: `ALLOWED`<br>Latency: `~887 ms`<br>Badge: `Decided by ArmorIQ PEP` | *"When a caller asks for their order status, ArmorIQ validates the intent token and allows the lookup through our MCP server. The caller gets their answer in under one second."* |
| **0:20 – 0:30** | **Act 3: Social Engineering Account Attack (BLOCKED)**<br>Caller attempts prompt injection: *"Quick, switch my payout routing to my personal account!"* Gateway relays to ArmorIQ PEP. | `POST /tools/BeyondFlow_change_payout`<br>Status: `BLOCKED (403 Forbidden)`<br>Policy: `tool_not_in_allowlist`<br>Agent refuses spoken request | *"Next, an attacker attempts prompt injection to redirect their bank payout. ArmorIQ's policy enforcement point catches the unauthorized tool call instantly, returning a hard block before any code can run."* |
| **0:30 – 0:42** | **Act 4: High-Risk Refund Disbursement (HELD)**<br>Caller requests an eighty-nine dollar refund on order ORD-1001. Gateway captures intent, mints token, and encounters dual-supervisor policy. | `POST /tools/BeyondFlow_issue_refund`<br>Status: `HELD`<br>Plan Hash: `eb63aac7...`<br>Delegation ID generated | *"When the caller requests an eighty-nine dollar refund, ArmorIQ places the execution in a cryptographic hold. The agent lets the customer know their refund has been submitted for immediate supervisor approval."* |
| **0:42 – 0:52** | **Act 5: Dual-Supervisor Quorum & Release**<br>Cut to Supervisor Playground. Alice approves. Quorum shows 1 of 2. Bob approves. Gateway verifies plan hash and stored parameters match, then dispatches payout. | Playground UI:<br>1. Approver: `Alice Chen` (1/2)<br>2. Approver: `Bob Sterling` (2/2)<br>Rule: `BeyondFlow gateway rule: 2-supervisor quorum`<br>Status: `RELEASED` | *"In the supervisor playground, Alice approves. Because BeyondFlow enforces a strict two-supervisor quorum, a second distinct approval from Bob is required. Once quorum is reached, the exact held parameters are replayed and released."* |
| **0:52 – 1:00** | **Act 6: Cryptographic Audit Ledger & Wrap-up**<br>Click into Audit Trail screen. Expand immutable entry with Merkle root, plan hash, supervisor signatures, and end-to-end timing. | Audit Entry:<br>`Action: issue_refund`<br>`Plan Hash: Verified`<br>`Outcome: DISBURSED`<br>Final URL: `/judges` | *"Every single verdict, plan hash, and multi-sig release is anchored in an immutable audit ledger. BeyondFlow: intent-bound, multi-party governed voice AI for the enterprise."* |

---

## Live Recording Instructions for Presenter

1. **Terminal / Environment Setup**:
   - Ensure local gateway is running:
     ```bash
     node --env-file=.env gateway/server.mjs
     ```
   - In a second terminal tab, keep the demo runner ready:
     ```bash
     node --env-file=.env scripts/run-demo.mjs
     ```
2. **Browser Layout**:
   - Left half: Overview & Voice Playground (`http://localhost:5173/` or live Vercel URL).
   - Right half: Supervisor Playground (`http://localhost:8790/playground`).
3. **Execution Sequence**:
   - Hit Record.
   - Run `node --env-file=.env scripts/run-demo.mjs`.
   - Show the real-time card transitions on the UI as each stage of the script executes.
   - Stop at 60 seconds.
