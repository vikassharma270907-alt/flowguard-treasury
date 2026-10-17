# Disclosures & Attribution — BeyondFlow

This document discloses all libraries, frameworks, tools, and developer lineage used in BeyondFlow for the ArmorIQ Flow State Hackathon, in accordance with the official hackathon rules.

## 1. Development Window & Git History

- **Official window**: October 10 to 17, 2026.
- **First commit in this repository**: October 15, 2026 (`ac099d0`).
- **Commits before October 10, 2026**: none (0 commits).
- **What predates the window** (if anything): nothing in this repository predates the window; earlier work is limited to the separate prototypes listed in section 2.
- **Built fresh in the window**: ArmorIQ plan capture and intent-token flow, PEP enforcement for `lookup_order`, `change_payout`, and `issue_refund`, the voice-gateway holding pattern as integrated here, the dual-supervisor quorum, the verification scripts, and the explainer video.

## 2. Lineage & Development Statement

BeyondFlow reuses and adapts earlier work by the same developer. All of it is MIT-licensed or self-authored:

| Reused component | Where it lives | Origin |
| :--- | :--- | :--- |
| Voice gateway holding pattern (sub-5-second reply for held calls) | `gateway/` | Earlier IntentGate prototype, MIT |
| Airwallex sandbox adapter | `server/` | Earlier IntentGate prototype, MIT |
| Header, footer, `siteConfig.js`, English/Hindi i18n, and legal stub pages | `client/src/` (header/footer, i18n files, `siteConfig.js`), `vercel.json` rewrites | Separate website project by the same developer, adapted for BeyondFlow. `<FILL: approximate date it was built>` |
| Theme tokens and UI subsystems | `client/src/index.css` and related components | `<FILL: origin>` |
| Three.js scenes | `client/src/components/3d/` | `<FILL: origin, or "written for this project">` |

The repository description on GitHub previously read "FlowGuard - Airwallex Sandbox Treasury Controller", reflecting the earlier prototype lineage.

## 3. Third-Party Libraries & Frameworks
The following open-source packages and frameworks were utilized:
- **`@armoriq/sdk` (v0.6.10)**: Official ArmorIQ TypeScript/JavaScript SDK for plan capture, CSRG-IAP intent token issuance, Merkle proof verification, and PEP proxy action invocation (`https://iap.armoriq.ai`, `https://proxy.armoriq.ai`, `https://api.armoriq.ai`).
- **`@modelcontextprotocol/sdk` (v1.32.1)**: Anthropic Model Context Protocol reference SDK for tool schemas and JSON-RPC 2.0 message handling.
- **Node.js Built-in Modules**: `node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url` for zero-overhead JSON-RPC over HTTP/SSE server and async timeout handling.
- **Express.js (v5.3.0) & CORS (v2.8.6)**: Lightweight HTTP server for REST endpoints and web app integration.
- **React (v19.x) & Vite (v8.x)**: Frontend client framework for the reactive web dashboard and supervisor playground.
- **`three` (v0.186.x)**: Three.js library for hardware-accelerated 60 FPS 3D cryptographic models, orbital vaults, particle fields, and gyroscopic enclaves with WebGL cleanup and reduced-motion compliance.
- **`pdfkit` (v0.20.x)**: Server-side PDF generation engine used to compile technical architectural documentation.
- **Self-Hosted Web Fonts (SIL Open Font License)**: Inter, JetBrains Mono, and Noto Sans Devanagari woff2 subsets are vendored into `client/public/fonts/` via `scripts/vendor-fonts.mjs` and served from our own origin — no third-party font CDN is contacted at runtime.
- **Cloudflare Tunnel (`cloudflared`)**: Used during local development to expose the local MCP port to public HTTPS (`trycloudflare.com`) for ArmorIQ proxy reachability.

## 4. AI Coding Assistants
- **Google Antigravity IDE (Gemini 2.5 Pro Agentic Engine)**: Used as an interactive pair-programming assistant for code generation, test script validation, linting, and documentation.
- **Claude (Anthropic)**: used for project review, documentation and README drafting, and drafting prompts for coding agents. It had no access to the repository or API credentials.

## 5. Security & Synthetic Data Attestation
- **No Production Customer Data**: 100% of customer names, order IDs (e.g. `ORD-1001`, `ORD-84920`), bank routing numbers, and accounts are synthetic mock/sandbox entities.
- **No Production Payment Systems**: All financial mutations operate strictly on synthetic balances and sandbox simulation endpoints. Real money is never moved.
- **No Secret Commits**: All platform credentials and API keys are stored exclusively in gitignored `.env` files; `.env.example` is provided for configuration setup.

## 6. ArmorIQ Platform Notes & Migration (16 October 2026)
- **Record migration**: the first accepted enforcement run (15–16 Oct) used a Cloudflare-tunnel MCP record named `intentgate-support-mcp` (UUID `cd7deb69-adb3-45f7-977b-f0d0e7235ba2`). The record was intentionally recreated as **`flowguard-treasury-mcp`** (`7540cd0a-7d76-414a-a849-96b337a0c6ed`) pointed at the production URL `https://flowguard-treasury.vercel.app/mcp`, governed by policy `flowguard-treasury-allowlist` (`23f8f304-0f6b-44a0-9bba-fa9886ca611b`). Historical captures in `EVIDENCE.md` sections 1–4 are left exactly as recorded.
- **Console vs SDK registration**: registering the same URL twice fails in the console (`400 MCP server with this URL already exists`); creating the record through the console is authoritative. The SDK's register helper upserts a record whose name equals the MCP identifier passed to it.
- **Update API limits**: `PATCH /mcp/servers/{id}` accepts only `roleMapping` / `toolMetadata` changes — URL or name changes return 500s. Recreate the record if the endpoint URL must change.
- **Naming rule**: the MCP identifier must equal the record name because the SDK builds the `X-Armoriq-MCP-Auth` header from `ARMORIQ_MCP_<SAFE_NAME>_{AUTH_TYPE,TOKEN}` environment variables keyed by the identifier passed to `invoke()`. Re-registering through the SDK after a console create would rename the record and break that mapping.
- **Open prod endpoint by design**: the deployed `/mcp` endpoint currently runs without `MCP_AUTH_TOKEN` (open sandbox endpoint; synthetic data only) so the ArmorIQ PEP proxy can reach it during judging. The conformance suite therefore passes `18/18` locally and the prod run intentionally shows the single auth-check deviation; all other checks pass.

## 7. Known Security Limitations

- **Open production MCP endpoint.** See section 6. `/mcp` currently runs without `MCP_AUTH_TOKEN`; direct calls bypass ArmorIQ governance. `<FILL: if you enabled the token before submitting, replace this with: "The endpoint requires a bearer token; the ArmorIQ proxy supplies it through ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_TOKEN. A direct call without it is rejected (verified <date>).">`
- **Intent binding is action-level.** Argument changes are not rejected by the intent token.
- **Approval quorum is counted in the BeyondFlow gateway,** not by ArmorIQ.
- **No caller identity verification** on the voice channel.
- **Credential hygiene.** An API key fragment was visible in an earlier version of the demo video. The key was rotated on `<FILL: date, or remove this bullet if the video was re-cut before publication and the key was rotated>`.
