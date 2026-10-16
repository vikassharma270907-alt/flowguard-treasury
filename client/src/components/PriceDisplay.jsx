/**
 * PriceDisplay Component
 * 
 * Complies with India-first currency handling:
 * - Takes amount in integer paise and renders formatted INR using formatINR.
 * - Single component used everywhere prices appear (no component formats money on its own).
 * - Indian digit grouping: ₹1,00,000 (not ₹100,000).
 * - Whole rupees by default, with paise only when amount has a fractional part.
 * - Tax label under prices: "Exclusive of GST" or "Inclusive of GST" - shown ONLY if gstRate is set.
 * - GST breakdown (base + GST) shown ONLY when showGstNote is true and gstRate is set.
 * - Never invents or assumes a GST rate.
 * - Supports optional USD display with server-fetched rate and "approximate" label.
 * - Uses explicit locale ('en-IN' or 'hi-IN'), avoiding hydration mismatch.
 */

import React from 'react';
import { useI18n } from '../context/I18nContext';
import { siteConfig } from '../siteConfig';
import { formatINR, formatINRCompact, calculateGST } from '../utils/currency';

export default function PriceDisplay({
  amountPaise,
  isCustom = false,
  customTextKey = 'currency.custom',
  periodKey,
  periodText,
  showTax = true,
  showBreakdown = true,
  compact = false,
  currency = 'INR',
  usdRate = null,
  isApproximate = false,
  style = {},
  priceStyle = {},
  taxStyle = {}
}) {
  const { t, language } = useI18n();
  const explicitLocale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const currencyConfig = siteConfig.currency || { base: 'INR', symbol: '₹', showGstNote: true };
  const gstRate = currencyConfig.gstRate;
  const taxMode = currencyConfig.taxMode || 'exclusive';

  // Handle custom enterprise pricing
  if (isCustom || amountPaise === null || amountPaise === undefined) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', ...style }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground, #111111)', letterSpacing: '-0.02em', ...priceStyle }}>
            {t(customTextKey) || 'Custom'}
          </span>
          {(periodKey || periodText) && (
            <span style={{ fontSize: '13px', color: 'var(--muted-foreground, #6b6b6b)' }}>
              / {periodKey ? t(periodKey) : periodText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Handle USD display when currency switcher is enabled & active
  if (currency === 'USD' && usdRate && usdRate > 0) {
    const rupees = amountPaise / 100;
    const usdValue = Math.round((rupees / usdRate) * 100) / 100;
    const formattedUsd = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: usdValue % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    }).format(usdValue);

    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', ...style }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--foreground, #111111)', letterSpacing: '-0.02em', ...priceStyle }}>
            {formattedUsd}
          </span>
          {isApproximate && (
            <span
              style={{
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--muted-foreground, #6b6b6b)',
                backgroundColor: 'rgba(107, 114, 128, 0.1)',
                padding: '1px 6px',
                borderRadius: '3px'
              }}
              title={t('currency.approximate') || 'approx.'}
            >
              {t('currency.approximate') || 'approx.'}
            </span>
          )}
          {(periodKey || periodText) && (
            <span style={{ fontSize: '13px', color: 'var(--muted-foreground, #6b6b6b)' }}>
              / {periodKey ? t(periodKey) : periodText}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Primary India-First INR (₹) Display
  const formattedPrice = compact
    ? formatINRCompact(amountPaise, { inPaise: true, locale: explicitLocale })
    : formatINR(amountPaise, { inPaise: true, locale: explicitLocale });

  // Calculate GST strictly without assuming a rate if none configured
  const gstCalculation = calculateGST(amountPaise, gstRate, taxMode);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', ...style }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          data-amount-paise={amountPaise}
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: 'var(--foreground, #111111)',
            letterSpacing: '-0.02em',
            ...priceStyle
          }}
        >
          {formattedPrice}
        </span>
        {(periodKey || periodText) && (
          <span style={{ fontSize: '13px', color: 'var(--muted-foreground, #6b6b6b)' }}>
            / {periodKey ? t(periodKey) : periodText}
          </span>
        )}
      </div>

      {/* Tax note under price: rendered ONLY if gstRate is configured, never assumed */}
      {showTax && gstCalculation.hasGst && (
        <div style={{ marginTop: '4px', fontSize: '11.5px', color: 'var(--muted-foreground, #6b6b6b)', lineHeight: 1.4, ...taxStyle }}>
          <div>
            {taxMode === 'inclusive' ? t('currency.inclusiveGst') : t('currency.exclusiveGst')}
          </div>

          {/* Optional GST breakdown: rendered ONLY if showGstNote is true */}
          {showBreakdown && currencyConfig.showGstNote && amountPaise > 0 && (
            <div style={{ fontSize: '10.5px', opacity: 0.85, marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
              {taxMode === 'exclusive' ? (
                <>
                  + {formatINR(gstCalculation.gstAmountPaise, { inPaise: true, locale: explicitLocale })} ({gstCalculation.gstRatePercentage}% GST) = {formatINR(gstCalculation.totalAmountPaise, { inPaise: true, locale: explicitLocale })}
                </>
              ) : (
                <>
                  (Base: {formatINR(gstCalculation.baseAmountPaise, { inPaise: true, locale: explicitLocale })} + {formatINR(gstCalculation.gstAmountPaise, { inPaise: true, locale: explicitLocale })} GST)
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
