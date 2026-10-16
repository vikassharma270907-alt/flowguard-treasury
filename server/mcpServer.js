/**
 * FlowGuard - Model Context Protocol (MCP) Server
 *
 * Exposes the SAME three sandbox tools that are registered on the ArmorIQ
 * platform under `intentgate-support-mcp` (see mcp-server/tools.cjs — single
 * implementation shared with the standalone stdio/SSE server):
 *
 *   - lookup_order   (read-only order lookup)
 *   - change_payout  (bank destination change)
 *   - issue_refund   (refund against an order)
 *
 * IMPORTANT: these tool implementations contain NO policy logic and return NO
 * verdict. Whether a call is allowed, held or blocked is decided by ArmorIQ
 * *before* the call reaches this server, when the call is routed through the
 * ArmorIQ proxy. A direct call to this server (e.g. /api/mcp/execute from the
 * playground) bypasses the proxy entirely and therefore carries no ArmorIQ
 * decision — responses make that explicit.
 *
 * Transport:
 * - HTTP JSON-RPC 2.0 (MCP spec 2024-11-05) via /mcp and /api/mcp
 * - Stdio transport for CLI / Claude Desktop / Cursor (`node server/mcpServer.js --stdio`)
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const { TOOLS, callTool } = require('../mcp-server/tools.cjs');
const securityEngine = require('./securityEngine');
const auditLedger = require('./auditLedger');

/** The three governed sandbox tools — same contract as the platform registration. */
const FLOWGUARD_MCP_TOOLS = TOOLS;

/**
 * App-side utility checks. These are NOT ArmorIQ tools and are never presented
 * as ArmorIQ decisions; they run locally against sandbox state.
 */
const FLOWGUARD_APP_TOOLS = [
  {
    name: 'assert_reserve_floor',
    description: 'App-side check: verifies that the sandbox liquid balance satisfies a minimum reserve floor.',
    inputSchema: {
      type: 'object',
      properties: {
        minimumReserveUsd: {
          type: 'number',
          description: 'Reserve floor threshold in USD (e.g. 15000)'
        }
      }
    }
  },
  {
    name: 'verify_audit_merkle',
    description: 'App-side check: computes a SHA-256 Merkle root over the local audit ledger events.',
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
      return await this.executeTool(name, args);
    });

    // 3. List Prompts (fintech reasoning prompts)
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'treasury_payout_review',
            description: 'Evaluate scheduled payouts against cash reserve floor and duplicate invoice anomalies. App-side reasoning prompt; ArmorIQ remains the enforcement point for governed tool calls.',
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
   * Execute one tool call.
   *
   * The three governed tools are delegated to the shared sandbox implementation
   * (mcp-server/tools.cjs) and return raw sandbox results — never a verdict.
   * A `_meta` note distinguishes direct execution from proxy-governed execution.
   *
   * @returns MCP result object: { content: [{type:'text', text}], isError? }
   */
  async executeTool(name, args) {
    const governed = FLOWGUARD_MCP_TOOLS.some((t) => t.name === name);

    if (governed) {
      const result = callTool(name, args);

      auditLedger.record({
        eventType: 'MCP_TOOL_EXECUTION',
        action: `MCP tool executed: ${name}`,
        actor: 'MCP client (direct execution)',
        summary:
          `flowguard-treasury-mcp ran "${name}" directly on sandbox data. ` +
          `No ArmorIQ decision was requested or implied — governed calls run through the ArmorIQ proxy instead.`,
        payload: { name, args },
        mode: 'MCP_DIRECT'
      });

      return result;
    }

    // --- App-side utility checks (not ArmorIQ tools) ---
    if (name === 'assert_reserve_floor') {
      const floor = Number(args.minimumReserveUsd) || 15000.0;
      const totalLiquid = 42800.0; // sandbox liquid balance
      const compliant = totalLiquid >= floor;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalLiquidUsd: totalLiquid,
              reserveFloorUsd: floor,
              freeBufferUsd: Math.max(0, totalLiquid - floor),
              compliant,
              checkedBy: 'app-side rule (no ArmorIQ involvement)',
            })
          }
        ]
      };
    }

    if (name === 'verify_audit_merkle') {
      const root = securityEngine.computeAuditMerkleRoot(auditLedger.events);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              merkleRoot: root,
              eventsCount: auditLedger.events.length,
              algorithm: 'SHA-256 binary Merkle tree over local audit ledger',
              checkedBy: 'app-side check (no ArmorIQ involvement)',
              verifiedAt: new Date().toISOString()
            })
          }
        ]
      };
    }

    throw Object.assign(new Error(`Unknown MCP tool: ${name}`), { code: -32602 });
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
  FLOWGUARD_MCP_TOOLS,
  FLOWGUARD_APP_TOOLS
};
