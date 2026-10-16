# Disclosures & Attribution — IntentGate

This document discloses all libraries, frameworks, tools, and developer lineage used in IntentGate (built under the interim project name **FlowGuard** until the 17 October 2026 rename) for the ArmorIQ Flow State Hackathon, in accordance with the official hackathon rules.

## 1. Development Window & Git History
- **Official Window**: Development was carried out within the official hackathon window (October 10–17, 2026).
- **Git History**: Commit history reflects iterative authoring of the ArmorIQ policy integration, the Model Context Protocol (MCP) server, the voice gateway holding pattern, and the cryptographic boundary test. The project was renamed FlowGuard → IntentGate on 17 Oct 2026; the rename and the fresh verification runs are visible in the branch history.

## 2. Lineage & Development Statement
- **Developer Statement**: IntentGate was assembled during the hackathon window and reuses the developer's earlier MIT-licensed IntentGate prototype components (disclosed below), alongside third-party open-source libraries (`@armoriq/sdk`, `@modelcontextprotocol/sdk`, Three.js, React, Express). The interim name FlowGuard appears in the 15–16 Oct captures and commits; those historical records are left exactly as recorded.
- Earlier architectural prototypes (such as the IntentGate gateway concept for sub-5-second voice holding patterns and the Airwallex sandbox adapter) were adapted and unified into IntentGate under the MIT License.

## 3. Third-Party Libraries & Frameworks
The following open-source packages and frameworks were utilized:
- **`@armoriq/sdk` (v0.6.10)**: Official ArmorIQ TypeScript/JavaScript SDK for plan capture, CSRG-IAP intent token issuance, Merkle proof verification, and PEP proxy action invocation (`https://iap.armoriq.ai`, `https://proxy.armoriq.ai`, `https://api.armoriq.ai`).
- **`@modelcontextprotocol/sdk` (v1.32.1)**: Anthropic Model Context Protocol reference SDK for tool schemas and JSON-RPC 2.0 message handling.
- **Node.js Built-in Modules**: `node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url` for zero-overhead JSON-RPC over HTTP/SSE server and async timeout handling.
- **Express.js (v5.3.0) & CORS (v2.8.6)**: Lightweight HTTP server for REST endpoints and web app integration.
- **React (v19.x) & Vite (v8.x)**: Frontend client framework for the reactive web dashboard and supervisor playground.
- **`three` (v0.186.x)**: Three.js library for hardware-accelerated 60 FPS 3D cryptographic models, orbital vaults, particle fields, and gyroscopic enclaves with WebGL cleanup and reduced-motion compliance.
- **`pdfkit` (v0.20.x)**: Server-side PDF generation engine used to compile technical architectural documentation.
- **yourbrand-ui (MIT)**: Header/footer layout scaffold adapted from the MIT-licensed `yourbrand-ui` starter template.
- **Self-Hosted Web Fonts (SIL Open Font License)**: Inter, JetBrains Mono, and Noto Sans Devanagari woff2 subsets are vendored into `client/public/fonts/` via `scripts/vendor-fonts.mjs` and served from our own origin — no third-party font CDN is contacted at runtime.
- **Cloudflare Tunnel (`cloudflared`)**: Used during local development to expose the local MCP port to public HTTPS (`trycloudflare.com`) for ArmorIQ proxy reachability.

## 4. AI Coding Assistants
- **Google Antigravity IDE (Gemini 2.5 Pro Agentic Engine)**: Used as an interactive pair-programming assistant for code generation, test script validation, linting, and documentation.

## 5. Security & Synthetic Data Attestation
- **No Production Customer Data**: 100% of customer names, order IDs (e.g. `ORD-1001`, `ORD-84920`), bank routing numbers, and accounts are synthetic mock/sandbox entities.
- **No Production Payment Systems**: All financial mutations operate strictly on synthetic balances and sandbox simulation endpoints. Real money is never moved.
- **No Secret Commits**: All platform credentials and API keys are stored exclusively in gitignored `.env` files; `.env.example` is provided for configuration setup.

## 6. ArmorIQ Platform Notes & Migration (15–17 October 2026)
- **Record migration**: the first accepted enforcement run (15–16 Oct) used a Cloudflare-tunnel MCP record named `intentgate-support-mcp` (UUID `cd7deb69-adb3-45f7-977b-f0d0e7235ba2`). The record was intentionally recreated as **`flowguard-treasury-mcp`** (`7540cd0a-7d76-414a-a849-96b337a0c6ed`) pointed at the production URL `https://flowguard-treasury.vercel.app/mcp`, governed by policy `flowguard-treasury-allowlist` (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`). Historical captures in `EVIDENCE.md` sections 1–4 are left exactly as recorded.
- **Console vs SDK registration**: registering the same URL twice fails in the console (`400 MCP server with this URL already exists`); creating the record through the console is authoritative. The SDK's register helper upserts a record whose name equals the MCP identifier passed to it.
- **Update API limits**: `PATCH /mcp/servers/{id}` accepts only `roleMapping` / `toolMetadata` changes — URL or name changes return 500s. Recreate the record if the endpoint URL must change.
- **Naming rule**: the MCP identifier must equal the record name because the SDK builds the `X-Armoriq-MCP-Auth` header from `ARMORIQ_MCP_<SAFE_NAME>_{AUTH_TYPE,TOKEN}` environment variables keyed by the identifier passed to `invoke()`. Re-registering through the SDK after a console create would rename the record and break that mapping.
- **Open prod endpoint by design**: the deployed `/mcp` endpoint currently runs without `MCP_AUTH_TOKEN` (open sandbox endpoint; synthetic data only) so the ArmorIQ PEP proxy can reach it during judging. The conformance suite therefore passes `18/18` locally and the prod run intentionally shows the single auth-check deviation; all other checks pass.
- **Rebrand to IntentGate (17 October 2026)**: the MCP record was renamed in place to `intentgate-treasury-mcp` (same UUID `7540cd0a-7d76-414a-a849-96b337a0c6ed`) via the control plane; a new agent **`intentgate-agent`** (`b50e7e3f-8d11-4a35-816a-2dc30b7cf760`) was registered, and the allow-list policy was re-applied in place as **`cli-intentgate-agent-intentgate-treasury-mcp`** (`cd50b382-4983-456e-a1a9-c30b09668ef5`, allowed tools `["issue_refund","lookup_order"]`, default `block`). The superseded pre-rename record `flowguard-treasury-allowlist` (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`) remains attached to the MCP and still matches calls with the same allow-list — the platform exposes no rename/delete route for policy records in the API-key realm (`/policies` management requires a dashboard access token), so the legacy record is documented here rather than removed. Fresh post-rename captures and updated run identifiers: `EVIDENCE.md` §6 and [`docs/evidence/`](docs/evidence/README.md).
