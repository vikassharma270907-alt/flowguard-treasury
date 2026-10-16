/**
 * Clean Minimal Pricing Section in INR (₹)
 * Designed for Indian Developers, Startups, and Enterprises
 * 
 * Complies with India-first currency handling:
 * - Reads plans directly from siteConfig.plans (single source of truth).
 * - All amounts stored as integer paise, converted only for display.
 * - Uses PriceDisplay component for all monetary representations.
 * - Indian digit grouping (e.g. ₹2,499, ₹1,00,000).
 * - Tax label ("Exclusive of GST") and breakdown rendered ONLY if gstRate is configured.
 * - Optional currency switcher (INR default, USD optional), OFF by default.
 * - Zero hardcoded currency formatting or ad-hoc toFixed.
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';
import PriceDisplay from './PriceDisplay';

export default function PricingSection({ onBackToHome, onBookDemo }) {
  const { t, language } = useI18n();
  const currencyConfig = siteConfig.currency || { base: 'INR', symbol: '₹', showGstNote: true };
  const enableSwitcher = Boolean(currencyConfig.enableCurrencySwitcher);

  // Currency switcher state: Defaults to INR for India-first visitors
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (typeof window === 'undefined') return 'INR';
    if (!enableSwitcher) return 'INR';
    const cookieMatch = document.cookie.match(/(?:^|; )preferred-currency=([^;]*)/);
    return cookieMatch ? decodeURIComponent(cookieMatch[1]) : 'INR';
  });

  const [exchangeRateData, setExchangeRateData] = useState({
    rate: null,
    isApproximate: false,
    loading: false
  });

  // Fetch exchange rate server-side only when USD is enabled and selected
  useEffect(() => {
    if (selectedCurrency !== 'USD') return;

    let isMounted = true;
    setExchangeRateData((prev) => ({ ...prev, loading: true }));

    fetch('/api/currency/rate')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && data.rate) {
          setExchangeRateData({
            rate: data.rate,
            isApproximate: Boolean(data.isApproximate || data.isFallback),
            loading: false
          });
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server exchange rate:', err);
        if (isMounted) {
          setExchangeRateData({ rate: 86.5, isApproximate: true, loading: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCurrency]);

  const handleCurrencyChange = (newCurrency) => {
    setSelectedCurrency(newCurrency);
    try {
      document.cookie = `preferred-currency=${encodeURIComponent(newCurrency)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      console.warn('Cookie write error:', e);
    }
  };

  const plans = siteConfig.plans || [];

  return (
    <section
      id="pricing"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px 60px 20px',
        fontFamily: "'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
      aria-labelledby="pricing-heading"
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--accent)',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          padding: '4px 10px',
          borderRadius: '4px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          {t('pricing.headingBadge') || 'Transparent Indian Pricing (INR)'}
        </div>
        <h1
          id="pricing-heading"
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 10px 0',
            color: 'var(--text)'
          }}
        >
          {t('pricing.headingTitle') || 'Predictable Pricing for Developers & Teams'}
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, maxWidth: '640px', marginLeft: 'auto', marginRight: 'auto' }}>
          {t('pricing.headingSubtitle') || 'All paid plans include GST-compliant invoicing, rupee settlement, and sovereign data retention.'}
        </p>

        {/* Optional Currency Switcher - OFF by default */}
        {enableSwitcher && (
          <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '3px', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '6px' }}>
            <button
              onClick={() => handleCurrencyChange('INR')}
              style={{
                background: selectedCurrency === 'INR' ? 'var(--accent)' : 'transparent',
                color: selectedCurrency === 'INR' ? 'var(--accent-foreground)' : 'var(--text)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ₹ INR
            </button>
            <button
              onClick={() => handleCurrencyChange('USD')}
              style={{
                background: selectedCurrency === 'USD' ? 'var(--accent)' : 'transparent',
                color: selectedCurrency === 'USD' ? 'var(--accent-foreground)' : 'var(--text)',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              $ USD
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}
      >
        {plans.map((p) => {
          const planName = t(p.nameKey) || p.name;
          const planDesc = t(p.descriptionKey) || p.description;
          const ctaLabel = t(p.ctaKey) || (p.popular ? 'Get Started' : 'Start Free');

          return (
            <div
              key={p.id || p.name}
              style={{
                backgroundColor: 'var(--surface)',
                border: p.popular ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: p.popular ? '0 10px 30px rgba(22, 163, 74, 0.08)' : 'none',
                transition: 'background-color 150ms ease, border-color 150ms ease'
              }}
            >
              {p.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '24px',
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {t('pricing.mostPopular') || 'Most Popular'}
                </div>
              )}

              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)' }}>
                  {planName}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px 0', lineHeight: 1.5 }}>
                  {planDesc}
                </p>

                {/* Centralized PriceDisplay Component */}
                <div style={{ marginBottom: '24px' }}>
                  <PriceDisplay
                    amountPaise={p.amountPaise}
                    isCustom={p.isCustom}
                    periodKey={p.periodKey}
                    currency={selectedCurrency}
                    usdRate={exchangeRateData.rate}
                    isApproximate={exchangeRateData.isApproximate}
                    showTax={true}
                    showBreakdown={currencyConfig.showGstNote}
                  />
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(p.featuresKeys || []).map((fKey, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: 'var(--text)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>✓</span>
                      <span>{t(fKey)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={p.ctaHref}
                target={p.ctaHref?.startsWith('http') ? '_blank' : undefined}
                rel={p.ctaHref?.startsWith('http') ? 'noopener noreferrer' : undefined}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: p.popular ? 'var(--accent)' : 'transparent',
                  color: p.popular ? 'var(--accent-foreground)' : 'var(--text)',
                  border: p.popular ? 'none' : '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background-color 150ms ease, color 150ms ease, border-color 150ms ease'
                }}
              >
                {ctaLabel}
              </a>
            </div>
          );
        })}
      </div>

      {onBackToHome && (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            onClick={onBackToHome}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {t('pricing.backToOverview') || '← Back to Overview'}
          </button>
        </div>
      )}
    </section>
  );
}
