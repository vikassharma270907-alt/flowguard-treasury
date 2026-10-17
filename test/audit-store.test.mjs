import { test, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  calls,
  pending,
  recordCall,
  listRecentCalls,
  recordHold,
  recordApproval,
  updateHold,
  listPending,
} from '../gateway/audit-store.mjs';

mock.method(fs, 'appendFileSync', () => {});

beforeEach(() => {
  calls.length = 0;
  pending.clear();
});

test('recordCall adds items to start and respects MAX_CALLS', () => {
  for (let i = 0; i < 205; i++) {
    recordCall({ id: i });
  }

  assert.equal(calls.length, 200, 'Calls array should not exceed 200 items');
  assert.equal(calls[0].id, 204, 'Newest item should be at the start');
  assert.equal(calls[199].id, 5, 'Oldest item should be at the end');
});

test('listRecentCalls respects the limit parameter', () => {
  for (let i = 0; i < 10; i++) {
    recordCall({ id: i });
  }

  const recent3 = listRecentCalls(3);
  assert.equal(recent3.length, 3, 'Should return exactly 3 items');
  assert.equal(recent3[0].id, 9, 'Should start with newest items');
  assert.equal(recent3[2].id, 7);

  const recent50 = listRecentCalls(); // default is 50
  assert.equal(recent50.length, 10, 'Should return all items if limit is larger than length');
});

test('recordHold adds an item to the pending map', () => {
  const record = { id: 'hold-123', tool: 'myTool', args: {}, planHash: 'abc', approvals: [] };
  const result = recordHold(record);

  assert.equal(pending.size, 1);
  assert.equal(pending.get('hold-123'), record);
  assert.equal(result, record);
});

test('recordApproval updates an existing record in pending map', () => {
  const record = { id: 'hold-456', approvals: [], requiredApprovals: 1 };
  recordHold(record);

  const approval = { by: 'user1', role: 'admin' };
  const result = recordApproval('hold-456', approval);

  assert.equal(result, record);
  assert.equal(record.approvals.length, 1);
  assert.equal(record.approvals[0], approval);

  const notFound = recordApproval('missing-id', approval);
  assert.equal(notFound, null, 'Should return null for non-existent id');
});

test('updateHold applies patch to existing record', () => {
  const record = { id: 'hold-789', tool: 'myTool' };
  recordHold(record);

  const patch = { tool: 'newTool', status: 'approved' };
  const result = updateHold('hold-789', patch);

  assert.equal(result, record);
  assert.equal(record.tool, 'newTool');
  assert.equal(record.status, 'approved');

  const notFound = updateHold('missing-id', patch);
  assert.equal(notFound, null, 'Should return null for non-existent id');
});

test('listPending returns elements sorted by createdAt descending', () => {
  const record1 = { id: 'r1', createdAt: 100 };
  const record2 = { id: 'r2', createdAt: 300 };
  const record3 = { id: 'r3', createdAt: 200 };

  recordHold(record1);
  recordHold(record2);
  recordHold(record3);

  const pendingList = listPending();
  assert.equal(pendingList.length, 3);
  assert.equal(pendingList[0].id, 'r2', 'Highest createdAt should be first');
  assert.equal(pendingList[1].id, 'r3');
  assert.equal(pendingList[2].id, 'r1');
});
