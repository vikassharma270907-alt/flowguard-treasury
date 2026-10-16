/**
 * 3D Cryptographic Enclave & Intent Visualizer Screen
 * 
 * Showcases all 3 interactive Three.js elements with live telemetry,
 * user controls, theme synchronization, and ArmorIQ cryptographic binding explanation.
 */

import React, { useState, Suspense, lazy } from 'react';
import { Box, Shield, ShieldCheck, Sparkles, Sliders, RefreshCw, Layers, Eye, Activity, CheckCircle2, FileText, BookOpen, ExternalLink } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';

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

export default function EnclaveScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [activeVisualizer, setActiveVisualizer] = useState('all'); // 'all' | 'vault' | 'gyro' | 'particles'
  const [particleDensity, setParticleDensity] = useState(1200);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px 28px',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle ambient particle background layer in banner */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
          <Suspense fallback={null}>
            <ParticleBackgroundField height={180} particleCount={400} interactive={false} />
          </Suspense>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-live" style={{ fontSize: '0.72rem' }}>
                <Activity size={12} />
                THREE.JS HARDWARE ACCELERATED · 60 FPS
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                THEME: {theme.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
              3D Cryptographic Intent Enclave
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted-foreground)', maxWidth: '640px', margin: 0 }}>
              Real-time interactive 3D spatial models visualizing ArmorIQ's cryptographic intent verification,
              Merkle proof validation, and multi-ring defense topology.
            </p>

            {/* Download Guide (PDF) Button */}
            {siteConfig.guidePdf?.enabled && (
              <div style={{ marginTop: '16px' }}>
                <a
                  href={siteConfig.guidePdf.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('links.guidePdfAria', { pages: siteConfig.guidePdf.pages, size: siteConfig.guidePdf.sizeLabel })}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    minHeight: '44px',
                    padding: '8px 16px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-muted)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    outlineOffset: '2px',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#27272a' : '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                  }}
                >
                  <FileText size={15} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                  <span>{t('links.downloadGuide')}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 500,
                      marginLeft: '2px'
                    }}
                  >
                    PDF · {siteConfig.guidePdf.sizeLabel}
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '2px' }} aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={13} color="var(--accent)" />
              <span>Toggle Mode ({isDark ? 'Light' : 'Dark'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* How to Use FlowGuard — Official Architecture & Operational Guide (PDF) */}
      {siteConfig.guidePdf?.enabled && (
        <div
          className="card"
          style={{
            padding: '24px 28px',
            border: '1px solid var(--border)',
            background: 'var(--card)',
            borderRadius: '12px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={22} color="var(--accent)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--foreground)' }}>
                    How to Use FlowGuard — Official Guide & Technical Blueprint
                  </h2>
                  <span className="badge badge-live" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    7 PAGES · {siteConfig.guidePdf.sizeLabel}
                  </span>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--muted-foreground)', margin: 0, maxWidth: '760px', lineHeight: 1.5 }}>
                  Everything you need to understand, run, and govern the FlowGuard treasury defense system. Covers ElevenLabs conversational voice routing, ArmorIQ CSRG-IAP intent hashing, Airwallex multi-currency corridors, cash-reserve floor enforcement, and duplicate invoice scanning.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href={siteConfig.guidePdf.path}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('links.guidePdfAria', { pages: siteConfig.guidePdf.pages, size: siteConfig.guidePdf.sizeLabel })}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  padding: '10px 20px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px'
                }}
              >
                <BookOpen size={16} aria-hidden="true" />
                <span>{t('links.downloadGuide')}</span>
                <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 500 }}>
                  ({siteConfig.guidePdf.sizeLabel})
                </span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 4 Architecture Pillars from the Guide */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '12px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px'
          }}>
            <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '4px' }}>
                1. Voice Support Gateway
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                ElevenLabs Conversational AI
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Natural caller audio with sub-5s timeout safety holding messages and webhook tool parameter extraction.
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>
                2. Intent Governance
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                ArmorIQ Cryptographic PEP
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Plan-hash binding: the intent token authorizes one specific plan — mismatched tool calls or arguments are refused.
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '4px' }}>
                3. Treasury Protection
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Airwallex Multi-Currency Rails
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                $15,000 protected cash floor (sandbox setting) — checked app-side on the planned disbursements.
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ec4899', textTransform: 'uppercase', marginBottom: '4px' }}>
                4. Fraud Prevention
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '2px' }}>
                Levenshtein Duplicate Shield
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: 0 }}>
                Normalized string distance halts duplicate invoices before execution with tamper-evident audit logs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of the 3 Interactive 3D Elements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
        
        {/* Element 1: Rotating Hero Vault */}
        <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={16} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>1. Cryptographic Treasury Vault</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Rotating Hero Object · Dual Core</span>
              </div>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '36px' }}>
            Inner crystalline core surrounded by outer holographic cage and orbital verification token ring.
            Hover or drag with pointer to tilt perspective.
          </p>

          <div style={{
            background: 'var(--background)',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '14px'
          }}>
            <Suspense fallback={<Loading3DFallback label="Hero Vault" />}>
              <RotatingHeroVault height={290} interactive={true} />
            </Suspense>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <span>Mesh: Icosahedron + Torus</span>
            <span style={{ color: '#10b981', fontWeight: 600 }}>GPU Disposed on Unmount</span>
          </div>
        </div>

        {/* Element 3: Interactive Intent Gyroscope */}
        <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={16} color="#8b5cf6" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>2. Multi-Ring Defense Gyroscope</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>Mouse & Scroll Interactive Gimbal</span>
              </div>
            </div>
            <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>3 LAYERS</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '36px' }}>
            Nested gimbal rings tracking mouse pitch/yaw. Scroll the window to trigger the exploded cryptographic view.
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

        {/* Element 2: Floating Particle Constellation */}
        <div className="shadcn-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>3. Intent Constellation Mesh</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>1,200 Floating Nodes · Ambient Field</span>
              </div>
            </div>
            <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>GPU ACCELERATED</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginBottom: '14px', minHeight: '36px' }}>
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
