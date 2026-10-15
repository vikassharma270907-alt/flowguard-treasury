/**
 * Reusable Responsive Footer Component
 * Indian Developer-Tools / SaaS Product ("YourBrand")
 *
 * Features:
 * - 5-column layout on desktop, responsive stacked grid on mobile
 * - Column 1: Brand, Tagline, Socials (GitHub, X, LinkedIn, YouTube, Instagram, WhatsApp Business)
 * - Indian Corporate & Tax Compliance block: Registered Office, CIN, GSTIN, Companies Act 2013
 * - Trust Badges: Data stored in India, UPI & Razorpay supported, GST-compliant invoices
 * - Column 2: PRODUCT (Quickstart, How it works, API reference, Pricing in ₹, Changelog)
 * - Column 3: FOR BUSINESS (Contact Sales, GST Invoice & Billing, Enterprise, Partners, Case Studies)
 * - Column 4: DEVELOPERS (Docs, GitHub, npm, Community, Hackathons & Events)
 * - Column 5: COMPANY & LEGAL (Privacy, Terms, Refund Policy, Grievance Officer, DPDP Act)
 * - Bottom Bar: Legal entity copyright, "Made with ♥ in India 🇮🇳", live system status
 * - Subtle 2px Indian tricolor accent bar at bottom
 */

import React from 'react';
import { siteConfig as defaultSiteConfig } from '../siteConfig';
import { useI18n } from '../context/I18nContext';
import { BrandLogoIcon } from './Header';

// Lightweight SVGs for Social Platforms
const SocialIcon = ({ name }) => {
  switch (name) {
    case 'github':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
          <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
      );
    case 'x':
      return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function Footer({
  config = defaultSiteConfig,
  onNavigate
}) {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e, link) => {
    if (link.isExternal) return;
    if (link.href && link.href.startsWith('mailto:')) return;
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
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
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
        {/* Main 5-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '36px',
            alignItems: 'start'
          }}
        >
          {/* Column 1: Brand & Indian Business Compliance Details */}
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
              <BrandLogoIcon />
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
                {config.name}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: '#6b6b6b', lineHeight: 1.55, marginBottom: '16px' }}>
              {t(config.taglineKey)}
            </p>

            {/* Social Icons Bar including WhatsApp Business */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              {config.socials.map((social) => (
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
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>

            {/* Indian Corporate & Tax Compliance Details Block */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                padding: '12px 14px',
                fontSize: '11.5px',
                color: '#555555',
                lineHeight: 1.6,
                marginBottom: '16px'
              }}
            >
              <div style={{ fontWeight: 600, color: '#111111', marginBottom: '4px' }}>
                {config.legalEntityName}
              </div>
              <div>{t(config.registrationTextKey)}</div>
              {config.businessDetails?.cin && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px' }}>
                  CIN: {config.businessDetails.cin}
                </div>
              )}
              {config.businessDetails?.gstin && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px' }}>
                  GSTIN: {config.businessDetails.gstin}
                </div>
              )}
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
                <div><strong>Email:</strong> {config.contact.email}</div>
                <div><strong>Phone:</strong> {config.contact.phoneDisplay}</div>
                <div><strong>HQ:</strong> {config.contact.addressShort}</div>
              </div>
            </div>

            {/* Trust Badges Row (Indian Sovereign & Financial Assurance) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {config.trustBadges.map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: '#444444',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  <span style={{ color: '#16a34a', fontSize: '12px' }}>✓</span>
                  <span>{t(badge.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columns 2, 3, 4, 5: Navigation Columns */}
          {config.footerColumns.map((col) => (
            <div key={col.titleKey}>
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
                {t(col.titleKey)}
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
                  <li key={link.labelKey}>
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
                      {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright, Made in India, Operational Status */}
        <div
          style={{
            borderTop: '1px solid #e5e5e5',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: '#6b6b6b'
          }}
        >
          <div>
            © {currentYear} {config.legalEntityName} {t('footer.allRights')}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {config.systemStatus && (
              <a
                href={config.systemStatus.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#444444',
                  textDecoration: 'none'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    display: 'inline-block'
                  }}
                  aria-hidden="true"
                />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                  {t(config.systemStatus.statusKey)}
                </span>
              </a>
            )}

            <span style={{ fontWeight: 500, color: '#333333' }}>
              {t('footer.madeInIndia')}
            </span>
          </div>
        </div>
      </div>

      {/* Subtle 2px Indian Tricolor Accent Line at Base */}
      <div
        style={{
          height: '2px',
          width: '100%',
          marginTop: '24px',
          background: 'linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)'
        }}
        aria-hidden="true"
      />
    </footer>
  );
}
