/**
 * Set the stored ArmorIQ policy for this MCP server through the control plane,
 * then verify enforcement for real.
 *
 *   node --env-file=.env scripts/set-policy.mjs [tool[,tool...]]
 *
 * Default allow-list: lookup_order. Every tool NOT in the allow-list falls to
 * the policy's default enforcement action, which this control-plane route
 * leaves at "block" (verified: a blocked call returns HTTP 403
 * reason=tool_not_in_allowlist).
 *
 * What this route can and cannot express (see DX_NOTES.md §3):
 *   - can:   per-tool ALLOW via `policy.allow`
 *   - cannot: a per-tool HOLD. The register route has no hold vocabulary; a
 *             hold rule has to be authored in the ArmorIQ dashboard
 *             (Policies → Policy Studio → member rule enforcement action).
 *
 * Re-running is safe: the policy is replaced in place (onConflict: replace).
 */
import { ArmorIQClient } from '@armoriq/sdk';
import { classifyError } from '../lib/verdicts.mjs';

const KEY = process.env.ARMORIQ_API_KEY;
const BASE = process.env.BACKEND_ENDPOINT || 'https://api.armoriq.ai';
const MCP = process.env.ARMORIQ_MCP_ID;
const AGENT = process.env.ARMORIQ_AGENT_ID || 'flowguard-agent';
const USER = process.env.USER_ID || 'flowguard-operator';

const ALLOW = (process.argv[2] || process.env.POLICY_ALLOW || 'lookup_order').split(',').map((s) => s.trim()).filter(Boolean);

for (const [name, value] of Object.entries({ ARMORIQ_API_KEY: KEY, ARMORIQ_MCP_ID: MCP, MCP_PUBLIC_URL: process.env.MCP_PUBLIC_URL, MCP_AUTH_TOKEN: process.env.MCP_AUTH_TOKEN })) {
  if (!value) {
    console.error(`Missing ${name} in .env`);
    process.exit(1);
  }
}

const config = {
  version: 'v1',
  identity: { api_key: KEY, user_id: USER, agent_id: AGENT },
  environment: 'sandbox',
  proxy: { url: 'https://proxy.armoriq.ai', timeout: 30, max_retries: 3 },
  mcp_servers: [{ id: MCP, url: process.env.MCP_PUBLIC_URL, auth: { type: 'bearer', token: process.env.MCP_AUTH_TOKEN } }],
  intent: { ttl_seconds: 300, require_csrg: true },
  onConflict: 'replace',
  policy: { allow: ALLOW },
};

console.log(`Writing policy: allow=[${ALLOW.join(', ')}], default=block (platform default)`);
const res = await fetch(`${BASE}/iap/sdk/register`, {
  method: 'POST',
  headers: { 'X-API-Key': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify(config),
});
const body = await res.json().catch(() => ({}));
console.log(`  control plane -> HTTP ${res.status}`);
if (body.policies) for (const p of body.policies) console.log(`  policy ${p.name} (${p.policyId}) target=${p.targetId}`);
if (res.status !== 200) {
  console.log(JSON.stringify(body).slice(0, 600));
  process.exit(1);
}

// ---- verify with real calls -------------------------------------------------
const client = new ArmorIQClient({ apiKey: KEY, userId: USER, agentId: AGENT });
const cases = [
  { tool: 'lookup_order', params: { order_id: 'ORD-1001' } },
  { tool: 'change_payout', params: { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19' } },
  { tool: 'issue_refund', params: { order_id: 'ORD-1001', amount: 89 } },
];

console.log('\nverifying against the live proxy:');
for (const c of cases) {
  const capture = client.capturePlan('set-policy-verify', `verify ${c.tool}`, {
    goal: `verify ${c.tool}`,
    steps: [{ action: c.tool, tool: c.tool, mcp: MCP, inputs: c.params }],
  });
  try {
    const token = await client.getIntentToken(capture);
    let verdict;
    try {
      await client.invoke(MCP, c.tool, token, c.params);
      verdict = 'ALLOWED';
    } catch (err) {
      const info = classifyError(err);
      verdict = info.verdict === 'HELD' ? 'HELD' : info.verdict === 'BLOCKED' ? `BLOCKED (${info.reason})` : `ERR ${info.errorName}`;
    }
    console.log(`  ${c.tool.padEnd(15)} ${verdict}`);
  } catch (err) {
    const info = classifyError(err);
    console.log(`  ${c.tool.padEnd(15)} REFUSED AT TOKEN TIME (${info.errorName})`);
  }
}

client.close();
