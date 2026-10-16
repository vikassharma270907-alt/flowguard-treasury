/**
 * Local conformance test for the MCP server (no ArmorIQ involvement).
 *
 *   node --env-file=.env scripts/test-mcp.mjs [baseUrl]
 *
 * Checks the ArmorIQ MCP format requirements:
 *   - POST /mcp accepts JSON-RPC 2.0
 *   - responses are SSE framed exactly `event: message\ndata: {...}\n\n`
 *   - initialize / tools/list / tools/call all work
 *   - tools/call returns content:[{type:"text",text:"<JSON string>"}]
 * Also exercises the bearer auth check.
 */
const base = (process.argv[2] || `http://127.0.0.1:${process.env.MCP_PORT || 8791}`).replace(/\/$/, '');
const token = process.env.MCP_AUTH_TOKEN || '';
const url = `${base}/mcp`;

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` -> ${detail}` : ''}`);
  }
}

/** Parse the SSE body and return the JSON-RPC envelope. Also asserts framing. */
function parseSse(body) {
  const lines = body.split('\n');
  const framedOk = lines[0] === 'event: message' && lines[1].startsWith('data: ') && body.endsWith('\n\n');
  const data = JSON.parse(lines[1].slice('data: '.length));
  return { framedOk, data };
}

async function rpc(method, params, id = 1, opts = {}) {
  const envelope = { jsonrpc: '2.0', ...(opts.notification ? {} : { id }), method, ...(params ? { params } : {}) };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(opts.auth === false ? {} : { authorization: `Bearer ${token}` }) },
    body: JSON.stringify(envelope),
  });
  const raw = await res.text();
  let parsed = null;
  let framedOk = false;
  if (raw) {
    try {
      ({ framedOk, data: parsed } = parseSse(raw));
    } catch (err) {
      framedOk = false;
    }
  }
  return { status: res.status, contentType: res.headers.get('content-type'), raw, parsed, framedOk };
}

const t0 = Date.now();
console.log(`MCP conformance test against ${url}\n`);

console.log('auth');
{
  const r = await rpc('tools/list', null, 1, { auth: false });
  check('unauthenticated request is rejected with 401', r.status === 401, `got ${r.status}`);
}

console.log('\ninitialize');
const init = await rpc('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'intentgate-conformance', version: '1.0.0' },
});
check('HTTP 200', init.status === 200, `got ${init.status}`);
check('content-type is text/event-stream', (init.contentType || '').startsWith('text/event-stream'), init.contentType);
check('SSE framing is `event: message\\ndata: {...}\\n\\n`', init.framedOk);
check('protocolVersion returned', Boolean(init.parsed?.result?.protocolVersion), init.raw?.slice(0, 120));
check('serverInfo.name returned', Boolean(init.parsed?.result?.serverInfo?.name), init.raw?.slice(0, 120));

console.log('\ntools/list');
const list = await rpc('tools/list', null, 2);
const tools = list.parsed?.result?.tools ?? [];
check('SSE framing', list.framedOk);
check('exactly 3 tools', tools.length === 3, `got ${tools.length}`);
for (const name of ['lookup_order', 'change_payout', 'issue_refund']) {
  const tool = tools.find((t) => t.name === name);
  check(`${name} present with inputSchema`, Boolean(tool?.inputSchema?.properties));
}

console.log('\ntools/call');
const look = await rpc('tools/call', { name: 'lookup_order', arguments: { order_id: 'ORD-1001' } }, 3);
check('lookup_order SSE framing', look.framedOk);
const lookContent = look.parsed?.result?.content;
check('content is an array with type:"text"', Array.isArray(lookContent) && lookContent[0]?.type === 'text');
let orderJson = null;
try {
  orderJson = JSON.parse(lookContent[0].text);
} catch {}
check('text field is a JSON *string* that parses', Boolean(orderJson?.order?.order_id), lookContent?.[0]?.text?.slice(0, 120));
check('returned the right order', orderJson?.order?.order_id === 'ORD-1001');
check('status is "delivered"', orderJson?.order?.status === 'delivered');

console.log('\nunknown tool');
const bogus = await rpc('tools/call', { name: 'transfer_everything', arguments: {} }, 4);
check('unknown tool returns JSON-RPC error -32602', bogus.parsed?.error?.code === -32602, JSON.stringify(bogus.parsed?.error));

console.log('\nnotification (no id)');
const note = await rpc('notifications/initialized', undefined, undefined, { notification: true });
check('notification accepted without a JSON-RPC response', note.status === 202 && !note.raw, `status ${note.status}`);

console.log(`\n${passed} passed, ${failed} failed (${Date.now() - t0} ms)`);
// Set the exit code and let the process end on its own: calling process.exit()
// while fetch keep-alive sockets are still closing trips a libuv assertion on
// Windows (UV_HANDLE_CLOSING) even when every check passed.
process.exitCode = failed === 0 ? 0 : 1;
