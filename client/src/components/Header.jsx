/**
 * Reusable Responsive Header Component
 *
 * Design Spec:
 * - Clean, minimal, developer-tool look. White page, light gray borders.
 * - Sticky top bar (~56px height) with 1px bottom border (#e5e5e5).
 * - Left: 24px black rounded-square (radius 6px) with white "M" icon + bold "intentgate".
 * - Desktop nav links: 14px muted gray (#6b6b6b), 24px gap, dark on hover, inline ↗ for external links.
 * - Right: Green indicator dot + "PLAYGROUND" (monospace 11px uppercase) + "HACKATHON ↗" button.
 * - Mobile (<768px): Hamburger drawer preserving logo & PLAYGROUND indicator.
 */

import React, { useState, useEffect } from 'react';
import { headerConfig as defaultHeaderConfig } from './navConfig';

// Inline External Link Arrow ↗ SVG
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
    style={{ marginLeft: '3px', opacity: 0.85, display: 'inline-block', verticalAlign: '-1px' }}
    aria-hidden="true"
  >
    <path d="M7 17L17 7M17 7H7M17 7V17" />
  </svg>
);

// 24px Black Rounded-Square with White "M" Icon
export const IntentGateLogoIcon = () => (
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
  config = defaultHeaderConfig,
  activeTab = 'overview',
  onNavigate
}) {
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
        height: '56px',
        width: '100%',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          height: '100%',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left Side: Logo & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Logo + Wordmark */}
          <a
            href={config.brand.href}
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
            aria-label={`${config.brand.name} home`}
          >
            <IntentGateLogoIcon />
            <span>{config.brand.name}</span>
          </a>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '24px' }}
              aria-label="Main navigation"
            >
              {config.navLinks.map((link) => {
                const isActive = !link.isExternal && activeTab === link.id;
                return (
                  <a
                    key={link.label}
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
                    <span>{link.label}</span>
                    {link.isExternal && <ExternalArrowIcon />}
                  </a>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Side: Playground Indicator + Hackathon Button + Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Status Indicator (Always visible on mobile & desktop) */}
          <div
            onClick={() => onNavigate && onNavigate(config.statusIndicator.id || 'voice')}
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
              {config.statusIndicator.label}
            </span>
          </div>

          {/* Desktop HACKATHON ↗ Button */}
          {!isMobile && config.actionButton && (
            <a
              href={config.actionButton.href}
              target={config.actionButton.isExternal ? '_blank' : undefined}
              rel={config.actionButton.isExternal ? 'noopener noreferrer' : undefined}
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
              <span>{config.actionButton.label}</span>
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
              aria-label="Toggle navigation menu"
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
            top: '56px',
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
          {config.navLinks.map((link) => (
            <a
              key={link.label}
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
              <span>{link.label}</span>
              {link.isExternal && <ExternalArrowIcon />}
            </a>
          ))}

          {config.actionButton && (
            <div style={{ paddingTop: '8px' }}>
              <a
                href={config.actionButton.href}
                target={config.actionButton.isExternal ? '_blank' : undefined}
                rel={config.actionButton.isExternal ? 'noopener noreferrer' : undefined}
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
                <span>{config.actionButton.label}</span>
                <ExternalArrowIcon />
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
