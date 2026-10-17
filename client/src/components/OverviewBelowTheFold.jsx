import React, { useState, Suspense, lazy } from 'react';
import {
  Wallet, ShieldCheck, ArrowDownLeft,
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, PhoneCall,
  ArrowRight, Shield, Box, Sparkles, Play
} from 'lucide-react';
import Lazy3DContainer from './3d/Lazy3DContainer';
const RotatingHeroVault = lazy(() => import('./3d/RotatingHeroVault'));

export default function OverviewBelowTheFold({
  systemStatus,
  onNavigate,
  onSimulateDeposit,
  plan,
  totalLiquid,
  reserveFloor,
  approvedOutflow,
  deferredOutflow,
  freeBuffer
}) {
  const [show3dHero, setShow3dHero] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Architecture & Governance Cards */}
      <div className="cv-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
        {/* Card 1: AI Agent */}
        <div style={{ background: 'var(--muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>1. AI Agent Framework</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-allowed-bg)', border: '1px solid var(--verdict-allowed-border)', color: 'var(--verdict-allowed-text)' }}>VERIFIED</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
            <strong>ElevenLabs Voice Support Agent</strong> & Google ADK Treasury Controller.
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Handles conversational caller requests, tool parameter extraction, and &lt;5s timeout-safe holding utterances.
          </div>
        </div>

        {/* Card 2: MCP Server */}
        <div style={{ background: 'var(--muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>2. Active MCP Server</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-allowed-bg)', border: '1px solid var(--verdict-allowed-border)', color: 'var(--verdict-allowed-text)' }}>VERIFIED</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
            <code style={{ color: 'var(--step-indigo-text)' }}>flowguard-treasury-mcp</code> (Spec 2024-11-05)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            5 governed tools exposed via JSON-RPC 2.0 at <code style={{ color: 'var(--step-sky-text)' }}>/mcp</code> & CLI stdio (<code style={{ color: 'var(--muted-foreground)' }}>npm run mcp</code>).
          </div>
        </div>

        {/* Card 3: Action ALLOWED */}
        <div style={{ background: 'var(--verdict-allowed-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--verdict-allowed-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--verdict-allowed-text)' }}>3A. Action ALLOWED</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-allowed-bg)', border: '1px solid var(--verdict-allowed-border)', color: 'var(--verdict-allowed-text)' }}>ALLOWED</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
            Tool: <code style={{ color: 'var(--verdict-allowed-text)' }}>lookup_order</code>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Read-only inquiry allowed by ArmorIQ at call time; the tool executes with the intent token issued for the call.
          </div>
        </div>

        {/* Card 4: Action BLOCKED */}
        <div style={{ background: 'var(--verdict-blocked-bg)', padding: '14px', borderRadius: '8px', border: '1px solid var(--verdict-blocked-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--verdict-blocked-text)' }}>3B. Action BLOCKED</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-blocked-bg)', border: '1px solid var(--verdict-blocked-border)', color: 'var(--verdict-blocked-text)' }}>BLOCKED</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
            Tool: <code style={{ color: 'var(--verdict-blocked-text)' }}>change_payout</code>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
            Unverified bank diversion halted by ArmorIQ policy. Supervisor presses <strong>DENY</strong> & agent rejects execution.
          </div>
        </div>
      </div>

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

      {/* 4 Reproducible Demo Scenarios (2x2 Balanced Grid on Desktop) */}
      <section className="cv-auto" style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <span className="pulse-dot green"></span>
              Interactive Hackathon Scenarios
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--foreground)', margin: 0 }}>
              🕹️ Reproducible Demo Scenarios (Scenario A, B, C, D)
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Select any hackathon scenario preset to test real multi-currency balance dynamics, duplicate invoice attacks, delayed customer receivables, and sandbox deposits.
            </p>
          </div>
          <button
            onClick={() => onNavigate('scenarios')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>Open Dedicated Scenarios Page</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '18px' }}>
          {[
            {
              id: 'SCENARIO_A',
              code: 'Scenario A',
              title: 'Baseline Multi-Currency Run',
              desc: '$33,110 cash across 4 wallets, $15,000 reserve floor, 5 supplier bills. Normal operations preserved.',
              badge: 'NORMAL OPS',
              color: 'var(--verdict-allowed-text)',
              actionLabel: 'View in Planner',
              targetView: 'planner'
            },
            {
              id: 'SCENARIO_B',
              code: 'Scenario B',
              title: 'Duplicate Invoice Attack',
              desc: 'Injects invoice INV-2024-884B (€4,250) with 91.2% similarity. Caught by duplicate shield & blocked.',
              badge: 'ATTACK SIM',
              color: 'var(--verdict-blocked-text)',
              actionLabel: 'Inspect Risk Guard',
              targetView: 'invoices'
            },
            {
              id: 'SCENARIO_C',
              code: 'Scenario C',
              title: 'Delayed Receivable Shock',
              desc: '$14,500 customer receipt delayed by 14 days. Rules engine defers low-priority bills to protect floor.',
              badge: 'STRESS SHOCK',
              color: 'var(--verdict-held-text)',
              actionLabel: 'View Deferred Bills',
              targetView: 'planner'
            },
            {
              id: 'SCENARIO_D',
              code: 'Scenario D',
              title: 'Sandbox Deposit (+ $25,000)',
              desc: 'Calls Airwallex sandbox deposit to inject +$25,000 USD, unlocking held obligations automatically.',
              badge: 'REPLENISHMENT',
              color: 'var(--step-sky-text)',
              actionLabel: 'View Audit Ledger',
              targetView: 'audit'
            }
          ].map((item, idx) => {
            const isCurrent = systemStatus?.activeScenario === item.id;
            return (
              <div
                key={idx}
                style={{
                  background: isCurrent ? `${item.color}10` : 'var(--secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: isCurrent ? `2px solid ${item.color}` : '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: item.color }}>
                        {item.code}
                      </span>
                      {isCurrent && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-allowed-bg)', border: '1px solid var(--verdict-allowed-border)', color: 'var(--verdict-allowed-text)' }}>
                          Active Now
                        </span>
                      )}
                    </div>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                      {item.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '6px' }}>
                    {item.title}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <button
                    onClick={() => onNavigate('scenarios')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                  >
                    <span>Launch & Run</span>
                    <Play size={12} style={{ marginLeft: '4px' }} />
                  </button>
                  <button
                    onClick={() => onNavigate(item.targetView)}
                    className="btn btn-sm"
                    style={{ background: 'transparent', border: 'none', color: item.color, fontSize: '0.76rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ElevenLabs Voice Agent Feature Spotlight Banner */}
      <div className="cv-auto" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        padding: '16px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          }}>
            <PhoneCall size={20} color="var(--success)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--foreground)' }}>
                ElevenLabs Voice Agent Gateway & Supervisor Playground
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--badge-nav-bg)', border: '1px solid var(--badge-nav-border)', color: 'var(--step-indigo-text)' }}>NEW FEATURE</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
              Real-time voice support agent with ArmorIQ-signed plans, &lt;5s timeout protection, and interactive supervisor approval quorum.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('voice')}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <span>Launch Voice Playground</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Interactive 3D Hero Vault Showcase */}
      <div className="glass-card cv-auto" style={{
        padding: 'clamp(16px, 3vw, 24px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
        gap: '24px',
        alignItems: 'center',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--badge-nav-bg)', border: '1px solid var(--badge-nav-border)', color: 'var(--step-indigo-text)' }}>
              <Box size={11} />
              THREE.JS 3D CRYPTOGRAPHIC MODEL
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'var(--verdict-allowed-bg)', border: '1px solid var(--verdict-allowed-border)', color: 'var(--verdict-allowed-text)' }}>60 FPS ACCELERATED</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            BeyondFlow & ArmorIQ Intent Vault 3D
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '16px' }}>
            Interactive spatial representation of the cryptographic treasury boundary. Every tool request executes within an isolated plan enclave validated against stored OPA security policies before token minting.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => onNavigate('enclave')}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={13} />
              <span>Explore All 3D Enclaves</span>
            </button>
            <button
              onClick={() => onNavigate('voice')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Shield size={13} color="var(--success)" />
              <span>Test Voice Agent Governance</span>
            </button>
          </div>
        </div>

        <div style={{
          height: '240px',
          background: 'var(--background)',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {show3dHero ? (
            <Lazy3DContainer height={235} fallbackTitle="BeyondFlow Intent Vault" fallbackDescription="3D Cryptographic Enclave fallback. Full security logic remains operational.">
              <Suspense fallback={
                <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                  Loading 3D Hero Vault...
                </div>
              }>
                <RotatingHeroVault height={235} interactive={true} />
              </Suspense>
            </Lazy3DContainer>
          ) : (
            <button
              type="button"
              onClick={() => setShow3dHero(true)}
              aria-label="Click to launch interactive 3D intent vault"
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                border: 'none',
                background: 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.14), rgba(99, 102, 241, 0.10) 42%, transparent 72%)',
                color: 'inherit',
                font: 'inherit',
                padding: '16px'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 10px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(99, 102, 241, 0.55)',
                  boxShadow: 'inset 0 0 28px rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Box size={28} />
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>
                  Interactive 3D Intent Vault
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                  Click to launch WebGL 3D model
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="cv-auto" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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
      <div className="glass-card cv-auto" style={{ padding: '24px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px' }}>
          {(plan?.balanceBreakdown || []).map(b => (
            <div
              key={b.currency}
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--step-sky-text)' }}>
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
      <div className="glass-card cv-auto" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>
          Liquidity Allocation & Reserve Floor Protection
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '18px' }}>
          Deterministic boundary: BeyondFlow guarantees the ${reserveFloor.toLocaleString()} reserve floor remains inviolable.
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
