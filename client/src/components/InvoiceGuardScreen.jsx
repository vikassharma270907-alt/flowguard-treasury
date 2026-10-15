import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, FileText, Plus, Eye, X, ArrowRight, CornerDownRight } from 'lucide-react';

export default function InvoiceGuardScreen({
  invoices,
  inspections,
  onRegisterInvoice
}) {
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInvForm, setNewInvForm] = useState({
    invoice_number: 'INV-2024-884',
    vendor_id: 'ven_bavaria_01',
    vendor_name: 'Bavaria Precision Tooling GmbH',
    amount: '4250.00',
    currency: 'EUR',
    due_date: '2026-10-20',
    operational_criticality: 'HIGH',
    impact_description: 'Test synthetic invoice submission'
  });

  const inspectionList = inspections?.inspections || [];
  const flaggedCount = inspectionList.filter(i => i.isFlagged).length;
  const criticalCount = inspectionList.filter(i => i.riskLevel === 'CRITICAL_DUPLICATE').length;
  const clearedCount = inspectionList.length - flaggedCount;

  // Calculate prevented duplicate loss
  const preventedLossUsd = inspectionList
    .filter(i => i.riskLevel === 'CRITICAL_DUPLICATE')
    .reduce((sum, i) => sum + (i.amount * (i.currency === 'EUR' ? 1.085 : 1)), 0);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    onRegisterInvoice(newInvForm);
    setShowAddModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Risk Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Invoices Inspected
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
            {inspectionList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Active AP ledger corpus
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Critical Duplicates Halted
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ef4444', marginTop: '6px' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '4px' }}>
            Disbursement blocked before payout
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Duplicates Prevented Loss
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
            ${preventedLossUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Working capital saved from double-billing
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Cleared Invoices
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>
            {clearedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Passed deterministic checks
          </div>
        </div>
      </div>

      {/* Main Inspection Table */}
      <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#6366f1" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Deterministic AP Duplicate Detection Engine</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Evaluates exact identifier collisions, Levenshtein fuzzy suffixes (-A/-B), and triple-vector vendor/amount/date proximity.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} /> Register Synthetic Invoice
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>Invoice Identifier</th>
              <th style={{ padding: '12px 14px' }}>Vendor</th>
              <th style={{ padding: '12px 14px' }}>Amount</th>
              <th style={{ padding: '12px 14px' }}>Risk Assessment</th>
              <th style={{ padding: '12px 14px' }}>Triggered Rules</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Inspection</th>
            </tr>
          </thead>
          <tbody>
            {inspectionList.map(item => {
              const isCrit = item.riskLevel === 'CRITICAL_DUPLICATE';
              const isSuspect = item.riskLevel === 'SUSPECT';

              return (
                <tr
                  key={item.invoiceId}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isCrit ? 'rgba(239, 68, 68, 0.06)' : isSuspect ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '14px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: isCrit ? '#f87171' : '#93c5fd' }}>
                      {item.invoiceNumber}
                    </span>
                  </td>

                  <td style={{ padding: '14px', fontSize: '0.88rem', color: '#f8fafc' }}>
                    {item.vendorName}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span className="mono" style={{ fontWeight: 600 }}>
                      {item.currency} {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td style={{ padding: '14px' }}>
                    {isCrit ? (
                      <span className="badge badge-danger">
                        <AlertTriangle size={12} /> CRITICAL DUPLICATE
                      </span>
                    ) : isSuspect ? (
                      <span className="badge badge-warning">
                        <AlertTriangle size={12} /> SUSPECT PROXIMITY
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> CLEARED
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px', maxWidth: '320px' }}>
                    {item.flags.length > 0 ? (
                      <div style={{ fontSize: '0.78rem', color: isCrit ? '#fca5a5' : '#fde68a' }}>
                        {item.flags[0].rule}: {item.flags[0].detail}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        No collisions found in AP history
                      </span>
                    )}
                  </td>

                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    {item.isFlagged ? (
                      <button
                        onClick={() => setSelectedInspection(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', borderColor: isCrit ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)' }}
                      >
                        <Eye size={13} /> View Match
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Verified</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Side-by-Side Match Inspection Modal */}
      {selectedInspection && (
        <div className="modal-overlay" onClick={() => setSelectedInspection(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fca5a5' }}>
                  Duplicate Collision Breakdown
                </h3>
              </div>
              <button
                onClick={() => setSelectedInspection(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Comparison Box */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700 }}>
                    Target Under Review
                  </div>
                  <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>
                    {selectedInspection.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedInspection.vendorName}
                  </div>
                  <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px', color: '#f87171' }}>
                    {selectedInspection.currency} {selectedInspection.amount.toFixed(2)}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '14px' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700 }}>
                    Existing Ledger Record
                  </div>
                  <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '4px' }}>
                    {selectedInspection.matchedWith?.invoice_number || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {selectedInspection.vendorName}
                  </div>
                  <div className="mono" style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '4px', color: '#60a5fa' }}>
                    {selectedInspection.matchedWith?.currency} {selectedInspection.matchedWith?.amount?.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Rule Flags Breakdown */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-muted)' }}>
                  Triggered Deterministic Rules:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedInspection.flags.map((flag, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fca5a5' }}>
                        {flag.rule} ({flag.code})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#fecaca', marginTop: '4px' }}>
                        {flag.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Recommendation */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                  Policy Enforcement
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, marginTop: '4px' }}>
                  {selectedInspection.recommendation}
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedInspection(null)} className="btn btn-secondary btn-sm">
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Synthetic Invoice Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Register Synthetic Invoice</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Invoice Number / Reference
                </label>
                <input
                  type="text"
                  required
                  value={newInvForm.invoice_number}
                  onChange={e => setNewInvForm({ ...newInvForm, invoice_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1f2937',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)'
                  }}
                  placeholder="e.g. INV-2024-884 or INV-2024-884B"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Tip: Test "INV-2024-884B" to trigger fuzzy duplicate detection against Bavaria Precision.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newInvForm.amount}
                    onChange={e => setNewInvForm({ ...newInvForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#1f2937',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Currency
                  </label>
                  <select
                    value={newInvForm.currency}
                    onChange={e => setNewInvForm({ ...newInvForm, currency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: '#1f2937',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#ffffff'
                    }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Operational Criticality
                </label>
                <select
                  value={newInvForm.operational_criticality}
                  onChange={e => setNewInvForm({ ...newInvForm, operational_criticality: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: '#1f2937',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#ffffff'
                  }}
                >
                  <option value="CRITICAL">CRITICAL (Halts operations if unpaid)</option>
                  <option value="HIGH">HIGH (Contractual penalty risk)</option>
                  <option value="MEDIUM">MEDIUM (Standard net-30 terms)</option>
                  <option value="LOW">LOW (Discretionary buffer)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Run Deterministic Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
