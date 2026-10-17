/**
 * Call simulator — drives the gateway the same way an ElevenLabs webhook tool
 * does, so the five-second tool budget is exercised for real.
 *
 *   node --env-file=.env scripts/simulate-call.mjs [scenario]
 *
 * Scenarios:
 *   all        (default) order lookup, payout change, refund
 *   lookup     only the allowed call
 *   payout     only the blocked call
 *   refund     only the held call
 *
 * This script does not decide anything. It prints the decision ArmorIQ returned
 * and the wall-clock time the gateway took to answer.
 */
const BASE = process.env.GATEWAY_LOCAL_URL || `http://127.0.0.1:${process.env.GATEWAY_PORT || 8790}`;
const TOKEN = process.env.GATEWAY_SHARED_SECRET || '';
const scenario = (process.argv[2] || 'all').toLowerCase();

async function callTool(tool, args) {
  const url = `${BASE}/tools/BeyondFlow_${tool}`;
  const started = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(TOKEN ? { 'x-beyondflow-token': TOKEN } : {}) },
      body: JSON.stringify(args),
    });
  } catch (err) {
    console.log(`${tool.padEnd(15)} NETWORK ERROR ${err.message}`);
    return null;
  }
  const ms = Date.now() - started;
  const body = await res.json().catch(() => ({}));
  const flag = ms > 5000 ? '  *** OVER 5s BUDGET ***' : '';
  console.log(`${tool.padEnd(15)} HTTP ${res.status}  ${String(body.decision ?? body.status ?? '?').padEnd(14)} ${String(ms + ' ms').padStart(8)}${flag}`);
  console.log(`  message : ${body.message}`);
  if (body.plan_hash) console.log(`  planHash: ${body.plan_hash}`);
  if (body.matched_policy) console.log(`  policy  : ${JSON.stringify(body.matched_policy).slice(0, 220)}`);
  if (body.case_id) console.log(`  case    : ${body.case_id}`);
  console.log('');
  return { ms, body };
}

const scenarios = {
  lookup: [['lookup_order', { order_id: 'ORD-1001', __goal: 'Caller asks where order ORD-1001 is' }]],
  payout: [['change_payout', { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19', __goal: 'Caller asks to change the payout destination' }]],
  refund: [['issue_refund', { order_id: 'ORD-1001', amount: 89, __goal: 'Caller asks for a full refund on ORD-1001' }]],
  all: [
    ['lookup_order', { order_id: 'ORD-1001', __goal: 'Caller asks where order ORD-1001 is' }],
    ['change_payout', { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19', __goal: 'Caller asks to change the payout destination' }],
    ['issue_refund', { order_id: 'ORD-1001', amount: 89, __goal: 'Caller asks for a full refund on ORD-1001' }],
  ],
};

const steps = scenarios[scenario];
if (!steps) {
  console.error(`Unknown scenario "${scenario}". Use: all | lookup | payout | refund`);
  process.exit(1);
}

console.log(`Simulating an ElevenLabs tool call against ${BASE}\n`);
const results = [];
for (const [tool, args] of steps) results.push({ tool, ...(await callTool(tool, args)) });

const held = results.find((r) => r?.body?.decision === 'HELD');
if (held && held.body.case_id) {
  console.log('A supervisor decision is pending. Check it the way the agent would:');
  const check = await callTool('check_supervisor_decision', { about: JSON.stringify(held.body.result ?? held.body.tool ?? ''), order_id: 'ORD-1001' });
  if (check) console.log(`  ${check.body.message}\n`);
}

const worst = Math.max(...results.map((r) => r?.ms ?? 0));
console.log(`slowest reply: ${worst} ms ${worst > 5000 ? '(over the ElevenLabs ~5s budget!)' : '(within the ~5s budget)'}`);
