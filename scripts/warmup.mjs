/**
 * Warmup script — makes one throwaway lookup_order call through the gateway
 * and prints the latency to eliminate cold starts for judges.
 *
 * Usage:
 *   node --env-file=.env scripts/warmup.mjs
 */
const BASE = process.env.GATEWAY_LOCAL_URL || `http://127.0.0.1:${process.env.GATEWAY_PORT || 8790}`;
const TOKEN = process.env.GATEWAY_SHARED_SECRET || '';

console.log('BeyondFlow Gateway Warmup');
console.log('=========================');
console.log(`Target: ${BASE}/tools/FlowGuard_lookup_order`);

const started = Date.now();

try {
  const res = await fetch(`${BASE}/tools/FlowGuard_lookup_order`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(TOKEN ? { 'x-flowguard-token': TOKEN } : {}),
    },
    body: JSON.stringify({
      order_id: 'ORD-1001',
      __goal: 'Cold judge warmup throwaway call',
      __prompt: 'Where is my order ORD-1001?'
    }),
  });

  const latencyMs = Date.now() - started;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`Gateway returned HTTP ${res.status}: ${JSON.stringify(data)}`);
  }

  console.log(`\nHTTP Status : ${res.status}`);
  console.log(`Decision    : ${data.decision || data.status || 'ALLOWED'}`);
  console.log(`Plan Hash   : ${data.plan_hash || 'N/A'}`);
  console.log(`Latency     : ${latencyMs} ms`);
  console.log(`Message     : ${data.message || 'Call completed successfully'}`);
  console.log('\n[PASS] Gateway and ArmorIQ PEP warmed up successfully.');
} catch (err) {
  // If gateway HTTP server is not running locally, execute direct governed warmup
  console.log(`HTTP gateway not reachable on ${BASE} (${err.message}).`);
  console.log('Falling back to direct ArmorIQ PEP governed call warmup...');

  const { governedCall } = await import('../gateway/armoriq-gateway.mjs');
  const directStart = Date.now();
  const result = await governedCall({
    tool: 'lookup_order',
    args: { order_id: 'ORD-1001' },
    goal: 'Cold judge warmup throwaway call',
    prompt: 'Where is my order ORD-1001?',
    warmup: true,
  });

  const directMs = Date.now() - directStart;
  console.log(`\nDecision    : ${result.decision}`);
  console.log(`Plan Hash   : ${result.planHash || 'N/A'}`);
  console.log(`Total Latency: ${directMs} ms (mint: ${result.timings.mint}ms, invoke: ${result.timings.invoke}ms)`);
  console.log(`Result      : ${JSON.stringify(result.result || {})}`);
  console.log('\n[PASS] ArmorIQ PEP warmed up successfully.');
}
