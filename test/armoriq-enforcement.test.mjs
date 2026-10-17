import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sdkPath = require.resolve('@armoriq/sdk');

test('1. governedToolCall handles not configured ArmorIQ client', async () => {
    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const origEnv = process.env.ARMORIQ_API_KEY;
    delete process.env.ARMORIQ_API_KEY;

    const { governedToolCall } = require('../server/armorIqEnforcement.js');
    try {
        const result = await governedToolCall({
            tool: 'test_tool',
            args: { id: 1 },
            prompt: 'Test prompt',
            goal: 'Test goal',
        });

        assert.equal(result.decision, 'NOT_EXECUTED');
        assert.equal(result.errorName, 'NotConfigured');
    } finally {
        if (origEnv) {
            process.env.ARMORIQ_API_KEY = origEnv;
        }
    }
});

test('2. governedToolCall - successful flow', async () => {
    // Mock ArmorIQClient
    require.cache[sdkPath] = {
      id: sdkPath,
      filename: sdkPath,
      loaded: true,
      exports: {
        ArmorIQClient: class MockClient {
          capturePlan() { return { planId: 'plan1' }; }
          async getIntentToken() { return { planHash: 'hash1', tokenId: 'token1', planId: 'plan1' }; }
          async invoke() { return { result: 'allowed_result', status: 'mcpStatus1' }; }
        }
      }
    };

    process.env.ARMORIQ_API_KEY = 'test_key';
    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const enforcement = require('../server/armorIqEnforcement.js');

    const result = await enforcement.governedToolCall({
        tool: 'some_other_tool',
        args: { foo: 'bar' },
        prompt: 'Test prompt',
        goal: 'Test goal',
        clientKey: 'success_test'
    });

    assert.equal(result.decision, 'ALLOWED');
    assert.equal(result.result, 'allowed_result');
    assert.equal(result.tokenId, 'token1');
});

test('3. governedToolCall - rate limited', async () => {
    process.env.ARMORIQ_API_KEY = 'test_key';
    process.env.ENFORCEMENT_RPM = '1';

    // We mock the client to return ALLOWED for lookup_order
    require.cache[sdkPath] = {
      id: sdkPath,
      filename: sdkPath,
      loaded: true,
      exports: {
        ArmorIQClient: class MockClient {
          capturePlan() { return { planHash: 'hash1' }; }
          async getIntentToken() { return { planHash: 'hash1', tokenId: 'token1' }; }
          async invoke() { return { result: 'allowed', status: 'mcpStatus1' }; }
        }
      }
    };

    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const enforcement = require('../server/armorIqEnforcement.js');

    const result1 = await enforcement.governedToolCall({ tool: 'tool1', clientKey: 'rate_test' });
    assert.equal(result1.decision, 'ALLOWED');

    const result2 = await enforcement.governedToolCall({ tool: 'tool2', clientKey: 'rate_test' });
    assert.equal(result2.decision, 'NOT_EXECUTED');
    assert.equal(result2.errorName, 'RateLimited');
});

test('4. governedToolCall caches lookup_order result', async () => {
    // We mock the client to return ALLOWED for lookup_order
    require.cache[sdkPath] = {
      id: sdkPath,
      filename: sdkPath,
      loaded: true,
      exports: {
        ArmorIQClient: class MockClient {
          capturePlan() { return { planHash: 'hash1' }; }
          async getIntentToken() { return { planHash: 'hash1', tokenId: 'token1' }; }
          async invoke() { return { result: 'allowed', status: 'mcpStatus1' }; }
        }
      }
    };

    process.env.ARMORIQ_API_KEY = 'test_key';
    process.env.ENFORCEMENT_RPM = '1000'; // Increase to avoid rate limit error
    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const enforcement = require('../server/armorIqEnforcement.js');

    const result1 = await enforcement.governedToolCall({
        tool: 'lookup_order',
        args: { id: 1 },
        prompt: 'Test prompt',
        goal: 'Test goal',
        clientKey: 'cache_test_client_key'
    });

    assert.equal(result1.decision, 'ALLOWED');
    assert.equal(result1.cached, undefined);

    const result2 = await enforcement.governedToolCall({
        tool: 'lookup_order',
        args: { id: 1 },
        prompt: 'Test prompt',
        goal: 'Test goal',
        clientKey: 'cache_test_client_key'
    });

    assert.equal(result2.decision, 'ALLOWED');
    assert.equal(result2.cached, true);
});

test('5. governedToolCall - issue_refund with delegation', async () => {
    process.env.ARMORIQ_API_KEY = 'ak_live_test';

    require.cache[sdkPath] = {
      id: sdkPath,
      filename: sdkPath,
      loaded: true,
      exports: {
        ArmorIQClient: class MockClient {
          capturePlan() { return { planHash: 'hash1' }; }
          async getIntentToken() { return { planHash: 'hash1', tokenId: 'token1', planId: 'plan1' }; }
          async createDelegationRequest() {
              return {
                  message: 'Custom hold message',
                  delegationId: 'del1'
              };
          }
          async invoke() { return { result: 'allowed', status: 'mcpStatus1' }; }
        }
      }
    };

    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const enforcement = require('../server/armorIqEnforcement.js');

    const result = await enforcement.governedToolCall({
        tool: 'issue_refund',
        args: { amount: 100 },
        clientKey: 'delegation_test'
    });

    assert.equal(result.decision, 'HELD');
    assert.equal(result.errorName, 'PolicyHoldException');
    assert.equal(result.reason, 'Custom hold message');
    assert.equal(result.delegation.delegationId, 'del1');
    assert.equal(result.matchedPolicy, 'policy-issue-refund-hold');
});

test('6. mintSessionPlan - successful flow', async () => {
    process.env.ARMORIQ_API_KEY = 'ak_live_test';

    require.cache[sdkPath] = {
      id: sdkPath,
      filename: sdkPath,
      loaded: true,
      exports: {
        ArmorIQClient: class MockClient {
          capturePlan() { return { planHash: 'hash1' }; }
          async getIntentToken() {
            return {
                planHash: 'hash1',
                tokenId: 'token1',
                planId: 'plan1',
                stepProofs: [{proof: 'proof1'}],
                expiresAt: 1000
            };
          }
        }
      }
    };

    delete require.cache[require.resolve('../server/armorIqEnforcement.js')];
    const enforcement = require('../server/armorIqEnforcement.js');

    const result = await enforcement.mintSessionPlan({
        goal: 'test_goal',
        steps: []
    });

    assert.equal(result.connected, true);
    assert.equal(result.tokenId, 'token1');
    assert.equal(result.planHash, 'hash1');
    assert.equal(result.stepProofs, 1);
    assert.equal(result.expiresAt, 1000);
});
