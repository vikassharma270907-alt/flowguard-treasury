/**
 * Clean Minimal Pricing Section in INR (₹)
 * Designed for Indian Developers, Startups, and Enterprises
 */

import React from 'react';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';

export default function PricingSection({ onBackToHome, onBookDemo }) {
  const { t } = useI18n();

  const plans = [
    {
      name: 'Developer Sandbox',
      price: '₹0',
      period: 'forever free',
      description: 'Ideal for local MCP testing, hackathons, and individual open-source developers.',
      features: [
        'Up to 10,000 monthly intent verifications',
        'Direct local MCP stdio & JSON-RPC connectivity',
        'Community Discord & GitHub support',
        'Single sandbox enclave key'
      ],
      cta: 'Start Free',
      ctaHref: 'https://github.com/vikassharma270907-alt/flowguard-treasury',
      popular: false
    },
    {
      name: 'Growth & Startup',
      price: '₹2,499',
      period: 'per month',
      description: 'Production voice-agent intent governance for fast-growing Indian tech startups.',
      features: [
        '250,000 monthly intent verifications',
        'Sub-5s dual supervisor approval workflows',
        'GST-compliant invoices with automatic B2B tax filing',
        'UPI, Netbanking & Razorpay billing',
        'Email & priority Slack support'
      ],
      cta: 'Get Started',
      ctaHref: siteConfig.booking?.url || `mailto:${siteConfig.contact.email}?subject=Growth%20Plan%20Inquiry`,
      popular: true
    },
    {
      name: 'Sovereign Enterprise',
      price: 'Custom',
      period: 'annual agreement',
      description: 'Dedicated VPC deployment inside Indian cloud regions with DPDP Act compliance.',
      features: [
        'Unlimited verified actions & audit logs',
        'Dedicated AWS ap-south-1 / GCP asia-south-1 residency',
        'Hardware Security Module (HSM) key isolation',
        'Custom air-gapped MCP connectors',
        '24/7 dedicated support & SLA guarantees'
      ],
      cta: 'Contact Sales',
      ctaHref: `mailto:${siteConfig.contact.email}?subject=Enterprise%20Inquiry`,
      popular: false
    }
  ];

  return (
    <section
      id="pricing"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px 60px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
      aria-labelledby="pricing-heading"
    >
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          display: 'inline-block',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 600,
          color: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          padding: '4px 10px',
          borderRadius: '4px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          Transparent Indian Pricing (INR)
        </div>
        <h1
          id="pricing-heading"
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            margin: '0 0 10px 0',
            color: 'var(--foreground, #111111)'
          }}
        >
          Predictable Pricing for Developers & Teams
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--muted-foreground, #6b6b6b)', margin: 0 }}>
          All paid plans include GST-compliant invoicing, rupee settlement, and sovereign data retention.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '24px',
          alignItems: 'stretch'
        }}
      >
        {plans.map((p) => (
          <div
            key={p.name}
            style={{
              backgroundColor: 'var(--card, #ffffff)',
              border: p.popular ? '2px solid #16a34a' : '1px solid var(--border, #e5e5e5)',
              borderRadius: '8px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: p.popular ? '0 10px 30px rgba(22, 163, 74, 0.08)' : 'none'
            }}
          >
            {p.popular && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}
              >
                Most Popular
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--foreground, #111111)' }}>
                {p.name}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--muted-foreground, #6b6b6b)', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground, #111111)', letterSpacing: '-0.02em' }}>
                  {p.price}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--muted-foreground, #6b6b6b)' }}>
                  / {p.period}
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: 'var(--foreground, #374151)' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={p.ctaHref}
              target={p.ctaHref.startsWith('http') ? '_blank' : undefined}
              rel={p.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                backgroundColor: p.popular ? '#16a34a' : 'transparent',
                color: p.popular ? '#ffffff' : 'var(--foreground, #111111)',
                border: p.popular ? 'none' : '1px solid var(--border, #111111)',
                borderRadius: '6px',
                padding: '12px 16px',
                minHeight: '44px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {p.cta}
            </a>
          </div>
        ))}
      </div>

      {onBackToHome && (
        <div style={{ textAlign: 'center', marginTop: '36px' }}>
          <button
            onClick={onBackToHome}
            style={{
              background: 'none',
              border: 'none',
              color: '#16a34a',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            ← Back to Overview
          </button>
        </div>
      )}
    </section>
  );
}
