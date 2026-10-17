import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, Clock, Send } from 'lucide-react';

export default function ApprovalModal({
  invoice,
  onClose,
  onExecutePayment,
  onTransitionStatus
}) {
  const [approverName, setApproverName] = useState('Sarah Chen (Finance Director)');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [fxQuote, setFxQuote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [armorIqData, setArmorIqData] = useState(null);
  const [currentStep, setCurrentStep] = useState('REVIEW'); // 'REVIEW' | 'DISPATCHED' | 'SETTLED'

  const fetchFxQuote = async () => {
    setLoadingQuote(true);
    try {
      const res = await fetch('/api/fx/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyCurrency: invoice.currency,
          sellCurrency: 'USD',
          buyAmount: invoice.amount
        })
      });
      const data = await res.json();
      if (data.quote) {
        setFxQuote(data.quote);
      }
    } catch (err) {
      console.warn('FX quote fetch error:', err);
    } finally {
      setLoadingQuote(false);
    }
  };

  // Fetch or simulate FX quote if payment is non-USD
  useEffect(() => {
    if (invoice && invoice.currency !== 'USD') {
      fetchFxQuote();
    }
  }, [invoice]);

  const handleAuthorize = async () => {
    setIsSubmitting(true);
    try {
      const res = await onExecutePayment({
        invoiceId: invoice.id,
        approverName
      });
      if (res && res.success) {
        setTransferResult(res.transferResult);
        if (res.armorIq) {
          setArmorIqData(res.armorIq);
        }
        setCurrentStep('DISPATCHED');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateSettlement = async () => {
    if (!transferResult?.transferId) return;
    setIsSubmitting(true);
    try {
      const res = await onTransitionStatus(transferResult.transferId, 'PAID');
      if (res && res.success) {
        setCurrentStep('SETTLED');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Human-in-the-Loop Payment Authorization</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Airwallex Sandbox Transfer Dispatch with UUID Idempotency Control
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentStep === 'REVIEW' && (
            <>
              {/* Obligation Summary Box */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '18px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Beneficiary Vendor:</span>
                  <strong style={{ color: 'var(--foreground)' }}>{invoice.vendor_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice Identifier:</span>
                  <span className="mono" style={{ color: '#93c5fd', fontWeight: 700 }}>{invoice.invoice_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Operational Criticality:</span>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>{invoice.operational_criticality}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Method & Corridor:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {invoice.payment_method === 'SWIFT' ? 'Cross-Border SWIFT' : 'Local Clearing (ACH/FasterPay)'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Gross Payout Amount:</span>
                  <span className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                    {invoice.currency} {invoice.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Corridor Fee & FX Quote Card */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#818cf8', fontWeight: 700, marginBottom: '8px' }}>
                  Corridor Fee & FX Quote
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Airwallex Corridor Fee:</span>
                  <span className="mono" style={{ color: invoice.payment_method === 'SWIFT' ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                    {invoice.payment_method === 'SWIFT' ? `+${invoice.corridorFee?.fee_currency} ${invoice.corridorFee?.fee_amount?.toFixed(2)} (EUR SWIFT Flat)` : 'Free ($0.00 LOCAL)'}
                  </span>
                </div>

                {invoice.currency !== 'USD' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Locked Client Rate:</span>
                    <span className="mono" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
                      {loadingQuote ? 'Fetching live quote...' : fxQuote ? `1 ${invoice.currency} = ${(1 / fxQuote.client_rate).toFixed(4)} USD` : 'Indicative market rate'}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Net Outflow (USD Eq.):</span>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                    ${invoice.totalOutflowUsd?.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Cash Reserve Verification */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle2 size={20} color="#10b981" />
                <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                  <strong>Reserve Floor Verified:</strong> Post-payment liquidity remains strictly above the protected reserve floor.
                </div>
              </div>

              {/* Approver Signature */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Approver Authorization Binding
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={e => setApproverName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </>
          )}

          {/* Post-Dispatch Screen */}
          {(currentStep === 'DISPATCHED' || currentStep === 'SETTLED') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: currentStep === 'SETTLED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <CheckCircle2 size={32} color={currentStep === 'SETTLED' ? '#10b981' : '#6366f1'} />
              </div>

              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  {currentStep === 'SETTLED' ? 'Transfer Settled in Sandbox' : 'Dispatched to Airwallex Sandbox'}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {currentStep === 'SETTLED'
                    ? 'Funds successfully settled to supplier bank account.'
                    : 'Payout created with status SENT. Advance status via simulation endpoint.'}
                </p>
              </div>

              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Transfer ID:</span>
                  <span className="mono" style={{ fontSize: '0.85rem', color: '#93c5fd' }}>{transferResult?.transferId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Idempotency UUID:</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{transferResult?.requestId}</span>
                </div>
                {armorIqData?.intentToken && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShieldCheck size={12} /> ArmorIQ Token:
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>
                        {armorIqData.intentToken.token_id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ArmorIQ Plan Hash:</span>
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {armorIqData.intentToken.plan_hash ? armorIqData.intentToken.plan_hash.substring(0, 16) + '...' : 'Verified'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ArmorIQ Policy Decision:</span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        ALLOW (INTENT VERIFIED)
                      </span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Current Status:</span>
                  <span className={`badge ${currentStep === 'SETTLED' ? 'badge-success' : 'badge-warning'}`}>
                    {currentStep === 'SETTLED' ? 'PAID' : 'SENT'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          {currentStep === 'REVIEW' && (
            <>
              <button onClick={onClose} className="btn btn-secondary btn-sm" disabled={isSubmitting}>
                Cancel
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isSubmitting}
                className="btn btn-primary btn-sm"
              >
                {isSubmitting ? 'Dispatching...' : (
                  <>
                    <Send size={14} /> Authorize & Submit Sandbox Payout
                  </>
                )}
              </button>
            </>
          )}

          {currentStep === 'DISPATCHED' && (
            <>
              <button onClick={onClose} className="btn btn-secondary btn-sm">
                Close
              </button>
              <button
                onClick={handleSimulateSettlement}
                disabled={isSubmitting}
                className="btn btn-success btn-sm"
              >
                <Clock size={14} /> Advance to PAID (Simulation Transition)
              </button>
            </>
          )}

          {currentStep === 'SETTLED' && (
            <button onClick={onClose} className="btn btn-primary btn-sm">
              Done & Return to Ledger
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
