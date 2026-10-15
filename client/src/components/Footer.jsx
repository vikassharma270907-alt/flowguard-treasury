/**
 * Reusable Responsive Footer Component
 *
 * Design Spec:
 * - Full width, background #f7f7f5, 1px top border #e5e5e5, padding ~64px vertical.
 * - 4-column grid on desktop (brand column wider), cleanly stacked on mobile.
 * - Column 1: Logo icon (24px rounded-square with white "M") + bold "IntentGate",
 *   muted tagline, GitHub and X (Twitter) icons in gray (hover dark).
 * - Column 2: PRODUCT (Quickstart, How it works, CLI reference, Flight Recorder, Security model).
 * - Column 3: INTEGRATIONS (Claude Desktop, Cursor, ElevenLabs agents, ArmorIQ).
 * - Column 4: PROJECT (GitHub, npm, DX notes on ArmorIQ, Hackathon).
 * - Headings: monospace, uppercase, 11px, letter-spacing 0.08em, muted gray (#6b6b6b).
 * - Links: 14px, dark gray (#444444), 12px vertical spacing, darker on hover.
 * - Thin bottom border below footer content.
 */

import React from 'react';
import { footerConfig as defaultFooterConfig } from './navConfig';
import { IntentGateLogoIcon } from './Header';

// GitHub SVG Icon
const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// X (formerly Twitter) SVG Icon
const XIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer({
  config = defaultFooterConfig,
  onNavigate
}) {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e, link) => {
    if (link.isExternal) return;
    if (onNavigate && link.id) {
      e.preventDefault();
      onNavigate(link.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: '#f7f7f5',
        borderTop: '1px solid #e5e5e5',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#111111',
        padding: '64px 20px 32px 20px',
        marginTop: '60px'
      }}
      aria-label="Site footer"
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '48px'
        }}
      >
        {/* Main 4-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '40px',
            alignItems: 'start'
          }}
        >
          {/* Column 1: Brand (Wider Column) */}
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
              <IntentGateLogoIcon />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
                {config.brand.name}
              </span>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: '#6b6b6b',
                lineHeight: 1.6,
                marginBottom: '20px',
                marginRight: '12px'
              }}
            >
              {config.brand.tagline}
            </p>

            {/* Social Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {config.brand.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  style={{
                    color: '#6b6b6b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6b6b')}
                >
                  {social.icon === 'github' && <GitHubIcon />}
                  {social.icon === 'x' && <XIcon />}
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2, 3, 4: Navigation Columns */}
          {config.columns.map((col) => (
            <div key={col.title}>
              <h3
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#6b6b6b',
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}
              >
                {col.title}
              </h3>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link)}
                      target={link.isExternal ? '_blank' : undefined}
                      rel={link.isExternal ? 'noopener noreferrer' : undefined}
                      style={{
                        fontSize: '14px',
                        color: '#444444',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease, text-decoration 0.15s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#111111';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#444444';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Thin Bottom Border & Copyright Attribution Bar */}
        <div
          style={{
            borderTop: '1px solid #e5e5e5',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#6b6b6b'
          }}
        >
          <div>
            © {currentYear} IntentGate. Cryptographically enforced via ArmorIQ.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Model Context Protocol (MCP)</span>
            <span>·</span>
            <span>ElevenLabs Voice</span>
            <span>·</span>
            <span>ArmorIQ Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
