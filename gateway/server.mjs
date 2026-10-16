/**
 * FlowGuard gateway (live ArmorIQ enforcement).
 *
 * Two jobs:
 *   1. Tool endpoint for the ElevenLabs agent. Every call is routed through
 *      ArmorIQ (capture_plan -> get_intent_token -> invoke) before it can touch
 *      the MCP server. There is no path to the MCP that skips ArmorIQ.
 *   2. Supervisor playground API + UI, and the approval counter for held calls.
 *
 * The gateway never decides allow/deny/hold. It relays what ArmorIQ decided,
 * replies inside ElevenLabs' ~5 s tool budget, and records the real outcome.
 *
 * Run:  node --env-file=.env gateway/server.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { governedCall, warmup, client } from './armoriq-gateway.mjs';
import { audit, recordCall, recordHold, recordApproval, updateHold, listPending, listRecentCalls, pending } from './audit-store.mjs';

const PORT = Number(process.env.GATEWAY_PORT || 8790);
const SHARED_SECRET = process.env.GATEWAY_SHARED_SECRET || '';
const PLAYGROUND_TOKEN = process.env.PLAYGROUND_TOKEN || '';
/**
 * ElevenLabs exposes tools with a namespace prefix. FlowGuard_ is the current
 * prefix; IntentGate_ (earlier prototype) is still accepted so existing agent
 * configurations keep working.
 */
const TOOL_PREFIXES = ['FlowGuard_', 'IntentGate_'];
const HOLD_TTL_MS = Number(process.env.HOLD_TTL_MS || 15 * 60 * 1000);
const REQUIRED_APPROVALS = {
  issue_refund: Number(process.env.REQUIRED_APPROVALS_ISSUE_REFUND || 2),
  default: 1,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAYGROUND_HTML = path.join(__dirname, '..', 'playground', 'index.html');

function log(event, detail = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), svc: 'gateway', event, ...detail }));
}

function json(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload), ...extraHeaders });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('body too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/** Strip the ElevenLabs tool prefix so the plan uses the MCP's real tool name. */
export function canonicalToolName(raw) {
  for (const prefix of TOOL_PREFIXES) {
    if (raw.startsWith(prefix)) return raw.slice(prefix.length);
  }
  return raw;
}

/* --------------------------------------------------------------------------
 * Hold lifecycle
 * ------------------------------------------------------------------------ */

/**
 * Turn a HELD ArmorIQ decision into a pending case. The reply to ElevenLabs
 * happens immediately (well under 5 s) — the real outcome is recorded here and
 * relayed later through the check_supervisor_decision tool.
 */
function openHold(call) {
  const required = REQUIRED_APPROVALS[call.tool] ?? REQUIRED_APPROVALS.default;
  const record = {
    id: `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    status: 'awaiting_approvals',
    tool: call.tool,
    args: call.args,
    goal: call.plan?.goal ?? null,
    planHash: call.planHash,
    tokenId: call.tokenId,
    armoriqDecision: 'HELD',
    armoriqReason: call.reason,
    matchedPolicy: call.matchedPolicy,
    delegation: call.delegation,
    requiredApprovals: required,
    approvals: [],
    outcome: null,
    expiresAt: Date.now() + HOLD_TTL_MS,
  };
  return recordHold(record);
}

/** Human-readable one-liner for the voice agent, safe to speak out loud. */
function speakable(call) {
  switch (call.decision) {
    case 'ALLOWED':
      return `Done. ${summarizeResult(call.tool, call.result)}`;
    case 'BLOCKED':
      return 'That is blocked by our policy, so I cannot do it. Would you like me to help with something else?';
    case 'HELD':
      return 'Thanks — that needs a supervisor to approve it. I have notified them and will let you know as soon as they respond.';
    case 'INTENT_MISMATCH':
      return 'That request did not match what was approved, so I had to stop.';
    case 'TOKEN_EXPIRED':
      return 'That took a moment too long and expired. Please say that again and I will retry.';
    case 'MCP_ERROR':
      return 'The support system did not answer just now. Please try again in a moment.';
    default:
      return 'Something went wrong on my side. Please try again.';
  }
}

function unwrapResult(result) {
  if (result == null) return null;
  if (Array.isArray(result.content) && result.content[0]?.type === 'text') {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return null;
    }
  }
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }
  return result;
}

function summarizeResult(tool, rawResult) {
  try {
    const result = unwrapResult(rawResult);
    if (tool === 'lookup_order') {
      const order = result?.order;
      if (order) {
        const places = order.status === 'delivered' ? `It was delivered on ${order.delivered_on}.` : `It is currently ${order.status}.`;
        return `Order ${order.order_id} for ${order.customer} — ${places} Total ${order.currency} ${order.total}, refunded ${order.currency} ${order.refunded}.`;
      }
    }
    if (tool === 'issue_refund') {
      if (result?.refund_id) return `Refund ${result.refund_id} for ${result.currency} ${result.amount} was issued on ${result.order_id}.`;
    }
    if (tool === 'change_payout') {
      if (result?.changed) return `Payout destination for ${result.account_id} was updated.`;
    }
    if (result?.error) return `The support system said: ${result.error}`;
  } catch {
    /* fall through to generic */
  }
  return 'The action completed.';
}

/**
 * Called when supervisors have approved a held call. The gateway does not
 * execute the tool itself — it asks ArmorIQ again with a fresh plan and token.
 * ArmorIQ remains the decider; this function only counts approvals.
 */
async function releaseHold(record) {
  updateHold(record.id, { status: 'releasing', releasedAt: Date.now() });
  const attempt = await governedCall({
    tool: record.tool,
    args: record.args,
    goal: record.goal ?? `Supervisor-approved release of ${record.tool}`,
    prompt: `supervisor-approved retry: ${record.tool}`,
    releaseApproved: true,
  });
  recordCall({ ...attempt, source: 'release-after-approval', caseId: record.id });

  const outcome = {
    decision: attempt.decision,
    planHash: attempt.planHash ?? null,
    reason: attempt.reason ?? null,
    result: attempt.result ?? null,
    timings: attempt.timings,
  };
  updateHold(record.id, {
    status: attempt.decision === 'ALLOWED' ? 'released' : 'release_failed',
    outcome,
    closedAt: Date.now(),
  });
  audit('hold.closed', { id: record.id, decision: attempt.decision, planHash: attempt.planHash });
  return attempt;
}

function expireStaleHolds() {
  const now = Date.now();
  for (const record of pending.values()) {
    if (record.status === 'awaiting_approvals' && now > record.expiresAt) {
      updateHold(record.id, { status: 'expired', outcome: { decision: 'EXPIRED', reason: 'no supervisor responded in time' }, closedAt: now });
    }
  }
}
setInterval(expireStaleHolds, 30_000).unref();

/* --------------------------------------------------------------------------
 * HTTP routes
 * ------------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const route = `${req.method} ${url.pathname}`;

  try {
    /* ---- ElevenLabs tool endpoint -------------------------------------- */
    if (req.method === 'POST' && url.pathname.startsWith('/tools/')) {
      // x-flowguard-token is the current shared-secret header; the legacy
      // x-intentgate-token name from the earlier prototype is still accepted.
      const presentedToken = req.headers['x-flowguard-token'] || req.headers['x-intentgate-token'];
      if (SHARED_SECRET && presentedToken !== SHARED_SECRET) {
        log('tool.unauthorized', { path: url.pathname });
        return json(res, 401, { error: 'unauthorized' });
      }

      const rawTool = decodeURIComponent(url.pathname.slice('/tools/'.length));
      const tool = canonicalToolName(rawTool);
      const args = await readBody(req);
      const goal = typeof args.__goal === 'string' ? args.__goal : undefined;
      const prompt = typeof args.__prompt === 'string' ? args.__prompt : undefined;
      delete args.__goal;
      delete args.__prompt;

      // Follow-up tool: report the recorded outcome of a held call. This does
      // not execute anything; it only relays ArmorIQ's recorded decision.
      if (tool === 'check_supervisor_decision') {
        const wanted = String(args.about ?? args.order_id ?? '').trim();
        const cases = listPending().filter((c) => (wanted ? JSON.stringify(c.args).includes(wanted) : true));
        const latest = cases[0] ?? listPending()[0];
        if (!latest) return json(res, 200, { status: 'none', message: 'There are no pending approvals right now.' });
        if (latest.status === 'awaiting_approvals') {
          return json(res, 200, {
            status: 'pending',
            message: `The ${latest.tool} request is still awaiting supervisor approval (${latest.approvals.length} of ${latest.requiredApprovals} approvals so far).`,
            case_id: latest.id,
          });
        }
        if (latest.status === 'released') {
          return json(res, 200, { status: 'approved', message: `Good news — the ${latest.tool} request was approved by ArmorIQ and completed.`, case_id: latest.id, result: latest.outcome?.result ?? null });
        }
        if (latest.status === 'denied') {
          return json(res, 200, { status: 'denied', message: `The ${latest.tool} request was declined by a supervisor.`, case_id: latest.id });
        }
        return json(res, 200, { status: latest.status, message: `The ${latest.tool} request ended with status ${latest.status}.`, case_id: latest.id, outcome: latest.outcome ?? null });
      }

      // Normal MCP tools: ALWAYS through ArmorIQ.
      const started = Date.now();
      const call = await governedCall({ tool, args, goal, prompt });
      recordCall({ ...call, source: 'elevenlabs-tool' });
      log('tool.decision', {
        tool,
        decision: call.decision,
        errorName: call.errorName,
        reason: call.reason,
        planHash: call.planHash,
        totalMs: call.timings.total,
        mintMs: call.timings.mint,
        invokeMs: call.timings.invoke,
      });

      let holdCase = null;
      if (call.decision === 'HELD') holdCase = openHold(call);

      const withinBudget = Date.now() - started;
      return json(res, 200, {
        status: call.decision.toLowerCase(),
        message: speakable(call),
        decision: call.decision,
        tool,
        plan_hash: call.planHash ?? null,
        matched_policy: call.matchedPolicy ?? null,
        case_id: holdCase?.id ?? null,
        latency_ms: withinBudget,
        result: call.decision === 'ALLOWED' ? call.result : null,
      });
    }

    /* ---- Playground API ------------------------------------------------- */
    if (url.pathname.startsWith('/api/') && PLAYGROUND_TOKEN && req.headers['x-playground-token'] !== PLAYGROUND_TOKEN) {
      return json(res, 401, { error: 'playground token required' });
    }

    if (route === 'GET /api/state') {
      return json(res, 200, {
        source: 'ArmorIQ',
        pending: listPending(),
        recent_calls: listRecentCalls(60),
        stats: latencyStats(),
      });
    }

    if (req.method === 'POST' && url.pathname.startsWith('/api/pending/')) {
      const parts = url.pathname.split('/').filter(Boolean); // api, pending, :id, decide
      const id = parts[2];
      const action = parts[3];
      if (!id || action !== 'decide') return json(res, 404, { error: 'not found' });
      const body = await readBody(req);
      const decision = body.decision === 'approve' ? 'approve' : body.decision === 'deny' ? 'deny' : null;
      const supervisor = String(body.supervisor || '').trim() || 'anonymous-supervisor';
      if (!decision) return json(res, 400, { error: 'decision must be "approve" or "deny"' });

      const record = pending.get(id);
      if (!record) return json(res, 404, { error: 'unknown case id' });
      if (record.status !== 'awaiting_approvals') return json(res, 409, { error: `case is ${record.status}` });

      recordApproval(id, { supervisor, decision, at: Date.now() });

      if (decision === 'deny') {
        updateHold(id, { status: 'denied', outcome: { decision: 'DENIED_BY_SUPERVISOR', by: supervisor }, closedAt: Date.now() });
        log('hold.denied', { id, supervisor });
        return json(res, 200, { case: pending.get(id) });
      }

      const approvals = pending.get(id).approvals.filter((a) => a.decision === 'approve').length;
      if (approvals < record.requiredApprovals) {
        log('hold.approval_counted', { id, approvals, required: record.requiredApprovals, supervisor });
        return json(res, 200, { case: pending.get(id), waiting_for: record.requiredApprovals - approvals });
      }

      // Enough approvals: ask ArmorIQ to run it for real.
      const attempt = await releaseHold(pending.get(id));
      return json(res, 200, { case: pending.get(id), release: { decision: attempt.decision, planHash: attempt.planHash ?? null, reason: attempt.reason ?? null, result: attempt.result ?? null } });
    }

    if (route === 'GET /playground' || route === 'GET /') {
      const html = fs.readFileSync(PLAYGROUND_HTML);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(html);
    }

    if (route === 'GET /health') {
      return json(res, 200, { ok: true, mcp: process.env.ARMORIQ_MCP_ID, agent: process.env.ARMORIQ_AGENT_ID || 'intentgate-agent' });
    }

    return json(res, 404, { error: 'not found' });
  } catch (err) {
    log('route.error', { route, message: err.message });
    return json(res, 500, { error: err.message });
  }
});

/* ---- latency stats -------------------------------------------------------- */

function latencyStats() {
  const allowed = listRecentCalls(200).filter((c) => c.decision === 'ALLOWED' && c.timings?.total && !c.warmup);
  if (!allowed.length) return { allowed_calls: 0 };
  const totals = allowed.map((c) => c.timings.total).sort((a, b) => a - b);
  const median = totals[Math.floor(totals.length / 2)];
  return {
    allowed_calls: allowed.length,
    total_ms: { min: totals[0], median, max: totals[totals.length - 1] },
    mint_ms: {
      median: allowed.map((c) => c.timings.mint || 0).sort((a, b) => a - b)[Math.floor(allowed.length / 2)],
    },
    invoke_ms: {
      median: allowed.map((c) => c.timings.invoke || 0).sort((a, b) => a - b)[Math.floor(allowed.length / 2)],
    },
  };
}

server.listen(PORT, async () => {
  log('listening', { port: PORT, mcp: process.env.ARMORIQ_MCP_ID || '(unset)', playground: `http://localhost:${PORT}/playground` });
  const warm = await warmup();
  recordCall({ ...warm, source: 'warmup' });
  log('warmup', { decision: warm.decision, reason: warm.reason ?? null, ms: warm.timings?.total ?? null });
});

async function shutdown() {
  log('shutdown');
  client.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
