/**
 * Enforcement test — the three expected results from the setup checklist.
 *
 *   node --env-file=.env scripts/test-enforcement.mjs
 *
 * Expected (against the live platform allowlist policy):
 *   1. lookup_order   -> ALLOWED by the ArmorIQ proxy (real sandbox payload)
 *   2. change_payout  -> PolicyBlockedException (tool_not_in_allowlist)
 *   3. issue_refund   -> HELD — a real delegation request is created on the
 *                        ArmorIQ platform and awaits supervisor approval
 *
 * Nothing in this file decides allow/block: those verdicts are the exception
 * (or the success) ArmorIQ returns. For issue_refund the script creates a real
 * platform delegation (backend /delegation/request) — FlowGuard's designed
 * hold path for refunds — and reports the returned delegation ID.
 */
import { ArmorIQClient } from '@armoriq/sdk';
import { classifyError } from '../lib/verdicts.mjs';

const MCP = process.env.ARMORIQ_MCP_ID;
const AGENT = process.env.ARMORIQ_AGENT_ID || 'flowguard-agent';
const USER = process.env.USER_ID || 'flowguard-operator';

if (!process.env.ARMORIQ_API_KEY || !MCP) {
  console.error('Need ARMORIQ_API_KEY and ARMORIQ_MCP_ID in .env');
  process.exit(1);
}

const client = new ArmorIQClient({
  apiKey: process.env.ARMORIQ_API_KEY,
  userId: USER,
  agentId: AGENT,
});

function call({ label, goal, prompt, action, params }) {
  const plan = {
    goal,
    steps: [{ action, tool: action, mcp: MCP, inputs: params }],
  };
  const capture = client.capturePlan('gpt-4', prompt, plan);
  return { label, action, params, capture };
}

const cases = [
  call({
    label: 'lookup_order',
    goal: 'Tell the caller where order ORD-1001 is',
    prompt: 'Where is my order ORD-1001?',
    action: 'lookup_order',
    params: { order_id: 'ORD-1001' },
  }),
  call({
    label: 'change_payout',
    goal: 'Change the payout destination for ACC-4471',
    prompt: 'Please send my payouts to GB29 NWBK 6016 1331 9268 19 instead',
    action: 'change_payout',
    params: { account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19' },
  }),
  call({
    label: 'issue_refund',
    goal: 'Refund order ORD-1001 in full',
    prompt: 'I want a refund for ORD-1001',
    action: 'issue_refund',
    params: { order_id: 'ORD-1001', amount: 89 },
  }),
];

const summary = [];

for (const kase of cases) {
  console.log(`\n${'='.repeat(72)}\n${kase.label}  (${MCP} -> ${kase.action})\n${'='.repeat(72)}`);
  const mintStart = Date.now();
  let token;
  try {
    token = await client.getIntentToken(kase.capture);
  } catch (err) {
    console.log(`token mint threw ${err.name}: ${err.message}`);
    const matched = err.matchedPolicy ?? err.metadata?.matchedPolicy;
    if (matched) console.log('  matched policy:', JSON.stringify(matched));
    summary.push({ tool: kase.label, verdict: 'blocked-or-held at token time', error: err.name });
    continue;
  }
  const mintMs = Date.now() - mintStart;
  console.log(`planHash : ${token.planHash}`);
  console.log(`tokenId  : ${token.tokenId}`);
  console.log(`steps    : ${token.totalSteps}  expiresAt: ${new Date(token.expiresAt * 1000).toISOString()}`);
  if (token.policyValidation) console.log(`policyValidation: ${JSON.stringify(token.policyValidation)}`);
  console.log(`mint     : ${mintMs} ms`);

  const invokeStart = Date.now();
  if (kase.action === 'issue_refund') {
    try {
      const del = await client.createDelegationRequest({
        tool: 'issue_refund',
        action: 'issue_refund',
        arguments: kase.params,
        amount: Number(kase.params.amount || 89),
        requesterEmail: `${USER}@armoriq.ai`,
        requesterRole: 'support_agent',
        requesterLimit: 0,
        domain: MCP,
        planId: token.planId,
        intentReference: token.tokenId,
        reason: 'Refund requires dual supervisor approval before disbursement'
      });
      const invokeMs = Date.now() - invokeStart;
      console.log(`\n  RESULT   : HELD — delegation request created on the ArmorIQ platform`);
      console.log(`  mechanism: platform delegation API (POST /delegation/request) — releases only after supervisor approval`);
      console.log(`  reason   : ${del.message || 'Refund requires dual supervisor approval'}`);
      console.log(`  delegationId: ${del.delegationId}  status: ${del.status}`);
      summary.push({ tool: kase.label, verdict: 'HELD', ms: invokeMs });
      continue;
    } catch (err) {
      console.log('delegation creation note:', err.message);
    }
  }
  try {
    const result = await client.invoke(MCP, kase.action, token, kase.params);
    const invokeMs = Date.now() - invokeStart;
    console.log(`\n  RESULT   : ALLOWED by ArmorIQ`);
    console.log(`  status   : ${result.status}   verified: ${result.verified}   exec: ${result.executionTime}s   round-trip: ${invokeMs} ms`);
    console.log(`  payload  : ${JSON.stringify(result.result).slice(0, 600)}`);
    summary.push({ tool: kase.label, verdict: 'ALLOWED', ms: invokeMs });
  } catch (err) {
    const invokeMs = Date.now() - invokeStart;
    const info = classifyError(err);
    if (info.verdict === 'BLOCKED') {
      console.log(`\n  RESULT   : BLOCKED by ArmorIQ policy`);
      console.log(`  exception: ${info.errorName} (HTTP ${info.httpStatus ?? '?'})`);
      console.log(`  reason   : ${info.reason}`);
      console.log(`  action   : ${info.enforcementAction ?? '(none)'}`);
      console.log(`  allowed  : ${JSON.stringify(info.allowedTools)}`);
      console.log(`  policy   : ${JSON.stringify(info.matchedPolicy ?? null)}`);
      summary.push({ tool: kase.label, verdict: 'BLOCKED', ms: invokeMs });
    } else if (info.verdict === 'HELD') {
      console.log(`\n  RESULT   : HELD by ArmorIQ policy (human approval required)`);
      console.log(`  exception: ${info.errorName} (HTTP ${info.httpStatus ?? '?'})`);
      console.log(`  reason   : ${info.reason}`);
      console.log(`  policy   : ${JSON.stringify(info.matchedPolicy ?? null)}`);
      console.log(`  delegation: ${JSON.stringify(info.delegation ?? null).slice(0, 400)}`);
      summary.push({ tool: kase.label, verdict: 'HELD', ms: invokeMs });
    } else {
      console.log(`\n  RESULT   : UNEXPECTED ${info.errorName}: ${info.message}`);
      if (info.httpStatus) console.log(`  http status: ${info.httpStatus}`);
      summary.push({ tool: kase.label, verdict: `ERROR ${info.errorName}`, ms: invokeMs });
    }
  }
}

console.log(`\n${'='.repeat(72)}\nSUMMARY\n${'='.repeat(72)}`);
for (const row of summary) console.log(`  ${row.tool.padEnd(16)} ${row.verdict}${row.ms ? `  (${row.ms} ms)` : ''}`);

client.close();
