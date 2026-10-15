# Disclosures & Attribution

This document discloses all pre-existing libraries, frameworks, starter code, and AI assistants used during the development of this hackathon project, in strict accordance with Rule 6 and Rule 8 of the ArmorIQ Hackathon.

## 1. Hackathon Development Timeline
- **Hackathon Window**: Core project development, ArmorIQ policy authoring, MCP server deployment, voice gateway proxy integration, and multi-approval protocol were executed within the official hackathon window.
- **Git Commit History**: Reflects iterative development of the voice gateway service, MCP server tools, ArmorIQ integration, supervisor playground, and test scripts.

## 2. AI Coding Assistants Used
- **Google Antigravity IDE (Gemini 2.5 Pro Agentic Engine)**: Used as an interactive pair-programming assistant for code generation, architectural analysis, terminal execution, error debugging, and test validation.

## 3. Pre-Existing Libraries & Frameworks
The following open-source packages and frameworks were utilized:
- **`@armoriq/sdk` (v0.6.10)**: Official ArmorIQ TypeScript/JavaScript SDK for plan capture, CSRG-IAP intent token issuance, Merkle proof verification, and proxy action invocation (`https://iap.armoriq.ai`, `https://proxy.armoriq.ai`, `https://api.armoriq.ai`).
- **`@modelcontextprotocol/sdk` (v1.32.1)**: Anthropic Model Context Protocol reference SDK for tool schemas and JSON-RPC 2.0 message handling.
- **Node.js Built-in Modules**: `node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url` for zero-overhead JSON-RPC over HTTP/SSE server and async timeout handling.
- **Express.js (v5.3.0) & CORS (v2.8.6)**: Lightweight HTTP server for REST endpoints and web app integration.
- **React (v18.x) & Vite (v5.x)**: Frontend client framework for the reactive web dashboard and supervisor playground.
- **`three` (v0.183.x)**: Three.js library for hardware-accelerated 60 FPS 3D cryptographic models, orbital vaults, particle fields, and gyroscopic enclaves with WebGL cleanup and reduced-motion compliance.
- **`pdfkit` (v0.20.x)**: Server-side PDF generation engine used to compile the technical architectural guides ([docs/Veratone_Overview.pdf](docs/Veratone_Overview.pdf) and [docs/USER_GUIDE.pdf](docs/USER_GUIDE.pdf)).
- **Cloudflare Tunnel (`cloudflared`)**: Tunneling agent used to expose local development ports to public HTTPS (`trycloudflare.com`) for ArmorIQ proxy reachability.

## 4. Starter Templates & Prior Prototypes
- **Airwallex Sandbox Adapter & FlowGuard Treasury Concept**: Earlier sandbox fintech UI components and prototype data structures for duplicate invoice detection and treasury buffer monitoring were adapted into the Veratone project to showcase how voice agents execute financial payouts and refunds under zero-trust ArmorIQ governance.
- **IntentGate Gateway Service**: Architecture developed specifically for governing ElevenLabs Conversational Voice Agent tool calls with strict sub-5-second timeout holding utterances and dual-key supervisor authorization.

## 5. Security & Synthetic Data Attestation
- **No Production Customer Data**: All customer names, order IDs (e.g. `ORD-1001`, `ORD-1002`), bank routing numbers, and accounts are synthetic mock/sandbox entities.
- **No Production Payment Systems**: All financial mutations operate strictly on synthetic balances and sandbox simulation endpoints.
- **No Secret Commits**: All platform credentials and API keys are stored exclusively in gitignored `.env` files; `.env.example` is provided for configuration setup.
