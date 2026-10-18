import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, X, Code, ShieldAlert } from 'lucide-react';

export default function AuditLedgerScreen() {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = '/api/audit-logs?limit=100';
      if (filterType !== 'ALL') url += `&eventType=${filterType}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.events || []);
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Universal Sandbox Disclaimer */}
      <div className="sandbox-disclaimer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: 'var(--step-amber-text, #f59e0b)', fontSize: '0.82rem' }}>
        <ShieldAlert size={16} />
        <span><strong>Sandbox / test environment.</strong> No real funds or customer data. Synthetic audit ledger events only.</span>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'SANDBOX_API_REQUEST', label: 'Airwallex API' },
              { id: 'DUPLICATE_CHECK', label: 'Duplicate Checks' },
              { id: 'POLICY_EVALUATION', label: 'Reserve Engine' },
              { id: 'SANDBOX_TRANSFER_DISPATCH', label: 'Payouts' },
              { id: 'SIMULATION_EVENT', label: 'Simulations' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className="btn btn-secondary btn-sm"
                style={{
                  background: filterType === f.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.04)',
                  borderColor: filterType === f.id ? '#6366f1' : 'transparent',
                  fontSize: '0.78rem'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search action, UUID, endpoint..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  fontSize: '0.82rem',
                  width: 'min(240px, calc(100vw - 120px))'
                }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm" disabled={isLoading}>
              <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
            </button>
          </form>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card table-cards-mobile" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Searchable Financial Audit Trail</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Append-only record of every policy evaluation, risk inspection, and Airwallex sandbox request.
            </p>
          </div>
          <span className="badge badge-neutral">{logs.length} Logged Entries</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>Timestamp</th>
              <th style={{ padding: '12px 14px' }}>Event / Action</th>
              <th style={{ padding: '12px 14px' }}>Actor</th>
              <th style={{ padding: '12px 14px' }}>Request ID (UUID)</th>
              <th style={{ padding: '12px 14px' }}>Latency</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr
                key={log.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  fontSize: '0.82rem'
                }}
              >
                <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>

                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>{log.action}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {log.summary}
                  </div>
                </td>

                <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                  {log.actor}
                </td>

                <td style={{ padding: '12px 14px' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                    {log.requestId ? log.requestId.substring(0, 8) + '...' : '—'}
                  </span>
                </td>

                <td style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>
                  {log.latencyMs !== null ? `${log.latencyMs}ms` : '—'}
                </td>

                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {log.payload ? (
                    <button
                      onClick={() => setSelectedEvent(log)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* JSON Payload Inspector Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Audit Event Payload ({selectedEvent.id})
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', background: 'var(--surface-muted)' }}>
              <pre className="mono" style={{ fontSize: '0.78rem', color: 'var(--foreground)', overflowX: 'auto', maxHeight: '350px' }}>
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvent(null)} className="btn btn-secondary btn-sm">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
