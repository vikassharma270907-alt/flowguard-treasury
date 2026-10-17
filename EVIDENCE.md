# ArmorIQ Enforcement Evidence & Audit Logs

This document provides cryptographically verified evidence of **ArmorIQ policy enforcement** directly from `proxy.armoriq.ai` and `iap.armoriq.ai`, fulfilling the hackathon requirement for audit log evidence of:
1. **One action visibly ALLOWED by ArmorIQ** (`lookup_order`)
2. **One action visibly BLOCKED by ArmorIQ** (`change_payout`)
3. **One action visibly HELD by ArmorIQ** (`issue_refund`)
4. **Cryptographic Intent Mismatch Refusal** (`IntentMismatchException`)

> **Migration & latest run (2026-10-16):** sections 1–4 below are the first accepted run, captured against a local tunnel (platform record then named `intentgate-support-mcp`). The record has since been recreated as **`flowguard-treasury-mcp`** (`7540cd0a-7d76-414a-a849-96b337a0c6ed`) at `https://flowguard-treasury.vercel.app/mcp`, governed by policy **`flowguard-treasury-allowlist`** (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`). Fresh captures on the production endpoint: **section 5 below** and [`docs/evidence/`](docs/evidence/README.md). Historical sections are left exactly as recorded.

---

## 1. Action ALLOWED by ArmorIQ (`lookup_order`)

### Overview
- **Tool**: `lookup_order`
- **Agent**: `intentgate-agent` (UUID `c8bcbe51-dea4-4459-9fd8-38f88ebc714e`)
- **MCP Server**: `intentgate-support-mcp` (UUID `cd7deb69-adb3-45f7-977b-f0d0e7235ba2`)
- **ArmorIQ Decision**: `ALLOWED`
- **Verification Status**: `verified: true`, `mcpStatus: "success"`
- **Execution Roundtrip**: 1,793 ms (within ~5s budget)

### Full Audit Log Entry
```json
{
  "t": "2026-10-15T21:10:39.009Z",
  "event": "call",
  "decision": "ALLOWED",
  "callId": "call-1-mva198o9",
  "tool": "lookup_order",
  "args": {
    "order_id": "ORD-1004"
  },
  "timings": {
    "capture": 0,
    "mint": 2463,
    "invoke": 1496,
    "total": 3960
  },
  "plan": {
    "goal": "startup warmup (real governed call)",
    "steps": [
      {
        "action": "lookup_order",
        "tool": "lookup_order",
        "mcp": "intentgate-support-mcp",
        "inputs": {
          "order_id": "ORD-1004"
        }
      }
    ]
  },
  "planHash": "b3e6889fe267adb661881333d488307f0263e0c2baf3efb3866bf136a62ac1ec",
  "tokenId": "4d23b173149b411b93c90a6a99e11d59",
  "policyValidation": {
    "domain": "avi-england-vessel-touched.trycloudflare.com",
    "requested_tools": [
      "lookup_order"
    ],
    "allowed_tools": [
      "issue_refund",
      "lookup_order"
    ],
    "denied_tools": [],
    "denied_reasons": [],
    "matched_policies": [
      {
        "policyId": "a84b9fb7-62f2-4154-a4c5-e696ec42a146",
        "policyName": "cli-intentgate-agent-intentgate-support-mcp",
        "priority": 100,
        "defaultEnforcementAction": "block",
        "rules": {}
      }
    ],
    "default_enforcement_action": "block",
    "decision_source": "opa",
    "policy_ref": "armoriq:5a7c94c2258e:1a141671878"
  },
  "stepProofs": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"found\":true,\"order\":{\"order_id\":\"ORD-1004\",\"customer\":\"Tomas Berg\",\"status\":\"delivered\",\"placed_on\":\"2026-10-01\",\"delivered_on\":\"2026-10-06\",\"items\":[{\"sku\":\"CBL-100\",\"name\":\"XLR Cable 5m\",\"qty\":4,\"unit_price\":12.25}],\"total\":49,\"currency\":\"USD\",\"refunded\":12.25,\"refundable\":36.75,\"payout_account_id\":\"ACC-4471\"}}"
      }
    ]
  },
  "verified": true,
  "mcpStatus": "success",
  "source": "elevenlabs-tool"
}
```

---

## 2. Action BLOCKED by ArmorIQ Policy (`change_payout`)

### Overview
- **Tool**: `change_payout`
- **Agent**: `intentgate-agent`
- **MCP Server**: `intentgate-support-mcp`
- **ArmorIQ Decision**: `BLOCKED` (HTTP 403 `PolicyBlockedException`)
- **Reason**: `tool_not_in_allowlist`
- **Enforcement Action**: `block`

### Full Audit Log Entry
```json
{
  "t": "2026-10-15T21:10:58.276Z",
  "event": "call",
  "decision": "BLOCKED",
  "callId": "call-3-mva19oid",
  "tool": "change_payout",
  "args": {
    "account_id": "ACC-4471",
    "new_destination": "GB29 NWBK 6016 1331 9268 19"
  },
  "timings": {
    "capture": 1,
    "mint": 2100,
    "total": 2702
  },
  "plan": {
    "goal": "Caller asks to change the payout destination",
    "steps": [
      {
        "action": "change_payout",
        "tool": "change_payout",
        "mcp": "intentgate-support-mcp",
        "inputs": {
          "account_id": "ACC-4471",
          "new_destination": "GB29 NWBK 6016 1331 9268 19"
        }
      }
    ]
  },
  "planHash": "b086c9aeb8da13433d03ae96a34433d6c5af56a6e1019c4bd77ef62846b791a8",
  "tokenId": "92b7cd5898024d1a823b1dfb96f426ce",
  "policyValidation": {
    "domain": "avi-england-vessel-touched.trycloudflare.com",
    "requested_tools": [
      "change_payout"
    ],
    "allowed_tools": [
      "issue_refund",
      "lookup_order"
    ],
    "denied_tools": [],
    "denied_reasons": [],
    "matched_policies": [
      {
        "policyId": "a84b9fb7-62f2-4154-a4c5-e696ec42a146",
        "policyName": "cli-intentgate-agent-intentgate-support-mcp",
        "priority": 100,
        "defaultEnforcementAction": "block",
        "rules": {}
      }
    ],
    "default_enforcement_action": "block",
    "decision_source": "opa",
    "policy_ref": "armoriq:5a7c94c2258e:1a141676731"
  },
  "stepProofs": 1,
  "verdict": "BLOCKED",
  "errorName": "PolicyBlockedException",
  "httpStatus": 403,
  "reason": "tool_not_in_allowlist",
  "message": "Tool 'change_payout' is not allowed by policy",
  "enforcementAction": "block",
  "allowedTools": [
    "issue_refund",
    "lookup_order"
  ],
  "source": "elevenlabs-tool"
}
```

---

## 3. Action HELD by ArmorIQ Delegation (`issue_refund`)

### Overview
- **Tool**: `issue_refund`
- **ArmorIQ Decision**: `HELD` (`PolicyHoldException`)
- **Platform Delegation ID**: `05c93bac-4f57-4e1d-ae65-4008bf559dde` (Status: `pending`)
- **Holding Response**: *"Thanks — that needs a supervisor to approve it. I have notified them and will let you know as soon as they respond."*
- **Execution on 2 Approvals**: Released via `proxy.armoriq.ai`, executing refund `RFD-MVA1E72W` on order `ORD-1002`.

---

## 4. Cryptographic Intent Mismatch (`IntentMismatchException`)

### Overview
- Token minted for plan containing only `lookup_order` (`planHash=b3e6889f...`).
- Agent attempted to invoke `issue_refund` with that token.
- **Refused by**: `IntentMismatchException`
- **Reason**: *"Action 'issue_refund' not found in the original plan. Plan contains actions: [\"lookup_order\"]. You can only invoke actions that were included in the plan when you called capturePlan()."*
- Refusal occurs immediately prior to any proxy transmission, demonstrating cryptographic intent binding.

---

## 5. Re-verified on Production (2026-10-16, 19:06 UTC)

Full raw captures (committed at revision `11de761`): [`docs/evidence/test-enforcement-2026-10-16.txt`](docs/evidence/test-enforcement-2026-10-16.txt) · [`docs/evidence/test-intent-mismatch-2026-10-16.txt`](docs/evidence/test-intent-mismatch-2026-10-16.txt) · metadata: [`docs/evidence/README.md`](docs/evidence/README.md).

Every call below ran against the registered record `flowguard-treasury-mcp` (`7540cd0a-…`) at `https://flowguard-treasury.vercel.app/mcp` and matched policy **`flowguard-treasury-allowlist`** (`23f8f304-…`, `decision_source: "opa"`).

| Case | Verdict | tokenId | policy_ref | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `lookup_order` | **ALLOWED** | `951f7625efe24fb18039b62fadfed910` | `armoriq:5081adc84221:1a1461bc656` | Real payload: order ORD-1001 (Dana Whitfield, delivered, USD 89); exec 0.885 s; `verified: true` |
| `change_payout` | **BLOCKED** | `3a280ab1a5f74beea90b4b459b71b498` | `armoriq:5081adc84221:1a1461bd394` | `PolicyBlockedException` HTTP 403 — `tool_not_in_allowlist` |
| `issue_refund` | **HELD** | `df327b9275b74d43b008c4e1e10ccf00` | `armoriq:5081adc84221:1a1461be00c` | Delegation `eb63aac7-349a-4cf0-a156-a2f3c469f427` (status `pending`) created via the platform delegation API — releases only after supervisor approval |

Intent-binding run:

- **Case 1 — wrong action:** token minted for `lookup_order` (`90916da4116f4900bcd85e588714e785`) used to invoke `issue_refund` → `IntentMismatchException`, refused before any network call.
- **Case 2 — swapped amount:** token minted for a refund of 89 (`86401740b0e8428fa5807abd4676dc84`) used to invoke a refund of 5,000 → **NOT REFUSED**; the platform binds declared actions and token freshness, not call arguments. The sandbox tool's own bounds check rejected it (`Refund of 5000 exceeds refundable balance 89 for ORD-1001.`). Reported exactly as observed rather than presented as an interception.
- **Case 3 — expired token:** token `464314b10ac44edd8c20da15adde40b2` (5 s validity) → `TokenExpiredException`, refused before any network call.
- **Mechanism for HELD:** refunds are held by BeyondFlow's designed control — a real ArmorIQ platform delegation request (`POST /delegation/request`). The platform's response ("Delegation request created. Awaiting approval from senior officer.") and the delegation id are captured verbatim.
