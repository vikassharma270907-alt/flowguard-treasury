# BeyondFlow — ArmorIQ Platform Onboarding & Hackathon Compliance Guide

> **Official Portal:** [https://platform.armoriq.ai](https://platform.armoriq.ai)  
> **Repository:** [github.com/vikassharma270907-alt/beyondflow-treasury](https://github.com/vikassharma270907-alt/beyondflow-treasury)
> **Live Production:** [https://flowguard-treasury.vercel.app](https://flowguard-treasury.vercel.app)

---

## 📜 Hackathon Rules Compliance Matrix

| Rule | Requirement | BeyondFlow Treasury Implementation | Status |
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

BeyondFlow registers one governed agent on the ArmorIQ platform; the same identity is used by the voice gateway and the verification scripts.

### Agent: `flowguard-agent` (BeyondFlow Operator Identity)
* **Agent UUID:** `c8bcbe51-dea4-4459-9fd8-38f88ebc714e`
* **Description:** Represents the BeyondFlow operator (`flowguard-operator`) when plans are captured and intent tokens are minted.
* **Attached MCP Server:** `flowguard-treasury-mcp` (`7540cd0a-7d76-414a-a849-96b337a0c6ed`) at `https://flowguard-treasury.vercel.app/mcp`.
* **Governing Policy:** `flowguard-treasury-allowlist` (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`) — allowed tools `issue_refund` + `lookup_order`, default enforcement `block`, priority 100.
* **Tools exposed to the voice agent (via the BeyondFlow gateway):**
  - `BeyondFlow_orderLookup`: Allowed automatically by the stored read policy.
  - `BeyondFlow_payoutChange`: Blocked by the stored policy (`tool_not_in_allowlist`).
  - `BeyondFlow_issueRefund`: Held for dual-supervisor approval via a real platform delegation.

---

## 🔌 3. Onboarding the Model Context Protocol (MCP) Server

BeyondFlow implements a full MCP server compliant with the **Model Context Protocol spec (2024-11-05)**.

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
    "beyondflow-treasury": {
      "command": "node",
      "args": ["server/mcpServer.js", "--stdio"],
      "env": {
        "ARMORIQ_API_KEY": "ak_live_your_key_here"
      }
    }
  }
}
```

### Governed MCP Tools
1. `lookup_order`: Query order status & scheduled payout date. Allowed by the stored ArmorIQ policy.
2. `change_payout`: Wire routing override attempt. Blocked by the stored policy (`tool_not_in_allowlist`).
3. `issue_refund`: High-value refund disbursement. Held for two supervisor approvals via a real ArmorIQ platform delegation.
4. `assert_reserve_floor`: App-side treasury check for the minimum cash reserve floor ($15,000 USD, sandbox ledger).
5. `verify_audit_merkle`: App-side SHA-256 Merkle root over the audit events.

---

## 🧪 4. Verifying Actual ArmorIQ Enforcement

### Live Test Command
Run the real enforcement scripts against the live ArmorIQ platform:
```bash
node --env-file=.env scripts/test-enforcement.mjs
node --env-file=.env scripts/test-intent-mismatch.mjs
# Expected: lookup_order ALLOWED · change_payout BLOCKED · issue_refund HELD (pending platform delegation)
# Raw captures: docs/evidence/
```

### Webhook API Verification (Vercel Production)
```bash
# 1. Test MCP Status
curl https://flowguard-treasury.vercel.app/api/mcp/status

# 2. Test MCP Tool Execution with ArmorIQ Gate
curl -X POST https://flowguard-treasury.vercel.app/api/mcp/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "lookup_order", "arguments": {"order_id": "ORD-1001"}}'
```
