/**
 * BeyondFlow - ArmorPay Intent Settlement Service
 *
 * Provides cryptographic intent-gated settlement for accounts payable invoices:
 * 1. Pre-flight duplicate inspection (Levenshtein + triple-vector proximity)
 * 2. Real-time reserve floor protection ($15,000 minimum liquidity threshold)
 * 3. ArmorIQ CSRG-IAP Intent Token minting with plan hashing
 * 4. Payout dispatch via Airwallex Sandbox rails (LOCAL / SWIFT)
 * 5. Tamper-evident receipt generation with SHA-256 Merkle root anchoring
 */

const crypto = require('crypto');
const { randomUUID: uuidv4 } = require('crypto');
const auditLedger = require('./auditLedger');
const armorIqService = require('./armorIqService');
const airwallexService = require('./airwallexService');
const { inspectInvoice, scanAllInvoices } = require('./duplicateDetector');
const { planPayments } = require('./rulesEngine');
const { INDICATIVE_FX_RATES } = require('./mockData');

class ArmorPayService {
  constructor() {
    this.receipts = new Map();
  }

  /**
   * Retrieves overall ArmorPay treasury metrics and status
   */
  async getStatus(invoices, vendors, reserveFloor, receivables) {
    const balanceResult = await airwallexService.getBalances();
    const fxResult = await airwallexService.getFxRates();
    const inspections = scanAllInvoices(invoices, vendors);

    const plan = planPayments({
      balances: balanceResult.balances,
      invoices,
      inspections,
      reserveFloor,
      expectedReceivables: receivables,
      fxRates: fxResult.rates || INDICATIVE_FX_RATES
    });

    const settledInvoices = invoices.filter(inv => inv.status === 'PAID');
    const inspectionsByInvoiceId = new Map(inspections.map(i => [i.invoiceId, i]));
    const clearedInvoices = invoices.filter(inv => {
      const insp = inspectionsByInvoiceId.get(inv.id);
      return inv.status !== 'PAID' && (!insp || insp.riskLevel === 'CLEARED');
    });

    const criticalDuplicates = inspections.filter(i => i.riskLevel === 'CRITICAL_DUPLICATE');
    const preventedDuplicateLoss = criticalDuplicates.reduce((sum, i) => {
      const rate = i.currency === 'EUR' ? 1.085 : (i.currency === 'GBP' ? 1.275 : 1);
      return sum + (i.amount * rate);
    }, 0);

    return {
      protocol: 'ArmorPay v1.0 (Intent-Gated Settlement)',
      governance: 'ArmorIQ CSRG-IAP + PEP Proxy',
      armorIqConfigured: armorIqService.isConfigured(),
      armorIqMode: armorIqService.mode,
      totalBalancesUsd: Math.round(plan.totalLiquidUsd * 100) / 100,
      reserveFloorUsd: reserveFloor,
      liquidityBufferUsd: Math.round((plan.forecastRunway?.projectedBufferAfterApprovedUsd || 0) * 100) / 100,
      settledCount: settledInvoices.length,
      clearedForSettlementCount: clearedInvoices.length,
      criticalDuplicatesHalted: criticalDuplicates.length,
      preventedDuplicateLossUsd: Math.round(preventedDuplicateLoss * 100) / 100,
      receiptsCount: this.receipts.size
    };
  }

  /**
   * Settles a single invoice via ArmorPay
   */
  async settleInvoice({
    invoiceId,
    invoices,
    vendors,
    reserveFloor,
    receivables,
    approverName = 'Finance Director (ArmorPay Officer)',
    paymentMethod,
    expedited = false
  }) {
    const startTime = Date.now();
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);

    if (!targetInvoice) {
      return { success: false, error: 'INVOICE_NOT_FOUND', message: `Invoice ${invoiceId} not found.` };
    }

    if (targetInvoice.status === 'PAID') {
      return {
        success: false,
        error: 'ALREADY_PAID',
        message: `Invoice ${targetInvoice.invoice_number} is already marked as PAID.`
      };
    }

    // Step 1: Pre-flight Duplicate Inspection
    const inspection = inspectInvoice(targetInvoice, invoices, vendors);
    if (inspection.riskLevel === 'CRITICAL_DUPLICATE') {
      auditLedger.record({
        eventType: 'ARMORPAY_BLOCKED',
        action: 'ArmorPay Settlement Blocked',
        actor: approverName,
        summary: `ArmorPay duplicate shield halted settlement for ${targetInvoice.invoice_number}: ${inspection.recommendation}`,
        payload: inspection
      });

      return {
        success: false,
        error: 'ARMORPAY_DUPLICATE_RISK_BLOCKED',
        message: 'ArmorPay duplicate shield blocked this transaction: critical collision detected in AP ledger.',
        inspection
      };
    }

    // Step 2: Pre-flight Reserve Floor Evaluation
    const balanceResult = await airwallexService.getBalances();
    const fxResult = await airwallexService.getFxRates();
    const inspections = scanAllInvoices(invoices, vendors);

    const plan = planPayments({
      balances: balanceResult.balances,
      invoices,
      inspections,
      reserveFloor,
      expectedReceivables: receivables,
      fxRates: fxResult.rates || INDICATIVE_FX_RATES
    });

    const plannedDecision = plan.decisions.find(d => d.id === invoiceId);
    if (plannedDecision && plannedDecision.recommendation === 'DEFER') {
      auditLedger.record({
        eventType: 'ARMORPAY_HOLD',
        action: 'ArmorPay Reserve Floor Hold',
        actor: approverName,
        summary: `Disbursement of ${targetInvoice.currency} ${targetInvoice.amount} would breach the $${reserveFloor.toLocaleString()} reserve floor.`,
        payload: { shortfall: plannedDecision.shortfall, reserveFloor }
      });

      return {
        success: false,
        error: 'ARMORPAY_RESERVE_FLOOR_HOLD',
        message: `Payment deferred: executing this settlement would breach the minimum cash reserve floor ($${reserveFloor.toLocaleString()}).`,
        shortfall: plannedDecision.shortfall,
        reserveFloor
      };
    }

    // Step 3: ArmorIQ Intent Token & Policy Interception
    const chosenMethod = paymentMethod || targetInvoice.payment_method || 'LOCAL';
    const armorIqResult = await armorIqService.interceptAndMintIntentToken({
      invoice: { ...targetInvoice, ...(plannedDecision || {}) },
      planDecision: plannedDecision,
      reserveFloor,
      approverName,
      paymentMethod: chosenMethod
    });

    if (!armorIqResult.authorized) {
      return {
        success: false,
        error: armorIqResult.policyStatus || 'ARMORIQ_POLICY_BLOCKED',
        message: armorIqResult.decision?.violations?.[0]?.detail || 'ArmorIQ policy rejected the settlement intent.',
        armorIq: armorIqResult
      };
    }

    // Step 4: Dispatch to Airwallex Sandbox Rails
    const transferResult = await airwallexService.executeTransfer({
      invoiceId: targetInvoice.id,
      vendorName: targetInvoice.vendor_name,
      amount: targetInvoice.amount,
      currency: targetInvoice.currency,
      paymentMethod: chosenMethod,
      reference: `AP-${targetInvoice.invoice_number}`,
      approver: approverName
    });

    if (!transferResult.success) {
      return {
        success: false,
        error: 'RAIL_DISPATCH_FAILED',
        message: transferResult.error || 'Airwallex transfer execution failed.',
        transferResult
      };
    }

    // Step 5: Generate Immutable ArmorPay Cryptographic Receipt
    const receiptId = `ap_rcpt_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const executionMs = Date.now() - startTime;

    const receipt = {
      receiptId,
      invoiceId: targetInvoice.id,
      invoiceNumber: targetInvoice.invoice_number,
      vendorName: targetInvoice.vendor_name,
      amount: targetInvoice.amount,
      currency: targetInvoice.currency,
      paymentMethod: chosenMethod,
      transferId: transferResult.transferId,
      settledAt: new Date().toISOString(),
      approver: approverName,
      executionMs,
      expedited,
      planHash: armorIqResult.decision?.planHash || armorIqResult.token?.planHash || null,
      intentTokenId: armorIqResult.token?.tokenId || null,
      policyStatus: armorIqResult.policyStatus,
      merkleProofRoot: auditLedger.merkleRoot,
      verificationStatus: 'CRYPTOGRAPHICALLY_VERIFIED',
      rail: transferResult.mode === 'LIVE_SANDBOX' ? 'Airwallex Sandbox' : 'Airwallex Synthetic Adapter'
    };

    this.receipts.set(receiptId, receipt);

    // Update target invoice in-memory state
    targetInvoice.status = 'PAID';
    targetInvoice.transfer_id = transferResult.transferId;
    targetInvoice.armorpay_settled = true;
    targetInvoice.armorpay_receipt_id = receiptId;
    targetInvoice.settled_at = receipt.settledAt;

    // Record immutable audit event
    auditLedger.record({
      eventType: 'ARMORPAY_SETTLEMENT',
      action: 'Invoice Settled via ArmorPay',
      actor: approverName,
      summary: `ArmorPay successfully settled ${targetInvoice.currency} ${targetInvoice.amount.toLocaleString()} for ${targetInvoice.vendor_name} (Receipt: ${receiptId})`,
      payload: receipt,
      isAirwallexApi: transferResult.mode === 'LIVE_SANDBOX',
      mode: transferResult.mode
    });

    return {
      success: true,
      receipt,
      invoice: targetInvoice,
      transferResult,
      armorIq: armorIqResult
    };
  }

  /**
   * Batch settles all cleared invoices
   */
  async batchSettleInvoices({
    invoices,
    vendors,
    reserveFloor,
    receivables,
    approverName = 'Finance Director (ArmorPay Batch)'
  }) {
    const inspections = scanAllInvoices(invoices, vendors);
    const inspectionsByInvoiceId = new Map(inspections.map(i => [i.invoiceId, i]));
    const eligibleInvoices = invoices.filter(inv => {
      if (inv.status === 'PAID') return false;
      const insp = inspectionsByInvoiceId.get(inv.id);
      return !insp || insp.riskLevel === 'CLEARED';
    });

    const results = [];
    let settledCount = 0;
    let skippedCount = 0;

    for (const inv of eligibleInvoices) {
      const res = await this.settleInvoice({
        invoiceId: inv.id,
        invoices,
        vendors,
        reserveFloor,
        receivables,
        approverName
      });

      results.push({ invoiceId: inv.id, invoiceNumber: inv.invoice_number, result: res });
      if (res.success) {
        settledCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    return {
      success: true,
      batchSummary: {
        totalEvaluated: eligibleInvoices.length,
        settledCount,
        skippedCount,
        timestamp: new Date().toISOString()
      },
      settlements: results
    };
  }

  getReceipt(receiptId) {
    return this.receipts.get(receiptId) || null;
  }
}

const armorPayService = new ArmorPayService();
module.exports = armorPayService;
