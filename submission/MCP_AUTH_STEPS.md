# Step-by-Step Guide: Enabling MCP Bearer Authentication

This document outlines the exact procedure to lock down the production Model Context Protocol (MCP) endpoint on Vercel using bearer token authentication, preventing ungoverned direct calls while keeping ArmorIQ Policy Enforcement Point (PEP) proxy routing fully operational.

---

## 1. Summary of Authentication Architecture

- **Endpoint**: `https://flowguard-treasury.vercel.app/mcp`
- **Enforcement Mechanism**: The server (`server/server.js` and `mcp-server/server.mjs`) inspects the incoming `Authorization` HTTP header. If `process.env.MCP_AUTH_TOKEN` is defined, requests lacking `Authorization: Bearer <MCP_AUTH_TOKEN>` receive an immediate `401 Unauthorized` response.
- **Proxy Upstream Passing**: When the gateway invokes tools through `@armoriq/sdk` via `proxy.armoriq.ai`, the SDK automatically builds the header from environment variables formatted as `ARMORIQ_MCP_<SAFE_MCP_ID>_{AUTH_TYPE,TOKEN}`. For the registered MCP server ID `flowguard-treasury-mcp`, the SDK attaches the token credentials and `proxy.armoriq.ai` presents them to Vercel upon forwarding.

---

## 2. Environment Variables to Set

### A. On Vercel (Production / Preview / Development)
1. Navigate to **Vercel Dashboard** → Select **flowguard-treasury** → **Settings** → **Environment Variables**.
2. Add the following variable:
   - **Key**: `MCP_AUTH_TOKEN`
   - **Value**: A high-entropy random string (e.g., generate with `node -e "console.log(crypto.randomBytes(24).toString('hex'))"`)
   - **Environments**: Check **Production**, **Preview**, and **Development**.
3. **Trigger a Redeployment**:
   - Go to **Deployments** → Click the three dots `...` on the latest production deployment → Select **Redeploy** (or push a commit).
   - *Note: Environment variables do not take effect on active deployments until redeployed.*

### B. In the Local `.env` (Gateway & Test Scripts)
Add or update the following entries in your local `.env` file:
```env
# Shared Bearer Token for MCP Authentication
MCP_AUTH_TOKEN=<same_token_value_as_set_on_vercel>

# ArmorIQ SDK MCP Proxy Authentication Mapping
ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_AUTH_TYPE=bearer
ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_TOKEN=<same_token_value_as_set_on_vercel>
```

---

## 3. Verification Protocol

### Step 1: Verify Direct Unauthenticated Call is Rejected (401)
Run this command from your terminal:
```bash
curl -i -s -X POST https://flowguard-treasury.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
**Expected Response:**
```http
HTTP/2 401
content-type: application/json

{"jsonrpc":"2.0","id":1,"error":{"code":-32001,"message":"Unauthorized: missing or invalid MCP bearer token."}}
```

### Step 2: Verify Direct Authenticated Call Succeeds (200 SSE)
Run with the Bearer token:
```bash
curl -i -s -X POST https://flowguard-treasury.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
**Expected Response:**
```http
HTTP/2 200
content-type: text/event-stream

event: message
data: {"jsonrpc":"2.0","id":1,"result":{"tools":[{"name":"lookup_order",...}]}}
```

### Step 3: Verify GET /mcp Returns Clean Status (200 JSON, No HTML)
```bash
curl -i -s https://flowguard-treasury.vercel.app/mcp
```
**Expected Response:**
```http
HTTP/2 200
content-type: application/json

{"name":"flowguard-treasury-mcp","transport":"POST JSON-RPC 2.0 over HTTP, SSE responses","status":"ok"}
```

### Step 4: Verify Governed Gateway & ArmorIQ Proxy Execution
Run the verification script through the ArmorIQ proxy:
```bash
node --env-file=.env scripts/test-enforcement.mjs
```
**Expected Outcome:**
- `lookup_order` -> `ALLOWED`
- `change_payout` -> `BLOCKED`
- `issue_refund` -> `HELD`

### Step 5: Update DISCLOSURES.md
In `DISCLOSURES.md` under **Section 7 (Known Security Limitations)**:
Replace the placeholder:
```markdown
- **Open production MCP endpoint.** The endpoint requires a bearer token; the ArmorIQ proxy supplies it through ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_TOKEN. A direct call without it is rejected (verified October 17, 2026).
```
