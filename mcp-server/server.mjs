/**
 * FlowGuard MCP server — JSON-RPC 2.0 over HTTP, SSE responses.
 *
 * Format per ArmorIQ's MCP requirements:
 *   POST /mcp   Content-Type: application/json
 *   200         Content-Type: text/event-stream
 *               "event: message\ndata: {json}\n\n"
 *
 * Tools: lookup_order, change_payout, issue_refund (synthetic sandbox data).
 *
 * Auth: bearer token in `Authorization`, so the endpoint is not wide open.
 * The ArmorIQ proxy attaches it from the registered MCP credential
 * (X-Armoriq-MCP-Auth), which the SDK builds from ARMORIQ_MCP_<ID>_TOKEN.
 *
 * Run:  node --env-file=.env mcp-server/server.mjs
 */
import http from 'node:http';
import { TOOLS, callTool } from './tools.mjs';
import { MUTATIONS } from './sandbox-data.mjs';

const PORT = Number(process.env.MCP_PORT || 8791);
const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN || '';
const SERVER_NAME = process.env.MCP_SERVER_NAME || 'flowguard-treasury-mcp';
const PROTOCOL_VERSION = '2024-11-05';

if (!AUTH_TOKEN) {
  console.warn('[mcp] WARNING: MCP_AUTH_TOKEN is not set — /mcp will accept unauthenticated calls.');
}

function log(event, detail = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), svc: 'mcp', event, ...detail }));
}

function sse(data) {
  return `event: message\ndata: ${JSON.stringify(data)}\n\n`;
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message, data) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

function handleRpc(msg) {
  const { method, id } = msg ?? {};

  // Notifications have no id and must not be answered.
  if (id === undefined || id === null) {
    if (method === 'notifications/initialized' || method === 'notifications/cancelled') {
      log('notification', { method });
      return null;
    }
    log('notification.unknown', { method });
    return null;
  }

  switch (method) {
    case 'initialize':
      return rpcResult(id, {
        protocolVersion: msg.params?.protocolVersion || PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: '1.0.0' },
      });

    case 'ping':
      return rpcResult(id, {});

    case 'tools/list':
      return rpcResult(id, { tools: TOOLS });

    case 'tools/call': {
      const name = msg.params?.name;
      const args = msg.params?.arguments ?? {};
      const startedAt = Date.now();
      const result = callTool(name, args);
      log('tools/call', {
        tool: name,
        args,
        isError: Boolean(result.isError),
        ms: Date.now() - startedAt,
      });
      return rpcResult(id, result);
    }

    default:
      log('unknown.method', { method });
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, server: SERVER_NAME, tools: TOOLS.map((t) => t.name), mutations: MUTATIONS.length }));
    return;
  }

  if (url.pathname !== '/mcp') {
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found', hint: 'POST /mcp' }));
    return;
  }

  /* ---- TASK 4: Small JSON /mcp GET without exposing tool internals ---- */
  if (req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      name: 'flowguard-treasury-mcp',
      version: '1.0.0',
      transport: 'POST JSON-RPC 2.0 over HTTP, SSE responses',
      status: 'ok',
    }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'content-type': 'application/json', allow: 'GET, POST' });
    res.end(JSON.stringify({ error: 'method not allowed' }));
    return;
  }

  if (AUTH_TOKEN) {
    const header = req.headers.authorization || '';
    const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (presented !== AUTH_TOKEN) {
      log('auth.rejected', { hasHeader: Boolean(header) });
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized', hint: 'Authorization: Bearer <MCP_AUTH_TOKEN>' }));
      return;
    }
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy();
  });

  req.on('end', () => {
    let payload;
    try {
      payload = JSON.parse(body || '{}');
    } catch {
      res.writeHead(400, { 'content-type': 'text/event-stream' });
      res.end(sse(rpcError(null, -32700, 'Parse error: body is not valid JSON')));
      return;
    }

    const startedAt = Date.now();
    let out;
    try {
      out = Array.isArray(payload) ? payload.map(handleRpc).filter(Boolean) : handleRpc(payload);
    } catch (err) {
      log('handler.error', { message: err.message });
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end(sse(rpcError(payload?.id ?? null, err.code ?? -32603, err.message)));
      return;
    }

    if (out === null || (Array.isArray(out) && out.length === 0)) {
      res.writeHead(202, { 'content-type': 'text/event-stream' });
      res.end();
      return;
    }

    log('rpc.ok', { method: payload?.method, ms: Date.now() - startedAt });
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    });
    res.end(Array.isArray(out) ? out.map(sse).join('') : sse(out));
  });
});

server.listen(PORT, () => {
  log('listening', { port: PORT, tools: TOOLS.map((t) => t.name), authRequired: Boolean(AUTH_TOKEN) });
});
