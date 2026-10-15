# FlowGuard — ArmorIQ Platform Onboarding & Hackathon Compliance Guide

> **Official Portal:** [https://platform.armoriq.ai](https://platform.armoriq.ai)  
> **Repository:** [github.com/vikassharma270907-alt/flowguard-treasury](https://github.com/vikassharma270907-alt/flowguard-treasury)  
> **Live Production:** [https://flowguard-treasury.vercel.app](https://flowguard-treasury.vercel.app)

---

## 📜 Hackathon Rules Compliance Matrix

| Rule | Requirement | FlowGuard Treasury Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Rule 1** | **Mandatory ArmorIQ Integration** | Integrated `@armoriq/sdk` in production mode connected to `api.armoriq.ai` and `iap.armoriq.ai`. |  **COMPLIANT** |
| **Rule 2** | **ElevenLabs with ArmorIQ** | Every ElevenLabs support call session mints an ArmorIQ-signed plan with Ed25519 token & SHA-256 hash. |  **COMPLIANT** |
| **Rule 3** | **AI Models & Frameworks** | Utilizes ElevenLabs Flash/Turbo for voice, Node.js + Express 5, React 19, and ArmorIQ SDK. |  **COMPLIANT** |
| **Rule 4** | **At Least One MCP Server** | Built official Model Context Protocol (MCP) server `flowguard-treasury-mcp` with stdio & REST modes. |  **COMPLIANT** |
| **Rule 7** | **Sandbox Environments Only** | Exclusively targets Airwallex Sandbox API (`api.sandbox.airwallex.com`). No real money moved. |  **COMPLIANT** |
| **Rule 8** | **Actual ArmorIQ Enforcement** | Live platform plan capture (`capturePlan`), Ed25519 token minting, and policy validation. |  **COMPLIANT** |

---

## 🔑 1. Generating API Keys on platform.armoriq.ai

1. Navigate to [platform.armoriq.ai](https://platform.armoriq.ai) and sign in.
2. Go to **API Keys** -> Click **Create New Key**.
3. Select Environment: **Production / Live** (`ak_live_...`).
4. Set Permissions: `capturePlan`, `verifyToken`, `listMcps`, `iapPublicKey`.
5. Add the key to your `.env` or Vercel Environment Variables:
   ```env
   ARMORIQ_API_KEY=ak_live_your_actual_key_here
   ```

---

## 🤖 2. Onboarding Agents to platform.armoriq.ai

FlowGuard utilizes two governed agents that must be registered on the ArmorIQ platform:

### Agent 1: FlowGuard Treasury Controller Agent
* **Agent Identifier:** `flowguard-treasury-agent-v1`
* **Agent Name:** FlowGuard Autonomous Treasury Planner
* **Description:** Governs liquidity reserve floors ($15,000 USD default), Airwallex FX corridor selection, and accounts payable payouts.
* **Governed Policies:**
  - `DUPLICATE_INVOICE_PROHIBITION` (Levenshtein fuzzy similarity threshold: 85%)
  - `RESERVE_FLOOR_PROTECTION` (Fail-Closed if payout breaches minimum reserve)
  - `SINGLE_PAYOUT_THRESHOLD` ($50,000 USD autonomous limit)

### Agent 2: ElevenLabs Voice Support Agent
* **Agent Identifier:** `elevenlabs-voice-support-agent-v2`
* **Agent Name:** ElevenLabs Voice Support Gateway Agent
* **Description:** Takes customer voice support calls through the gateway with 5s timeout window handling.
* **Governed Tools:**
  - `IntentGate_orderLookup`: Allowed automatically by ArmorIQ read policy.
  - `IntentGate_payoutChange`: Intercepted and escalated to human supervisor (Press Deny).
  - `IntentGate_issueRefund`: Enforces dual-key supervisor quorum (2 approvals required).

---

## 🔌 3. Onboarding the Model Context Protocol (MCP) Server

FlowGuard implements a full MCP server compliant with the **Model Context Protocol spec (2024-11-05)**.

### MCP Server Registration Details
* **Server Name:** `flowguard-treasury-mcp`
* **Version:** `1.0.0`
* **Supported Transports:** `stdio` (CLI) and `HTTP-SSE / REST` (Cloud)
* **Execution Command:**
  ```bash
  npm run mcp
  # or
  node server/mcpServer.js --stdio
  ```

### Claude Desktop & Cursor Integration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "flowguard-treasury": {
      "command": "node",
      "args": ["d:/hackathon/New folder/server/mcpServer.js", "--stdio"],
      "env": {
        "ARMORIQ_API_KEY": "ak_live_your_key_here"
      }
    }
  }
}
```

### Governed MCP Tools
1. `order_lookup`: Query order status & scheduled payout date. Allowed by ArmorIQ.
2. `payout_change`: Wire routing override attempt. Halted by ArmorIQ; requires supervisor review.
3. `issue_refund`: High-value refund disbursement. Requires two supervisor approvals (dual quorum).
4. `assert_reserve_floor`: Asserts minimum treasury cash reserve floor ($15,000 USD).
5. `verify_audit_merkle`: Computes cryptographic SHA-256 Merkle root across audit events.

---

## 🧪 4. Verifying Actual ArmorIQ Enforcement

### Live Test Command
Run the verification test script against the live ArmorIQ platform:
```bash
node -e "
require('dotenv').config();
const { ArmorIQClient } = require('@armoriq/sdk');
const client = new ArmorIQClient({ apiKey: process.env.ARMORIQ_API_KEY });
client.capturePlan('flowguard-treasury-agent-v1', 'Authorize payout of USD 18500', { steps: [{ step: 1, tool: 'airwallex.transfers.create' }] })
  .then(res => console.log('✅ Plan captured live on ArmorIQ Platform:', res));
"
```

### Webhook API Verification (Vercel Production)
```bash
# 1. Test MCP Status
curl https://flowguard-treasury.vercel.app/api/mcp/status

# 2. Test MCP Tool Execution with ArmorIQ Gate
curl -X POST https://flowguard-treasury.vercel.app/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "order_lookup", "arguments": {"orderId": "ORD-84920"}}'
```
