# FlowGuard — Adaptive Treasury Controller & AP Duplicate Shield

> Built for the **Airwallex Developer Hackathon (Sandbox Only)**  
> Integrated with **Airwallex Sandbox APIs** and **ArmorIQ Intent Assurance (`@armoriq/sdk`)**  
> Designed with a **Vercel & Shadcn Dark Theme**

---

## ⚡ Overview

**FlowGuard** is an autonomous treasury orchestration and accounts payable (AP) protection engine designed for multi-entity international enterprises. It bridges **Airwallex multi-currency corridors** with **deterministic financial guardrails** and **ArmorIQ agent intent verification** to prevent duplicate payments, enforce liquidity reserve floors, and eliminate manual treasury overhead.

### Key Capabilities
- **Deterministic Liquidity Protection:** Enforces a mathematical cash reserve floor ($15,000 USD default) across multi-currency operations before any payout is authorized.
- **Levenshtein AP Duplicate Shield:** Triple-vector fuzzy matching (Vendor normalization + Amount similarity + Date window) halts duplicate disbursements before funds leave the wallet.
- **ArmorIQ Cryptographic Intent Governance:** Intercepts payment actions, canonicalizes plans into SHA-256 hashes, validates policy rules against the live ArmorIQ platform (`ak_live_...`), and mints tamper-proof `aiq_tok_...` tokens.
- **Enterprise Admin Console & OAuth 2.0:** Vercel-inspired dark management console with Google Workspace, GitHub, ArmorIQ SSO, policy sliders, corridor switches, and real-time telemetry.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, Vite, Lucide Icons, Vanilla CSS (Shadcn UI & Vercel dark aesthetics)
- **Backend:** Node.js, Express 5, `@armoriq/sdk`, UUID, CORS, Dotenv
- **Fintech APIs:** Airwallex Sandbox API (`https://api.sandbox.airwallex.com/api/v1`)
  - Wallet & Balance Endpoints (`/api/v1/balances/current`)
  - Guaranteed FX Quotes (`/api/v1/fx/quotes/create`)
  - Multi-Currency Payout Transfers (`/api/v1/transfers/create`)
  - Deposit Simulation & Webhooks
- **Model Context Protocol (MCP):** Official MCP Server (`@modelcontextprotocol/sdk`) governing treasury tools with live ArmorIQ intent verification (`server/mcpServer.js`). Run with `npm run mcp`.
- **Voice AI:** ElevenLabs Conversational Voice Agent Support Gateway with 5s timeout protection.
- **Platform Onboarding:** See [ARMORIQ_ONBOARDING.md](file:///d:/hackathon/New%20folder/ARMORIQ_ONBOARDING.md) for step-by-step registration on [platform.armoriq.ai](https://platform.armoriq.ai).
- **Hosting:** Vercel Serverless Architecture (Static React build + Express Serverless API via `@vercel/node`)

---

## 🚀 Quickstart

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/vikassharma270907-alt/flowguard-treasury.git
cd flowguard-treasury
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=3001
AIRWALLEX_CLIENT_ID=your_sandbox_client_id
AIRWALLEX_API_KEY=your_sandbox_api_key
AIRWALLEX_API_URL=https://api.sandbox.airwallex.com/api/v1
ARMORIQ_API_KEY=ak_live_your_key_here
DEFAULT_RESERVE_FLOOR=15000
```

### 3. Run Locally
```bash
npm run dev
```
- **React Frontend:** [http://localhost:5173](http://localhost:5173)
- **Express Backend:** [http://localhost:3001](http://localhost:3001)

### 4. Build for Production
```bash
npm run build
```

---

## 🎙️ ElevenLabs Conversational Voice Agent Gateway & Supervisor Playground

FlowGuard features a real-time conversational voice agent gateway integrated with **ElevenLabs Conversational AI** and **ArmorIQ Intent Assurance**.

- **ArmorIQ-Signed Plan on Every Support Call:** Every incoming call session computes a canonical plan, canonicalizes its steps into a SHA-256 hash, and issues a cryptographic Ed25519 Intent Token before any financial tool can execute.
- **Order Lookup:** Allowed directly by ArmorIQ read policy (0.2s latency) with zero human intervention required.
- **Supervisor Role in the Playground ("You are the supervisor"):**
  - When callers attempt to socially engineer or persuade the agent into modifying destination payout routing or bank accounts, the action is caught by ArmorIQ.
  - On the playground, you press **[Deny]** and the agent speaks directly to the caller refusing the change.
- **Dual-Approval Quorum for Refunds:** Refunds of freight or damaged goods require two supervisor approvals (Key 1 + Key 2 Compliance Lead) before executing payouts via Airwallex rails.
- **45-Second End-to-End Guided Scenario:** Includes animated audio waveform visualizers, Web Speech API audio playback, live transcript streaming, and stepped interactive control.

### 💡 Developer Experience (DX) Architectural Insights
1. **5-Second Tool Call Timeout Window & Async Holding Pattern:**
   The ElevenLabs Conversational Voice platform gives tool calls roughly 5 seconds before timing out. Human supervisor evaluation or multi-sig review takes longer than 5 seconds. The gateway solves this by returning an immediate holding utterance within the 5-second window: *"A supervisor has been notified. Please hold for supervisor review..."* and records the real decision asynchronously when the supervisor acts.
2. **IntentGate Tool Prefix Mapping (`IntentGate_<tool>`):**
   Tools are exposed to the ElevenLabs LLM with security namespaces (`IntentGate_orderLookup`, `IntentGate_payoutChange`, `IntentGate_issueRefund`) so the model reasons through intent governance. The FlowGuard Gateway transparently strips this prefix before dispatching to internal ArmorIQ policy validators and Airwallex services.

---

## 🛡️ Sandbox Safety & Isolation Notice
- Operates strictly against the Airwallex Sandbox environment (`api.sandbox.airwallex.com`).
- No live banking credentials or real money movement are ever utilized.
- Automatic fallback to high-fidelity mock adapter if sandbox credentials are unconfigured.

---

## 📄 License
MIT License. Developed for the Airwallex Developer Hackathon.
