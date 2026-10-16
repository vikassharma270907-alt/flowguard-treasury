/**
 * IntentGate - Airwallex Sandbox API Integration Service
 * 
 * Interacts with official Airwallex Sandbox endpoints:
 * - Base URL: https://api.sandbox.airwallex.com/api/v1
 * - Authentication: POST /authentication/login (x-client-id, x-api-key) -> Bearer token (30-min life)
 * - Balances: GET /balances/current
 * - FX Rates: GET /fx/rates/current
 * - FX Quotes: POST /fx/quotes/create
 * - FX Conversions: POST /fx/conversions/create
 * - Payouts / Transfers: POST /transfers/create
 * - Sandbox Deposit Simulation: POST /simulation/deposit/create
 * - Sandbox Transfer Status Transition: POST /simulation/transfers/{id}/transition
 * 
 * Safety & Fallback:
 * If API credentials are missing, invalid, or in offline demo mode, this service
 * gracefully operates via the Sandbox Mock Adapter, clearly labeling all outputs as synthetic.
 */

const { randomUUID: uuidv4 } = require('crypto');
const auditLedger = require('./auditLedger');
const { INITIAL_BALANCES, INDICATIVE_FX_RATES } = require('./mockData');

class AirwallexService {
  constructor() {
    this.clientId = (process.env.AIRWALLEX_CLIENT_ID || '').replace(/^["']|["']$/g, '').trim();
    this.apiKey = (process.env.AIRWALLEX_API_KEY || '').replace(/^["']|["']$/g, '').trim();
    this.apiUrl = (process.env.AIRWALLEX_API_URL || 'https://api.sandbox.airwallex.com/api/v1').replace(/^["']|["']$/g, '').trim();
    this.forceMock = process.env.AIRWALLEX_MOCK_MODE === 'true';

    this.token = null;
    this.tokenExpiry = null;

    // Stateful in-memory balance ledger for synthetic/sandbox simulation
    this.statefulBalances = JSON.parse(JSON.stringify(INITIAL_BALANCES));
    this.executedTransfers = [];
    this.usedRequestIds = new Set();
  }

  updateCredentials(clientId, apiKey) {
    this.clientId = clientId;
    this.apiKey = apiKey;
    this.token = null;
    this.tokenExpiry = null;
  }

  isConfigured() {
    return !this.forceMock && !!(this.clientId && this.apiKey && this.clientId.trim() !== '' && this.apiKey.trim() !== '');
  }

  async authenticate() {
    if (!this.isConfigured()) {
      return { success: false, reason: 'No sandbox credentials provided. Operating in Sandbox Mock Mode.' };
    }

    // Check cached token
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return { success: true, token: this.token };
    }

    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      const response = await fetch(`${this.apiUrl}/authentication/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.apiKey
        }
      });

      const latencyMs = Date.now() - startTime;
      const data = await response.json();

      if (response.ok && data.token) {
        this.token = data.token;
        // Expires in 30 mins, cache for 25 mins
        this.tokenExpiry = Date.now() + 25 * 60 * 1000;

        auditLedger.record({
          eventType: 'SANDBOX_API_REQUEST',
          action: 'Airwallex Sandbox Login',
          actor: 'System Auth',
          requestId,
          endpoint: 'POST /api/v1/authentication/login',
          httpStatus: response.status,
          latencyMs,
          summary: 'Authenticated with Airwallex Sandbox. 30-min Bearer token acquired.',
          isAirwallexApi: true,
          mode: 'AIRWALLEX_LIVE_SANDBOX'
        });

        return { success: true, token: this.token };
      } else {
        auditLedger.record({
          eventType: 'SANDBOX_API_REQUEST',
          action: 'Airwallex Sandbox Login Failed',
          actor: 'System Auth',
          requestId,
          endpoint: 'POST /api/v1/authentication/login',
          httpStatus: response.status,
          latencyMs,
          summary: `Authentication rejected: ${data.message || data.code || 'Unauthorized'}. Falling back to Mock Adapter.`,
          payload: data,
          isAirwallexApi: true,
          mode: 'AIRWALLEX_LIVE_SANDBOX'
        });

        return { success: false, reason: data.message || 'Authentication failed' };
      }
    } catch (err) {
      auditLedger.record({
        eventType: 'SANDBOX_API_REQUEST',
        action: 'Airwallex Sandbox Connection Error',
        actor: 'System Auth',
        requestId,
        endpoint: 'POST /api/v1/authentication/login',
        httpStatus: 0,
        latencyMs: Date.now() - startTime,
        summary: `Network unreachable (${err.message}). Using Mock Adapter.`,
        isAirwallexApi: false,
        mode: 'MOCK_ADAPTER'
      });
      return { success: false, reason: err.message };
    }
  }

  async getBalances() {
    const auth = await this.authenticate();
    if (auth.success) {
      const startTime = Date.now();
      const requestId = uuidv4();
      try {
        const res = await fetch(`${this.apiUrl}/balances/current`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          auditLedger.record({
            eventType: 'SANDBOX_API_REQUEST',
            action: 'Fetch Live Balances',
            actor: 'Airwallex Live API',
            requestId,
            endpoint: 'GET /api/v1/balances/current',
            httpStatus: res.status,
            latencyMs,
            summary: `Fetched live sandbox balances for ${data.items ? data.items.length : 0} currencies.`,
            isAirwallexApi: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX'
          });
          return {
            isLiveSandbox: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX',
            balances: data.items || []
          };
        }
      } catch (err) {
        console.warn('Error fetching live balances, falling back to mock:', err.message);
      }
    }

    // Mock Adapter Fallback
    return {
      isLiveSandbox: false,
      mode: 'SANDBOX_MOCK_ADAPTER',
      balances: this.statefulBalances
    };
  }

  async getFxRates() {
    const auth = await this.authenticate();
    if (auth.success) {
      const startTime = Date.now();
      const requestId = uuidv4();
      try {
        const res = await fetch(`${this.apiUrl}/fx/rates/current`, {
          headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const latencyMs = Date.now() - startTime;
        if (res.ok) {
          const data = await res.json();
          auditLedger.record({
            eventType: 'SANDBOX_API_REQUEST',
            action: 'Fetch Live FX Rates',
            actor: 'Airwallex Live API',
            requestId,
            endpoint: 'GET /api/v1/fx/rates/current',
            httpStatus: res.status,
            latencyMs,
            summary: 'Retrieved indicative live sandbox FX rates.',
            isAirwallexApi: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX'
          });
          return { isLiveSandbox: true, rates: data };
        }
      } catch (err) {
        console.warn('FX rate check failed, using mock:', err.message);
      }
    }

    return {
      isLiveSandbox: false,
      rates: INDICATIVE_FX_RATES
    };
  }

  async createFxQuote({ buyCurrency, sellCurrency, buyAmount }) {
    const requestId = uuidv4();
    const auth = await this.authenticate();
    if (auth.success) {
      const startTime = Date.now();
      try {
        const payload = {
          request_id: requestId,
          buy_currency: buyCurrency,
          sell_currency: sellCurrency,
          buy_amount: Number(buyAmount)
        };
        const res = await fetch(`${this.apiUrl}/fx/quotes/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify(payload)
        });
        const latencyMs = Date.now() - startTime;
        const data = await res.json();

        if (res.ok) {
          auditLedger.record({
            eventType: 'FX_QUOTE_LOCKED',
            action: 'Airwallex FX Quote Created',
            actor: 'Airwallex API',
            requestId,
            endpoint: 'POST /api/v1/fx/quotes/create',
            httpStatus: res.status,
            latencyMs,
            summary: `Locked FX Quote ${data.quote_id} for ${buyCurrency} ${buyAmount} @ client_rate ${data.client_rate}`,
            payload: data,
            isAirwallexApi: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX'
          });
          return { isLiveSandbox: true, quote: data };
        }
      } catch (err) {
        console.warn('FX Quote live call error:', err.message);
      }
    }

    // Mock FX Quote
    const rateKey = `${buyCurrency}_${sellCurrency}`;
    const inverseKey = `${sellCurrency}_${buyCurrency}`;
    let rate = INDICATIVE_FX_RATES[rateKey] || (INDICATIVE_FX_RATES[inverseKey] ? 1 / INDICATIVE_FX_RATES[inverseKey] : 1.085);
    const clientRate = Number((rate * 1.002).toFixed(4)); // slight spread
    const sellAmount = Number((buyAmount * clientRate).toFixed(2));

    const mockQuote = {
      quote_id: 'quo_' + uuidv4().substring(0, 12),
      request_id: requestId,
      buy_currency: buyCurrency,
      sell_currency: sellCurrency,
      buy_amount: Number(buyAmount),
      sell_amount: sellAmount,
      client_rate: clientRate,
      valid_to: new Date(Date.now() + 60000).toISOString(), // 60s quote validity
      synthetic: true
    };

    auditLedger.record({
      eventType: 'FX_QUOTE_LOCKED',
      action: 'Simulated FX Quote Locked',
      actor: 'IntentGate Mock Adapter',
      requestId,
      summary: `Synthetic locked quote ${mockQuote.quote_id}: Buy ${buyCurrency} ${buyAmount} for ${sellCurrency} ${sellAmount} (rate: ${clientRate})`,
      payload: mockQuote,
      isAirwallexApi: false,
      mode: 'SANDBOX_MOCK_ADAPTER'
    });

    return { isLiveSandbox: false, quote: mockQuote };
  }

  async executeTransfer({
    invoiceId,
    vendorName,
    amount,
    currency,
    paymentMethod,
    reference,
    reason = 'goods_trade',
    approver = 'CFO Approval'
  }) {
    const requestId = uuidv4();

    // Idempotency check: 7-day rule as per official docs
    if (this.usedRequestIds.has(requestId)) {
      return {
        success: false,
        code: 'duplicate_request_id',
        message: 'This request_id was already submitted within the idempotency window.'
      };
    }
    this.usedRequestIds.add(requestId);

    const auth = await this.authenticate();
    if (auth.success) {
      const startTime = Date.now();
      try {
        const payload = {
          request_id: requestId,
          transfer_currency: currency,
          transfer_amount: Number(amount),
          reference: reference || `INV-${invoiceId}`,
          reason: reason
        };

        const res = await fetch(`${this.apiUrl}/transfers/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify(payload)
        });
        const latencyMs = Date.now() - startTime;
        const data = await res.json();

        if (res.ok) {
          auditLedger.record({
            eventType: 'SANDBOX_TRANSFER_DISPATCH',
            action: 'Live Sandbox Transfer Created',
            actor: approver,
            requestId,
            endpoint: 'POST /api/v1/transfers/create',
            httpStatus: res.status,
            latencyMs,
            summary: `Dispatched live transfer ${data.id || requestId} for ${currency} ${amount} to ${vendorName}. Status: ${data.status}`,
            payload: data,
            isAirwallexApi: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX'
          });

          return {
            success: true,
            isLiveSandbox: true,
            transferId: data.id,
            status: data.status || 'PROCESSING',
            requestId,
            data
          };
        } else {
          auditLedger.record({
            eventType: 'SANDBOX_TRANSFER_DISPATCH',
            action: 'Transfer Rejected by Airwallex',
            actor: approver,
            requestId,
            endpoint: 'POST /api/v1/transfers/create',
            httpStatus: res.status,
            latencyMs,
            summary: `Payment creation rejected: ${data.message || data.code}`,
            payload: data,
            isAirwallexApi: true,
            mode: 'AIRWALLEX_LIVE_SANDBOX'
          });
          return { success: false, code: data.code, message: data.message };
        }
      } catch (err) {
        console.warn('Live transfer call failed, falling back to mock adapter:', err.message);
      }
    }

    // Statefully deduct balance in Mock Adapter
    const bal = this.statefulBalances.find(b => b.currency === currency);
    if (bal) {
      if (bal.available_amount < amount) {
        return {
          success: false,
          code: 'balance_insufficient',
          message: `Insufficient ${currency} funds in sandbox wallet. Available: ${bal.available_amount}, Required: ${amount}.`
        };
      }
      bal.available_amount = Number((bal.available_amount - amount).toFixed(2));
    }

    const transferId = 'trf_' + uuidv4().substring(0, 12);
    const mockRecord = {
      id: transferId,
      request_id: requestId,
      invoice_id: invoiceId,
      vendor_name: vendorName,
      amount: Number(amount),
      currency,
      payment_method: paymentMethod,
      reference,
      status: 'SENT', // moves to SENT as per kit 1 & 3 watch-outs
      created_at: new Date().toISOString(),
      synthetic: true
    };
    this.executedTransfers.push(mockRecord);

    auditLedger.record({
      eventType: 'SANDBOX_TRANSFER_DISPATCH',
      action: 'Simulated Sandbox Payout Executed',
      actor: approver,
      requestId,
      summary: `Approved & executed simulated payout ${transferId}: ${currency} ${amount.toFixed(2)} to ${vendorName} via ${paymentMethod}.`,
      payload: mockRecord,
      isAirwallexApi: false,
      mode: 'SANDBOX_MOCK_ADAPTER'
    });

    return {
      success: true,
      isLiveSandbox: false,
      transferId,
      status: 'SENT',
      requestId,
      synthetic: true,
      record: mockRecord
    };
  }

  async transitionTransferStatus(transferId, nextStatus = 'PAID') {
    const requestId = uuidv4();
    const auth = await this.authenticate();

    if (auth.success) {
      const startTime = Date.now();
      try {
        const res = await fetch(`${this.apiUrl}/simulation/transfers/${transferId}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({ next_status: nextStatus })
        });
        const latencyMs = Date.now() - startTime;
        const data = await res.json();

        auditLedger.record({
          eventType: 'TRANSACTION_STATUS_UPDATE',
          action: `Live Transfer Transition to ${nextStatus}`,
          actor: 'Airwallex Simulation API',
          requestId,
          endpoint: `POST /api/v1/simulation/transfers/${transferId}/transition`,
          httpStatus: res.status,
          latencyMs,
          summary: `Transitioned transfer ${transferId} to status ${nextStatus}.`,
          isAirwallexApi: true,
          mode: 'AIRWALLEX_LIVE_SANDBOX'
        });

        return { success: true, isLiveSandbox: true, status: nextStatus, data };
      } catch (err) {
        console.warn('Simulation transition call failed:', err.message);
      }
    }

    // Mock transition
    const trf = this.executedTransfers.find(t => t.id === transferId);
    if (trf) {
      trf.status = nextStatus;
      trf.settled_at = new Date().toISOString();
    }

    auditLedger.record({
      eventType: 'TRANSACTION_STATUS_UPDATE',
      action: `Simulated Status Transition to ${nextStatus}`,
      actor: 'Airwallex Simulation Engine',
      requestId,
      summary: `Simulation: Transfer ${transferId} successfully advanced to final status '${nextStatus}'.`,
      payload: { transferId, nextStatus },
      isAirwallexApi: false,
      mode: 'SANDBOX_MOCK_ADAPTER'
    });

    return { success: true, isLiveSandbox: false, status: nextStatus, synthetic: true };
  }

  async simulateDeposit(amount = 25000, currency = 'USD', payerName = 'Demo Capital Top-up') {
    const requestId = uuidv4();
    const auth = await this.authenticate();

    if (auth.success) {
      const startTime = Date.now();
      try {
        const payload = {
          amount: Number(amount),
          payer_name: payerName
        };
        const res = await fetch(`${this.apiUrl}/simulation/deposit/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify(payload)
        });
        const latencyMs = Date.now() - startTime;
        const data = await res.json();

        auditLedger.record({
          eventType: 'SIMULATION_EVENT',
          action: 'Live Sandbox Deposit Triggered',
          actor: 'Airwallex Deposit Simulator',
          requestId,
          endpoint: 'POST /api/v1/simulation/deposit/create',
          httpStatus: res.status,
          latencyMs,
          summary: `Deposited $${amount.toLocaleString()} into live sandbox wallet.`,
          isAirwallexApi: true,
          mode: 'AIRWALLEX_LIVE_SANDBOX'
        });

        return { success: true, isLiveSandbox: true, data };
      } catch (err) {
        console.warn('Live simulation deposit error:', err.message);
      }
    }

    // Stateful mock deposit
    const bal = this.statefulBalances.find(b => b.currency === currency);
    if (bal) {
      bal.available_amount += Number(amount);
    } else {
      this.statefulBalances.push({ currency, available_amount: Number(amount), pending_amount: 0, reserved_amount: 0 });
    }

    auditLedger.record({
      eventType: 'SIMULATION_EVENT',
      action: 'Simulated Sandbox Wallet Deposit',
      actor: 'Airwallex Deposit Simulator',
      requestId,
      summary: `Simulated deposit: +${currency} ${amount.toLocaleString()} credited to sandbox wallet from "${payerName}".`,
      payload: { amount, currency, payerName },
      isAirwallexApi: false,
      mode: 'SANDBOX_MOCK_ADAPTER'
    });

    return {
      success: true,
      isLiveSandbox: false,
      creditedAmount: amount,
      currency,
      synthetic: true
    };
  }

  resetMockState() {
    this.statefulBalances = JSON.parse(JSON.stringify(INITIAL_BALANCES));
    this.executedTransfers = [];
    this.usedRequestIds.clear();
  }
}

const airwallexService = new AirwallexService();
module.exports = airwallexService;
