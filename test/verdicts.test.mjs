import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyError, explain } from '../lib/verdicts.js';

test('classifyError transforms standard Error correctly', () => {
  const err = new Error('Something went wrong');
  const result = classifyError(err);

  assert.equal(result.verdict, 'ERROR');
  assert.equal(result.errorName, 'Error');
  assert.equal(result.httpStatus, null);
  assert.equal(result.message, 'Something went wrong');
});

test('classifyError transforms specific mapped SDK error name', () => {
  const err = new Error();
  err.name = 'PolicyBlockedException';
  const result = classifyError(err);

  assert.equal(result.verdict, 'BLOCKED');
  assert.equal(result.errorName, 'PolicyBlockedException');
});

test('classifyError handles error with missing name and undefined inputs', () => {
  const result = classifyError(undefined);
  assert.equal(result.verdict, 'ERROR');
  assert.equal(result.errorName, 'Error');
});

test('classifyError extracts typed fields first', () => {
  const err = new Error('Direct error message');
  err.name = 'IntentMismatchException';
  err.statusCode = 403;
  err.enforcementAction = 'BLOCK';
  err.matchedPolicy = { id: 'policy1' };
  err.delegationContext = { user: 'test' };
  err.metadata = { source: 'typed' };

  // Conflicting proxy data
  err.response = {
    data: {
      message: 'Proxy message',
      enforcementAction: 'ALLOW',
      matchedPolicy: { id: 'proxy-policy' },
      delegationContext: { user: 'proxy' },
      metadata: { source: 'proxy' },
      enforcement: {
        action: 'WARN'
      }
    }
  };

  const result = classifyError(err);

  assert.equal(result.verdict, 'INTENT_MISMATCH');
  assert.equal(result.errorName, 'IntentMismatchException');
  assert.equal(result.httpStatus, 403);
  assert.equal(result.message, 'Direct error message');
  assert.equal(result.enforcementAction, 'BLOCK');
  assert.deepEqual(result.matchedPolicy, { id: 'policy1' });
  assert.deepEqual(result.delegation, { user: 'test' });
  assert.deepEqual(result.metadata, { source: 'typed' });
});

test('classifyError extracts fields from proxy HTTP payload when typed fields missing', () => {
  const err = new Error('Proxy message');
  err.name = 'PolicyHoldException';
  err.response = {
    status: 401,
    data: {
      message: 'Proxy message',
      enforcementAction: 'HOLD',
      matchedPolicy: { id: 'proxy-policy' },
      delegation: { user: 'proxy' },
      metadata: { source: 'proxy' },
      enforcement: {
        allowedTools: ['toolA', 'toolB']
      }
    }
  };

  const result = classifyError(err);

  assert.equal(result.verdict, 'HELD');
  assert.equal(result.httpStatus, 401);
  assert.equal(result.message, 'Proxy message');
  assert.equal(result.enforcementAction, 'HOLD');
  assert.deepEqual(result.matchedPolicy, { id: 'proxy-policy' });
  assert.deepEqual(result.delegation, { user: 'proxy' });
  assert.deepEqual(result.metadata, { source: 'proxy' });
  assert.deepEqual(result.allowedTools, ['toolA', 'toolB']);
});

test('classifyError extracts action from nested enforcement payload', () => {
  const err = new Error();
  err.name = 'PolicyHoldException';
  err.response = {
    data: {
      enforcement: {
        action: 'WARN'
      }
    }
  };

  const result = classifyError(err);
  assert.equal(result.enforcementAction, 'WARN');
});

test('explain formats denial string correctly', () => {
  const err = new Error('Proxy reason');
  err.name = 'PolicyBlockedException';
  err.response = {
    data: {
      enforcementAction: 'BLOCK',
      enforcement: {
        allowedTools: ['A', 'B']
      }
    }
  };

  const result = explain(err);
  assert.equal(result, 'BLOCKED | BLOCK | Proxy reason | allowed=[A, B]');
});

test('describeError extracts deep cause or nested fields', () => {
  // the current behavior we reverted our fix for:
  // describeError tries to format a readable string
  const err = new Error('Top level message');
  err.cause = { message: 'Deep cause message' };

  const result = classifyError(err);
  assert.equal(result.reason, 'Deep cause message');
});
