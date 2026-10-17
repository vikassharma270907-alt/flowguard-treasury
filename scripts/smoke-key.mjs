/**
 * Step 0 smoke test: is the ArmorIQ API key live, and what does the org
 * already have onboarded?
 *
 *   node --env-file=.env scripts/smoke-key.mjs
 *
 * Prints: endpoint resolution, bootstrap identity, registered MCP servers.
 * Nothing here writes to the platform.
 */
import { ArmorIQClient } from '@armoriq/sdk';

const apiKey = process.env.ARMORIQ_API_KEY;
if (!apiKey) {
  console.error('ARMORIQ_API_KEY is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new ArmorIQClient({
  apiKey,
  userId: process.env.USER_ID || 'beyondflow-smoke',
  agentId: process.env.AGENT_ID || 'beyondflow-smoke',
});

const internals = client._sessionInternals();
console.log('backend  :', internals.backendEndpoint);
console.log('proxy    :', client.proxyEndpoint);
console.log('apiKey   :', apiKey.slice(0, 12) + '...' + apiKey.slice(-4));
console.log('');

function report(label, err) {
  console.log(`${label}: FAIL ${err.name}: ${err.message}`);
  const status = err.response?.status ?? err.statusCode;
  if (status) console.log(`   http status: ${status}`);
  const data = err.response?.data;
  if (data) console.log('   body:', typeof data === 'string' ? data.slice(0, 400) : JSON.stringify(data).slice(0, 400));
  console.log('');
}

try {
  const boot = await client.bootstrap();
  console.log('bootstrap: OK');
  console.log(JSON.stringify(boot, null, 2).slice(0, 2500));
  console.log('');
} catch (err) {
  report('bootstrap', err);
}

try {
  const mcps = await client.listMcps();
  console.log(`listMcps: OK (${mcps.length} registered)`);
  for (const m of mcps) console.log('  -', JSON.stringify(m));
  console.log('');
} catch (err) {
  report('listMcps', err);
}

for (const mcpId of (process.env.PROBE_MCP_IDS || '').split(',').filter(Boolean)) {
  try {
    const tools = await client.getMcpToolSchemas(mcpId);
    console.log(`tools[${mcpId}]: ${tools.length}`);
    for (const t of tools) console.log('  -', t.function?.name ?? t.name ?? JSON.stringify(t).slice(0, 120));
  } catch (err) {
    report(`tools[${mcpId}]`, err);
  }
}

client.close();
