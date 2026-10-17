/**
 * Provision the ElevenLabs side of BeyondFlow:
 *
 *   1. four webhook tools (three MCP tools + one supervisor-status check),
 *      each pointing at the gateway with the shared-secret header
 *   2. one conversational agent wired to those tools
 *
 *   node --env-file=.env scripts/create-elevenlabs-agent.mjs
 *
 * Idempotent: tools are matched by name and updated in place, so re-running
 * pushes your latest definitions instead of creating duplicates. The new agent
 * id is printed and appended to .env as ELEVENLABS_AGENT_ID.
 *
 * The gateway URL must be public HTTPS — ElevenLabs calls it from their cloud.
 */
import fs from 'node:fs';

const KEY = process.env.ELEVENLABS_API_KEY;
const GATEWAY = (process.env.GATEWAY_PUBLIC_URL || '').replace(/\/$/, '');
const SHARED_SECRET = process.env.GATEWAY_SHARED_SECRET || '';
const PREFIX = 'FlowGuard_';

if (!KEY) {
  console.error('ELEVENLABS_API_KEY is not set. Add it to .env (see .env.example).');
  process.exit(1);
}
if (!GATEWAY.startsWith('https://')) {
  console.error(`GATEWAY_PUBLIC_URL must be a public HTTPS URL, got: ${GATEWAY || '(empty)'}`);
  process.exit(1);
}

const API = 'https://api.elevenlabs.io/v1';

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text.slice(0, 400);
  }
  return { status: res.status, body: parsed };
}

/* --------------------------------------------------------------------------
 * Tool definitions. Each maps 1:1 onto a gateway route, which again maps onto
 * an ArmorIQ-governed MCP tool. The FlowGuard_ prefix is deliberate: the task
 * spec requires the gateway to strip it before building the plan.
 * ------------------------------------------------------------------------ */

const toolDefs = [
  {
    name: `${PREFIX}lookup_order`,
    description:
      'Look up a customer order by its id. Use this whenever the caller asks about an order, delivery, shipment status, what was bought, or refund history. Returns status, delivery date, items, total and refunded amount.',
    required: ['order_id'],
    properties: {
      order_id: { type: 'string', description: 'The order id the caller is asking about, e.g. "ORD-1001".' },
    },
  },
  {
    name: `${PREFIX}change_payout`,
    description:
      'Change the bank destination where a seller payout account receives funds. Only use this when the caller explicitly asks to change a payout bank account or destination.',
    required: ['account_id', 'new_destination'],
    properties: {
      account_id: { type: 'string', description: 'Payout account id, e.g. "ACC-4471".' },
      new_destination: { type: 'string', description: 'The new bank destination (IBAN or account number) the caller provided.' },
    },
  },
  {
    name: `${PREFIX}issue_refund`,
    description:
      'Issue a refund against a delivered order. Use only when the caller asks for a refund and you have confirmed the order id and amount with them.',
    required: ['order_id', 'amount'],
    properties: {
      order_id: { type: 'string', description: 'The order id to refund, e.g. "ORD-1001".' },
      amount: { type: 'number', description: 'Refund amount in the order currency (USD), e.g. 89.' },
    },
  },
  {
    name: `${PREFIX}check_supervisor_decision`,
    description:
      'Check whether a refund that was waiting for supervisor approval has been approved, denied, or is still pending. Use this when the caller asks about a refund that was "being reviewed".',
    required: [],
    properties: {
      order_id: { type: 'string', description: 'The order id the caller is asking about, e.g. "ORD-1001".' },
    },
  },
];

function toolPayload(def) {
  return {
    tool_config: {
      type: 'webhook',
      name: def.name,
      description: def.description,
      api_schema: {
        url: `${GATEWAY}/tools/${def.name}`,
        method: 'POST',
        content_type: 'application/json',
        request_headers: SHARED_SECRET ? { 'x-flowguard-token': SHARED_SECRET } : {},
        request_body_schema: {
          type: 'object',
          required: def.required,
          properties: Object.fromEntries(
            Object.entries(def.properties).map(([k, v]) => [k, { ...v, type: v.type, description: v.description }]),
          ),
        },
      },
      // The gateway answers held/blocked calls immediately; allowed calls run the
      // full ArmorIQ round trip. 5s would be right for the voice UX but leaves no
      // headroom for a slow edge, so allow a little slack here (min allowed by
      // ElevenLabs is 5) and keep the gateway's own answers under ~5s.
      response_timeout_secs: 8,
      tool_error_handling_mode: 'passthrough',
      pre_tool_speech: 'auto',
    },
  };
}

console.log('Listing existing tools…');
const existing = await api('GET', '/convai/tools');
if (existing.status !== 200) {
  console.error(`Could not list tools (HTTP ${existing.status}):`, JSON.stringify(existing.body).slice(0, 400));
  process.exit(1);
}
const byName = new Map((existing.body?.tools ?? []).map((t) => [t.tool_config?.name, t.id]));

const toolIds = [];
for (const def of toolDefs) {
  const payload = toolPayload(def);
  const existingId = byName.get(def.name);
  if (existingId) {
    const upd = await api('PATCH', `/convai/tools/${existingId}`, payload);
    console.log(`  ${upd.status === 200 ? 'updated' : `FAILED ${upd.status}`}  ${def.name}  (${existingId})`);
    if (upd.status === 200) toolIds.push(existingId);
  } else {
    const created = await api('POST', '/convai/tools', payload);
    console.log(`  ${created.status === 200 ? 'created' : `FAILED ${created.status}`}  ${def.name}  (${created.body?.id ?? '?'})`);
    if (created.status === 200) toolIds.push(created.body.id);
    else console.error('   ', JSON.stringify(created.body).slice(0, 400));
  }
}

if (toolIds.length !== toolDefs.length) {
  console.error(`Only ${toolIds.length}/${toolDefs.length} tools are ready; not creating the agent.`);
  process.exit(1);
}

const systemPrompt = [
  'You are Riley, a phone support agent for Northwind Traders, a small online store.',
  'You are talking to the business owner or a customer on a live phone call. Keep replies short, friendly and spoken — one or two sentences.',
  '',
  'You can look up orders, issue refunds, and change payout bank destinations using your tools. Rules:',
  '- Always ask for the order id (format ORD-####) before looking an order up.',
  '- Only issue a refund after the caller confirms the exact amount.',
  '- For payout changes ask for the payout account id and the new bank destination.',
  '- Never invent order details, refund ids or account data: only state what a tool returned.',
  '',
  'After each tool call, look at the returned JSON and mention the important parts out loud:',
  '- status "allowed": give the caller the result (delivery date, amounts, refund id, etc.).',
  '- status "blocked": a policy blocked the action. Apologise briefly and say you cannot do it, without speculating why.',
  '- status "held": say a supervisor has been notified and will review it shortly. If the caller asks again later, call check_supervisor_decision with the order id and relay the real outcome.',
  '- status "intent_mismatch", "token_expired" or "mcp_error": apologise and offer to try again.',
].join('\n');

const agentPayload = {
  name: 'BeyondFlow Support (ArmorIQ-governed)',
  conversation_config: {
    agent: {
      first_message: 'Hi, thanks for calling Northwind Traders support. This is Riley. What can I help you with today?',
      language: 'en',
      prompt: {
        prompt: systemPrompt,
        temperature: 0.3,
        tool_ids: toolIds,
      },
    },
    tts: {
      voice_id: process.env.ELEVENLABS_VOICE_ID || 'cjVigY5qzO86Huf0OWal', // "Eric" — standard premade voice
      model_id: 'eleven_turbo_v2_5',
    },
  },
  platform_settings: {
    // Keep the agent from being edited by randoms while the demo runs.
    widget: { disable_banner: true },
  },
};

console.log('\nCreating agent…');
const agent = await api('POST', '/convai/agents/create', agentPayload);
if (agent.status !== 200) {
  console.error(`Agent creation failed (HTTP ${agent.status}):`);
  console.error(JSON.stringify(agent.body).slice(0, 1200));
  process.exit(1);
}

const agentId = agent.body.agent_id ?? agent.body.id;
console.log(`  agent created: ${agentId}`);
console.log(`  tools attached: ${toolIds.length}`);

// Persist the agent id for the demo and docs.
const envPath = '.env';
try {
  let env = fs.readFileSync(envPath, 'utf8');
  env = env.replace(/^ELEVENLABS_AGENT_ID=.*$/m, `ELEVENLABS_AGENT_ID=${agentId}`);
  if (!/^ELEVENLABS_AGENT_ID=/m.test(env)) env += `\nELEVENLABS_AGENT_ID=${agentId}\n`;
  fs.writeFileSync(envPath, env);
  console.log(`  wrote ELEVENLABS_AGENT_ID to ${envPath}`);
} catch (err) {
  console.log(`  (could not update ${envPath}: ${err.message})`);
}

console.log('\nDone. Open https://elevenlabs.io/app/agents to test the agent, or embed it with:');
console.log(`  <elevenlabs-convai agent-id="${agentId}"></elevenlabs-convai>`);
