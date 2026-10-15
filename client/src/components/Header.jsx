/**
 * Reusable Responsive Header Component
 * Indian Developer-Tools / SaaS Product ("YourBrand")
 *
 * Features:
 * - 2px subtle Indian Tricolor accent line (saffron / white / green)
 * - Sticky, white, 1px bottom border (#e5e5e5), 56px height
 * - Logo (24px black rounded-square with white icon) + bold wordmark
 * - Nav links driven by i18n ("Home", "How it works", "Pricing (₹)", "Docs ↗", "GitHub ↗", "Contact Sales")
 * - Language switcher: "EN | हिन्दी" toggle with localStorage persistence
 * - Status dot + "PLAYGROUND" (monospace 11px uppercase)
 * - CTA button: "BOOK A DEMO ↗"
 * - Mobile (<768px): Responsive hamburger drawer with logo & status indicator preserved
 */

import React, { useState, useEffect } from 'react';
import { siteConfig as defaultSiteConfig } from '../siteConfig';
import { useI18n } from '../context/I18nContext';

// Inline External Arrow ↗ SVG
const ExternalArrowIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: '4px', opacity: 0.85, display: 'inline-block', verticalAlign: '-1px' }}
    aria-hidden="true"
  >
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);

// 24px Black Rounded-Square with White Geometric Brand Icon
export const BrandLogoIcon = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      backgroundColor: '#000000',
      flexShrink: 0
    }}
    aria-hidden="true"
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5l8 7 8-7v14" />
    </svg>
  </span>
);

export default function Header({
  config = defaultSiteConfig,
  activeTab = 'overview',
  onNavigate
}) {
  const { language, setLanguage, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLinkClick = (e, link) => {
    if (link.isExternal) return;
    if (link.href && link.href.startsWith('mailto:')) return;
    e.preventDefault();
    if (onNavigate && link.id) {
      onNavigate(link.id);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e5e5',
        width: '100%',
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Subtle 2px Indian Tricolor Accent Line (Saffron, White, Green) */}
      <div
        style={{
          height: '2px',
          width: '100%',
          background: 'linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)'
        }}
        aria-hidden="true"
      />

      <div
        style={{
          maxWidth: '1280px',
          height: '56px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left Side: Logo + Wordmark & Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('overview');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              textDecoration: 'none',
              color: '#111111',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '-0.02em'
            }}
            aria-label={`${config.name} home`}
          >
            <BrandLogoIcon />
            <span>{config.name}</span>
          </a>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '22px' }}
              aria-label="Main navigation"
            >
              {config.headerNav.map((link) => {
                const isActive = !link.isExternal && activeTab === link.id;
                const label = t(link.labelKey);

                return (
                  <a
                    key={link.labelKey}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    target={link.isExternal ? '_blank' : undefined}
                    rel={link.isExternal ? 'noopener noreferrer' : undefined}
                    style={{
                      fontSize: '14px',
                      color: isActive ? '#111111' : '#6b6b6b',
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'color 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#111111')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? '#111111' : '#6b6b6b')}
                  >
                    <span>{label}</span>
                    {link.isExternal && <ExternalArrowIcon />}
                  </a>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Language Switcher, Playground Indicator, Book a Demo CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Language Switcher: "EN | हिन्दी" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6b6b6b',
              backgroundColor: '#f7f7f5',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #e5e5e5'
            }}
            aria-label="Language selection"
          >
            <button
              onClick={() => setLanguage('en')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: '12px',
                fontWeight: language === 'en' ? 700 : 400,
                color: language === 'en' ? '#111111' : '#6b6b6b',
                fontFamily: 'inherit'
              }}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <span style={{ color: '#d1d5db', padding: '0 2px' }}>|</span>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                fontSize: '12px',
                fontWeight: language === 'hi' ? 700 : 400,
                color: language === 'hi' ? '#111111' : '#6b6b6b',
                fontFamily: "'Noto Sans Devanagari', inherit"
              }}
              aria-pressed={language === 'hi'}
            >
              हिन्दी
            </button>
          </div>

          {/* Green Status Indicator: "PLAYGROUND" (Monospace uppercase) */}
          <div
            onClick={() => onNavigate && onNavigate(config.headerPlayground?.id || 'voice')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: onNavigate ? 'pointer' : 'default',
              userSelect: 'none'
            }}
            title="Interactive Voice & Intent Governance Playground"
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
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: '#333333',
                textTransform: 'uppercase'
              }}
            >
              {t(config.headerPlayground?.labelKey || 'nav.playground')}
            </span>
          </div>

          {/* Desktop CTA Button: "BOOK A DEMO ↗" */}
          {!isMobile && config.headerCta && (
            <a
              href={config.headerCta.href}
              target={config.headerCta.isExternal ? '_blank' : undefined}
              rel={config.headerCta.isExternal ? 'noopener noreferrer' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                padding: '8px 16px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: '#111111',
                textDecoration: 'none',
                textTransform: 'uppercase',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#d4d4d4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e5e5e5';
              }}
            >
              <span>{t(config.headerCta.labelKey)}</span>
              <ExternalArrowIcon />
            </a>
          )}

          {/* Mobile Hamburger Toggle */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                color: '#111111',
                cursor: 'pointer',
                padding: 0
              }}
              aria-label={t('nav.toggleMenu')}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 12h16M4 6h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '58px',
            left: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {config.headerNav.map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link)}
              target={link.isExternal ? '_blank' : undefined}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
              style={{
                fontSize: '14px',
                color: '#111111',
                textDecoration: 'none',
                padding: '8px 0',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{t(link.labelKey)}</span>
              {link.isExternal && <ExternalArrowIcon />}
            </a>
          ))}

          {config.headerCta && (
            <div style={{ paddingTop: '8px' }}>
              <a
                href={config.headerCta.href}
                target={config.headerCta.isExternal ? '_blank' : undefined}
                rel={config.headerCta.isExternal ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e5e5',
                  borderRadius: '4px',
                  padding: '10px 16px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: '#111111',
                  textDecoration: 'none',
                  textTransform: 'uppercase'
                }}
              >
                <span>{t(config.headerCta.labelKey)}</span>
                <ExternalArrowIcon />
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
