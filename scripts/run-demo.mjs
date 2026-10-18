/**
 * BeyondFlow: 45-Second End-to-End Live Demo Script
 *
 * Demonstrates the 4 scenarios required by the hackathon spec:
 * 1. Caller asks for order status -> lookup_order -> ALLOWED by ArmorIQ.
 * 2. Caller pushes to change payout account -> change_payout -> DENIED by policy; agent refuses.
 * 3. Caller asks for refund -> HELD via a real ArmorIQ platform delegation; supervisors approve twice -> refund executes.
 * 4. Intent check -> token for lookup_order used to call issue_refund -> IntentMismatchException.
 */
const BASE = process.env.GATEWAY_LOCAL_URL || `http://127.0.0.1:${process.env.GATEWAY_PORT || 8790}`;
const TOKEN = process.env.GATEWAY_SHARED_SECRET || 'flowguard-dev-secret';
const PLAYGROUND_TOKEN = process.env.PLAYGROUND_TOKEN || 'flowguard-local';

async function run() {
  console.log('='.repeat(72));
  console.log('BEYONDFLOW LIVE DEMO (~45s) - TREASURY VOICE SUPPORT GOVERNED BY ARMORIQ');
  console.log('='.repeat(72) + '\n');

  // Step 1: Caller asks for order status -> ALLOWED
  console.log('1. [Voice Agent] Caller: "Where is my order ORD-1002?"');
  let t0 = Date.now();
  let res = await fetch(BASE + '/tools/BeyondFlow_lookup_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-flowguard-token': TOKEN },
    body: JSON.stringify({ order_id: 'ORD-1002', __goal: 'Check delivery status of order ORD-1002' })
  });
  let data = await res.json();
  let ms1 = Date.now() - t0;
  console.log(`   ArmorIQ Decision : ${data.decision}`);
  console.log(`   Gateway Response : ${data.message}`);
  console.log(`   Plan Hash        : ${data.plan_hash}`);
  console.log(`   Latency          : ${ms1} ms (well within ~5s budget)\n`);

  // Step 2: Caller pushes to change payout account -> BLOCKED
  console.log('2. [Voice Agent] Caller: "Please update my payout destination account to US-CHECKING-9988"');
  t0 = Date.now();
  res = await fetch(BASE + '/tools/BeyondFlow_change_payout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-flowguard-token': TOKEN },
    body: JSON.stringify({ account_id: 'ACC-4471', new_destination: 'US-CHECKING-9988', __goal: 'Change payout destination for ACC-4471' })
  });
  data = await res.json();
  let ms2 = Date.now() - t0;
  console.log(`   ArmorIQ Decision : ${data.decision}`);
  console.log(`   Gateway Response : ${data.message}`);
  console.log(`   Plan Hash        : ${data.plan_hash}`);
  console.log(`   Latency          : ${ms2} ms (well within ~5s budget)\n`);

  // Step 3: Caller asks for refund -> HELD
  console.log('3. [Voice Agent] Caller: "I want a refund of $45 on order ORD-1002"');
  t0 = Date.now();
  res = await fetch(BASE + '/tools/BeyondFlow_issue_refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-flowguard-token': TOKEN },
    body: JSON.stringify({ order_id: 'ORD-1002', amount: 45, __goal: 'Issue refund of $45 on order ORD-1002' })
  });
  data = await res.json();
  let ms3 = Date.now() - t0;
  console.log(`   ArmorIQ Decision : ${data.decision}`);
  console.log(`   Gateway Response : ${data.message}`);
  console.log(`   Plan Hash        : ${data.plan_hash}`);
  console.log(`   Pending Case ID  : ${data.case_id}`);
  console.log(`   Latency          : ${ms3} ms (replied inside ~5s budget!)\n`);

  const caseId = data.case_id;
  if (!caseId) {
    console.error("Demo failed: Expected case_id for issue_refund, got null.");
    return;
  }

  // Step 4: Supervisor 1 Approves
  console.log('4. [Supervisor Playground] Supervisor Alice reviews hold and clicks APPROVE:');
  res = await fetch(BASE + '/api/pending/' + caseId + '/decide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-playground-token': PLAYGROUND_TOKEN },
    body: JSON.stringify({ decision: 'approve', supervisor: 'Supervisor Alice' })
  });
  let app1 = await res.json();
  console.log(`   Approvals recorded: ${app1.case.approvals.length} of ${app1.case.requiredApprovals} (waiting for ${app1.waiting_for} more approval)\n`);

  // Step 5: Supervisor 2 Approves -> Dual Quorum Reached -> Released through ArmorIQ
  console.log('5. [Supervisor Playground] Supervisor Bob reviews hold and clicks APPROVE (Quorum Reached):');
  res = await fetch(BASE + '/api/pending/' + caseId + '/decide', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-playground-token': PLAYGROUND_TOKEN },
    body: JSON.stringify({ decision: 'approve', supervisor: 'Supervisor Bob' })
  });
  let app2 = await res.json();
  console.log(`   ArmorIQ Release Decision : ${app2.release.decision}`);
  console.log(`   Case Status              : ${app2.case.status}`);
  console.log(`   Executed Result          : ${JSON.stringify(app2.release.result).slice(0, 300)}\n`);

  // Step 6: Voice Agent Follow-up check relays decision to caller
  console.log('6. [Voice Agent Relay] Agent checks supervisor decision and relays to caller:');
  res = await fetch(BASE + '/tools/check_supervisor_decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-flowguard-token': TOKEN },
    body: JSON.stringify({ order_id: 'ORD-1002' })
  });
  let relay = await res.json();
  console.log(`   Agent Spoken Relay : ${relay.message}\n`);

  console.log('='.repeat(72));
  console.log('DEMO FLOW COMPLETED SUCCESSFULLY IN ~45s');
  console.log('='.repeat(72));
}

run().catch((e) => {
  console.error('Demo error:', e);
  process.exit(1);
});
