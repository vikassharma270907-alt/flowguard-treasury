import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, ShieldCheck, DollarSign, Clock, AlertTriangle,
  Zap, Copy, Check, ExternalLink, ArrowRight, ShieldAlert, FileText, Lock
} from 'lucide-react';

export default function ArmorPayModal({
  invoice,
  onClose,
  onSettle,
  onRefreshData
}) {
  const [approverName, setApproverName] = useState('Sarah Chen (Finance Director)');
  const [paymentMethod, setPaymentMethod] = useState(invoice?.payment_method || 'LOCAL');
  const [isExpedited, setIsExpedited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionStep, setExecutionStep] = useState(0); // 0: Idle, 1: Hashing, 2: Minting, 3: Verifying, 4: Settling, 5: Complete
  const [settlementResult, setSettlementResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (invoice?.payment_method) {
      setPaymentMethod(invoice.payment_method);
    }
  }, [invoice]);

  const handleCopyReceipt = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handleAuthorizeSettlement = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setExecutionStep(1);

    try {
      // Step 1: Simulated animation timing for plan hashing
      await new Promise(r => setTimeout(r, 450));
      setExecutionStep(2);

      // Step 2: Call backend ArmorPay settle endpoint
      const settlePromise = onSettle
        ? onSettle({
            invoiceId: invoice.id || invoice.invoiceId,
            approverName,
            paymentMethod,
            expedited: isExpedited
          })
        : fetch('/api/armorpay/settle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: invoice.id || invoice.invoiceId,
              approverName,
              paymentMethod,
              expedited: isExpedited
            })
          }).then(r => r.json());

      await new Promise(r => setTimeout(r, 400));
      setExecutionStep(3);
      await new Promise(r => setTimeout(r, 400));
      setExecutionStep(4);

      const res = await settlePromise;

      if (!res.success) {
        setErrorMessage(res.message || res.error || 'ArmorPay settlement halted by policy.');
        setIsSubmitting(false);
        setExecutionStep(0);
        return;
      }

      setExecutionStep(5);
      setSettlementResult(res);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Settlement request failed.');
      setIsSubmitting(false);
      setExecutionStep(0);
    }
  };

  if (!invoice) return null;

  const isEur = invoice.currency === 'EUR';
  const isGbp = invoice.currency === 'GBP';
  const usdRate = isEur ? 1.0852 : (isGbp ? 1.2747 : 1.0);
  const totalUsdEstimated = invoice.amount * usdRate;
  const corridorFee = paymentMethod === 'SWIFT' ? (isEur ? '€12.85' : '$15.00') : '$0.00 (Local Rails)';

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94%',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.1) 100%)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              <Zap size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
                  ArmorPay Intent Settlement
                </h3>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  CRYPTOGRAPHIC AP
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: '2px 0 0 0' }}>
                Governed by ArmorIQ Ed25519 Intent Tokens & Airwallex Sandbox Rails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '6px' }}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#fca5a5',
              fontSize: '0.85rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '2px', color: '#f87171' }}>
                  Settlement Rejected by Policy
                </strong>
                {errorMessage}
              </div>
            </div>
          )}

          {/* If already completed settlement */}
          {settlementResult?.receipt ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                textAlign: 'center',
                padding: '28px 20px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px'
              }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px auto'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#34d399' }}>
                  Invoice Successfully Settled via ArmorPay!
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0 }}>
                  Cryptographic intent token verified. Payout dispatched to {invoice.vendor_name || invoice.vendorName}.
                </p>
              </div>

              {/* Cryptographic Receipt Card */}
              <div style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em' }}>
                    ArmorPay Cryptographic Receipt
                  </span>
                  <button
                    onClick={() => handleCopyReceipt(settlementResult.receipt.receiptId)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      color: 'var(--foreground)',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedReceipt ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copiedReceipt ? 'Copied' : 'Copy Receipt ID'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>Receipt ID</span>
                    <span className="mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {settlementResult.receipt.receiptId}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>Settled Amount</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                      {settlementResult.receipt.currency} {settlementResult.receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>Corridor & Rail</span>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                      {settlementResult.receipt.paymentMethod} · {settlementResult.receipt.rail}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.75rem' }}>Settlement Timestamp</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {new Date(settlementResult.receipt.settledAt).toLocaleTimeString()} · Today
                    </span>
                  </div>
                </div>

                {settlementResult.receipt.planHash && (
                  <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                      SHA-256 Plan Hash (Sealed by ArmorIQ)
                    </span>
                    <div className="mono" style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px', color: '#818cf8', wordBreak: 'break-all' }}>
                      {settlementResult.receipt.planHash}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ minWidth: '130px' }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Pre-Flight Review & Authorization Form */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Invoice Summary Card */}
              <div style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Invoice Identifier
                  </div>
                  <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                    {invoice.invoice_number || invoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    ID: {invoice.id || invoice.invoiceId}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Beneficiary Vendor
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--foreground)', marginTop: '2px' }}>
                    {invoice.vendor_name || invoice.vendorName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <ShieldCheck size={12} /> Whitelisted Master Account
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Disbursement Amount
                  </div>
                  <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '2px' }}>
                    {invoice.currency} {Number(invoice.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {invoice.currency !== 'USD' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      ≈ ${totalUsdEstimated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </div>
                  )}
                </div>
              </div>

              {/* Settlement Corridor & Parameters */}
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Settlement Rail & Corridor Config
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label
                    onClick={() => setPaymentMethod('LOCAL')}
                    style={{
                      border: `1px solid ${paymentMethod === 'LOCAL' ? '#10b981' : 'var(--border)'}`,
                      background: paymentMethod === 'LOCAL' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: paymentMethod === 'LOCAL' ? '#34d399' : 'var(--foreground)' }}>
                        Local ACH / SEPA
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399' }}>
                        $0.00 FEE
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)' }}>
                      Domestic zero-fee settlement route
                    </span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('SWIFT')}
                    style={{
                      border: `1px solid ${paymentMethod === 'SWIFT' ? '#818cf8' : 'var(--border)'}`,
                      background: paymentMethod === 'SWIFT' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '10px',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: paymentMethod === 'SWIFT' ? '#a5b4fc' : 'var(--foreground)' }}>
                        Cross-Border SWIFT
                      </span>
                      <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>
                        {isEur ? '€12.85' : '$15.00'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--muted-foreground)' }}>
                      Direct international priority rail
                    </span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '6px' }}>
                    Authorizing Officer (Bound to Intent Token)
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* 5-Step Execution Progress Bar (When Submitting) */}
              {isSubmitting && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '12px',
                  padding: '18px 20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8' }}>
                      {executionStep === 1 && '1/4 Declaring Canonical Plan & Hashing...'}
                      {executionStep === 2 && '2/4 Minting ArmorIQ Intent Token (Ed25519)...'}
                      {executionStep === 3 && '3/4 Validating Policy Boundaries on PEP Proxy...'}
                      {executionStep === 4 && '4/4 Dispatching Payout via Airwallex Sandbox...'}
                      {executionStep === 5 && '✓ Cryptographic Settlement Confirmed!'}
                    </span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                      {Math.min(executionStep * 25, 100)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(executionStep * 25, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
                      transition: 'width 0.35s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAuthorizeSettlement}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                    fontWeight: 700,
                    fontSize: '0.92rem'
                  }}
                >
                  <Zap size={16} />
                  <span>{isSubmitting ? 'Verifying with ArmorIQ...' : 'Authorize & Settle with ArmorPay'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
