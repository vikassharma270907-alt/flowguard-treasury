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
import { useTheme } from '../context/ThemeContext';
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

// Inline Accessible Sun SVG Icon (Light mode trigger)
const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// Inline Accessible Moon SVG Icon (Dark mode trigger)
const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

// 24px Rounded-Square with White Geometric Brand Icon
export const BrandLogoIcon = ({ isDark = false }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      backgroundColor: isDark ? '#18181b' : '#000000',
      border: isDark ? '1px solid #3f3f46' : '1px solid #000000',
      flexShrink: 0,
      transition: 'background-color 0.15s ease, border-color 0.15s ease'
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
  const { theme, isDark, toggleTheme } = useTheme();
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

    if (onNavigate) {
      e.preventDefault();
      if (link.id) {
        onNavigate(link.id);
      } else if (link.href === '/') {
        onNavigate('overview');
      } else {
        const clean = link.href.replace(/^\/+|\/?#|\/+$/g, '');
        onNavigate(clean || 'overview');
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
        backgroundColor: isDark ? 'rgba(9, 9, 11, 0.95)' : '#ffffff',
        backdropFilter: 'blur(12px)',
        borderBottom: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
        width: '100%',
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
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
          padding: isDesktop ? '0 20px' : '0 12px',
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
              color: isDark ? '#fafafa' : '#111111',
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '-0.02em',
              outlineOffset: '2px',
              transition: 'color 0.15s ease'
            }}
            aria-label={`${config.name} home`}
          >
            <BrandLogoIcon isDark={isDark} />
            <span>{config.name}</span>
          </a>

          {/* Desktop Nav Links (from 1024px up) */}
          {isDesktop && (
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '24px' }}
              aria-label="Main navigation"
            >
              {config.headerNav
                .filter((link) => !(link.id === 'pricing' && config.flags?.showPricing === false))
                .map((link) => {
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
                        color: isActive ? (isDark ? '#fafafa' : '#111111') : (isDark ? '#a1a1aa' : '#6b6b6b'),
                        textDecoration: 'none',
                        fontWeight: isActive ? 600 : 400,
                        transition: 'color 0.15s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        outlineOffset: '2px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = isDark ? '#ffffff' : '#111111')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? (isDark ? '#fafafa' : '#111111') : (isDark ? '#a1a1aa' : '#6b6b6b'))}
                    >
                      <span>{label}</span>
                      {link.badge && (
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontWeight: 700
                        }}>
                          {link.badge}
                        </span>
                      )}
                      {link.isExternal && <ExternalArrowIcon />}
                    </a>
                  );
                })}
            </nav>
          )}
        </div>

        {/* Right: Theme Toggle (Light/Dark Mode), Language Switcher, Optional Playground Indicator, CTA, Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? '10px' : '6px' }}>
          {/* Light / Dark Mode Button on Top Right Corner */}
          <button
            onClick={toggleTheme}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: isDark ? '#f4f4f5' : '#111111',
              backgroundColor: isDark ? '#18181b' : '#f7f7f5',
              padding: isDesktop ? '4px 9px' : '8px 10px',
              minHeight: '44px',
              minWidth: isDesktop ? 'auto' : '44px',
              borderRadius: '6px',
              border: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              fontFamily: 'inherit',
              outlineOffset: '2px',
              lineHeight: 1.2
            }}
            aria-label={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}
            title={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}
          >
            {isDark ? (
              <>
                <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
                  <SunIcon />
                </span>
                <span>{t('nav.themeLight')}</span>
              </>
            ) : (
              <>
                <span style={{ color: '#4f46e5', display: 'inline-flex', alignItems: 'center' }} aria-hidden="true">
                  <MoonIcon />
                </span>
                <span>{t('nav.themeDark')}</span>
              </>
            )}
          </button>

          {/* Language Switcher: "EN | हिन्दी" */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '12px',
              fontWeight: 500,
              color: isDark ? '#a1a1aa' : '#6b6b6b',
              backgroundColor: isDark ? '#18181b' : '#f7f7f5',
              padding: '2px 4px',
              minHeight: '44px',
              borderRadius: '6px',
              border: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            aria-label={t('nav.switchLanguage')}
          >
            <button
              onClick={() => setLanguage('en')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 6px',
                minHeight: '36px',
                fontSize: '12px',
                fontWeight: language === 'en' ? 700 : 400,
                color: language === 'en' ? (isDark ? '#fafafa' : '#111111') : (isDark ? '#a1a1aa' : '#6b6b6b'),
                fontFamily: 'inherit',
                outlineOffset: '2px'
              }}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <span style={{ color: isDark ? '#3f3f46' : '#d1d5db', padding: '0 2px' }} aria-hidden="true">|</span>
            <button
              onClick={() => setLanguage('hi')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 6px',
                minHeight: '36px',
                fontSize: '12px',
                fontWeight: language === 'hi' ? 700 : 400,
                color: language === 'hi' ? (isDark ? '#fafafa' : '#111111') : (isDark ? '#a1a1aa' : '#6b6b6b'),
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
                  color: isDark ? '#d4d4d8' : '#333333',
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
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                border: isDark ? '1px solid #3f3f46' : '1px solid #111111',
                borderRadius: '4px',
                padding: '7px 14px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#fafafa' : '#111111',
                textDecoration: 'none',
                transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                outlineOffset: '2px'
              }}
              onMouseEnterCapture={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#27272a' : '#111111';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeaveCapture={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? '#18181b' : '#ffffff';
                e.currentTarget.style.color = isDark ? '#fafafa' : '#111111';
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
                width: '44px',
                height: '44px',
                minWidth: '44px',
                minHeight: '44px',
                background: isDark ? '#18181b' : 'transparent',
                border: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
                borderRadius: '6px',
                color: isDark ? '#fafafa' : '#111111',
                cursor: 'pointer',
                padding: 0,
                outlineOffset: '2px',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.toggleMenu')}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            height: 'calc(100dvh - 57px)',
            maxHeight: 'calc(100dvh - 57px)',
            overflowY: 'auto',
            backgroundColor: isDark ? '#0d0d11' : '#ffffff',
            borderBottom: isDark ? '1px solid #27272a' : '1px solid #e5e5e5',
            boxShadow: isDark ? '0 12px 24px rgba(0, 0, 0, 0.6)' : '0 12px 24px rgba(0, 0, 0, 0.08)',
            padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px)) 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 99,
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}
        >
          {config.headerNav
            .filter((link) => !(link.id === 'pricing' && config.flags?.showPricing === false))
            .map((link) => (
            <a
              key={link.labelKey}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link)}
              target={link.isExternal ? '_blank' : undefined}
              rel={link.isExternal ? 'noopener noreferrer' : undefined}
              style={{
                fontSize: '15px',
                color: isDark ? '#fafafa' : '#111111',
                textDecoration: 'none',
                padding: '12px 4px',
                minHeight: '48px',
                borderBottom: isDark ? '1px solid #1c1c22' : '1px solid #f5f5f5',
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
                  backgroundColor: isDark ? '#ffffff' : '#111111',
                  borderRadius: '4px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isDark ? '#09090b' : '#ffffff',
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
