/**
 * Veratone Responsive Global Footer
 * 
 * Features:
 * - Brand logo, project name, and official tagline
 * - Navigation columns: Product, Resources, and Company/Legal
 * - Official text-only attribution: "Powered by ElevenLabs & ArmorIQ"
 * - Dynamic copyright year (new Date().getFullYear())
 * - Secondary Theme Toggle with WCAG AA compliance
 * - Mobile-first responsive grid that stacks on smaller viewports
 */

import React from 'react';
import { Shield, FileText, ExternalLink, Sun, Moon, Sparkles, Lock, PhoneCall, Layers, Box, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer({ onNavigate }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const currentYear = new Date().getFullYear();

  const handleNav = (tab) => {
    if (onNavigate) {
      onNavigate(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer style={{
      width: '100%',
      background: 'var(--card)',
      borderTop: '1px solid var(--border)',
      marginTop: '60px',
      color: 'var(--foreground)',
      transition: 'background-color 0.25s ease, border-color 0.25s ease'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '48px 24px 32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px'
      }}>
        {/* Main Footer Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '36px',
          alignItems: 'start'
        }}>
          {/* Column 1: Brand & Tagline */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border)'
              }}>
                <img src="/logo.svg" alt="Veratone Logo" style={{ width: '20px', height: '20px' }} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                Vera<span style={{ color: '#10b981' }}>tone</span>
              </span>
            </div>

            <p style={{
              fontSize: '0.84rem',
              color: 'var(--muted-foreground)',
              lineHeight: 1.6,
              marginBottom: '16px'
            }}>
              Verifiable voice AI, cryptographically governed by ArmorIQ. Real-time conversational agent with sub-5s timeout protection and multi-supervisor approval quorums.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <a
                href="https://github.com/vikassharma270907-alt/flowguard-treasury"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '6px' }}
                aria-label="GitHub Repository"
                title="View Veratone on GitHub"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
                <span>GitHub</span>
              </a>
              <a
                href="/docs/Veratone_Overview.pdf"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '6px' }}
                aria-label="Download Technical Overview PDF"
                title="Download Technical Overview PDF"
              >
                <FileText size={13} color="#10b981" />
                <span>PDF Guide</span>
              </a>
            </div>
          </div>

          {/* Column 2: Product Navigation */}
          <div>
            <h4 style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--foreground)',
              marginBottom: '14px'
            }}>
              Product & Features
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.84rem' }}>
              <li>
                <button
                  onClick={() => handleNav('voice')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <PhoneCall size={12} color="#10b981" />
                  ElevenLabs Voice Gateway
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('enclave')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Box size={12} color="#6366f1" />
                  3D Cryptographic Enclave
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('overview')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit' }}
                >
                  Treasury Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('planner')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit' }}
                >
                  Payment Planner
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('invoices')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit' }}
                >
                  Invoice & Risk Guard
                </button>
              </li>
              <li>
                <a
                  href="http://localhost:8790/playground"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Supervisor Playground</span>
                  <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources & Documentation */}
          <div>
            <h4 style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--foreground)',
              marginBottom: '14px'
            }}>
              Resources & Docs
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.84rem' }}>
              <li>
                <a
                  href="/docs/Veratone_Overview.pdf"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                >
                  <FileText size={13} color="#10b981" />
                  <span>Veratone Overview PDF (9 pgs)</span>
                </a>
              </li>
              <li>
                <a
                  href="https://docs.armoriq.ai"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>ArmorIQ Platform Docs</span>
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <a
                  href="https://elevenlabs.io/docs"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>ElevenLabs Voice Docs</span>
                  <ExternalLink size={10} />
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleNav('audit')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, textAlign: 'left', font: 'inherit' }}
                >
                  Immutable Audit Ledger
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/DX_NOTES.md"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Developer Experience (DX) Notes</span>
                  <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Legal */}
          <div>
            <h4 style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--foreground)',
              marginBottom: '14px'
            }}>
              Governance & Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.84rem' }}>
              <li>
                <a
                  href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/DISCLOSURES.md"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
                >
                  Hackathon Disclosures
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/vikassharma270907-alt/flowguard-treasury/blob/main/LICENSE"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--muted-foreground)', textDecoration: 'none' }}
                >
                  MIT Open Source License
                </a>
              </li>
              <li>
                <span style={{ color: 'var(--muted-foreground)' }}>
                  Privacy & Data Policy (Sandbox Only)
                </span>
              </li>
              <li>
                <div style={{ marginTop: '6px' }}>
                  <button
                    onClick={toggleTheme}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem' }}
                    aria-label={`Switch theme to ${isDark ? 'light' : 'dark'} mode`}
                  >
                    {isDark ? <Sun size={12} color="#fbbf24" /> : <Moon size={12} color="#6366f1" />}
                    <span>Theme: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Attribution & Copyright Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '0.78rem',
          color: 'var(--muted-foreground)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>© {currentYear} Veratone Contributors. Released under MIT License.</span>
          </div>

          {/* Official Text Attribution (Brand Compliance) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--secondary)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '0.74rem',
            color: 'var(--foreground)'
          }}>
            <Shield size={12} color="#10b981" />
            <span>Powered by ElevenLabs & ArmorIQ</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
