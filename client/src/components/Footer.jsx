/**
 * Responsive Footer Component
 * BeyondFlow Responsive Footer Component
 * 
 * Complies with strict Phase 2 & Booking requirements:
 * - Background #f7f7f5, 1px top border (#e5e5e5), 64px vertical padding
 * - 5 columns on desktop (>=1024px), 2 columns on mobile (<1024px)
 *   1: Brand + contact, 2: Product, 3: For Business, 4: Developers, 5: Company & Legal
 * - Headings: monospace, uppercase, 11px, letter-spacing 0.08em, muted gray
 * - Links: 14px, #444, hover darker or underlined
 * - Contact block:
 *   - Plain text email rendered in HTML with client-built mailto link and aria-label
 *   - Address: "Indore, Madhya Pradesh, India" (Hindi: "इंदौर, मध्य प्रदेश, भारत")
 *   - No phone numbers, no telephone links, no empty rows/labels
 *   - No WhatsApp or messaging links
 * - Booking integration: "Book a call" opens scheduling window; hidden if booking URL is empty
 * - CIN & GSTIN rendered ONLY if set
 * - Trust badges and tricolor accent DISABLED by default
 * - Bottom bar: © {currentYear} {legalName}. All rights reserved.
 * - "Made with ♥ in India" text (no emoji flag)
 * - Social icons: inline SVGs with aria-labels, no third-party brand dependencies
 */

import React, { useState, useEffect, useRef } from 'react';
import { siteConfig as defaultSiteConfig, SUPPORT_EMAIL } from '../siteConfig';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { BrandLogoIcon } from './Header';
import { loadCalendlyAssets, openCalendly } from '../utils/calendly';

// Inline Accessible SVGs for Social Platforms (no third-party icon dependencies)
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
    default:
      return null;
  }
};

export default function Footer({
  config = defaultSiteConfig,
  onNavigate
}) {
  const { t, language } = useI18n();
  const { isDark } = useTheme();
  const currentYear = new Date().getFullYear();
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [mailtoHref, setMailtoHref] = useState('');
  const bookingTriggerRef = useRef(null);

  const bookingUrl = config.booking?.url?.trim();

  // Build mailto href dynamically on client to reduce automated web scraping
  useEffect(() => {
    const email = SUPPORT_EMAIL;
    const parts = email.split('@');
    if (parts.length === 2) {
      setMailtoHref(`mailto:${parts[0]}@${parts[1]}`);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = (e, link) => {
    if (link.isBooking) {
      e.preventDefault();
      if (bookingUrl) {
        openCalendly(bookingUrl, e.currentTarget);
      }
      return;
    }

    if (link.isExternal) return;
    if (link.href && link.href.startsWith('mailto:')) return;

    if (link.href && link.href.startsWith('/')) {
      if (onNavigate) {
        e.preventDefault();
        const routeKey = link.href === '/' ? 'overview' : link.href.replace('/', '');
        onNavigate(routeKey);
        window.history.pushState(null, '', link.href);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (link.href && link.href.startsWith('#')) {
      if (onNavigate && link.id) {
        e.preventDefault();
        onNavigate(link.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBookingHover = () => {
    if (bookingUrl) {
      loadCalendlyAssets();
    }
  };

  // CIN and GSTIN condition: Render ONLY if valid string is set, never empty/placeholder
  const hasCin = Boolean(config.businessDetails?.cin && config.businessDetails.cin.trim());
  const hasGstin = Boolean(config.businessDetails?.gstin && config.businessDetails.gstin.trim());

  // Localized address
  const addressText = language === 'hi' ? 'इंदौर, मध्य प्रदेश, भारत' : 'Indore, Madhya Pradesh, India';

  return (
    <footer
      style={{
        width: '100%',
        backgroundColor: isDark ? '#0d0d11' : '#f7f7f5',
        borderTop: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
        color: isDark ? '#fafafa' : '#111111',
        padding: '64px 20px 32px 20px',
        marginTop: '60px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}
      aria-label="Site footer"
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}
      >
        {/* Main Columns Grid: 2 columns on mobile, 5 on desktop */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1.4fr 1fr 1fr 1fr 1.1fr' : isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
            gap: isDesktop ? '36px' : '28px 20px',
            alignItems: 'start'
          }}
        >
          {/* Column 1: Brand + Contact & Indian Business Details */}
          <div style={{ gridColumn: isDesktop ? 'auto' : '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
              <BrandLogoIcon isDark={isDark} />
              <span style={{ fontSize: '16px', fontWeight: 700, color: isDark ? '#fafafa' : '#111111', letterSpacing: '-0.02em' }}>
                {config.name}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: isDark ? '#a1a1aa' : '#6b6b6b', lineHeight: 1.55, marginBottom: '16px', maxWidth: '340px' }}>
              {t(config.taglineKey)}
            </p>

            {/* Social Icons Bar (inline SVGs with aria-labels) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              {config.socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  style={{
                    color: isDark ? '#a1a1aa' : '#6b6b6b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s ease',
                    textDecoration: 'none',
                    outlineOffset: '2px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#ffffff' : '#111111')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? '#a1a1aa' : '#6b6b6b')}
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </div>

            {/* Contact & Legal Entity Block */}
            <div
              style={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                border: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '12px',
                color: isDark ? '#d4d4d8' : '#4b5563',
                lineHeight: 1.6,
                maxWidth: '340px'
              }}
            >
              <div style={{ fontWeight: 600, color: isDark ? '#fafafa' : '#111111', marginBottom: '4px' }}>
                {config.legalEntityName}
              </div>
              <div>{t(config.registrationTextKey)}</div>

              {/* CIN: Renders ONLY if configured, never placeholder */}
              {hasCin && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', marginTop: '2px' }}>
                  {t('contact.cin')}: {config.businessDetails.cin}
                </div>
              )}

              {/* GSTIN: Renders ONLY if configured, never placeholder */}
              {hasGstin && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                  {t('contact.gstin')}: {config.businessDetails.gstin}
                </div>
              )}

              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: isDark ? '1px solid #27272a' : '1px solid #f0f0f0' }}>
                {/* Render email as plain text in the HTML and build mailto link on client */}
                <div>
                  <strong>{t('contact.email')}:</strong>{' '}
                  <a
                    href={mailtoHref || `mailto:${SUPPORT_EMAIL}`}
                    aria-label={`Send email to support at ${SUPPORT_EMAIL}`}
                    style={{ color: isDark ? '#38bdf8' : '#111111', textDecoration: 'none', outlineOffset: '2px' }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    <span>{SUPPORT_EMAIL}</span>
                  </a>
                </div>
                <div style={{ marginTop: '2px' }}>
                  <strong>{t('contact.office')}:</strong> <span>{addressText}</span>
                </div>
              </div>
            </div>

            {/*
              Trust badges (Data stored in India, UPI/Razorpay supported, GST-compliant invoices)
              are config-driven and DISABLED by default.
              They MUST ONLY be enabled if verified true for the business entity.
            */}
            {config.flags?.trustBadges && config.trustBadges?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                {config.trustBadges.map((badge, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: isDark ? '#d4d4d8' : '#374151',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    <span style={{ color: '#16a34a', fontSize: '12px' }} aria-hidden="true">✓</span>
                    <span>{t(badge.key)}</span>
                  </div>
                ))}
              </div>
            )}
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
                  color: isDark ? '#a1a1aa' : '#6b6b6b',
                  marginBottom: '14px',
                  margin: '0 0 14px 0'
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
                  gap: '10px'
                }}
              >
                {col.links.map((link) => {
                  // If this is the booking link and bookingUrl is empty, hide it completely
                  if (link.isBooking && !bookingUrl) {
                    return null;
                  }

                  if (link.isBooking) {
                    return (
                      <li key={link.labelKey}>
                        <a
                          ref={bookingTriggerRef}
                          href={bookingUrl}
                          onClick={(e) => handleLinkClick(e, link)}
                          onMouseEnter={handleBookingHover}
                          onFocus={handleBookingHover}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${t(link.labelKey)} - ${t('nav.bookDemoAria')}`}
                          style={{
                            fontSize: '14px',
                            color: isDark ? '#d4d4d8' : '#444444',
                            textDecoration: 'none',
                            transition: 'color 0.15s ease',
                            cursor: 'pointer',
                            outlineOffset: '2px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = isDark ? '#ffffff' : '#111111';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = isDark ? '#d4d4d8' : '#444444';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          {t(link.labelKey)}
                        </a>
                      </li>
                    );
                  }

                  // BeyondFlow Guide (PDF) link
                  if (link.isGuidePdf) {
                    if (!config.guidePdf?.enabled || link.enabled === false) {
                      return null;
                    }
                    const sizeText = config.guidePdf?.sizeLabel || '32 KB';
                    const pagesCount = config.guidePdf?.pages || 24;
                    const pdfHref = config.guidePdf?.path || link.href;
                    const ariaLabel = `${t(link.labelKey)} - ${t('links.guidePdfAria', { pages: pagesCount, size: sizeText })}`;

                    return (
                      <li key={link.labelKey}>
                        <a
                          href={pdfHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={ariaLabel}
                          style={{
                            fontSize: '14px',
                            color: isDark ? '#d4d4d8' : '#444444',
                            textDecoration: 'none',
                            transition: 'color 0.15s ease',
                            cursor: 'pointer',
                            outlineOffset: '2px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            minHeight: '44px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = isDark ? '#ffffff' : '#111111';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = isDark ? '#d4d4d8' : '#444444';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          <span>{t(link.labelKey)}</span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isDark ? '#a1a1aa' : '#6b7280',
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 500,
                              lineHeight: 1
                            }}
                          >
                            PDF · {sizeText}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }} aria-hidden="true">↗</span>
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={link.labelKey}>
                      <a
                        href={link.href}
                        onClick={(e) => handleLinkClick(e, link)}
                        target={link.isExternal ? '_blank' : undefined}
                        rel={link.isExternal ? 'noopener noreferrer' : undefined}
                        style={{
                          fontSize: '14px',
                          color: isDark ? '#d4d4d8' : '#444444',
                          textDecoration: 'none',
                          transition: 'color 0.15s ease',
                          cursor: 'pointer',
                          outlineOffset: '2px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = isDark ? '#ffffff' : '#111111';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isDark ? '#d4d4d8' : '#444444';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {t(link.labelKey)}
                        {link.isExternal && (
                          <span style={{ marginLeft: '3px', fontSize: '10px', opacity: 0.7 }} aria-hidden="true">↗</span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright, Made with Heart in India (No emoji flag), System Status */}
        <div
          style={{
            borderTop: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            fontSize: '12px',
            color: isDark ? '#a1a1aa' : '#6b6b6b'
          }}
        >
          <div>
            © {currentYear} {config.legalEntityName}. {t('footer.allRights')}
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
                  color: isDark ? '#d4d4d8' : '#4b5563',
                  textDecoration: 'none',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  outlineOffset: '2px'
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
                <span>{t(config.systemStatus.statusKey)}</span>
              </a>
            )}

            {/* "Made with ♥ in India" text representation - NEVER an emoji flag */}
            <span style={{ fontWeight: 500, color: isDark ? '#d4d4d8' : '#374151' }}>
              {t('footer.madeInIndia')}
            </span>
          </div>
        </div>
      </div>

      {/* Optional subtle 2px Indian Tricolor Accent Line - DISABLED by default */}
      {config.flags?.tricolorLine && (
        <div
          style={{
            height: '2px',
            width: '100%',
            marginTop: '24px',
            background: 'linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)'
          }}
          aria-hidden="true"
        />
      )}
    </footer>
  );
}
