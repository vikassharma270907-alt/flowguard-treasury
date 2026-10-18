const test = require('node:test');
const assert = require('node:assert/strict');
const proxyquire = require('proxyquire').noCallThru();
const { VERDICT_BY_ERROR_NAME, classifyError } = require('../lib/verdicts.js');

test('governedToolCall with @armoriq/sdk mock', async (t) => {

  const originalEnv = { ...process.env };

  await t.test('returns NOT_EXECUTED when ARMORIQ_API_KEY is missing', async () => {
    delete process.env.ARMORIQ_API_KEY;
    const { governedToolCall } = proxyquire('../server/armorIqEnforcement.js', {
      '@armoriq/sdk': {
        ArmorIQClient: class {}
      }
    });

    const result = await governedToolCall({ tool: 'lookup_order' });
    assert.equal(result.decision, 'NOT_EXECUTED');
    assert.equal(result.errorName, 'NotConfigured');

    // restore for subsequent tests
    process.env.ARMORIQ_API_KEY = 'test_key';
  });

  await t.test('returns ALLOWED when invoke succeeds', async () => {
    process.env.ARMORIQ_API_KEY = 'test_key';
    const mockClient = {
      capturePlan: () => ({ planId: 'plan-1' }),
      getIntentToken: async () => ({
        tokenId: 'token-1',
        planHash: 'hash-1',
        planId: 'plan-1',
        policyValidation: true,
        stepProofs: []
      }),
      invoke: async () => ({
        result: { status: 'success', data: { id: 'ORD-1001' } },
        verified: true,
        status: 'OK'
      })
    };

    const { governedToolCall } = proxyquire('../server/armorIqEnforcement.js', {
      '@armoriq/sdk': {
        ArmorIQClient: class {
          constructor() { return mockClient; }
        }
      }
    });

    const result = await governedToolCall({ tool: 'lookup_order', args: { order_id: 'ORD-1001' } });
    assert.equal(result.decision, 'ALLOWED');
    assert.deepEqual(result.result, { status: 'success', data: { id: 'ORD-1001' } });
    assert.equal(result.tokenId, 'token-1');
  });

  await t.test('returns BLOCKED when invoke throws PolicyBlockedException', async () => {
     process.env.ARMORIQ_API_KEY = 'test_key';
     const mockClient = {
      capturePlan: () => ({ planId: 'plan-2' }),
      getIntentToken: async () => ({
        tokenId: 'token-2',
        planHash: 'hash-2',
        planId: 'plan-2',
      }),
      invoke: async () => {
        const err = new Error('Policy blocked');
        err.name = 'PolicyBlockedException';
        err.enforcementAction = 'deny';
        err.matchedPolicy = 'deny-all';
        err.reason = 'Blocked by policy deny-all';
        throw err;
      }
    };

    const { governedToolCall } = proxyquire('../server/armorIqEnforcement.js', {
      '@armoriq/sdk': {
        ArmorIQClient: class {
          constructor() { return mockClient; }
        }
      }
    });

    const result = await governedToolCall({ tool: 'change_payout' });
    assert.equal(result.decision, 'BLOCKED');
    assert.equal(result.errorName, 'PolicyBlockedException');
    assert.equal(result.enforcementAction, 'deny');
  });

  await t.test('returns HELD for issue_refund when creating delegation succeeds', async () => {
    process.env.ARMORIQ_API_KEY = 'test_key';
    const mockClient = {
      capturePlan: () => ({ planId: 'plan-3' }),
      getIntentToken: async () => ({
        tokenId: 'token-3',
        planHash: 'hash-3',
        planId: 'plan-3',
      }),
      createDelegationRequest: async () => ({
        id: 'del-123',
        message: 'Refund held for review',
        status: 'pending'
      }),
      invoke: async () => {
         throw new Error('Should not reach invoke if createDelegationRequest succeeds');
      }
    };

    const { governedToolCall } = proxyquire('../server/armorIqEnforcement.js', {
      '@armoriq/sdk': {
        ArmorIQClient: class {
          constructor() { return mockClient; }
        }
      }
    });

    const result = await governedToolCall({ tool: 'issue_refund', args: { amount: 100 } });
    assert.equal(result.decision, 'HELD');
    assert.equal(result.errorName, 'PolicyHoldException');
    assert.equal(result.matchedPolicy, 'policy-issue-refund-hold');
    assert.deepEqual(result.delegation, { id: 'del-123', message: 'Refund held for review', status: 'pending' });
  });

  // Cleanup
  process.env = originalEnv;
});
