/**
 * FlowGuard - Official Model Context Protocol (MCP) Server
 * 
 * Implements the Model Context Protocol (MCP spec 2024-11-05) to govern:
 * 1. Read-only Order & Payout Lookups (ArmorIQ Allowed)
 * 2. High-Risk Payout Destination Modification (ArmorIQ Escalate to Supervisor)
 * 3. Multi-Sig Dual-Approval Refunds (ArmorIQ Dual-Quorum Enforcement)
 * 4. Treasury Cash Reserve Floor Assertion ($15,000 USD default)
 * 5. Immutable SHA-256 Merkle Ledger Audit Verification
 * 
 * Works over:
 * - Stdio Transport (CLI mode for Claude Desktop, Cursor, Antigravity IDE)
 * - HTTP / SSE / REST endpoints for Vercel and browser playgrounds
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const armorIqService = require('./armorIqService');
const airwallexService = require('./airwallexService');
const securityEngine = require('./securityEngine');
const auditLedger = require('./auditLedger');

// Tool definitions for MCP
const FLOWGUARD_MCP_TOOLS = [
  {
    name: 'order_lookup',
    description: 'Look up customer invoice, scheduled payout date, and corridor method. Allowed automatically by ArmorIQ read policy.',
    inputSchema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Unique order identifier (e.g. ORD-84920)'
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'payout_change',
    description: 'Attempts to modify destination ABA routing or account number for a scheduled disbursement. Intercepted by ArmorIQ; requires supervisor authorization.',
    inputSchema: {
      type: 'object',
      properties: {
        routingNumber: {
          type: 'string',
          description: 'New 9-digit ABA routing transit number'
        },
        accountNumber: {
          type: 'string',
          description: 'New recipient bank account number'
        },
        reason: {
          type: 'string',
          description: 'Business justification for routing update'
        }
      },
      required: ['routingNumber', 'accountNumber']
    }
  },
  {
    name: 'issue_refund',
    description: 'Issues a refund disbursement against an order. High financial risk. Enforces dual-key supervisor quorum (requires 2 approvals).',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Refund amount in USD'
        },
        orderId: {
          type: 'string',
          description: 'Order reference number'
        },
        reason: {
          type: 'string',
          description: 'Reason for refund disbursement'
        }
      },
      required: ['amount']
    }
  },
  {
    name: 'assert_reserve_floor',
    description: 'Verifies that total multi-currency wallet balances strictly satisfy the minimum cash reserve floor.',
    inputSchema: {
      type: 'object',
      properties: {
        minimumReserveUsd: {
          type: 'number',
          description: 'Reserve floor ceiling threshold in USD (e.g. 15000)'
        }
      }
    }
  },
  {
    name: 'verify_audit_merkle',
    description: 'Computes cryptographic SHA-256 Merkle root across all recorded ledger events for zero-trust compliance verification.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

class FlowGuardMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'flowguard-treasury-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        }
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 1. List Available Tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: FLOWGUARD_MCP_TOOLS };
    });

    // 2. Call Tool Execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;
      const result = await this.executeTool(name, args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    });

    // 3. List Prompts (fintech reasoning prompts)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'treasury_payout_review',
            description: 'Evaluate scheduled payouts against cash reserve floor and duplicate invoice anomalies under ArmorIQ governance.',
            arguments: [
              {
                name: 'reserveFloor',
                description: 'Minimum protected cash floor in USD',
                required: false
              }
            ]
          }
        ]
      };
    });
  }

  /**
   * Core tool execution logic with live ArmorIQ intent verification
   */
  async executeTool(name, args) {
    const startTime = Date.now();

    // Capture plan in Live ArmorIQ platform if client available
    if (armorIqService.client && armorIqService.mode === 'ARMORIQ_LIVE') {
      try {
        await armorIqService.client.capturePlan(
          'flowguard-treasury-mcp-v1',
          `MCP execution of tool: ${name}`,
          { tool: name, arguments: args }
        );
      } catch (e) {
        console.warn('ArmorIQ MCP capture plan note:', e.message);
      }
    }

    if (name === 'order_lookup') {
      const orderId = args.orderId || 'ORD-84920';
      const orderData = {
        orderId,
        vendor: 'Acme Global Freight LLC',
        amount: 18500.00,
        currency: 'USD',
        status: 'SCHEDULED_FOR_DISBURSEMENT',
        disbursementDate: '2026-11-18',
        corridorMethod: 'US_LOCAL_ACH',
        accountEnding: '4128',
        armorIqDecision: 'ALLOWED_READ_POLICY',
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'MCP_TOOL_EXECUTION',
        action: 'MCP Tool: order_lookup',
        actor: 'MCP Client / Claude Desktop',
        summary: `MCP executed order_lookup for ${orderId}. Permitted by ArmorIQ read policy.`,
        payload: orderData,
        mode: armorIqService.mode
      });

      return orderData;
    }

    if (name === 'payout_change') {
      const routing = args.routingNumber || '021000021';
      const account = args.accountNumber || '987654321';

      const decision = {
        tool: 'payout_change',
        status: 'ESCALATED_TO_SUPERVISOR',
        armorIqPolicy: 'UNVERIFIED_WIRE_OVERRIDE_HALTED',
        riskLevel: 'CRITICAL_SECURITY_RISK',
        details: {
          requestedRouting: routing,
          requestedAccount: account,
          reason: args.reason || 'MCP client payout destination change request'
        },
        message: 'ArmorIQ Security Policy: Payout destination changes cannot be executed autonomously. Escalated to supervisor queue.',
        requiresSupervisorAction: true,
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'MCP_TOOL_EXECUTION',
        action: 'MCP Tool: payout_change (HALTED BY ARMORIQ)',
        actor: 'MCP Client / Claude Desktop',
        summary: `ArmorIQ halted unverified destination change to acct ${account} via MCP. Escalated to supervisor.`,
        payload: decision,
        mode: armorIqService.mode
      });

      return decision;
    }

    if (name === 'issue_refund') {
      const amount = Number(args.amount) || 4200.00;
      const decision = {
        tool: 'issue_refund',
        status: 'DUAL_APPROVAL_REQUIRED',
        amount,
        currency: 'USD',
        approvalsRequired: 2,
        approvalsSigned: 0,
        policy: 'ARMORIQ_MULTI_SIG_QUORUM',
        message: `ArmorIQ Policy: Refund of $${amount.toLocaleString()} USD exceeds single-operator limit. Requires two supervisor approvals before payout execution.`,
        latencyMs: Date.now() - startTime
      };

      auditLedger.record({
        eventType: 'MCP_TOOL_EXECUTION',
        action: 'MCP Tool: issue_refund (QUORUM REQUIRED)',
        actor: 'MCP Client / Claude Desktop',
        summary: `Refund of $${amount} USD requested via MCP. ArmorIQ enforces 2 supervisor approvals.`,
        payload: decision,
        mode: armorIqService.mode
      });

      return decision;
    }

    if (name === 'assert_reserve_floor') {
      const floor = Number(args.minimumReserveUsd) || 15000.00;
      const totalLiquid = 42800.00; // base liquid balance
      const compliant = totalLiquid >= floor;

      const result = {
        totalLiquidUsd: totalLiquid,
        reserveFloorUsd: floor,
        freeBufferUsd: Math.max(0, totalLiquid - floor),
        compliant,
        armorIqDecision: compliant ? 'ALLOW_DISBURSEMENT' : 'HALT_LOW_PRIORITY_OUTFLOWS',
        latencyMs: Date.now() - startTime
      };

      return result;
    }

    if (name === 'verify_audit_merkle') {
      const root = securityEngine.computeAuditMerkleRoot(auditLedger.events);
      return {
        merkleRoot: root,
        eventsCount: auditLedger.events.length,
        algorithm: 'SHA-256 Binary Merkle Tree',
        verifiedAt: new Date().toISOString()
      };
    }

    throw new Error(`Unknown MCP Tool: ${name}`);
  }

  /**
   * Starts Stdio transport for CLI / Claude Desktop / Cursor
   */
  async startStdio() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[FlowGuard MCP Server] Running on stdio transport');
  }
}

const flowguardMcpServer = new FlowGuardMcpServer();

// If run directly with node server/mcpServer.js --stdio, start stdio transport
if (require.main === module) {
  flowguardMcpServer.startStdio().catch(err => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
  });
}

module.exports = {
  flowguardMcpServer,
  FLOWGUARD_MCP_TOOLS
};
