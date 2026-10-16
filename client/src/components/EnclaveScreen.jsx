/**
 * How FlowGuard Works & 3D Cryptographic Enclave Screen
 * 
 * Comprehensive walkthrough complying with Hackathon Checkpoints 5 & 7:
 * - Theme-aware inline SVG architecture flow (Agent -> FlowGuard Gateway -> ArmorIQ Cloud -> Governed MCP Server)
 * - Exact production ArmorIQ SDK method calls
 * - 4-stage cryptographic intent execution pipeline
 * - Three.js WebGL interactive spatial visualizers (Rotating Vault, Intent Gyroscope, Particle Constellation)
 * - Deep links to Boundary Test centerpiece and Judge Evaluation tour
 */

import React, { useState, Suspense, lazy } from 'react';
import {
  Box, Shield, ShieldCheck, Sparkles, Sliders, RefreshCw,
  Layers, Eye, Activity, CheckCircle2, FileText, BookOpen,
  ExternalLink, ArrowRight, Terminal, Zap, Server, Lock,
  FileCode, AlertTriangle, ChevronRight, ChevronLeft, Check
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';
import HowWeUseArmorIQSection from './HowWeUseArmorIQSection';

// Lazy-load all 3D elements for optimal bundle loading & performance
const RotatingHeroVault = lazy(() => import('./3d/RotatingHeroVault'));
const ParticleBackgroundField = lazy(() => import('./3d/ParticleBackgroundField'));
const InteractiveIntentGyroscope = lazy(() => import('./3d/InteractiveIntentGyroscope'));

function Loading3DFallback({ label }) {
  return (
    <div style={{
      width: '100%',
      height: '320px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--card)',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      color: 'var(--muted-foreground)',
      gap: '8px'
    }}>
      <RefreshCw size={24} className="spin" color="var(--accent)" />
      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Initializing Three.js WebGL Scene ({label})...</span>
    </div>
  );
}

export default function EnclaveScreen({ onNavigate }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [activeVisualizer, setActiveVisualizer] = useState('all'); // 'all' | 'vault' | 'gyro' | 'particles'
  const [particleDensity, setParticleDensity] = useState(1200);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  const pipelineStages = [
    {
      time: "Stage 1",
      badge: "Plan Capture & Hashing",
      badgeColor: "#38bdf8",
      title: "1. Intent Plan Capture & SHA-256 Merkle Hashing",
      headline: "The agent formally declares its goal and tool parameters before execution begins.",
      explanation: "When an operator or voice caller triggers an operation (e.g. checking order status, changing payout destination, or issuing a refund), FlowGuard intercepts the intent. The client invokes client.capturePlan(agentId, goal, plan). The plan binds every step, target MCP server, and parameter. FlowGuard computes a SHA-256 Merkle hash that binds every step of the plan.",
      keyPoints: [
        "Prevents prompt injection, tool poisoning, and agent drift at the source",
        "Deterministic Plan Hash: b3e6889fe267adb6c3a64790176...",
        "Zero tool access or banking API execution permitted prior to validation"
      ],
      codeSnippet: "// 1. Declare intent & capture deterministic plan\nconst capture = client.capturePlan(\n  'flowguard-agent',\n  'Check order status ORD-1001',\n  {\n    goal: 'Check order status ORD-1001',\n    steps: [{\n      action: 'lookup_order',\n      mcp: 'flowguard-treasury-mcp',\n      params: { order_id: 'ORD-1001' }\n    }]\n  }\n);"
    },
    {
      time: "Stage 2",
      badge: "Cryptographic Authorization",
      badgeColor: "#818cf8",
      title: "2. Ed25519 Intent Token Minting at iap.armoriq.ai",
      headline: "ArmorIQ verifies policy permissions and issues a single-use authorization token.",
      explanation: "FlowGuard submits the captured plan to ArmorIQ's Identity & Policy Assertion (IAP) service at https://iap.armoriq.ai. ArmorIQ evaluates the registered agent identity (flowguard-agent), user permissions, and the active workspace policy (flowguard-treasury-allowlist). If approved, ArmorIQ mints an Ed25519 cryptographically signed Intent Token containing the plan hash and step Merkle root.",
      keyPoints: [
        "Real platform token ID: 951f7625efe24fb18039b62fadfed910",
        "Asymmetrically signed by ArmorIQ private key; verifiable by public key",
        "Strict TTL expiration (e.g. 3600s) preventing replay attacks"
      ],
      codeSnippet: "// 2. Request Ed25519 token from ArmorIQ IAP\nconst token = await client.getIntentToken(capture);\n// Output from real run:\n// token.id = \"951f7625efe24fb18039b62fadfed910\"\n// token.plan_hash = \"b3e6889fe267adb6...\"\n// token.expires = 3600 (seconds)"
    },
    {
      time: "Stage 3",
      badge: "Inline PEP Interception",
      badgeColor: "#34d399",
      title: "3. Deterministic PEP Enforcement at proxy.armoriq.ai",
      headline: "Every tool call passes through ArmorIQ's Policy Enforcement Point.",
      explanation: "Tool invocations never communicate with the banking MCP server directly. Instead, client.invoke() routes every call through proxy.armoriq.ai. The proxy verifies the Ed25519 token, validates step compliance against the plan hash, and applies the policy. Safe inquiries (lookup_order) pass with 200 OK. Unauthorized wire changes (change_payout) are blocked immediately with PolicyBlockedException. Large disbursements (issue_refund) are held with PolicyHoldException.",
      keyPoints: [
        "ALLOWED: lookup_order executed in ~887ms verification latency",
        "BLOCKED: change_payout blocked in 764ms with tool_not_in_allowlist",
        "HELD: issue_refund halted in 604ms requiring 2 supervisor approvals"
      ],
      codeSnippet: "// 3. PEP enforces policy on tool call\ntry {\n  const res = await client.invoke(\n    token.id, 'flowguard-treasury-mcp',\n    'change_payout', { new_destination: 'GB29 NWBK...' }\n  );\n} catch (err) {\n  // Throws PolicyBlockedException: tool_not_in_allowlist (HTTP 403)\n  // Wire diversion rejected; $0.00 lost!\n}"
    },
    {
      time: "Stage 4",
      badge: "Quorum & Audit Ledger",
      badgeColor: "#f59e0b",
      title: "4. Governed MCP Server Execution & Flight Recorder",
      headline: "Approved tools run inside the governed MCP server; all proof records append to audit log.",
      explanation: "Only after ArmorIQ's proxy approves the request does the tool execute on the registered flowguard-treasury-mcp server over JSON-RPC 2.0. Every intent token, policy verdict, plan hash, supervisor signature, and bank acknowledgment is appended immutably to the flight recorder audit ledger for regulatory compliance.",
      keyPoints: [
        "Dual-supervisor authorization for payments exceeding reserve limits",
        "Deterministic audit trail with SHA-256 cryptographic binding",
        "Full support for Airwallex multi-currency global disbursements"
      ],
      codeSnippet: "// 4. Successful execution & immutable audit trail\nconst result = await mcpServer.executeTool('lookup_order', { order_id: 'ORD-1001' });\nauditLedger.record({\n  tokenId: token.id,\n  verdict: 'ALLOWED',\n  proof: result.proof,\n  timestamp: new Date().toISOString()\n});"
    }
  ];

  const handleJumpToBoundaryTest = (e) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate('boundary-test');
    } else {
      window.location.hash = '#boundary-test';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
        <ShieldCheck size={16} color="#38bdf8" />
        <span><strong>Sandbox / test environment.</strong> No real funds or customer data. Synthetic transactions only.</span>
      </div>
      {/* Header Banner */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(24px, 4vw, 36px) clamp(20px, 4vw, 32px)',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle ambient particle background layer in banner */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
          <Suspense fallback={null}>
            <ParticleBackgroundField height={200} particleCount={400} interactive={false} />
          </Suspense>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-live" style={{ fontSize: '0.72rem' }}>
                <Activity size={12} />
                ARMORIQ LIVE PEP GOVERNED
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                ELEVENLABS VOICE AGENT
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                MCP SERVER /mcp (SPEC 2024-11-05)
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.025em', color: 'var(--foreground)' }}>
              How FlowGuard Works: Architecture & Cryptographic Enclave
            </h1>
            <p style={{ fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)', color: 'var(--muted-foreground)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
              FlowGuard enforces cryptographic intent boundaries on autonomous AI agents. Every tool invocation passes through ArmorIQ's Policy Enforcement Point (PEP) proxy to prove compliance with declared user intent via signed Ed25519 tokens, Merkle plan hashes, and dual-supervisor quorum.
            </p>

            {/* Quick Action Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleJumpToBoundaryTest}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <ShieldCheck size={16} />
                <span>View Boundary Test Live</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('judges')}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                <span>Judge Evaluation Tour (/judges)</span>
                <ExternalLink size={13} />
              </button>

              {siteConfig.guidePdf?.enabled && (
                <a
                  href={siteConfig.guidePdf.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    fontSize: '0.88rem',
                    textDecoration: 'none'
                  }}
                >
                  <FileText size={15} color="var(--accent)" />
                  <span>Download Guide (PDF)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Architectural Flow Diagram & Exact SDK Methods (Checkpoint 7) */}
      <HowWeUseArmorIQSection />

      {/* SECTION 2: 4-Stage Cryptographic Intent Execution Pipeline */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            <Zap size={12} color="#38bdf8" />
            Execution Lifecycle
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
            4-Stage Intent Assurance Pipeline
          </h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', margin: 0, maxWidth: '750px', lineHeight: 1.5 }}>
            Step-by-step cryptographic sequence that prevents prompt injection, tool hijacking, and unauthorized banking operations.
          </p>
        </div>

        {/* Stage Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '10px', marginBottom: '22px' }}>
          {pipelineStages.map((stage, idx) => {
            const isSelected = walkthroughStep === idx;
            return (
              <button
                key={stage.title}
                onClick={() => setWalkthroughStep(idx)}
                style={{
                  background: isSelected ? 'var(--secondary)' : 'var(--background)',
                  border: isSelected ? `2px solid ${stage.badgeColor}` : '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: stage.badgeColor, textTransform: 'uppercase' }}>
                    {stage.time}
                  </span>
                  {isSelected && <Check size={14} color={stage.badgeColor} />}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)' }}>
                  {stage.badge}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Deep Dive */}
        {(() => {
          const s = pipelineStages[walkthroughStep];
          return (
            <div style={{ background: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', padding: 'clamp(18px, 3vw, 26px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
                    {s.title}
                  </h3>
                  <div style={{ fontSize: '0.92rem', color: s.badgeColor, fontWeight: 600 }}>
                    {s.headline}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setWalkthroughStep((prev) => (prev > 0 ? prev - 1 : pipelineStages.length - 1))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                    aria-label="Previous step"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setWalkthroughStep((prev) => (prev < pipelineStages.length - 1 ? prev + 1 : 0))}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 10px' }}
                    aria-label="Next step"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '20px' }}>
                {s.explanation}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '18px' }}>
                {/* Left: Key Cryptographic Points */}
                <div style={{ background: 'var(--card)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '12px' }}>
                    Core Technical Guarantees
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: 'var(--foreground)' }}>
                    {s.keyPoints.map((pt, i) => (
                      <li key={i} style={{ lineHeight: 1.45 }}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* Right: Code Snippet */}
                <div style={{ background: '#090d16', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)', overflowX: 'auto' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={12} />
                    <span>Exact Node.js / ArmorIQ SDK Execution Trace</span>
                  </div>
                  <pre style={{ margin: 0, fontSize: '0.78rem', color: '#a5f3fc', fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {s.codeSnippet}
                  </pre>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SECTION 3: 3D Spatial Intent Enclave & Visualizers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#c084fc', fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <Box size={14} />
              Spatial Cryptography
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
              Interactive 3D Cryptographic Spatial Models
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--card)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {[
              { id: 'all', label: 'All 3D Models' },
              { id: 'vault', label: 'Intent Vault' },
              { id: 'gyro', label: 'Intent Gyroscope' },
              { id: 'particles', label: 'Particle Mesh' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveVisualizer(tab.id)}
                style={{
                  background: activeVisualizer === tab.id ? 'var(--secondary)' : 'transparent',
                  color: activeVisualizer === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
                  border: activeVisualizer === tab.id ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: activeVisualizer === tab.id ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Visualizer Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: activeVisualizer === 'all' ? 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' : '1fr',
          gap: '20px'
        }}>
          {/* Element 1: Rotating Vault */}
          {(activeVisualizer === 'all' || activeVisualizer === 'vault') && (
            <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={16} color="#10b981" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>1. Rotating Intent Vault</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Hardware Secure Boundary · Three.js</span>
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ACTIVE ENCLAVE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '38px' }}>
                Interactive dual-octahedron vault visualizing cryptographic locking of intent tokens and secret signing keys.
              </p>
              <div style={{
                background: 'var(--background)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                marginBottom: '14px'
              }}>
                <Suspense fallback={<Loading3DFallback label="Intent Vault" />}>
                  <RotatingHeroVault height={290} interactive={true} />
                </Suspense>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span>OrbitControls · Drag to rotate</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Ed25519 Enforced</span>
              </div>
            </div>
          )}

          {/* Element 2: Intent Gyroscope */}
          {(activeVisualizer === 'all' || activeVisualizer === 'gyro') && (
            <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={16} color="#8b5cf6" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>2. Three-Ring Intent Gyroscope</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Multi-Ring Defense · Policy Alignment</span>
                  </div>
                </div>
                <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>DYNAMIC MERKLE</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '38px' }}>
                Gimbal-mounted multi-axis gyroscope modeling alignment between agent policy, Merkle proofs, and token validity.
              </p>
              <div style={{
                background: 'var(--background)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                marginBottom: '14px'
              }}>
                <Suspense fallback={<Loading3DFallback label="Intent Gyroscope" />}>
                  <InteractiveIntentGyroscope height={290} interactive={true} />
                </Suspense>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span>Outer: Policy · Mid: Merkle · Inner: Token</span>
                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Scroll Reactive</span>
              </div>
            </div>
          )}

          {/* Element 3: Floating Particle Constellation */}
          {(activeVisualizer === 'all' || activeVisualizer === 'particles') && (
            <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={16} color="#38bdf8" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>3. Intent Constellation Mesh</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>1,200 Floating Nodes · Ambient Field</span>
                  </div>
                </div>
                <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>GPU ACCELERATED</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '38px' }}>
                3D particle mesh representing distributed tool calls. Moving cursor generates electromagnetic drift on particles.
              </p>
              <div style={{
                background: 'var(--background)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                marginBottom: '14px'
              }}>
                <Suspense fallback={<Loading3DFallback label="Particle Field" />}>
                  <ParticleBackgroundField height={290} particleCount={particleDensity} interactive={true} />
                </Suspense>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span>BufferGeometry · 1,200 Vertices</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Zero Memory Leaks</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Boundary Test Centerpiece Callout */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(129, 140, 248, 0.05) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: 'clamp(20px, 3vw, 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            <ShieldCheck size={14} />
            <span>Centerpiece Verification Proof</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--foreground)', margin: '0 0 6px 0' }}>
            Ready to inspect the live 3-Result Boundary Test?
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
            See real platform decisions: <strong style={{ color: 'var(--success)' }}>ALLOWED</strong> (lookup_order), <strong style={{ color: 'var(--danger)' }}>BLOCKED</strong> (change_payout via PolicyBlockedException), and <strong style={{ color: 'var(--warning)' }}>HELD</strong> (issue_refund via platform delegation).
          </p>
        </div>
        <button
          onClick={handleJumpToBoundaryTest}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          <span>Jump to Boundary Test (/#boundary-test)</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Technical Specifications & Compliance Card */}
      <div className="glass-card" style={{ padding: '22px 26px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="#10b981" />
          Technical Standards & Quality Compliance for 3D Elements
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', fontSize: '0.82rem' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>60 FPS & Lazy Loading</div>
            <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
              All 3D components use <code>React.lazy()</code> with Suspense fallbacks. RequestAnimationFrame loops are delta-timed for consistent 60 FPS.
            </p>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Zero GPU Resource Leaks</div>
            <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
              Unmount lifecycle cleanly disposes all geometries, materials, renderers, canvas contexts, and listeners.
            </p>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Accessibility & Reduced Motion</div>
            <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
              Respects <code>prefers-reduced-motion</code> by damping rotations to static or gentle micro-drifts. Fallback card displayed if WebGL is disabled.
            </p>
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>Theme-Synchronized Shaders</div>
            <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
              3D lighting, materials, specular highlights, and wireframes dynamically synchronize with CSS design tokens when switching between light and dark modes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
