/**
 * FlowGuard - Deterministic Treasury Controller & Payment Planning Engine
 * 
 * Implements deterministic financial rules:
 * - Multi-currency wallet balance normalization to USD base
 * - SWIFT corridor fee inclusion (e.g., official Airwallex EUR 12.85 flat fee) vs LOCAL ($0)
 * - Strict Cash Reserve Floor protection
 * - Rule-based prioritization (Operational Criticality > Due Date Urgency > Currency Wallet Affinity)
 * - Automatic halt of invoices flagged by the Duplicate Engine
 */

const { INDICATIVE_FX_RATES } = require('./mockData');

/**
 * Normalizes an amount in any currency to USD base
 */
function convertToUsdBase(amount, currency, rates = INDICATIVE_FX_RATES) {
  if (currency === 'USD') return amount;
  const directKey = `${currency}_USD`;
  if (rates[directKey]) return amount * rates[directKey];
  const inverseKey = `USD_${currency}`;
  if (rates[inverseKey]) return amount / rates[inverseKey];
  return amount; // fallback 1:1 if rate unknown
}

/**
 * Calculates payment corridor payout fees according to Airwallex rules:
 * - EUR SWIFT: Flat EUR 12.85
 * - USD SWIFT: Flat USD 15.00
 * - LOCAL: Free (USD ACH, UK Faster Payments, SEPA local)
 */
function getCorridorFee(currency, paymentMethod) {
  if (paymentMethod === 'SWIFT') {
    if (currency === 'EUR') return { fee_amount: 12.85, fee_currency: 'EUR', fee_usd: 13.94 };
    if (currency === 'USD') return { fee_amount: 15.00, fee_currency: 'USD', fee_usd: 15.00 };
    return { fee_amount: 15.00, fee_currency: 'USD', fee_usd: 15.00 };
  }
  return { fee_amount: 0.00, fee_currency: currency, fee_usd: 0.00 };
}

/**
 * Evaluates and plans payments against available cash and reserve floor
 */
function planPayments({
  balances,
  invoices,
  inspections = [],
  reserveFloor = 15000.00,
  expectedReceivables = [],
  fxRates = INDICATIVE_FX_RATES
}) {
  // 1. Calculate Total Liquid Cash in USD equivalent
  let totalLiquidUsd = 0;
  const balanceBreakdown = balances.map(b => {
    const usdVal = convertToUsdBase(b.available_amount, b.currency, fxRates);
    totalLiquidUsd += usdVal;
    return {
      currency: b.currency,
      available_amount: b.available_amount,
      usd_equivalent: usdVal
    };
  });

  // 2. Identify and block duplicate-risk invoices
  const inspectionMap = {};
  inspections.forEach(insp => {
    inspectionMap[insp.invoiceId] = insp;
  });

  // 3. Score and prioritize invoices
  const scoredInvoices = invoices.map(inv => {
    const insp = inspectionMap[inv.id];
    const isBlocked = insp && (insp.riskLevel === 'CRITICAL_DUPLICATE' || insp.riskScore >= 80);

    const corridorFee = getCorridorFee(inv.currency, inv.payment_method);
    const totalOutflowOriginal = inv.amount + (corridorFee.fee_currency === inv.currency ? corridorFee.fee_amount : 0);
    const amountUsd = convertToUsdBase(inv.amount, inv.currency, fxRates);
    const totalOutflowUsd = amountUsd + corridorFee.fee_usd;

    // Criticality weight
    let weight = 0;
    if (inv.operational_criticality === 'CRITICAL') weight += 500;
    else if (inv.operational_criticality === 'HIGH') weight += 300;
    else if (inv.operational_criticality === 'MEDIUM') weight += 150;
    else weight += 50;

    // Due date urgency (closer due date = higher priority)
    const today = new Date('2026-10-15');
    const dueDate = new Date(inv.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    weight += Math.max(0, (30 - daysUntilDue) * 5);

    // Currency native balance availability bonus (avoids FX conversion spread)
    const nativeBal = balances.find(b => b.currency === inv.currency);
    const hasNativeBalance = nativeBal && nativeBal.available_amount >= inv.amount;
    if (hasNativeBalance) weight += 40;

    return {
      ...inv,
      corridorFee,
      totalOutflowOriginal,
      amountUsd,
      totalOutflowUsd,
      daysUntilDue,
      priorityScore: weight,
      isBlocked,
      blockReason: isBlocked ? insp.explanation || 'Blocked by Duplicate Risk Engine' : null,
      inspection: insp || null
    };
  });

  // Sort by Priority Score descending (highest operational impact first)
  scoredInvoices.sort((a, b) => b.priorityScore - a.priorityScore);

  // 4. Deterministic Cash Allocation against Reserve Floor
  let runningUsdAvailable = totalLiquidUsd;
  let approvedOutflowUsd = 0;
  let deferredOutflowUsd = 0;

  const plannedDecisions = scoredInvoices.map(inv => {
    if (inv.isBlocked) {
      return {
        ...inv,
        recommendation: 'BLOCKED',
        decisionReason: `HALTED: ${inv.inspection?.flags?.[0]?.detail || 'Duplicate invoice collision detected.'}`,
        canExecuteInDemo: false
      };
    }

    if (inv.status === 'PAID') {
      return {
        ...inv,
        recommendation: 'ALREADY_PAID',
        decisionReason: 'Transfer already settled via Airwallex Sandbox.',
        canExecuteInDemo: false
      };
    }

    const projectedBalanceAfterPayment = runningUsdAvailable - inv.totalOutflowUsd;

    if (projectedBalanceAfterPayment >= reserveFloor) {
      // Approve for execution
      runningUsdAvailable -= inv.totalOutflowUsd;
      approvedOutflowUsd += inv.totalOutflowUsd;
      return {
        ...inv,
        recommendation: 'PAY_NOW',
        decisionReason: `RECOMMENDED: High operational priority (${inv.operational_criticality}). Cash reserve maintained at $${projectedBalanceAfterPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })} ($${(projectedBalanceAfterPayment - reserveFloor).toFixed(2)} above $${reserveFloor.toLocaleString('en-US')} floor).`,
        canExecuteInDemo: true,
        projectedRemainingReserveUsd: projectedBalanceAfterPayment
      };
    } else {
      // Defer to protect floor
      deferredOutflowUsd += inv.totalOutflowUsd;
      const shortfall = reserveFloor - projectedBalanceAfterPayment;
      return {
        ...inv,
        recommendation: 'DEFER',
        decisionReason: `DEFERRED: Payment of $${inv.totalOutflowUsd.toFixed(2)} would breach minimum reserve floor ($${reserveFloor.toLocaleString('en-US')}) by $${shortfall.toFixed(2)}. Scheduled for release upon incoming receivable settlement.`,
        canExecuteInDemo: false,
        shortfall
      };
    }
  });

  // 5. Compute Receivables Impact (Simulation)
  const incomingReceivablesUsd = expectedReceivables
    .filter(r => r.status === 'ON_TRACK')
    .reduce((sum, r) => sum + convertToUsdBase(r.expected_amount, r.currency, fxRates), 0);

  const forecastRunway = {
    currentLiquidityUsd: totalLiquidUsd,
    reserveFloorUsd: reserveFloor,
    approvedOutflowsUsd: approvedOutflowUsd,
    deferredOutflowsUsd: deferredOutflowUsd,
    projectedBufferAfterApprovedUsd: runningUsdAvailable - reserveFloor,
    incomingReceivablesUsd,
    postReceivableLiquidityUsd: runningUsdAvailable + incomingReceivablesUsd
  };

  return {
    balanceBreakdown,
    totalLiquidUsd,
    reserveFloor,
    decisions: plannedDecisions,
    forecastRunway
  };
}

module.exports = {
  convertToUsdBase,
  getCorridorFee,
  planPayments
};
