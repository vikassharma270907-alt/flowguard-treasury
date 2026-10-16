# Disclosures & Attribution — FlowGuard

This document discloses all libraries, frameworks, tools, and developer lineage used in FlowGuard for the ArmorIQ Flow State Hackathon, in accordance with the official hackathon rules.

## 1. Development Window & Git History
- **Official Window**: Development was carried out within the official hackathon window (October 10–17, 2026).
- **Git History**: Commit history reflects iterative authoring of the ArmorIQ policy integration, the Model Context Protocol (MCP) server, the voice gateway holding pattern, and the cryptographic boundary test.

## 2. Lineage & Development Statement
- **Developer Statement**: FlowGuard was assembled during the hackathon window and reuses the developer's earlier MIT-licensed IntentGate prototype components (disclosed below), alongside third-party open-source libraries (`@armoriq/sdk`, `@modelcontextprotocol/sdk`, Three.js, React, Express).
- Earlier architectural prototypes (such as the IntentGate gateway concept for sub-5-second voice holding patterns and the Airwallex sandbox adapter) were adapted and unified into FlowGuard under the MIT License.

## 3. Third-Party Libraries & Frameworks
The following open-source packages and frameworks were utilized:
- **`@armoriq/sdk` (v0.6.10)**: Official ArmorIQ TypeScript/JavaScript SDK for plan capture, CSRG-IAP intent token issuance, Merkle proof verification, and PEP proxy action invocation (`https://iap.armoriq.ai`, `https://proxy.armoriq.ai`, `https://api.armoriq.ai`).
- **`@modelcontextprotocol/sdk` (v1.32.1)**: Anthropic Model Context Protocol reference SDK for tool schemas and JSON-RPC 2.0 message handling.
- **Node.js Built-in Modules**: `node:http`, `node:crypto`, `node:fs`, `node:path`, `node:url` for zero-overhead JSON-RPC over HTTP/SSE server and async timeout handling.
- **Express.js (v5.3.0) & CORS (v2.8.6)**: Lightweight HTTP server for REST endpoints and web app integration.
- **React (v18.x) & Vite (v5.x)**: Frontend client framework for the reactive web dashboard and supervisor playground.
- **`three` (v0.183.x)**: Three.js library for hardware-accelerated 60 FPS 3D cryptographic models, orbital vaults, particle fields, and gyroscopic enclaves with WebGL cleanup and reduced-motion compliance.
- **`pdfkit` (v0.20.x)**: Server-side PDF generation engine used to compile technical architectural documentation.
- **Cloudflare Tunnel (`cloudflared`)**: Used during local development to expose the local MCP port to public HTTPS (`trycloudflare.com`) for ArmorIQ proxy reachability.

## 4. AI Coding Assistants
- **Google Antigravity IDE (Gemini 2.5 Pro Agentic Engine)**: Used as an interactive pair-programming assistant for code generation, test script validation, linting, and documentation.

## 5. Security & Synthetic Data Attestation
- **No Production Customer Data**: 100% of customer names, order IDs (e.g. `ORD-1001`, `ORD-84920`), bank routing numbers, and accounts are synthetic mock/sandbox entities.
- **No Production Payment Systems**: All financial mutations operate strictly on synthetic balances and sandbox simulation endpoints. Real money is never moved.
- **No Secret Commits**: All platform credentials and API keys are stored exclusively in gitignored `.env` files; `.env.example` is provided for configuration setup.
