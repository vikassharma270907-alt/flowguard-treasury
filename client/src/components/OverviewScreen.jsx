import React from 'react';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownLeft, Clock, AlertTriangle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

export default function OverviewScreen({
  planData,
  balances,
  systemStatus,
  onNavigate,
  onSimulateDeposit
}) {
  const plan = planData?.plan;
  const totalLiquid = plan?.totalLiquidUsd || 0;
  const reserveFloor = plan?.reserveFloor || 15000;
  const approvedOutflow = plan?.forecastRunway?.approvedOutflowsUsd || 0;
  const deferredOutflow = plan?.forecastRunway?.deferredOutflowsUsd || 0;
  const freeBuffer = Math.max(0, totalLiquid - reserveFloor);
  const bufferPercent = Math.min(100, Math.round((reserveFloor / (totalLiquid || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Alert depending on active scenario */}
      {systemStatus?.activeScenario === 'SCENARIO_B' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '14px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} color="#ef4444" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fca5a5' }}>
                Scenario B Active: Duplicate Invoice Injected (INV-2024-884B)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#fecaca' }}>
                Deterministic duplicate detector flagged a near-variation match with Bavaria Precision Tooling. Payment halted.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('invoices')}
            className="btn btn-sm btn-danger"
          >
            Inspect Duplicate Warning
          </button>
        </div>
      )}

      {systemStatus?.activeScenario === 'SCENARIO_C' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '14px 20px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={22} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fde68a' }}>
                Scenario C Active: Customer Receivable Delayed ($14,500 Inbound Postponed)
              </div>
              <div style={{ fontSize: '0.82rem', color: '#fef3c7' }}>
                Treasury rules engine automatically deferred non-critical obligations to safeguard the $15,000 reserve floor.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('planner')}
            className="btn btn-sm btn-secondary"
            style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            View Re-Balanced Plan
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {/* KPI 1: Total Net Liquid Cash */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Total Liquid Cash (USD Base)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={16} color="#818cf8" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff' }}>
            ${totalLiquid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Across 4 multi-currency sandbox wallets
          </div>
        </div>

        {/* KPI 2: Protected Cash Reserve Floor */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Protected Reserve Floor
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#818cf8" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#818cf8' }}>
            ${reserveFloor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> Strict policy floor enforced by rules engine
          </div>
        </div>

        {/* KPI 3: Free Discretionary Buffer */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Available Liquidity Buffer
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} color="#34d399" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399' }}>
            ${freeBuffer.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Funds clear for immediate supplier disbursement
          </div>
        </div>

        {/* KPI 4: Inbound Receivables (Simulation) */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Expected Inbound Receivables
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={16} color="#22d3ee" />
            </div>
          </div>
          <div className="mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#22d3ee' }}>
            ${(plan?.forecastRunway?.incomingReceivablesUsd || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            2 customer receipts tracked on ledger
          </div>
        </div>
      </div>

      {/* Multi-Currency Sandbox Wallets */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Airwallex Sandbox Multi-Currency Wallets</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Balances in major units. Native currency settlement avoids cross-currency conversion spreads.
            </p>
          </div>
          <button
            onClick={() => onSimulateDeposit(25000, 'USD')}
            className="btn btn-secondary btn-sm"
            style={{ border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399' }}
          >
            <DollarSign size={14} /> + Simulate $25k Deposit (POST /simulation/deposit/create)
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {(plan?.balanceBreakdown || []).map(b => (
            <div
              key={b.currency}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#93c5fd' }}>
                  {b.currency} Wallet
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  {b.currency === 'USD' ? 'ACH/Fedwire' : b.currency === 'EUR' ? 'SEPA / SWIFT' : b.currency === 'GBP' ? 'Faster Pay' : 'Local'}
                </span>
              </div>
              <div className="mono" style={{ fontSize: '1.45rem', fontWeight: 700 }}>
                {b.currency === 'USD' ? '$' : b.currency === 'EUR' ? '€' : b.currency === 'GBP' ? '£' : 'A$'}
                {b.available_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                ≈ ${b.usd_equivalent.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity Runway Gauge */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
          Liquidity Allocation & Reserve Floor Protection
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
          Deterministic boundary: FlowGuard guarantees the ${reserveFloor.toLocaleString()} reserve floor remains inviolable.
        </p>

        {/* Visual Bar */}
        <div style={{
          width: '100%',
          height: '24px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: '14px'
        }}>
          {/* Reserve Floor segment */}
          <div
            style={{
              width: `${Math.min(100, (reserveFloor / totalLiquid) * 100)}%`,
              background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
              height: '100%'
            }}
            title={`Protected Floor: $${reserveFloor}`}
          />
          {/* Approved Outflow segment */}
          <div
            style={{
              width: `${Math.min(100 - (reserveFloor / totalLiquid) * 100, (approvedOutflow / totalLiquid) * 100)}%`,
              background: 'linear-gradient(90deg, #10b981, #059669)',
              height: '100%'
            }}
            title={`Approved Outflows: $${approvedOutflow.toFixed(2)}`}
          />
          {/* Remaining buffer */}
          <div
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              height: '100%'
            }}
            title="Unallocated Free Buffer"
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#6366f1' }}></span>
            <span>Protected Floor: <strong>${reserveFloor.toLocaleString()}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }}></span>
            <span>Approved Immediate Payments: <strong>${approvedOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#f59e0b' }}></span>
            <span>Deferred to Safeguard Floor: <strong>${deferredOutflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
