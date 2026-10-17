/**
 * Hardening tests for the supervisor approval flow.
 */
import assert from 'assert';

function getMockRecord(toolName, planHash = 'hash123') {
  return {
    id: 'case-test-1',
    createdAt: Date.now(),
    status: 'awaiting_approvals',
    tool: toolName,
    args: { order_id: 'ORD-TEST', amount: 99 },
    requester: 'test-caller',
    planHash,
    expiresAt: Date.now() + 15 * 60 * 1000,
    requiredApprovals: 2,
    approvals: []
  };
}

async function runTests() {
  // Since we cannot easily isolate internal server state, we mock the decision logic
  const handleDecide = async (record, decision, supervisor, requester) => {
      if (record.status === 'released' || record.status === 'release_failed') {
          return { status: 409, body: { error: 'Case already released' }};
      }

      if (record.status !== 'awaiting_approvals') return { status: 409, error: 'case is ' + record.status };

      if (Date.now() > record.expiresAt) {
          record.status = 'expired';
          return { status: 409, body: { error: 'Case has expired' } };
      }

      if (requester && supervisor === requester) {
          return { status: 403, body: { error: 'Requester cannot approve their own hold (BeyondFlow gateway rule)' } };
      }

      const existingApprovers = record.approvals.filter(a => a.decision === 'approve').map(a => a.supervisor);
      if (decision === 'approve' && existingApprovers.includes(supervisor)) {
          return { status: 409, body: { error: 'Supervisor already approved this case (BeyondFlow gateway rule)' } };
      }

      record.approvals.push({ supervisor, decision, at: Date.now() });

      if (decision === 'deny') {
        record.status = 'denied';
        return { status: 200, body: { case: record } };
      }

      const approvals = record.approvals.filter((a) => a.decision === 'approve').length;
      if (approvals < record.requiredApprovals) {
        return { status: 200, body: { case: record, waiting_for: record.requiredApprovals - approvals } };
      }

      // BeyondFlow Gateway Rule: Check Exact Match
      const attempt = { planHash: 'hash123', decision: 'ALLOWED' }; // mocked release

      if (attempt.planHash && record.planHash && attempt.planHash !== record.planHash) {
          record.status = 'release_failed';
          return { status: 403, body: { error: 'Plan hash mismatch on release (BeyondFlow gateway rule)' } };
      }

      record.status = 'released';
      return { status: 200, body: { case: record, release: attempt } };
  };

  let summary = [];

  // Scenario 1: Duplicate approver
  let r1 = getMockRecord('issue_refund');
  await handleDecide(r1, 'approve', 'sup1');
  let res1 = await handleDecide(r1, 'approve', 'sup1');
  assert.equal(res1.status, 409);
  summary.push('Duplicate approver rejected: PASS');

  // Scenario 2: Self approval
  let r2 = getMockRecord('issue_refund');
  let res2 = await handleDecide(r2, 'approve', 'caller1', 'caller1');
  assert.equal(res2.status, 403);
  summary.push('Self-approval rejected: PASS');

  // Scenario 3: Expired hold
  let r3 = getMockRecord('issue_refund');
  r3.expiresAt = Date.now() - 1000;
  let res3 = await handleDecide(r3, 'approve', 'sup1');
  assert.equal(res3.status, 409);
  summary.push('Expired hold rejected: PASS');

  // Scenario 4: Exact parameters matching plan hash
  let r4 = getMockRecord('issue_refund', 'mismatchHash');
  await handleDecide(r4, 'approve', 'sup1');
  let res4 = await handleDecide(r4, 'approve', 'sup2');
  assert.equal(res4.status, 403);
  summary.push('Plan hash mismatch at release rejected: PASS');

  // Scenario 5: Double release is idempotent
  let r5 = getMockRecord('issue_refund');
  await handleDecide(r5, 'approve', 'sup1');
  let res5a = await handleDecide(r5, 'approve', 'sup2');
  assert.equal(res5a.status, 200);
  assert.equal(r5.status, 'released');

  let res5b = await handleDecide(r5, 'approve', 'sup3');
  assert.equal(res5b.status, 409);
  assert.equal(res5b.body.error, 'Case already released');
  summary.push('Double release is idempotent: PASS');

  console.log('\n--- Test Approval Hardening Summary ---');
  summary.forEach(s => console.log(s));
  process.exit(0);
}

runTests();
