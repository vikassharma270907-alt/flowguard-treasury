/**
 * Onboard the MCP server + agent to the ArmorIQ control plane, then verify the
 * tool list was discovered.
 *
 *   node --env-file=.env scripts/onboard.mjs
 *
 * Uses POST /iap/sdk/register — the same control-plane route `armoriq register`
 * (Python CLI) calls. Re-running is safe: servers/agents are upserted.
 *
 * NOTE: the MCP bearer token is sent to ArmorIQ so the proxy can authenticate
 * to the MCP upstream. That is the documented mechanism (armoriq.yaml
 * `mcp_servers[].auth.token`); the token protects a synthetic sandbox server.
 */
import { ArmorIQClient } from '@armoriq/sdk';

const KEY = process.env.ARMORIQ_API_KEY;
const BASE = process.env.BACKEND_ENDPOINT || 'https://api.armoriq.ai';
const MCP_URL = process.env.MCP_PUBLIC_URL;
const MCP_ID = process.env.ARMORIQ_MCP_ID;
const MCP_TOKEN = process.env.MCP_AUTH_TOKEN;
const AGENT_ID = process.env.ARMORIQ_AGENT_ID || 'intentgate-agent';

if (!KEY || !MCP_URL || !MCP_ID || !MCP_TOKEN) {
  console.error('Need ARMORIQ_API_KEY, MCP_PUBLIC_URL, ARMORIQ_MCP_ID and MCP_AUTH_TOKEN in .env');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let parsed;
  const text = await res.text();
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 400);
  }
  return { status: res.status, body: parsed };
}

const config = {
  version: 'v1',
  identity: { api_key: KEY, user_id: process.env.USER_ID || 'intentgate-operator', agent_id: AGENT_ID },
  environment: 'sandbox',
  proxy: { url: 'https://proxy.armoriq.ai', timeout: 30, max_retries: 3 },
  mcp_servers: [
    {
      id: MCP_ID,
      url: MCP_URL,
      description: 'IntentGate synthetic treasury tools: lookup_order, change_payout, issue_refund',
      auth: { type: 'bearer', token: MCP_TOKEN },
    },
  ],
  policy: { allow: [], deny: [] },
  intent: { ttl_seconds: 300, require_csrg: true },
};

console.log('registering config with the control plane...');
const reg = await api('POST', '/iap/sdk/register', config);
console.log(`  status ${reg.status}`);
console.log(' ', JSON.stringify(reg.body, null, 2).split('\n').join('\n  '));

// Try the routes that can trigger/refresh tool discovery.
console.log('\nrefreshing tool list...');
for (const [method, path] of [
  ['GET', `/mcp/tools/${encodeURIComponent(MCP_ID)}`],
  ['GET', `/mcp/tool-metadata/${encodeURIComponent(MCP_ID)}`],
  ['POST', `/mcp/servers/${MCP_ID}/scan`],
]) {
  const r = await api(method, path);
  console.log(`  ${method} ${path} -> ${r.status}`);
  if (r.status >= 400) console.log(`     ${JSON.stringify(r.body).slice(0, 200)}`);
}

const client = new ArmorIQClient({
  apiKey: KEY,
  userId: process.env.USER_ID || 'intentgate-operator',
  agentId: AGENT_ID,
});

const boot = await client.bootstrap();
console.log('\nbootstrap state:');
console.log('  agent :', JSON.stringify(boot.agent));
console.log('  agents:', JSON.stringify(boot.agents));
console.log('  mcps  :', JSON.stringify(boot.mcps));
console.log('  toolMap:', JSON.stringify(boot.toolMap));

for (const m of boot.mcps ?? []) {
  if (!m.tools?.length) {
    console.log(`\n  !! ${m.name} has no discovered tools yet`);
  }
}

client.close();
