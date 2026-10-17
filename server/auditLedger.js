/**
 * BeyondFlow - Append-Only Immutable Financial Audit Ledger
 * Records every policy decision, risk check, API interaction, and status transition.
 */

const { randomUUID: uuidv4 } = require('crypto');

class AuditLedger {
  constructor() {
    this.events = [];
    this.initDefaultSeedEvents();
  }

  initDefaultSeedEvents() {
    this.record({
      eventType: 'SYSTEM_BOOT',
      action: 'Treasury Controller Initialized',
      actor: 'BeyondFlow Core Engine',
      summary: 'Deterministic rules engine loaded with default $15,000.00 cash reserve floor.',
      payload: { reserveFloor: 15000, activeCorridors: ['US_LOCAL', 'GB_LOCAL', 'DE_SWIFT'] }
    });
  }

  record({
    eventType,
    action,
    actor = 'System',
    requestId = null,
    endpoint = null,
    httpStatus = null,
    latencyMs = null,
    summary,
    payload = null,
    isAirwallexApi = false,
    mode = 'MOCK_ADAPTER'
  }) {
    const entry = {
      id: 'aud_' + uuidv4().substring(0, 8),
      timestamp: new Date().toISOString(),
      eventType,
      action,
      actor,
      requestId: requestId || uuidv4(),
      endpoint,
      httpStatus,
      latencyMs,
      summary,
      payload,
      isAirwallexApi,
      mode
    };

    this.events.unshift(entry); // newest first
    // Limit ledger in-memory to 500 items
    if (this.events.length > 500) {
      this.events.pop();
    }
    return entry;
  }

  getEvents({ limit = 50, eventType = null, search = null } = {}) {
    let filtered = [...this.events];
    if (eventType) {
      filtered = filtered.filter(e => e.eventType === eventType);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        (e.requestId && e.requestId.toLowerCase().includes(q))
      );
    }
    return filtered.slice(0, limit);
  }

  clear() {
    this.events = [];
    this.initDefaultSeedEvents();
  }
}

const auditLedger = new AuditLedger();
module.exports = auditLedger;
