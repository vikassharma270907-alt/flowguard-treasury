import test from 'node:test';
import assert from 'node:assert/strict';
import auditLedgerInstance from '../server/auditLedger.js';

// The module exports an instance, so we can access the class via its constructor
const AuditLedger = auditLedgerInstance.constructor;

test('1. Initialization creates a default seed event', () => {
  const ledger = new AuditLedger();
  const events = ledger.getEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, 'SYSTEM_BOOT');
  assert.equal(events[0].action, 'Treasury Controller Initialized');
});

test('2. Recording an event adds it to the beginning of the ledger', () => {
  const ledger = new AuditLedger();
  const newEvent = ledger.record({
    eventType: 'TRANSFER',
    action: 'Funds Transfer',
    summary: 'Transfer $500',
  });

  const events = ledger.getEvents();
  assert.equal(events.length, 2);
  assert.equal(events[0].id, newEvent.id);
  assert.equal(events[0].eventType, 'TRANSFER');
  assert.equal(events[0].action, 'Funds Transfer');
  assert.equal(events[0].summary, 'Transfer $500');
  assert.equal(events[0].actor, 'System'); // Default value
  assert.equal(events[0].isAirwallexApi, false); // Default value
  assert.equal(events[0].mode, 'MOCK_ADAPTER'); // Default value
  assert.ok(events[0].id.startsWith('aud_'));
});

test('3. Ledger enforces 500 items limit', () => {
  const ledger = new AuditLedger();
  for (let i = 0; i < 510; i++) {
    ledger.record({
      eventType: 'BULK_TEST',
      action: `Action ${i}`,
      summary: `Summary ${i}`,
    });
  }

  // Note: We use an arbitrary large limit to fetch all events to assert the actual length
  const events = ledger.getEvents({ limit: 1000 });
  assert.equal(events.length, 500);
  assert.equal(events[0].action, 'Action 509'); // Newest is at the top
});

test('4. getEvents filters by eventType', () => {
  const ledger = new AuditLedger();
  ledger.record({ eventType: 'TYPE_A', action: 'A', summary: 'A' });
  ledger.record({ eventType: 'TYPE_B', action: 'B', summary: 'B' });
  ledger.record({ eventType: 'TYPE_A', action: 'A2', summary: 'A2' });

  const typeAEvents = ledger.getEvents({ eventType: 'TYPE_A' });
  assert.equal(typeAEvents.length, 2);
  assert.equal(typeAEvents[0].eventType, 'TYPE_A');
  assert.equal(typeAEvents[1].eventType, 'TYPE_A');
});

test('5. getEvents filters by search query', () => {
  const ledger = new AuditLedger();
  ledger.record({ eventType: 'TEST', action: 'Action one', summary: 'Summary' });
  ledger.record({ eventType: 'TEST', action: 'Action two', summary: 'Keyword found' });
  ledger.record({ eventType: 'TEST', action: 'Action three', summary: 'Summary', requestId: 'req_123_keyword' });

  const searchEvents = ledger.getEvents({ search: 'keyword' });
  assert.equal(searchEvents.length, 2);

  // Verify it found it in summary or requestId
  const foundInSummary = searchEvents.some(e => e.summary.includes('Keyword'));
  const foundInRequestId = searchEvents.some(e => e.requestId && e.requestId.includes('keyword'));
  assert.ok(foundInSummary);
  assert.ok(foundInRequestId);
});

test('6. getEvents limits output', () => {
  const ledger = new AuditLedger();
  for (let i = 0; i < 10; i++) {
    ledger.record({ eventType: 'LIMIT_TEST', action: 'Action', summary: 'Summary' });
  }

  const limitedEvents = ledger.getEvents({ limit: 5 });
  assert.equal(limitedEvents.length, 5);
});
