/**
 * BeyondFlow Unified Responsive Header Component (Task 3)
 *
 * Merges the stacked navigation bars into a single unified header:
 * - Single theme toggle with accessible icon and tooltips (no duplicate "Dark" button)
 * - Zero duplicate entries: "Demo video (3:49)" and "How It Works" appear once
 * - "Judge quick start" CTA button linking directly to /judges
 * - Embedded status badges (ArmorIQ Live PEP + MCP /mcp with WCAG AA contrast)
 * - Scenario selector dropdown (Scenarios A, B, C, D)
 * - State refresh button and user session indicator
 * - Accessible mobile hamburger drawer with focus trap & Esc key listener
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, RefreshCw, ChevronDown, Sliders,
  User, ExternalLink
} from 'lucide-react';
import { siteConfig as defaultSiteConfig } from '../siteConfig';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

// Inline Accessible Sun SVG Icon (Light mode trigger)
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      width: '26px',
      height: '26px',
      borderRadius: '6px',
      backgroundColor: isDark ? '#18181b' : '#000000',
      border: isDark ? '1px solid #3f3f46' : '1px solid #000000',
      flexShrink: 0,
      transition: 'background-color 0.15s ease, border-color 0.15s ease'
    }}
    aria-hidden="true"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5l8 7 8-7v14" />
    </svg>
  </span>
);

export default function Header({
  config = defaultSiteConfig,
  activeTab = 'overview',
  onNavigate,
  systemStatus,
  onSelectScenario,
  isRefreshing,
  onRefresh,
  userSession,
  onOpenOAuth,
  onLogout
}) {
  const { language, setLanguage, t } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const hamburgerButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const scenarioMenuRef = useRef(null);

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

  // Close scenario menu when clicking outside
  useEffect(() => {
    if (!scenarioOpen) return;
    const handleClickOutside = (e) => {
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(e.target)) {
        setScenarioOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setScenarioOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scenarioOpen]);

  // Accessibility: Focus trap & Escape key listener for mobile drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const drawerElement = drawerRef.current;
    if (!drawerElement) return;

    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = drawerElement.querySelectorAll(focusableSelectors);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

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
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const scenarios = [
    {
      id: 'SCENARIO_A',
      title: 'Scenario A: Baseline Multi-Currency Run',
      desc: 'Standard operations, healthy liquidity reserve ($15,000 floor), $0 local rails prioritized.',
      badge: 'NORMAL OPS',
      color: '#10b981'
    },
    {
      id: 'SCENARIO_B',
      title: 'Scenario B: Duplicate Invoice Attack',
      desc: 'Injects candidate INV-2024-884B with 91.2% similarity to trigger duplicate shield.',
      badge: 'ATTACK SIM',
      color: '#ef4444'
    },
    {
      id: 'SCENARIO_C',
      title: 'Scenario C: Delayed Receivable Shock',
      desc: 'Simulates a $14,500 customer receipt delay, auto-deferring low-priority vendor disbursements.',
      badge: 'LIQUIDITY STRESS',
      color: '#f59e0b'
    },
    {
      id: 'SCENARIO_D',
      title: 'Scenario D: Sandbox Deposit (+ $25,000)',
      desc: 'Simulates Airwallex inbound deposit to replenish wallet balances and unlock held invoices.',
      badge: 'REPLENISHMENT',
      color: '#3b82f6'
    }
  ];

  const currentScenarioObj = scenarios.find(s => s.id === systemStatus?.activeScenario) || scenarios[0];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* TIER 1: Main Brand, Navigation Links, Theme Toggle, Language, and Judge CTA (56px) */}
      <div
        style={{
          backgroundColor: isDark ? 'rgba(9, 9, 11, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            height: '56px',
            margin: '0 auto',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          {/* Left: Brand Logo + Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: 0 }}>
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
                gap: '8px',
                textDecoration: 'none',
                color: 'var(--foreground)',
                fontWeight: 800,
                fontSize: '15.5px',
                letterSpacing: '-0.02em',
                outlineOffset: '2px',
                flexShrink: 0
              }}
              aria-label={`${config.name} home`}
            >
              <BrandLogoIcon isDark={isDark} />
              <span>{config.name}</span>
            </a>

            {/* Desktop Nav Links */}
            {isDesktop && (
              <nav
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1.2vw, 16px)',
                  flexWrap: 'nowrap'
                }}
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
                          fontSize: '13px',
                          color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                          textDecoration: 'none',
                          fontWeight: isActive ? 700 : 500,
                          transition: 'color 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 6px',
                          borderRadius: '6px',
                          outlineOffset: '2px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = isActive ? 'var(--foreground)' : 'var(--muted-foreground)')}
                      >
                        <span>{label}</span>
                        {link.badge && (
                          <span style={{
                            fontSize: '0.62rem',
                            padding: '1px 5px',
                            borderRadius: '9999px',
                            background: 'var(--badge-nav-bg)',
                            color: 'var(--badge-nav-text)',
                            border: '1px solid var(--badge-nav-border)',
                            fontWeight: 700
                          }}>
                            {link.badge}
                          </span>
                        )}
                        {link.isExternal && <ExternalLink size={11} style={{ opacity: 0.7 }} />}
                      </a>
                    );
                  })}
              </nav>
            )}
          </div>

          {/* Right: Theme Toggle, Language, Judge quick start CTA, Mobile Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Single Theme Toggle Button (Light/Dark Mode) */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--foreground)',
                backgroundColor: 'var(--secondary)',
                padding: '6px 10px',
                minHeight: '34px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                outlineOffset: '2px'
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
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                backgroundColor: 'var(--secondary)',
                padding: '2px 4px',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}
              aria-label={t('nav.switchLanguage')}
            >
              <button
                onClick={() => setLanguage('en')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '11.5px',
                  fontWeight: language === 'en' ? 700 : 400,
                  color: language === 'en' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontFamily: 'inherit',
                  outlineOffset: '2px'
                }}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <span style={{ opacity: 0.4 }} aria-hidden="true">|</span>
              <button
                onClick={() => setLanguage('hi')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  fontSize: '11.5px',
                  fontWeight: language === 'hi' ? 700 : 400,
                  color: language === 'hi' ? 'var(--foreground)' : 'var(--muted-foreground)',
                  fontFamily: "'Noto Sans Devanagari', inherit",
                  outlineOffset: '2px'
                }}
                aria-pressed={language === 'hi'}
              >
                हिन्दी
              </button>
            </div>

            {/* Judge Quick Start Button (Replaces "Book a Demo", linking to /judges) */}
            {isDesktop && (
              <a
                href="/judges"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate('judges');
                  window.history.pushState(null, '', '/judges');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--brand-indigo, #4f46e5)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '6px',
                  padding: '7px 13px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.35)',
                  whiteSpace: 'nowrap'
                }}
                aria-label={t('nav.bookDemoAria')}
              >
                <ShieldCheck size={14} color="#ffffff" />
                <span style={{ color: '#ffffff' }}>{t('nav.bookDemo')}</span>
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
                  width: '40px',
                  height: '40px',
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  padding: 0,
                  outlineOffset: '2px'
                }}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav-drawer"
                aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.toggleMenu')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2: Secondary Control Bar (Desktop >= 1024px) */}
      {isDesktop && (
        <div
          style={{
            backgroundColor: isDark ? 'rgba(13, 13, 17, 0.94)' : 'rgba(248, 250, 252, 0.96)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease'
          }}
        >
          <div
            style={{
              maxWidth: '1440px',
              height: '42px',
              margin: '0 auto',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            {/* Tier 2 Left: Live PEP + MCP Status + Environment notice */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  whiteSpace: 'nowrap'
                }}
                title="ArmorIQ Policy Enforcement Point Active (proxy.armoriq.ai)"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                Live PEP Active
              </span>

              <span
                onClick={() => onNavigate && onNavigate('admin')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--badge-mcp-text, #0369a1)',
                  background: 'var(--badge-mcp-bg, rgba(3, 105, 161, 0.1))',
                  border: '1px solid var(--badge-mcp-border, rgba(3, 105, 161, 0.35))',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                title="Model Context Protocol Server Active (/mcp & stdio)"
              >
                MCP /mcp Active
              </span>

              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sandbox environment · Synthetic Airwallex balances & test orders
              </span>
            </div>

            {/* Tier 2 Right: Scenario Switcher + Refresh + User Session */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {/* Scenario Selector Dropdown */}
              {onSelectScenario && (
                <div style={{ position: 'relative' }} ref={scenarioMenuRef}>
                  <button
                    onClick={() => setScenarioOpen(!scenarioOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                    aria-label="Select demo scenario"
                    aria-expanded={scenarioOpen}
                    title="Switch hackathon test scenario"
                  >
                    <Sliders size={12} style={{ color: currentScenarioObj.color || 'var(--foreground)' }} />
                    <span>{currentScenarioObj.badge}</span>
                    <ChevronDown size={11} />
                  </button>

                  {scenarioOpen && (
                    <div
                      className="scenario-dropdown-panel"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        width: '320px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                        padding: '8px',
                        zIndex: 200
                      }}
                    >
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted-foreground)', padding: '4px 8px', textTransform: 'uppercase' }}>
                        Select Test Scenario
                      </div>
                      {scenarios.map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => {
                            onSelectScenario(sc.id);
                            setScenarioOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: systemStatus?.activeScenario === sc.id ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            marginBottom: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--foreground)' }}>{sc.title}</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: sc.color, padding: '1px 5px', borderRadius: '4px', background: `${sc.color}22` }}>
                              {sc.badge}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>{sc.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* State Refresh Button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--secondary)',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                  aria-label="Refresh treasury and ArmorIQ state"
                  title="Refresh treasury state"
                >
                  <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              )}

              {/* User Session Menu */}
              {userSession?.authenticated && (
                <button
                  onClick={onOpenOAuth}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--secondary)',
                    color: 'var(--foreground)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="Logged in administrator identity"
                >
                  <User size={12} />
                  <span>{userSession.user?.name || 'Admin'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Accessible Mobile Drawer (<1024px) */}
      {!isDesktop && mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          ref={drawerRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderBottom: '1px solid var(--border)',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            zIndex: 99
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          {/* Quick Start for Judges */}
          <a
            href="/judges"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
              if (onNavigate) onNavigate('judges');
              window.history.pushState(null, '', '/judges');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--brand-indigo, #4f46e5)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            <ShieldCheck size={16} color="#ffffff" />
            <span style={{ color: '#ffffff' }}>Judge Quick Start (/judges)</span>
          </a>

          {/* Navigation Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {config.headerNav.map((link) => {
              const label = t(link.labelKey);
              return (
                <a
                  key={link.labelKey}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link)}
                  target={link.isExternal ? '_blank' : undefined}
                  rel={link.isExternal ? 'noopener noreferrer' : undefined}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{label}</span>
                  {link.badge && (
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--pill-watch-bg)', color: 'var(--pill-watch-text)' }}>
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* Scenarios on Mobile */}
          {onSelectScenario && (
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Test Scenarios
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      onSelectScenario(sc.id);
                      setMobileMenuOpen(false);
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: systemStatus?.activeScenario === sc.id ? 'rgba(56, 189, 248, 0.15)' : 'var(--secondary)',
                      color: 'var(--foreground)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    {sc.badge}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
