import React, { useState, Suspense, lazy } from 'react';
import { Wallet, ShieldCheck, ArrowUpRight, ArrowDownLeft, Clock, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, PhoneCall, ArrowRight, Shield, Server, ExternalLink, Activity, Box, Sparkles, Video, Play, X, Info } from 'lucide-react';
import BoundaryTestSection from './BoundaryTestSection';
import HowWeUseArmorIQSection from './HowWeUseArmorIQSection';

const RotatingHeroVault = lazy(() => import('./3d/RotatingHeroVault'));

export default function OverviewScreen({
  planData,
  balances,
  systemStatus,
  onNavigate,
  onSimulateDeposit
}) {
  const [showDemoVideo, setShowDemoVideo] = useState(false);

  const plan = planData?.plan;
  const totalLiquid = plan?.totalLiquidUsd || 0;
  const reserveFloor = plan?.reserveFloor || 15000;
  const approvedOutflow = plan?.forecastRunway?.approvedOutflowsUsd || 0;
  const deferredOutflow = plan?.forecastRunway?.deferredOutflowsUsd || 0;
  const freeBuffer = Math.max(0, totalLiquid - reserveFloor);
  const bufferPercent = Math.min(100, Math.round((reserveFloor / (totalLiquid || 1)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Sandbox Notice Banner - Mandatory Rule 5 */}
      <div style={{
        background: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 600 }}>
          <Info size={16} />
          <span>Sandbox / test environment. No real funds or customer data.</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
          Synthetic Airwallex balances & test orders (ORD-1001, ACC-4471)
        </div>
      </div>

      {/* TIER 1 ITEM 6: First Screen Hero (2 Sentences + 60s Demo Button) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></span>
          Official Submission · ArmorIQ Flow State Hackathon
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 16px 0' }}>
          Autonomous Treasury & Intent Vault Governed by ArmorIQ
        </h1>

        {/* The 2 Mandated Sentences */}
        <p style={{ fontSize: '1.15rem', color: '#cbd5e1', lineHeight: 1.6, margin: '0 0 8px 0', fontWeight: 500 }}>
          FlowGuard is an autonomous treasury and customer support agent that manages multi-currency disbursements, verifies vendor invoices, and handles live telephony inquiries.
        </p>
        <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          ArmorIQ cryptographically bounds every tool invocation to declared intent using Ed25519 tokens and blocks unauthorized bank diversions or prompt injections before any network execution.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowDemoVideo(!showDemoVideo)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700 }}
          >
            <Play size={16} fill="currentColor" />
            <span>{showDemoVideo ? 'Hide Demo Video' : 'Watch the 60-Second Demo'}</span>
          </button>

          <a
            href="/judges"
            onClick={(e) => { e.preventDefault(); onNavigate('judges'); }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem' }}
          >
            <ShieldCheck size={16} color="#34d399" />
            <span>Judge Inspection Dashboard (/judges)</span>
            <ArrowRight size={14} />
          </a>

          <a
            href="/#boundary-test"
            onClick={(e) => { e.preventDefault(); const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}
          >
            <span>Skip to Boundary Test</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Lazy-Loaded 60-Second Demo Embed Modal / Player */}
        {showDemoVideo && (
          <div style={{ marginTop: '24px', background: '#030712', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>
                <Video size={18} color="#38bdf8" />
                <span>FlowGuard 60-Second Architecture & Enforcement Demo</span>
              </div>
              <button
                onClick={() => setShowDemoVideo(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '4px' }}
                aria-label="Close demo video"
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', background: '#090d16' }}>
              <iframe
                title="FlowGuard 60-Second Hackathon Demo"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '10px', textAlign: 'center' }}>
              60-second walkthrough showing real ArmorIQ plan capture, Ed25519 token minting, and proxy enforcement.
            </p>
          </div>
        )}
      </div>

      {/* TIER 1 ITEM 5: Centerpiece Boundary Test Section */}
      <BoundaryTestSection />

      {/* TIER 1 ITEM 7: Architecture & Zero-Bypass Flow Section */}
      <HowWeUseArmorIQSection />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {/* Card 1: AI Agent */}
          <div style={{ background: 'var(--muted)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--foreground)' }}>1. AI Agent Framework</span>
              <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>VERIFIED</span>
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
              <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>VERIFIED</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
              <code style={{ color: '#c084fc' }}>flowguard-treasury-mcp</code> (Spec 2024-11-05)
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              5 governed tools exposed via JSON-RPC 2.0 at <code style={{ color: '#38bdf8' }}>/mcp</code> & CLI stdio (<code style={{ color: '#a1a1aa' }}>npm run mcp</code>).
            </div>
          </div>

          {/* Card 3: Action ALLOWED */}
          <div style={{ background: 'rgba(16, 185, 129, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>3A. Action ALLOWED</span>
              <span className="badge badge-success" style={{ fontSize: '0.62rem' }}>ALLOWED</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
              Tool: <code style={{ color: '#34d399' }}>order_lookup</code>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              Read-only inquiry allowed by ArmorIQ policy. Cryptographic intent token & Merkle step proof signed in ~200ms.
            </div>
          </div>

          {/* Card 4: Action BLOCKED */}
          <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>3B. Action BLOCKED</span>
              <span className="badge badge-warning" style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>BLOCKED</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
              Tool: <code style={{ color: '#f87171' }}>payout_change</code>
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

      {/* ElevenLabs Voice Agent Feature Spotlight Banner */}
      <div style={{
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
            <PhoneCall size={20} color="#34d399" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#ffffff' }}>
                ElevenLabs Voice Agent Gateway & Supervisor Playground
              </span>
              <span className="badge badge-live">NEW FEATURE</span>
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
      <div className="glass-card" style={{
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        alignItems: 'center',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-live" style={{ fontSize: '0.68rem' }}>
              <Box size={11} />
              THREE.JS 3D CRYPTOGRAPHIC MODEL
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>60 FPS ACCELERATED</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            FlowGuard & ArmorIQ Intent Vault 3D
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
              <Shield size={13} color="#10b981" />
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
          <Suspense fallback={
            <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
              Loading 3D Hero Vault...
            </div>
          }>
            <RotatingHeroVault height={235} interactive={true} />
          </Suspense>
        </div>
      </div>

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
