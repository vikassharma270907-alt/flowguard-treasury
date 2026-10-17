import React, { useState } from 'react';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, FileText, Plus, Eye, X,
  Zap, Copy, Check, Lock, ShieldCheck
} from 'lucide-react';

export default function InvoiceGuardScreen({
  invoices,
  inspections,
  onRegisterInvoice,
  onSelectForArmorPay,
  onBatchSettleArmorPay,

}) {
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
    const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [isBatchSettling, setIsBatchSettling] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

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

  const handleTriggerBatchSettle = async () => {
    if (!onBatchSettleArmorPay) return;
    setIsBatchSettling(true);
    try {
      const res = await onBatchSettleArmorPay();
      setBatchResult(res);
      setTimeout(() => setBatchResult(null), 5000);
    } catch (err) {
      console.error('Batch settlement failed:', err);
    } finally {
      setIsBatchSettling(false);
    }
  };

  const [receiptDetails, setReceiptDetails] = useState(null);

  const handleOpenReceipt = async (receiptId) => {
    if (!receiptId) return;
    setLoadingReceipt(true);
    try {
      const res = await fetch(`/api/armorpay/receipt/${receiptId}`);
      const data = await res.json();
      if (data.receipt) {
        setReceiptDetails(data.receipt);
      } else {
        setReceiptDetails(data);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handleCopyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sandbox Notice Banner - Mandatory Rule 5 */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.82rem',
        color: 'var(--muted-foreground)'
      }}>
        <ShieldAlert size={16} color="#38bdf8" />
        <span><strong>Sandbox / test environment.</strong> No real funds or customer data. Synthetic transactions only.</span>
      </div>

      {/* ArmorPay Intent Settlement Protocol Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(56, 189, 248, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '18px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            <Zap size={13} />
            <span>ArmorPay Intent Settlement Protocol</span>
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Cryptographic Accounts Payable Execution
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
            Settle invoices with single-use Ed25519 Intent Tokens sealed by ArmorIQ. Guarantees that duplicate bills are mathematically blocked and treasury liquidity stays strictly above the $15,000 cash reserve floor.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleTriggerBatchSettle}
            disabled={isBatchSettling || clearedCount === 0}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            <Zap size={16} />
            <span>{isBatchSettling ? 'Batch Settling...' : `ArmorPay Batch Settle (${clearedCount} Cleared)`}</span>
          </button>
        </div>
      </div>

      {batchResult && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem',
          color: '#34d399'
        }}>
          <CheckCircle2 size={18} />
          <span>
            <strong>ArmorPay Batch Complete:</strong> Successfully settled {batchResult.batchSummary?.settledCount} invoices with cryptographic receipts.
          </span>
        </div>
      )}

      {/* Risk Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Invoices Inspected
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '6px' }}>
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
            Disbursement blocked by ArmorPay
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
            Cleared for ArmorPay
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>
            {clearedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Passed deterministic checks
          </div>
        </div>
      </div>

      {/* Main Inspection & Settlement Table */}
      <div className="glass-card table-cards-mobile" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#6366f1" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Deterministic AP Duplicate Detection & ArmorPay Gateway
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px', margin: 0 }}>
              Evaluates exact identifier collisions, Levenshtein fuzzy suffixes (-A/-B), and triple-vector vendor/amount/date proximity.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={14} /> Register Synthetic Invoice
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '880px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>Invoice Identifier</th>
              <th style={{ padding: '12px 14px' }}>Vendor</th>
              <th style={{ padding: '12px 14px' }}>Amount</th>
              <th style={{ padding: '12px 14px' }}>Risk Assessment</th>
              <th style={{ padding: '12px 14px' }}>Triggered Rules</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>ArmorPay Action</th>
            </tr>
          </thead>
          <tbody>
            {inspectionList.map(item => {
              const isCrit = item.riskLevel === 'CRITICAL_DUPLICATE';
              const isSuspect = item.riskLevel === 'SUSPECT';
              const matchedInv = invoices?.find(inv => inv.id === item.invoiceId || inv.invoice_number === item.invoiceNumber);
              const isSettled = item.status === 'PAID' || item.armorpay_settled || matchedInv?.status === 'PAID' || matchedInv?.armorpay_settled;
              const receiptId = item.armorpay_receipt_id || matchedInv?.armorpay_receipt_id;

              return (
                <tr
                  key={item.invoiceId}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isCrit ? 'rgba(239, 68, 68, 0.06)' : isSuspect ? 'rgba(245, 158, 11, 0.04)' : isSettled ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '14px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: isCrit ? '#f87171' : isSettled ? '#34d399' : '#93c5fd' }}>
                      {item.invoiceNumber}
                    </span>
                  </td>

                  <td style={{ padding: '14px', fontSize: '0.88rem', color: 'var(--foreground)' }}>
                    {item.vendorName}
                  </td>

                  <td style={{ padding: '14px' }}>
                    <span className="mono" style={{ fontWeight: 600 }}>
                      {item.currency} {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>

                  <td style={{ padding: '14px' }}>
                    {isSettled ? (
                      <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <ShieldCheck size={12} /> ARMORPAY SETTLED
                      </span>
                    ) : isCrit ? (
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

                  <td style={{ padding: '14px', maxWidth: '300px' }}>
                    {isSettled ? (
                      <span style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>
                        Intent cryptographic receipt issued • Disbursed
                      </span>
                    ) : item.flags.length > 0 ? (
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
                    {isSettled ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '4px 8px' }}>
                          <CheckCircle2 size={11} /> Settled
                        </span>
                        {receiptId && (
                          <button
                            onClick={() => handleOpenReceipt(receiptId)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                            title="Inspect Cryptographic Intent Receipt"
                          >
                            <FileText size={12} /> Receipt
                          </button>
                        )}
                      </div>
                    ) : isCrit ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedInspection(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                        >
                          <Eye size={13} /> View Match
                        </button>
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: '0.72rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="ArmorPay Shield halts execution to protect treasury"
                        >
                          <Lock size={11} /> Shield Blocked
                        </span>
                      </div>
                    ) : isSuspect ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedInspection(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fde68a' }}
                        >
                          <Eye size={13} /> Inspect Suspect
                        </button>
                        <button
                          onClick={() => onSelectForArmorPay && onSelectForArmorPay(matchedInv || item)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', borderColor: 'rgba(245, 158, 11, 0.6)', color: '#fbbf24', fontWeight: 600 }}
                        >
                          <Zap size={12} /> Override & Pay
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectForArmorPay && onSelectForArmorPay(matchedInv || item)}
                        className="btn btn-primary btn-sm"
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 14px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Zap size={13} /> Pay with ArmorPay
                      </button>
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
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-mono)'
                  }}
                  placeholder="e.g. INV-2024-884 or INV-2024-884B"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  Tip: Test "INV-2024-884B" to trigger fuzzy duplicate detection against Bavaria Precision.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
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
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--foreground)',
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
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--foreground)'
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
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)'
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

      {/* Cryptographic Receipt Modal */}
      {receiptDetails && (
        <div className="modal-overlay" onClick={() => setReceiptDetails(null)} style={{ zIndex: 1200 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={22} color="#10b981" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    Cryptographic ArmorPay Receipt
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Intent Protocol Settlement Audit Record
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReceiptDetails(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Receipt ID Bar */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Receipt Hash ID
                  </div>
                  <div className="mono" style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700 }}>
                    {receiptDetails.receiptId}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyText(receiptDetails.receiptId)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedReceipt ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedReceipt ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Status and Timestamp */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                gap: '12px'
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginTop: '4px' }}>
                    {receiptDetails.status || 'CRYPTOGRAPHICALLY_VERIFIED'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Settled At</div>
                  <div className="mono" style={{ fontSize: '0.78rem', color: 'var(--foreground)', marginTop: '4px' }}>
                    {receiptDetails.settledAt ? new Date(receiptDetails.settledAt).toLocaleString() : 'Just now'}
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Corridor Rails</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#a78bfa', marginTop: '4px' }}>
                    {receiptDetails.corridor || 'Airwallex Local Rails'}
                  </div>
                </div>
              </div>

              {/* Cryptographic Merkle Step Proof */}
              {receiptDetails.cryptographicProof && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.06)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} />
                    <span>ArmorIQ Intent-Plan Merkle Attestation</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Merkle Step Hash:</span>
                      <span className="mono" style={{ color: '#c7d2fe' }}>
                        {receiptDetails.cryptographicProof.stepProofHash?.slice(0, 24)}...
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Reserve Threshold Floor:</span>
                      <span className="mono" style={{ color: '#34d399' }}>$15,000.00 USD</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-dim)' }}>Pre-Flight Collision Scan:</span>
                      <span className="mono" style={{ color: '#34d399' }}>ZERO DUPLICATES DETECTED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rails Reference */}
              {receiptDetails.railsExecution && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>Airwallex Sandbox Transfer ID</div>
                  <div className="mono" style={{ color: '#38bdf8', fontWeight: 600 }}>
                    {receiptDetails.railsExecution.transferId}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setReceiptDetails(null)} className="btn btn-secondary btn-sm">
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
