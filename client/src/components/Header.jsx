/**
 * Responsive Header Component
 * Indian Developer-Tools / SaaS Product ("YourBrand")
 * 
 * Complies with strict Phase 2 & Calendly requirements:
 * - Sticky, white, 1px bottom border, ~56px height, max-width 1280px container
 * - Logo (24px black rounded-square with white icon) + bold wordmark from siteConfig.name
 * - Desktop nav from lg (1024px) up: Home, How it works, Pricing (₹), Docs ↗, GitHub ↗
 * - Accessible mobile hamburger (<1024px) with focus trap, Esc key listener, aria-expanded
 * - Right side: EN | हिन्दी toggle, Book a Demo CTA
 * - Calendly Integration:
 *   - Lazy-loads Calendly widget and CSS ONLY on hover or click (never on first paint)
 *   - Progressive fallback (<a href={url} target="_blank" rel="noopener noreferrer">)
 *   - If NEXT_PUBLIC_CALENDLY_URL is empty, completely hides booking buttons
 *   - In mobile drawer: closes drawer, opens popup, and returns focus to trigger
 *   - Visible focus states and aria-label "Book a demo (opens scheduling window)"
 */

import React, { useState, useEffect, useRef } from 'react';
import { siteConfig as defaultSiteConfig } from '../siteConfig';
import { useI18n } from '../context/I18nContext';
import { loadCalendlyAssets, openCalendly } from '../utils/calendly';

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
  const [isDesktop, setIsDesktop] = useState(true);

  const hamburgerButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const desktopCtaRef = useRef(null);
  const mobileCtaRef = useRef(null);

  const bookingUrl = config.booking?.url?.trim();

  // Responsive breakpoint: Desktop is >= 1024px (lg)
  useEffect(() => {
    const checkBreakpoint = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setMobileMenuOpen(false);
      }
    };
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  // Accessibility: Focus trap & Escape key listener for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const drawerElement = drawerRef.current;
    if (!drawerElement) return;

    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = drawerElement.querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setMobileMenuOpen(false);
        hamburgerButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = (e, link) => {
    if (link.isExternal) return;
    if (link.href && link.href.startsWith('mailto:')) return;

    if (link.href && link.href.startsWith('/')) {
      if (onNavigate) {
        e.preventDefault();
        const routeKey = link.href === '/' ? 'overview' : link.href.replace('/', '');
        onNavigate(routeKey);
        window.history.pushState(null, '', link.href);
      }
    } else if (link.href && link.href.startsWith('#')) {
      if (onNavigate && link.id) {
        e.preventDefault();
        onNavigate(link.id);
      }
    }
    setMobileMenuOpen(false);
  };

  const handleCalendlyClick = (e, isMobileDrawer = false) => {
    if (!bookingUrl) return;
    e.preventDefault();
    const trigger = isMobileDrawer ? hamburgerButtonRef.current : desktopCtaRef.current;
    if (isMobileDrawer) {
      setMobileMenuOpen(false);
    }
    openCalendly(bookingUrl, trigger);
  };

  const handleCalendlyHover = () => {
    if (bookingUrl) {
      loadCalendlyAssets();
    }
  };

  const showPlaygroundIndicator =
    Boolean(config.flags?.headerPlaygroundIndicator) &&
    Boolean(config.headerPlayground?.href || config.headerPlayground?.id);

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
      {/* Optional subtle 2px Indian Tricolor Accent Line - DISABLED by default */}
      {config.flags?.tricolorLine && (
        <div
          style={{
            height: '2px',
            width: '100%',
            background: 'linear-gradient(90deg, #ff9933 0%, #ff9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%, #138808 100%)'
          }}
          aria-hidden="true"
        />
      )}

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
        {/* Left: Brand Logo + Wordmark and Desktop Nav (lg: 1024px+) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('overview');
                window.history.pushState(null, '', '/');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#111111',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '-0.02em',
              outlineOffset: '2px'
            }}
            aria-label={`${config.name} home`}
          >
            <BrandLogoIcon />
            <span>{config.name}</span>
          </a>

          {/* Desktop Nav Links (from 1024px up) */}
          {isDesktop && (
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '24px' }}
              aria-label="Main navigation"
            >
              {config.headerNav.map((link) => {
                const isActive = !link.isExternal && (activeTab === link.id || (activeTab === 'overview' && link.href === '/'));
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
                      alignItems: 'center',
                      outlineOffset: '2px'
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

        {/* Right: Language Switcher, Optional Playground Indicator, CTA, Hamburger */}
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
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid #e5e5e5'
            }}
            aria-label={t('nav.switchLanguage')}
          >
            <button
              onClick={() => setLanguage('en')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '12px',
                fontWeight: language === 'en' ? 700 : 400,
                color: language === 'en' ? '#111111' : '#6b6b6b',
                fontFamily: 'inherit',
                outlineOffset: '2px'
              }}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <span style={{ color: '#d1d5db', padding: '0 2px' }} aria-hidden="true">|</span>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '12px',
                fontWeight: language === 'hi' ? 700 : 400,
                color: language === 'hi' ? '#111111' : '#6b6b6b',
                fontFamily: "'Noto Sans Devanagari', inherit",
                outlineOffset: '2px'
              }}
              aria-pressed={language === 'hi'}
            >
              हिन्दी
            </button>
          </div>

          {/* Optional Status / Playground Indicator - Rendered ONLY if configured */}
          {showPlaygroundIndicator && (
            <div
              onClick={() => onNavigate && onNavigate(config.headerPlayground?.id || 'voice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: onNavigate ? 'pointer' : 'default',
                userSelect: 'none'
              }}
              title="Interactive Playground"
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
          )}

          {/* Desktop CTA Button: "Book a Demo" - Hidden if booking URL is empty */}
          {isDesktop && Boolean(bookingUrl) && (
            <a
              ref={desktopCtaRef}
              href={bookingUrl}
              onClick={(e) => handleCalendlyClick(e, false)}
              onMouseEnter={handleCalendlyHover}
              onFocus={handleCalendlyHover}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('nav.bookDemoAria')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #111111',
                borderRadius: '4px',
                padding: '7px 14px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: '#111111',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                outlineOffset: '2px'
              }}
              onMouseEnterCapture={(e) => {
                e.currentTarget.style.backgroundColor = '#111111';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeaveCapture={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#111111';
              }}
            >
              <span>{t('nav.bookDemo')}</span>
            </a>
          )}

          {/* Mobile Hamburger Toggle (<1024px) */}
          {!isDesktop && (
            <button
              ref={hamburgerButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                background: 'transparent',
                border: '1px solid #e5e5e5',
                borderRadius: '4px',
                color: '#111111',
                cursor: 'pointer',
                padding: 0,
                outlineOffset: '2px'
              }}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.toggleMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Accessible Mobile Navigation Drawer (<1024px) */}
      {!isDesktop && mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          style={{
            position: 'absolute',
            top: '57px',
            left: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 99
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
                fontSize: '15px',
                color: '#111111',
                textDecoration: 'none',
                padding: '10px 4px',
                borderBottom: '1px solid #f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                outlineOffset: '2px'
              }}
            >
              <span>{t(link.labelKey)}</span>
              {link.isExternal && <ExternalArrowIcon />}
            </a>
          ))}

          {/* Mobile Drawer Booking Button - Hidden if booking URL is empty */}
          {Boolean(bookingUrl) && (
            <div style={{ paddingTop: '8px' }}>
              <a
                ref={mobileCtaRef}
                href={bookingUrl}
                onClick={(e) => handleCalendlyClick(e, true)}
                onMouseEnter={handleCalendlyHover}
                onFocus={handleCalendlyHover}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('nav.bookDemoAria')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#111111',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textDecoration: 'none',
                  outlineOffset: '2px'
                }}
              >
                <span>{t('nav.bookDemo')}</span>
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
