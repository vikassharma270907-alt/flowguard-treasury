/**
 * Intent-binding evidence: a token authorises one specific plan, and nothing else.
 *
 *   node --env-file=.env scripts/test-intent-mismatch.mjs
 *
 * Case 1 — different action: a token minted for a lookup_order plan is used to
 *          invoke issue_refund. Refused by the SDK before any network call
 *          (IntentMismatchException).
 * Case 2 — same action, different arguments: a token minted for a refund of 89
 *          is used to invoke a refund of 5,000. Observed honestly: the platform
 *          binds the action but not the call arguments, so the call reaches the
 *          sandbox tool, whose own bounds check rejects the amount. Reported as
 *          NOT REFUSED rather than dressed up as an interception.
 * Case 3 — expired token: minted with a 5 second validity, used after it lapses.
 *          Refused by the SDK before any network call (TokenExpiredException).
 *
 * Nothing here is mocked: every outcome is what the SDK or the ArmorIQ platform
 * actually returned.
 */
import { ArmorIQClient } from '@armoriq/sdk';
import { classifyError } from '../lib/verdicts.mjs';

const MCP = process.env.ARMORIQ_MCP_ID;
const AGENT = process.env.ARMORIQ_AGENT_ID || 'flowguard-agent';
const USER = process.env.USER_ID || 'flowguard-operator';

const client = new ArmorIQClient({ apiKey: process.env.ARMORIQ_API_KEY, userId: USER, agentId: AGENT });

function plan(action, inputs, goal) {
  return { goal, steps: [{ action, tool: action, mcp: MCP, inputs }] };
}

async function mint(action, inputs, goal) {
  const capture = client.capturePlan('flowguard-test', goal, plan(action, inputs, goal));
  return client.getIntentToken(capture);
}

async function report(label, fn) {
  console.log(`\n${'-'.repeat(72)}\n${label}\n${'-'.repeat(72)}`);
  try {
    const out = await fn();
    console.log(`  NOT REFUSED — the call reached the upstream tool: ${JSON.stringify(out).slice(0, 200)}`);
    return 'NOT REFUSED (reached upstream)';
  } catch (err) {
    const info = classifyError(err);
    console.log(`  refused by : ${info.errorName}${info.httpStatus ? ` (HTTP ${info.httpStatus})` : ' (before any network call)'}`);
    console.log(`  reason     : ${info.reason}`);
    return info.errorName;
  }
}

console.log('Intent-binding tests against ArmorIQ\n');

// --- Case 1: token for one tool, used for another ---------------------------
const lookupToken = await mint('lookup_order', { order_id: 'ORD-1001' }, 'Caller asks where ORD-1001 is');
console.log(`minted lookup_order token  planHash=${lookupToken.planHash}`);
const case1 = await report('Case 1 — lookup_order token used to invoke issue_refund', async () => {
  const r = await client.invoke(MCP, 'issue_refund', lookupToken, { order_id: 'ORD-1001', amount: 89 });
  return r.result;
});

// --- Case 2: same tool, escalated amount ------------------------------------
const smallRefund = await mint('issue_refund', { order_id: 'ORD-1001', amount: 89 }, 'Caller asks for an 89 USD refund on ORD-1001');
console.log(`minted issue_refund token  planHash=${smallRefund.planHash}  (plan amount: 89)`);
const case2 = await report('Case 2 — issue_refund(89) token used to invoke issue_refund(5000) [KNOWN LIMITATION]', async () => {
  const r = await client.invoke(MCP, 'issue_refund', smallRefund, { order_id: 'ORD-1001', amount: 5000 });
  return r.result;
});

// --- Case 3: expired token --------------------------------------------------
const shortCapture = client.capturePlan('flowguard-test', 'expiry test', plan('lookup_order', { order_id: 'ORD-1002' }, 'expiry test'));
const shortToken = await client.getIntentToken(shortCapture, undefined, 5);
console.log(`minted short-lived token    expiresAt=${new Date(shortToken.expiresAt * 1000).toISOString()} (5s validity)`);
console.log('waiting 7s for it to lapse…');
await new Promise((r) => setTimeout(r, 7000));
const case3 = await report('Case 3 — using a token after it expired', async () => {
  const r = await client.invoke(MCP, 'lookup_order', shortToken, { order_id: 'ORD-1002' });
  return r.result;
});

console.log(`\n${'='.repeat(72)}`);
console.log(`Case 1 — wrong action   : ${case1}`);
console.log(`Case 2 — swapped amount : ${case2} [KNOWN LIMITATION]`);
console.log(`Case 3 — expired token  : ${case3}`);
console.log('='.repeat(72));

client.close();
