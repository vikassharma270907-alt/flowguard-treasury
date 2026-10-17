import React, { useState } from 'react';
import { Sliders, CheckCircle2, Clock, AlertOctagon, ArrowRight } from 'lucide-react';

export default function PlannerScreen({
  planData,
  onRecalculateReserve,
  onSelectForApproval,
  onNavigate
}) {
  const plan = planData?.plan;
  const decisions = plan?.decisions || [];
  const currentFloor = plan?.reserveFloor || 15000;
  const [sliderVal, setSliderVal] = useState(currentFloor);

  const handleSliderChange = (e) => {
    setSliderVal(Number(e.target.value));
  };

  const handleApplyFloor = (newVal) => {
    const val = newVal !== undefined ? newVal : sliderVal;
    setSliderVal(val);
    onRecalculateReserve(val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Reserve Floor Controller Header */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sliders size={18} color="#818cf8" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Deterministic Cash Reserve Controller</h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Slide to adjust minimum cash buffer. The rules engine instantly prioritizes critical operational expenses and defers non-essential bills.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Floor:</span>
            <div className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#818cf8' }}>
              ${sliderVal.toLocaleString('en-US')}
            </div>
          </div>
        </div>

        {/* Range Slider and Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input
            type="range"
            min="5000"
            max="30000"
            step="1000"
            value={sliderVal}
            onChange={handleSliderChange}
            onMouseUp={() => handleApplyFloor()}
            onTouchEnd={() => handleApplyFloor()}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              accentColor: '#6366f1',
              cursor: 'pointer'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>$5,000 (Aggressive)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[10000, 15000, 20000, 25000].map(val => (
                <button
                  key={val}
                  onClick={() => handleApplyFloor(val)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    background: sliderVal === val ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.05)',
                    borderColor: sliderVal === val ? '#6366f1' : 'transparent',
                    fontSize: '0.75rem',
                    padding: '4px 10px'
                  }}
                >
                  ${(val / 1000)}k {val === 15000 ? '(Default)' : ''}
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>$30,000 (Conservative)</span>
          </div>
        </div>
      </div>

      {/* Decision Table */}
      <div className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Obligations & Execution Decisions</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Ranked by deterministic operational criticality, due date proximity, and native wallet liquidity.
            </p>
          </div>
          <span className="badge badge-neutral">
            {decisions.length} Active Obligations
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '12px 14px' }}>Vendor & Urgency</th>
              <th style={{ padding: '12px 14px' }}>Invoice ID</th>
              <th style={{ padding: '12px 14px' }}>Amount & Fee</th>
              <th style={{ padding: '12px 14px' }}>Recommendation</th>
              <th style={{ padding: '12px 14px' }}>Deterministic Reasoning</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map(inv => {
              const isPayNow = inv.recommendation === 'PAY_NOW';
              const isDefer = inv.recommendation === 'DEFER';
              const isBlocked = inv.recommendation === 'BLOCKED';
              const isPaid = inv.status === 'PAID';

              return (
                <tr
                  key={inv.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    background: isBlocked ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Vendor & Criticality */}
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                      {inv.vendor_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span className={`badge ${
                        inv.operational_criticality === 'CRITICAL' ? 'badge-danger' :
                        inv.operational_criticality === 'HIGH' ? 'badge-warning' : 'badge-neutral'
                      }`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {inv.operational_criticality}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Due in {inv.daysUntilDue} days ({inv.due_date})
                      </span>
                    </div>
                  </td>

                  {/* Invoice # */}
                  <td style={{ padding: '14px' }}>
                    <span className="mono" style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                      {inv.invoice_number}
                    </span>
                  </td>

                  {/* Amount & Corridor Fee */}
                  <td style={{ padding: '14px' }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {inv.currency} {inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {inv.payment_method === 'SWIFT' ? (
                        <span style={{ color: '#f59e0b' }}>SWIFT +{inv.corridorFee.fee_currency} {inv.corridorFee.fee_amount.toFixed(2)}</span>
                      ) : (
                        <span style={{ color: '#10b981' }}>LOCAL $0.00 fee</span>
                      )}
                      <span> (≈ ${inv.totalOutflowUsd.toFixed(2)} USD)</span>
                    </div>
                  </td>

                  {/* Recommendation Badge */}
                  <td style={{ padding: '14px' }}>
                    {isPaid ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> PAID
                      </span>
                    ) : isPayNow ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} /> PAY NOW
                      </span>
                    ) : isDefer ? (
                      <span className="badge badge-warning">
                        <Clock size={12} /> DEFER
                      </span>
                    ) : (
                      <span className="badge badge-danger">
                        <AlertOctagon size={12} /> BLOCKED
                      </span>
                    )}
                  </td>

                  {/* Financial Reasoning */}
                  <td style={{ padding: '14px', maxWidth: '300px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {inv.decisionReason}
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    {isPaid ? (
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Settled</span>
                    ) : isPayNow ? (
                      <button
                        onClick={() => onSelectForApproval(inv)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        Review & Pay <ArrowRight size={13} />
                      </button>
                    ) : isBlocked ? (
                      <button
                        onClick={() => onNavigate('invoices')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                      >
                        Inspect Risk
                      </button>
                    ) : (
                      <button
                        disabled
                        className="btn btn-secondary btn-sm"
                        style={{ opacity: 0.5, fontSize: '0.75rem', cursor: 'not-allowed' }}
                        title="Payment deferred to protect the configured reserve floor"
                      >
                        Deferred
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
