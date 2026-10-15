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

## 🛡️ Sandbox Safety & Isolation Notice
- Operates strictly against the Airwallex Sandbox environment (`api.sandbox.airwallex.com`).
- No live banking credentials or real money movement are ever utilized.
- Automatic fallback to high-fidelity mock adapter if sandbox credentials are unconfigured.

---

## 📄 License
MIT License. Developed for the Airwallex Developer Hackathon.
