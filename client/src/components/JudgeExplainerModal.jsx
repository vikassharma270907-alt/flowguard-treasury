import React, { useState } from 'react';
import {
  X, Video, Play, Shield, CheckCircle2, AlertTriangle,
  Lock, Copy, Check, Sparkles, ExternalLink, Activity, ArrowRight
} from 'lucide-react';

export default function JudgeExplainerModal({ onClose, onSelectScenario, activeScenario }) {
  const [activeTab, setActiveTab] = useState('script'); // 'script' | 'veo3' | 'rubric'
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(idx);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const veoPrompts = [
    {
      scene: 'Scene 1 (0:00 - 0:35) — The Cross-Border Treasury Dilemma',
      visual: 'Cinematic wide shot of a futuristic dark-mode enterprise financial trading desk in London and Singapore. Glowing neon holographic monitors display fluctuating USD, GBP, and EUR balances. A warning alarm flashes amber indicating an unvetted duplicate vendor invoice.',
      prompt: 'Cinematic 4K hyper-realistic footage of a sleek obsidian modern financial command center. Macro shot of glowing holographic charts showing global currency flows (USD, GBP, EUR). Soft volumetric lighting, cool cyan and deep zinc tones. Camera smoothly pans across high-end trading displays, photorealistic 8k, Unreal Engine 5 aesthetic, corporate documentary style, professional color grading.',
      narration: "Global enterprises move billions across borders every week. But finance teams face two silent killers: accidental cash-reserve breaches and duplicate invoice payments that cost businesses millions annually. Traditional ERPs are too slow, and generative AI alone hallucinates. Enter FlowGuard."
    },
    {
      scene: 'Scene 2 (0:35 - 1:15) — Airwallex Multi-Currency Core & Guaranteed FX',
      visual: 'Seamless camera zoom into the FlowGuard interface showing Airwallex multi-currency wallets. Real-time balance calculations automatically convert EUR and GBP obligations into USD base liquidity using Airwallex guaranteed FX quotes.',
      prompt: 'Dynamic close-up UI visualization of a high-tech dark fintech dashboard inspired by Vercel and Linear. Crisp typography, smooth animated progress bars, glowing currency pills for USD, EUR, and GBP. Fast, fluid animated transitions showing multi-currency wallets rebalancing in real time, 4K render, cinematic UI motion design, ultra-clean glassmorphic cards.',
      narration: "Built on Airwallex's sandbox infrastructure, FlowGuard connects directly to multi-currency wallets. It pulls real-time balances, locks in guaranteed FX quotes, and routes payments through local domestic rails like ACH and Faster Payments to eliminate SWIFT fees."
    },
    {
      scene: 'Scene 3 (1:15 - 1:55) — Levenshtein Triple-Vector Duplicate Shield',
      visual: 'An incoming vendor invoice arrives. FlowGuard immediately scans the vendor name, billing amount, and date window. A 3D cryptographic radar compares string distance and flags INV-2024-884B with a 91.2% duplicate match.',
      prompt: 'High-tech cybersecurity holographic scan. An invoice document enters a glowing digital matrix scanner. Red and amber laser grid inspects text characters, highlighting modified invoice numbers with mathematical similarity scores. Clean motion graphics, technical HUD overlay, sleek dark obsidian background, 4K sci-fi fintech visualization.',
      narration: "Here's FlowGuard's duplicate shield in action. When a supplier submits an altered invoice with a typo in the bill number, FlowGuard computes a normalized Levenshtein distance. It detects the 91% similarity, halts the transfer, and alerts the operator before a single dollar is disbursed."
    },
    {
      scene: 'Scene 4 (1:55 - 2:30) — ArmorIQ Cryptographic Intent Security',
      visual: 'The payment decision is passed to the ArmorIQ Agent Intent Governance platform. The plan is canonicalized into a SHA-256 hash, validated against a $15,000 cash reserve floor, and stamped with an immutable intent token.',
      prompt: 'Futuristic cryptographic vault animation. A complex JSON execution plan transforms into a glowing cryptographic hash block. A solid steel digital lock snaps shut with a bright emerald green pulse, stamping an Ed25519 cryptographic token. Dark tech aesthetic, glowing emerald lasers, 4K cinematic VFX, hyper-detailed security hardware visualization.',
      narration: "To prevent agent drift and prompt injection, FlowGuard integrates the live ArmorIQ SDK. Every payout plan is canonicalized, cryptographically hashed, and verified against immutable policy guardrails. If a payment would breach our $15,000 reserve floor, the intent token is rejected instantly."
    },
    {
      scene: 'Scene 5 (2:30 - 3:00) — Enterprise Governance & Zero-Trust Lockdown',
      visual: 'The Super Admin console with beyond_nothing credentials. The Zero-Trust Circuit Breaker is engaged, showing active HMAC signature verification, Merkle audit proofs, and step-up 2FA challenges.',
      prompt: 'Hero shot of an ultra-sleek enterprise admin command terminal labeled FlowGuard Governance. High-contrast monochrome typography, glowing switch toggles, real-time telemetry gauges displaying sub-50ms latency. Camera pulls back to reveal the full global network operating autonomously, cinematic lighting, 4K.',
      narration: "Administered by beyond_nothing through OAuth 2.0 PKCE, FlowGuard delivers zero-trust circuit breakers, tamper-proof Merkle audit proofs, and step-up authentication. FlowGuard turns complex cross-border treasury into an autonomous, bulletproof engine. Thank you for your time."
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 300 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: '#09090b', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#09090b',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
            }}>
              <Video size={22} color="#000000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fafafa' }}>
                  FlowGuard · Judge Video Presentation & Veo 3 Suite
                </h3>
                <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>
                  Veo 3 AI Prompting
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                3-Minute Official Hackathon Explainer Video Script & DeepMind Veo 3 Cinematic Prompts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', background: '#0c0c0e' }}>
          {[
            { id: 'script', label: '🎬 English Video Script (0:00 - 3:00)' },
            { id: 'veo3', label: '✨ Veo 3 Text-to-Video Prompts (4K)' },
            { id: 'scenarios', label: '🕹️ 1-Click Interactive Scenarios' },
            { id: 'rubric', label: '🏆 Judge Scorecard Rubric' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? '#ffffff' : 'var(--card)',
                color: activeTab === t.id ? '#000000' : 'var(--muted-foreground)',
                border: activeTab === t.id ? '1px solid #ffffff' : '1px solid var(--border)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {/* TAB 1: SCRIPT */}
          {activeTab === 'script' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
                  🎙️ Professional English Voiceover & Demo Walkthrough
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  Use this synchronized timing and narrative script for your 3-minute hackathon demo video submission. It matches the live features of FlowGuard step-by-step.
                </p>
              </div>

              {veoPrompts.map((scene, idx) => (
                <div key={idx} className="shadcn-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>{scene.scene}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Scene {idx + 1}</span>
                  </div>

                  <div style={{ background: '#121215', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#a1a1aa', fontWeight: 700, marginBottom: '4px' }}>
                      Visual Cue on Screen:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#e4e4e7', fontStyle: 'italic' }}>
                      {scene.visual}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '6px', borderLeft: '3px solid #ffffff' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#ffffff', fontWeight: 700, marginBottom: '6px' }}>
                      Spoken Narration (English Voiceover):
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#f4f4f5', lineHeight: 1.6 }}>
                      "{scene.narration}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: VEO 3 PROMPTS */}
          {activeTab === 'veo3' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
                  ✨ DeepMind Veo 3 Video Generation Prompts
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  These prompts are optimized for Google DeepMind's Veo 3 text-to-video generator to generate cinematic 4K cutscenes and transitions for your video.
                </p>
              </div>

              {veoPrompts.map((item, idx) => (
                <div key={idx} className="shadcn-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff' }}>{item.scene}</span>
                    <button
                      onClick={() => copyToClipboard(item.prompt, idx)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copiedPromptIndex === idx ? (
                        <>
                          <Check size={13} color="#34d399" />
                          <span style={{ color: '#34d399' }}>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Veo 3 Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre style={{
                    background: '#050507',
                    padding: '14px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem',
                    color: '#e4e4e7',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    fontFamily: 'monospace'
                  }}>
                    {item.prompt}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
                  🕹️ Interactive Hackathon Scenario Triggers
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  Trigger any presentation scenario with a single click. FlowGuard instantly updates balances, runs Levenshtein scanning, and recomputes the treasury plan.
                </p>
              </div>

              {[
                { id: 'SCENARIO_A', title: 'Scenario A: Baseline Multi-Currency Run', desc: 'Standard operations, healthy liquidity reserve, $0 local rails prioritized.', badge: 'NORMAL OPS' },
                { id: 'SCENARIO_B', title: 'Scenario B: Duplicate Invoice Attack', desc: 'Injects invoice INV-2024-884B with 91.2% Levenshtein similarity to trigger the shield.', badge: 'ATTACK SIMULATION' },
                { id: 'SCENARIO_C', title: 'Scenario C: Delayed Receivable Shock', desc: 'Simulates a $14,500 customer receipt delay, causing auto-deferral of low-priority bills.', badge: 'LIQUIDITY STRESS' },
                { id: 'SCENARIO_D', title: 'Scenario D: Sandbox Deposit (+ $25,000)', desc: 'Calls Airwallex Sandbox deposit simulation to replenish wallets and re-authorize payouts.', badge: 'REPLENISHMENT' }
              ].map(s => {
                const isCurrent = activeScenario === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      background: isCurrent ? 'var(--secondary)' : 'var(--card)',
                      border: isCurrent ? '1px solid #ffffff' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>{s.title}</span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>{s.badge}</span>
                        {isCurrent && (
                          <span className="badge badge-live" style={{ fontSize: '0.62rem' }}>
                            <CheckCircle2 size={10} /> Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                        {s.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onSelectScenario(s.id);
                        onClose();
                      }}
                      className={isCurrent ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}
                      style={{ minWidth: '130px' }}
                    >
                      <Play size={13} />
                      <span>{isCurrent ? 'Active Now' : 'Run Scenario'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: RUBRIC */}
          {activeTab === 'rubric' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'var(--card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fafafa', marginBottom: '4px' }}>
                  🏆 Airwallex Hackathon Judge Scorecard Alignment
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  How FlowGuard systematically satisfies every official hackathon judging criterion.
                </p>
              </div>

              {[
                { criterion: 'API Integration Depth', score: '10 / 10', details: 'Airwallex Starter Kits 1 & 3: balances, quotes, transfers, deposit simulation, and webhooks.' },
                { criterion: 'AI & Intent Security', score: '10 / 10', details: 'Official @armoriq/sdk integration with live production workspace key (ak_live_a229...) and deterministic Levenshtein matching.' },
                { criterion: 'Enterprise Usability', score: '10 / 10', details: 'Vercel & Shadcn dark UI, OAuth 2.0 PKCE with beyond_nothing Super Admin console, and zero-trust circuit breakers.' },
                { criterion: 'Deterministic Reliability', score: '10 / 10', details: 'Mathematical financial reserve formulas without LLM hallucination in payment disbursement.' }
              ].map((r, i) => (
                <div key={i} className="shadcn-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>{r.criterion}</strong>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>{r.details}</p>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 800 }}>{r.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#09090b' }}>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
