/**
 * Currency Formatting & Calculation Utilities
 * Optimized for Indian Rupee (INR - ₹) with Indian Digit Grouping
 * 
 * Rules:
 * - Always store and calculate money in integer paise to avoid floating-point issues.
 * - Format with 'en-IN' or 'hi-IN' locale with style 'currency', currency 'INR'.
 * - Whole rupees by default, with paise only when the amount has a fractional part.
 * - Compact format: ₹1.2 L (lakh) and ₹3.5 Cr (crore) with Latin digits in both locales.
 */

export interface FormatINROptions {
  locale?: string;
  inPaise?: boolean;
  showPaiseIfZero?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface CompactINROptions {
  locale?: string;
  inPaise?: boolean;
  decimals?: number;
}

export interface GSTCalculation {
  hasGst: boolean;
  gstRate: number;
  gstRatePercentage: number;
  baseAmountPaise: number;
  gstAmountPaise: number;
  totalAmountPaise: number;
  taxMode: 'exclusive' | 'inclusive';
}

/**
 * Converts paise (integer) to rupees (number).
 */
export function paiseToRupees(paise: number | bigint): number {
  return Number(paise) / 100;
}

/**
 * Converts rupees to integer paise, avoiding floating-point inaccuracies.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(Number(rupees) * 100);
}

/**
 * Formats an amount into standard Indian Rupee (INR - ₹) representation.
 * Supports whole rupees by default, and adds paise only when there is a fractional component.
 * Uses Latin digits in both en and hi locales.
 *
 * @param amount Amount in rupees (or paise if options.inPaise === true)
 * @param options Formatting options
 */
export function formatINR(amount: number | bigint, options: FormatINROptions = {}): string {
  const {
    locale = 'en-IN',
    inPaise = false,
    showPaiseIfZero = false,
    minimumFractionDigits,
    maximumFractionDigits
  } = options;

  const rawNumber = Number(amount);
  const rupees = inPaise ? rawNumber / 100 : rawNumber;

  if (isNaN(rupees)) {
    return '₹0';
  }

  const hasFractions = Math.abs(rupees % 1) > 0.0001;

  let minDecimals = 0;
  let maxDecimals = 0;

  if (minimumFractionDigits !== undefined && maximumFractionDigits !== undefined) {
    minDecimals = minimumFractionDigits;
    maxDecimals = maximumFractionDigits;
  } else if (hasFractions || showPaiseIfZero) {
    minDecimals = 2;
    maxDecimals = 2;
  }

  // Normalize locale: Always use Latin numerals (-u-nu-latn) so digits are 0-9
  const isHindi = locale.startsWith('hi');
  const targetLocale = isHindi ? 'hi-IN-u-nu-latn' : 'en-IN';

  const formatter = new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  });

  return formatter.format(rupees);
}

/**
 * Formats large amounts into compact Indian notation (Lakh / Crore).
 * e.g., ₹1.2 L (or ₹1.2 लाख) and ₹3.5 Cr (or ₹3.5 करोड़).
 * Always uses Latin digits.
 *
 * @param amount Amount in rupees (or paise if options.inPaise === true)
 * @param options Formatting options
 */
export function formatINRCompact(amount: number | bigint, options: CompactINROptions = {}): string {
  const {
    locale = 'en-IN',
    inPaise = false,
    decimals = 1
  } = options;

  const rawNumber = Number(amount);
  const rupees = inPaise ? rawNumber / 100 : rawNumber;

  if (isNaN(rupees)) {
    return '₹0';
  }

  const absRupees = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  const isHindi = locale.startsWith('hi');

  const croreUnit = isHindi ? 'करोड़' : 'Cr';
  const lakhUnit = isHindi ? 'लाख' : 'L';

  // 1 Crore = 10,000,000 (10^7)
  if (absRupees >= 10000000) {
    const val = absRupees / 10000000;
    const formattedNum = val.toFixed(decimals).replace(/\.0+$/, '');
    return `${sign}₹${formattedNum} ${croreUnit}`;
  }

  // 1 Lakh = 100,000 (10^5)
  if (absRupees >= 100000) {
    const val = absRupees / 100000;
    const formattedNum = val.toFixed(decimals).replace(/\.0+$/, '');
    return `${sign}₹${formattedNum} ${lakhUnit}`;
  }

  // Fallback to standard format for amounts under 1 Lakh
  return formatINR(rupees, { locale, inPaise: false });
}

/**
 * Parses a GST rate input (e.g. 0.18, "0.18", "18%").
 * Returns null if not provided or invalid. Never assumes a default rate.
 */
export function parseGSTRate(rateInput?: string | number | null): number | null {
  if (rateInput === undefined || rateInput === null || rateInput === '') {
    return null;
  }
  const str = String(rateInput).replace('%', '').trim();
  const parsed = Number(str);
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed > 1 ? parsed / 100 : parsed;
}

/**
 * Calculates GST for an amount in paise.
 * If gstRate is null/undefined/empty, does NOT calculate or assume any GST.
 */
export function calculateGST(
  amountPaise: number | bigint,
  gstRateInput?: string | number | null,
  taxMode: 'exclusive' | 'inclusive' = 'exclusive'
): GSTCalculation {
  const amount = Number(amountPaise);
  const rate = parseGSTRate(gstRateInput);

  if (rate === null) {
    return {
      hasGst: false,
      gstRate: 0,
      gstRatePercentage: 0,
      baseAmountPaise: amount,
      gstAmountPaise: 0,
      totalAmountPaise: amount,
      taxMode
    };
  }

  if (taxMode === 'inclusive') {
    const base = Math.round(amount / (1 + rate));
    const gst = amount - base;
    return {
      hasGst: true,
      gstRate: rate,
      gstRatePercentage: Math.round(rate * 100),
      baseAmountPaise: base,
      gstAmountPaise: gst,
      totalAmountPaise: amount,
      taxMode
    };
  } else {
    // exclusive
    const gst = Math.round(amount * rate);
    const total = amount + gst;
    return {
      hasGst: true,
      gstRate: rate,
      gstRatePercentage: Math.round(rate * 100),
      baseAmountPaise: amount,
      gstAmountPaise: gst,
      totalAmountPaise: total,
      taxMode
    };
  }
}

/**
 * Converts a price with clean rounding to nearest unit (e.g. 10 or 100).
 */
export function roundToClean(amount: number, roundTo: number = 10): number {
  if (roundTo <= 0) return Math.round(amount);
  return Math.round(amount / roundTo) * roundTo;
}
