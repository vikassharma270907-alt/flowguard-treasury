import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  Wallet, ShieldCheck, ArrowUpRight, ArrowDownLeft, Clock,
  AlertTriangle, CheckCircle2, TrendingUp, DollarSign, PhoneCall,
  ArrowRight, Shield, Server, ExternalLink, Activity, Box,
  Sparkles, Video, Play, X, Info, ChevronRight, ChevronLeft,
  Check, Terminal, Lock, Cpu
} from 'lucide-react';
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
  const [explainerStep, setExplainerStep] = useState(0);
  // The 3D hero is a heavy WebGL scene. Mount it only after the first user
  // interaction so it never blocks first paint or the initial main-thread
  // budget; a static placeholder holds the space until then.
  const [show3dHero, setShow3dHero] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const activate = () => setShow3dHero(true);
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, activate, { once: true, passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, activate));
    };
  }, []);

  const walkthroughSteps = [
    {
      time: "00s - 15s",
      badge: "Plan Capture & Hashing",
      badgeColor: "#38bdf8",
      title: "1. Intent Plan Capture & SHA-256 Merkle Hashing",
      headline: "The agent formally declares its goal and tool parameters before execution begins.",
      explanation: "When an operator or voice caller triggers an operation (e.g. checking order status, changing payout destination, or issuing a refund), BeyondFlow intercepts the intent. The client invokes client.capturePlan(agentId, goal, plan). The plan binds every step, target MCP server, and parameter. BeyondFlow computes a SHA-256 Merkle hash that binds every step of the plan.",
      keyPoints: [
        "Prevents prompt injection, tool poisoning, and agent drift at the source",
        "Deterministic Plan Hash: b3e6889fe267adb6c3a64790176...",
        "Zero tool access or banking API execution permitted prior to validation"
      ],
      codeSnippet: "// 1. Declare intent & capture deterministic plan\nconst capture = client.capturePlan(\n  'flowguard-agent',\n  'Check order status ORD-1001',\n  {\n    goal: 'Check order status ORD-1001',\n    steps: [{\n      action: 'lookup_order',\n      mcp: 'flowguard-treasury-mcp',\n      params: { order_id: 'ORD-1001' }\n    }]\n  }\n);"
    },
    {
      time: "15s - 30s",
      badge: "Cryptographic Authorization",
      badgeColor: "#818cf8",
      title: "2. Ed25519 Intent Token Minting at iap.armoriq.ai",
      headline: "ArmorIQ verifies policy permissions and issues a single-use authorization token.",
      explanation: "BeyondFlow submits the captured plan to ArmorIQ's Identity & Policy Assertion (IAP) service at https://iap.armoriq.ai. ArmorIQ evaluates the registered agent identity (flowguard-agent), user permissions, and the active workspace policy (flowguard-treasury-allowlist). If approved, ArmorIQ mints an Ed25519 cryptographically signed Intent Token containing the plan hash and step Merkle root.",
      keyPoints: [
        "Real platform token ID: 4f53c348a1104f1cbfb463fbad0ee1b1",
        "Asymmetrically signed by ArmorIQ private key; verifiable by public key",
        "Strict TTL expiration (e.g. 3600s) preventing replay attacks"
      ],
      codeSnippet: "// 2. Request Ed25519 token from ArmorIQ IAP\nconst token = await client.getIntentToken(capture);\n// Output from real run:\n// token.id = \"4f53c348a1104f1cbfb463fbad0ee1b1\"\n// token.plan_hash = \"b3e6889fe267adb6c3a64790176...\"\n// token.expires = 3600 (seconds)"
    },
    {
      time: "30s - 45s",
      badge: "Inline PEP Interception",
      badgeColor: "#34d399",
      title: "3. Deterministic PEP Enforcement at proxy.armoriq.ai",
      headline: "Every tool call passes through ArmorIQ's Policy Enforcement Point.",
      explanation: "Tool invocations never communicate with the banking MCP server directly. Instead, client.invoke() routes every call through proxy.armoriq.ai. The proxy verifies the Ed25519 token, validates step compliance against the plan hash, and applies the policy. Safe inquiries (lookup_order) pass with 200 OK. Unauthorized wire changes (change_payout) are blocked immediately with PolicyBlockedException. Large disbursements (issue_refund) are held with PolicyHoldException.",
      keyPoints: [
        "ALLOWED: lookup_order executed in ~1911ms total verification latency",
        "BLOCKED: change_payout blocked in 685ms with tool_not_in_allowlist",
        "HELD: issue_refund halted in 594ms requiring 2 supervisor approvals"
      ],
      codeSnippet: "// 3. PEP enforces policy on tool call\ntry {\n  const res = await client.invoke(\n    token.id, 'flowguard-treasury-mcp',\n    'change_payout', { new_routing: '021000021' }\n  );\n} catch (err) {\n  // Throws PolicyBlockedException: tool_not_in_allowlist\n  // Wire diversion rejected; $0.00 lost!\n}"
    },
    {
      time: "45s - 60s",
      badge: "Quorum & Audit Ledger",
      badgeColor: "#f59e0b",
      title: "4. Multi-Supervisor Quorum & Tamper-Evident Ledger",
      headline: "Dual-sign-off for high-value funds and tamper-evident Merkle auditing.",
      explanation: "When an action is held, ArmorIQ returns a delegationId (e.g. 65b502cb-6cb0-4e50-b392-934c6dba5bd7). In the BeyondFlow Supervisor Playground, designated treasury officers perform step-up authentication. When the 2-approval threshold is satisfied, the action executes against the Airwallex sandbox adapter, and every event is sealed into the cryptographic audit trail.",
      keyPoints: [
        "Auth-gated: MCP tools reject unauthenticated requests without ArmorIQ token",
        "Dual authorization: Multi-signature approval quorum for high-risk payouts",
        "Audit ledger: searchable log with SHA-256 Merkle proofs"
      ],
      codeSnippet: "// 4. Resolve delegation with dual quorum\nconst delegation = await client.createDelegationRequest({\n  delegationId: '65b502cb-6cb0-4e50-b392-934c6dba5bd7',\n  requiredApprovals: 2,\n  receivedApprovals: 2\n});\n// Executed in sandbox with cryptographic audit log entry"
    }
  ];

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
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 32px)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
          Official Submission · ArmorIQ Flow State Hackathon
        </div>

        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em', lineHeight: 1.2, margin: '0 0 16px 0' }}>
          Autonomous Treasury & Intent Vault Governed by ArmorIQ
        </h1>

        {/* The 2 Mandated Sentences */}
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: 'var(--foreground)', lineHeight: 1.6, margin: '0 0 8px 0', fontWeight: 500 }}>
          BeyondFlow is an autonomous treasury and customer support agent that manages multi-currency disbursements, verifies vendor invoices, and handles live telephony inquiries.
        </p>
        <p style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          ArmorIQ cryptographically bounds every tool invocation to declared intent using Ed25519 tokens and blocks unauthorized bank diversions or prompt injections before any network execution.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowDemoVideo(!showDemoVideo)}
            className="btn btn-primary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', minHeight: '44px', fontSize: '0.9rem', fontWeight: 700 }}
          >
            <Play size={16} fill="currentColor" />
            <span>{showDemoVideo ? 'Hide 60-Second Explainer' : 'Watch the 60-Second Explainer'}</span>
          </button>

          <a
            href="/judges"
            onClick={(e) => { e.preventDefault(); onNavigate('judges'); }}
            className="btn btn-secondary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            <ShieldCheck size={16} color="var(--success)" />
            <span>Judge Inspection Dashboard (/judges)</span>
            <ArrowRight size={14} />
          </a>

          <a
            href="/#boundary-test"
            onClick={(e) => { e.preventDefault(); const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
            className="btn btn-secondary mobile-tap-target"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 18px', minHeight: '44px', fontSize: '0.9rem' }}
          >
            <span>Skip to Boundary Test</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Interactive 60-Second Walkthrough Explainer (Replaces Rickroll Video) */}
        {showDemoVideo && (
          <div style={{ marginTop: '24px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', padding: 'clamp(16px, 3vw, 24px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ color: 'var(--foreground)', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                    BeyondFlow 60-Second Architectural Execution Explainer
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Step-by-step breakdown of real ArmorIQ intent verification, proxy PEP enforcement, and quorum governance.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDemoVideo(false)}
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '6px', padding: '8px 12px', minHeight: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                aria-label="Close walkthrough explainer"
              >
                <X size={15} />
                <span>Close</span>
              </button>
            </div>

            {/* Time Step Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '8px', marginBottom: '20px' }}>
              {walkthroughSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setExplainerStep(idx)}
                  style={{
                    background: explainerStep === idx ? 'rgba(56, 189, 248, 0.12)' : 'var(--card)',
                    border: explainerStep === idx ? '1px solid #38bdf8' : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    minHeight: '44px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'monospace', color: explainerStep === idx ? '#38bdf8' : 'var(--muted-foreground)' }}>
                      {step.time}
                    </span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: `${step.badgeColor}22`, color: step.badgeColor }}>
                      Phase {idx + 1}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: explainerStep === idx ? 'var(--foreground)' : 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.badge}
                  </div>
                </button>
              ))}
            </div>

            {/* Active Step Content */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: 'clamp(14px, 3vw, 20px)' }}>
              {/* Left Column: Explanation */}
              <div>
                <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: `${walkthroughSteps[explainerStep].badgeColor}22`, color: walkthroughSteps[explainerStep].badgeColor, marginBottom: '8px' }}>
                  {walkthroughSteps[explainerStep].time} · {walkthroughSteps[explainerStep].badge}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
                  {walkthroughSteps[explainerStep].title}
                </h3>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', margin: '0 0 10px 0' }}>
                  {walkthroughSteps[explainerStep].headline}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  {walkthroughSteps[explainerStep].explanation}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {walkthroughSteps[explainerStep].keyPoints.map((pt, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.75rem', color: 'var(--foreground)' }}>
                      <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Code & Trace */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                    <Terminal size={14} color="#38bdf8" />
                    <span>ArmorIQ SDK Execution Trace</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 600 }}>Recorded Platform Call</span>
                </div>
                <pre style={{
                  flex: 1,
                  background: '#04060a',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '0.72rem',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  lineHeight: 1.5,
                  margin: 0,
                  overflowX: 'auto',
                  whiteSpace: 'pre'
                }}>
                  {walkthroughSteps[explainerStep].codeSnippet}
                </pre>
              </div>
            </div>

            {/* Stepper Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                onClick={() => setExplainerStep(Math.max(0, explainerStep - 1))}
                disabled={explainerStep === 0}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', opacity: explainerStep === 0 ? 0.4 : 1 }}
              >
                <ChevronLeft size={14} />
                <span>Previous Phase</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {walkthroughSteps.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    onClick={() => setExplainerStep(dotIdx)}
                    style={{
                      width: explainerStep === dotIdx ? '20px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      background: explainerStep === dotIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>

              {explainerStep < walkthroughSteps.length - 1 ? (
                <button
                  onClick={() => setExplainerStep(explainerStep + 1)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  <span>Next Phase</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <a
                  href="/#boundary-test"
                  onClick={(e) => { e.preventDefault(); const el = document.getElementById('boundary-test'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
                >
                  <span>View Boundary Test Live</span>
                  <ArrowRight size={14} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TIER 1 ITEM 5: Centerpiece Boundary Test Section */}
      <div className="cv-auto">
        <BoundaryTestSection />
      </div>

      {/* TIER 1 ITEM 7: Architecture & Enforcement Flow Section */}
      <div className="cv-auto">
        <HowWeUseArmorIQSection />
      </div>

        <div className="cv-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
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
              Tool: <code style={{ color: '#34d399' }}>lookup_order</code>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
              Read-only inquiry allowed by ArmorIQ at call time; the tool executes with the intent token issued for the call.
            </div>
          </div>

          {/* Card 4: Action BLOCKED */}
          <div style={{ background: 'rgba(239, 68, 68, 0.06)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>3B. Action BLOCKED</span>
              <span className="badge badge-warning" style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>BLOCKED</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--foreground)', marginBottom: '4px' }}>
              Tool: <code style={{ color: '#f87171' }}>change_payout</code>
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
              color: '#10b981',
              actionLabel: 'View in Planner',
              targetView: 'planner'
            },
            {
              id: 'SCENARIO_B',
              code: 'Scenario B',
              title: 'Duplicate Invoice Attack',
              desc: 'Injects invoice INV-2024-884B (€4,250) with 91.2% similarity. Caught by duplicate shield & blocked.',
              badge: 'ATTACK SIM',
              color: '#ef4444',
              actionLabel: 'Inspect Risk Guard',
              targetView: 'invoices'
            },
            {
              id: 'SCENARIO_C',
              code: 'Scenario C',
              title: 'Delayed Receivable Shock',
              desc: '$14,500 customer receipt delayed by 14 days. Rules engine defers low-priority bills to protect floor.',
              badge: 'STRESS SHOCK',
              color: '#f59e0b',
              actionLabel: 'View Deferred Bills',
              targetView: 'planner'
            },
            {
              id: 'SCENARIO_D',
              code: 'Scenario D',
              title: 'Sandbox Deposit (+ $25,000)',
              desc: 'Calls Airwallex sandbox deposit to inject +$25,000 USD, unlocking held obligations automatically.',
              badge: 'REPLENISHMENT',
              color: '#38bdf8',
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
                        <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-live" style={{ fontSize: '0.68rem' }}>
              <Box size={11} />
              THREE.JS 3D CRYPTOGRAPHIC MODEL
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>60 FPS ACCELERATED</span>
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
          {show3dHero ? (
            <Suspense fallback={
              <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                Loading 3D Hero Vault...
              </div>
            }>
              <RotatingHeroVault height={235} interactive={true} />
            </Suspense>
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: 'radial-gradient(circle at 50% 45%, rgba(16, 185, 129, 0.14), rgba(99, 102, 241, 0.10) 42%, transparent 72%)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '96px',
                  height: '96px',
                  margin: '0 auto 10px',
                  borderRadius: '50%',
                  border: '1px dashed rgba(99, 102, 241, 0.55)',
                  boxShadow: 'inset 0 0 28px rgba(16, 185, 129, 0.25)'
                }} />
                <div style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                  Interactive 3D intent vault loads on first interaction
                </div>
              </div>
            </div>
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
