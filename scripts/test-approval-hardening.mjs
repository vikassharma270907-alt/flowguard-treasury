/**
 * Test Suite for BeyondFlow Gateway Supervisor Approval Hardening (Task 2)
 *
 * Verifies the 5 mandated hardening security rules:
 *   1. Duplicate approver rejected (2 distinct supervisors required)
 *   2. Self-approval rejected (requester/session cannot sign own hold)
 *   3. Expired hold rejected (15-minute TTL strictly enforced)
 *   4. Changed amount at release rejected (stored parameters and plan hash binding)
 *   5. Double release is idempotent (second release returns existing result without re-executing)
 *
 * All decisions verified in this suite are explicitly labeled as "BeyondFlow gateway rule".
 *
 * Run:
 *   node --env-file=.env scripts/test-approval-hardening.mjs
 */

import { openHold, decideHold, releaseHold } from '../gateway/server.mjs';
import { pending } from '../gateway/audit-store.mjs';

const PLAN_HASH = '5ed2b4ec3d598c4234398e2d6b27ce6bff71dbc206c8033209fd148e165e6f9d';
const REQUESTER_SESSION = 'call_session_operator_01';

const results = [];

function recordTest(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}  ${name}`);
  if (detail) console.log(`       └─ ${detail}`);
}

async function runTests() {
  console.log('='.repeat(72));
  console.log('BeyondFlow Gateway Hardening Verification (5 Rules)');
  console.log('='.repeat(72));

  // --------------------------------------------------------------------------
  // TEST 1: Duplicate approver rejected
  // --------------------------------------------------------------------------
  try {
    const hold = openHold({
      tool: 'issue_refund',
      args: { order_id: 'ORD-1001', amount: 89 },
      planHash: PLAN_HASH,
      reason: 'Dual supervisor approval required'
    }, {
      id: `test-dup-${Date.now()}`,
      requesterId: REQUESTER_SESSION
    });

    const sup1 = 'sarah.chen@beyondflow.io';

    // First approval by Sarah Chen
    const res1 = await decideHold(hold.id, { decision: 'approve', supervisor: sup1 });
    const firstOk = res1.ok && res1.waiting_for === 1;

    // Second approval attempt by the SAME Sarah Chen
    const res2 = await decideHold(hold.id, { decision: 'approve', supervisor: sup1 });
    const secondRejected = !res2.ok &&
      res2.status === 409 &&
      res2.rule === 'BeyondFlow gateway rule' &&
      res2.error.toLowerCase().includes('duplicate approval');

    const pass = firstOk && secondRejected;
    recordTest(
      'Duplicate approver rejected',
      pass,
      `First approval counted; duplicate attempt by "${sup1}" returned HTTP 409: "${res2.error}"`
    );
  } catch (err) {
    recordTest('Duplicate approver rejected', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Self-approval rejected
  // --------------------------------------------------------------------------
  try {
    const hold = openHold({
      tool: 'issue_refund',
      args: { order_id: 'ORD-1001', amount: 89 },
      planHash: PLAN_HASH,
      reason: 'Dual supervisor approval required'
    }, {
      id: `test-self-${Date.now()}`,
      requesterId: REQUESTER_SESSION
    });

    // Requester attempts to approve their own hold
    const res = await decideHold(hold.id, { decision: 'approve', supervisor: REQUESTER_SESSION });
    const pass = !res.ok &&
      res.status === 403 &&
      res.rule === 'BeyondFlow gateway rule' &&
      res.error.toLowerCase().includes('self-approval');

    recordTest(
      'Self-approval rejected',
      pass,
      `Requester "${REQUESTER_SESSION}" attempted self-approval, rejected with HTTP 403: "${res.error}"`
    );
  } catch (err) {
    recordTest('Self-approval rejected', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Expired hold rejected
  // --------------------------------------------------------------------------
  try {
    const expiredCreatedAt = Date.now() - (16 * 60 * 1000); // 16 minutes ago
    const hold = openHold({
      tool: 'issue_refund',
      args: { order_id: 'ORD-1001', amount: 89 },
      planHash: PLAN_HASH,
      reason: 'Dual supervisor approval required'
    }, {
      id: `test-expired-${Date.now()}`,
      requesterId: REQUESTER_SESSION,
      createdAt: expiredCreatedAt,
      ttlMs: 15 * 60 * 1000 // 15-minute TTL
    });

    const sup = 'marcus.sterling@beyondflow.io';
    const res = await decideHold(hold.id, { decision: 'approve', supervisor: sup });
    const pass = !res.ok &&
      res.status === 410 &&
      res.rule === 'BeyondFlow gateway rule' &&
      res.error.toLowerCase().includes('expired');

    recordTest(
      'Expired hold rejected',
      pass,
      `Hold created 16m ago (TTL: 15m). Approval rejected with HTTP 410: "${res.error}"`
    );
  } catch (err) {
    recordTest('Expired hold rejected', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 4: Changed amount at release rejected
  // --------------------------------------------------------------------------
  try {
    const hold = openHold({
      tool: 'issue_refund',
      args: { order_id: 'ORD-1001', amount: 89 },
      planHash: PLAN_HASH,
      reason: 'Dual supervisor approval required'
    }, {
      id: `test-tamper-${Date.now()}`,
      requesterId: REQUESTER_SESSION
    });

    // Attempt release with tampered amount ($500 instead of $89)
    let rejected = false;
    let errorMsg = '';
    try {
      await releaseHold(hold, {
        replayArgs: { order_id: 'ORD-1001', amount: 500 }, // Tampered!
        replayPlanHash: PLAN_HASH,
        who: 'attacker'
      });
    } catch (err) {
      rejected = true;
      errorMsg = err.message;
    }

    const pass = rejected && errorMsg.includes('Parameters do not match');
    recordTest(
      'Changed amount at release rejected',
      pass,
      `Release attempted with amount $500 instead of $89: rejected with "${errorMsg}"`
    );
  } catch (err) {
    recordTest('Changed amount at release rejected', false, err.message);
  }

  // --------------------------------------------------------------------------
  // TEST 5: Double release is idempotent
  // --------------------------------------------------------------------------
  try {
    const hold = openHold({
      tool: 'issue_refund',
      args: { order_id: 'ORD-1001', amount: 89 },
      planHash: PLAN_HASH,
      reason: 'Dual supervisor approval required'
    }, {
      id: `test-idempotent-${Date.now()}`,
      requesterId: REQUESTER_SESSION
    });

    let mockCallCount = 0;
    const mockGovernedCall = async (call) => {
      mockCallCount++;
      return {
        decision: 'ALLOWED',
        planHash: PLAN_HASH,
        result: { refund_id: 'ref_mock_9921', order_id: 'ORD-1001', amount: 89, currency: 'USD' },
        timings: { total: 42, mint: 20, invoke: 22 }
      };
    };

    // First release: executes downstream
    const release1 = await releaseHold(hold, {
      governedCallFn: mockGovernedCall,
      who: 'quorum-approver-2'
    });
    const firstCallCount = mockCallCount;

    // Second release on the same hold: must be idempotent and NOT call downstream again
    const release2 = await releaseHold(hold, {
      governedCallFn: mockGovernedCall,
      who: 'replay-attempt'
    });
    const secondCallCount = mockCallCount;

    const pass = firstCallCount === 1 &&
      secondCallCount === 1 &&
      release1.result?.refund_id === 'ref_mock_9921' &&
      release2.result?.refund_id === 'ref_mock_9921';

    recordTest(
      'Double release is idempotent',
      pass,
      `First release executed refund (count: 1). Second release returned cached result without re-executing (count: 1).`
    );
  } catch (err) {
    recordTest('Double release is idempotent', false, err.message);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('='.repeat(72));
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  console.log(`SUMMARY: ${passedCount}/${totalCount} tests passed`);
  console.log('='.repeat(72));

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests();
