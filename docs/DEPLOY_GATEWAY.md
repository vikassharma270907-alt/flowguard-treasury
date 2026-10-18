# Deploying BeyondFlow Gateway & Supervisor Playground

This guide explains how to deploy the BeyondFlow Gateway and Supervisor Playground on public container platforms (**Render**, **Railway**, or **Fly.io**).

The gateway exposes:
1. **ElevenLabs Webhook Tool Endpoint**: `POST /tools/FlowGuard_<tool_name>` (governed via ArmorIQ PEP)
2. **Supervisor Playground UI & API**: `GET /playground` and `GET /api/state`
3. **Dual-Supervisor Multi-Sig Engine**: `POST /api/pending/:id/decide` and `POST /api/pending/:id/release`
4. **Health & Keep-Warm Route**: `GET /health` and `GET /mcp`

---

## 1. Required Environment Variables

Configure the following secrets in your deployment dashboard:

| Variable | Description | Example / Note |
|---|---|---|
| `ARMORIQ_API_KEY` | ArmorIQ Platform API Key | `sec_live_...` |
| `ARMORIQ_MCP_ID` | Registered MCP server identifier | `flowguard-treasury-mcp` |
| `ARMORIQ_AGENT_ID` | Agent identity registered on ArmorIQ | `flowguard-agent` |
| `USER_ID` | Default actor identity | `flowguard-operator` |
| `GATEWAY_SHARED_SECRET` | Shared secret header (`x-flowguard-token`) | Random high-entropy string |
| `PLAYGROUND_TOKEN` | (Optional) Access token for playground API | If empty, open for review |
| `PORT` | HTTP port assigned by host | Injected automatically (default: `8790`) |

---

## 2. Deployment Options

### Option A: Railway (One-Click Docker)
1. Fork or push the repo to GitHub.
2. In Railway dashboard, click **New Project** > **Deploy from GitHub repo**.
3. Set **Root Directory** to `/` and select `gateway/Dockerfile`.
4. In Railway **Variables**, paste the required environment variables.
5. In **Settings** > **Networking**, enable a public domain (e.g. `https://beyondflow-gateway.up.railway.app`).

### Option B: Render (Web Service)
1. In Render dashboard, click **New** > **Web Service**.
2. Connect your repository.
3. Choose **Docker** environment (or Node with Build: `npm ci --omit=dev`, Start: `npm run gateway:prod`).
4. Set Dockerfile path: `./gateway/Dockerfile`.
5. Add the Environment Variables under **Environment**.
6. Set Health Check path: `/health`.

### Option C: Fly.io
1. Authenticate with Fly CLI: `fly auth login`.
2. Launch the app using the Dockerfile:
   ```bash
   fly launch --dockerfile gateway/Dockerfile --name beyondflow-gateway
   ```
3. Set secrets:
   ```bash
   fly secrets set ARMORIQ_API_KEY="..." ARMORIQ_MCP_ID="..." ARMORIQ_AGENT_ID="..." GATEWAY_SHARED_SECRET="..."
   ```
4. Deploy:
   ```bash
   fly deploy
   ```

---

## 3. Keep-Warm Setup (Zero Cold-Start for Judges)

Public platforms on free/starter tiers may put idle containers to sleep. To keep the gateway and ArmorIQ PEP connection warm:

1. **Vercel Cron**: If using Vercel, `vercel.json` is configured to trigger `/api/health` every 5 minutes.
2. **External Uptime Monitor** (e.g., UptimeRobot, BetterStack):
   - Monitor URL: `https://<YOUR_DEPLOYED_URL>/health`
   - Method: `GET`
   - Interval: Every 5 minutes
   - Expected Status: `200 OK`

---

## 4. Verification

After deployment, verify the live endpoints from your terminal:

```bash
# 1. Verify health & MCP capability info
curl -i https://<YOUR_DEPLOYED_URL>/health
curl -i https://<YOUR_DEPLOYED_URL>/mcp

# 2. Run warmup probe
node --env-file=.env scripts/warmup.mjs

# 3. Test multi-sig approval hardening
node --env-file=.env scripts/test-approval-hardening.mjs
```
