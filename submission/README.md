# BeyondFlow: a voice support agent governed by ArmorIQ

> A voice AI agent whose every MCP tool call goes through the ArmorIQ Policy Enforcement Point (PEP) before it can touch money. `lookup_order` is allowed, `change_payout` is blocked, and `issue_refund` is held for supervisor approval. The allow, block, and hold decisions come from ArmorIQ, not from code in this repo.

**Live app**: https://flowguard-treasury.vercel.app · **Judge dashboard**: https://flowguard-treasury.vercel.app/judges · **MCP endpoint**: `https://flowguard-treasury.vercel.app/mcp` · **Demo video**: <VIDEO_URL>

All data is synthetic sandbox data. No real money moves.

---

## Judge quick start

1. Watch the demo video (allow, block, hold, approve, audit): <VIDEO_URL>
2. Open the [judge dashboard](https://flowguard-treasury.vercel.app/judges) and the Boundary Test.
3. Raw captures from real runs are in [`docs/recorded-runs/`](docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json), [`docs/evidence/`](docs/evidence/README.md), and [`EVIDENCE.md`](EVIDENCE.md).
4. To re-run the checks yourself, see [Verify it yourself](#verify-it-yourself). You need your own `ARMORIQ_API_KEY`.

The voice gateway and supervisor playground run locally (`localhost:8790`) during live demos. The video and the recorded captures show the same flow end to end.

---

## Who decides what

| Behavior | Decided by | Notes |
| :--- | :--- | :--- |
| `lookup_order` allowed | **ArmorIQ PEP** (`proxy.armoriq.ai`) | Stored policy `flowguard-treasury-allowlist` |
| `change_payout` blocked | **ArmorIQ PEP** | HTTP 403, `tool_not_in_allowlist` |
| `issue_refund` held | **ArmorIQ** (platform delegation request) | Pending delegation created through `/delegation/request` |
| Two-supervisor quorum before release | **BeyondFlow gateway** | ArmorIQ creates the hold; the gateway counts approvals. Configured with `REQUIRED_APPROVALS_ISSUE_REFUND` (default 2) and `HOLD_TTL_MS`. |
| Wrong action or expired token | **ArmorIQ SDK** | `IntentMismatchException`, `TokenExpiredException` |
| ArmorPay duplicate-invoice shield and reserve floor | **BeyondFlow business rules** | App logic in `server/armorPayService.js`. Not an ArmorIQ decision and not part of the enforcement demo. |

The MCP server contains no allow/deny logic. The gateway contains no allow/deny rules for the three voice tools.

---

## Requirements checklist

| Requirement | Evidence | Status |
| :--- | :--- | :--- |
| Setup order followed | API key from `platform.armoriq.ai`; MCP registered as `flowguard-treasury-mcp` (`7540cd0a-7d76-414a-a849-96b337a0c6ed`) at the production URL; agent `flowguard-agent`; policy `flowguard-treasury-allowlist`. See [ARMORIQ_ONBOARDING.md](ARMORIQ_ONBOARDING.md). | Done |
| Policies verified with a 3-result script | `scripts/test-enforcement.mjs`: `lookup_order` ALLOWED, `change_payout` BLOCKED, `issue_refund` HELD, against real ArmorIQ. Captures are in [`docs/recorded-runs/`](docs/recorded-runs/real-armoriq-enforcement-2026-10-16.json). | Done |
| Two-approval approach documented | ArmorIQ creates the hold; the gateway counts two approvals. See [DX_NOTES.md](DX_NOTES.md) and [Known limitations](#known-limitations). | Done (quorum counted in gateway) |
| MCP reachable through the ArmorIQ proxy | `POST /mcp` (JSON-RPC 2.0, SSE responses), invoked through `https://proxy.armoriq.ai/invoke`. | Done |
| One ALLOWED and one BLOCKED in audit logs | `lookup_order` and `change_payout` entries in the `proxy.armoriq.ai` audit ledger. | Done |
| Intent binding demonstrated | `scripts/test-intent-mismatch.mjs`: wrong action refused; expired token refused; **swapped amount not refused by the token** (binding is action-level). | Done for action binding and expiry |
| Decisions come from ArmorIQ | See "Who decides what". | Done for the three voice tools |
| Held calls answer within ElevenLabs' ~5 s window | The gateway replies to held calls immediately with a holding message; the final decision is relayed through `check_supervisor_decision`. See [Latency](#latency). | Done (thin margin) |
| Prefix mapping and synthetic data | The gateway strips the `BeyondFlow_` prefix. All data is mock (`ORD-1001`, `ORD-1002`, `ACC-4471`). | Done |
| No secrets, disclosures complete | `.env` is gitignored; `.env.example` has placeholders only. See [DISCLOSURES.md](DISCLOSURES.md). | Done |

---

## Architecture

```mermaid
flowchart TD
    User([Caller Voice / Web Client]) <--> ElevenLabs[ElevenLabs Conversational AI Agent]
    ElevenLabs -- "Webhook Tool Call (BeyondFlow_<tool>)" --> Gateway[BeyondFlow Gateway :8790]

    subgraph ArmorIQ Platform ["ArmorIQ Governance Cloud (platform.armoriq.ai)"]
        IAP["Intent Backend (iap.armoriq.ai)"]
        Proxy["PEP Proxy (proxy.armoriq.ai)"]
        PlatformAPI["Control Plane (api.armoriq.ai)"]
    end

    Gateway -- "1. capturePlan()" --> Gateway
    Gateway -- "2. getIntentToken()" --> IAP
    Gateway -- "3. invoke(mcp, tool, token, params)" --> Proxy
    Proxy -- "Enforce stored policy (allow/block)" --> Proxy
    Proxy -- "4. Validated SSE tool call" --> MCPServer[BeyondFlow MCP Server (Vercel /mcp)]

    Gateway -- "Hold (/delegation/request)" --> PlatformAPI
    Supervisor([Supervisor]) <--> Playground[Supervisor Playground]
    Playground -- "2 approvals required for refund" --> Gateway
    Gateway -- "Release approved call" --> Proxy
```

## Components

- **Voice agent**: ElevenLabs Conversational AI. Tools exposed through the gateway: `BeyondFlow_orderLookup`, `BeyondFlow_payoutChange`, `BeyondFlow_issueRefund`, `check_supervisor_decision`.
- **MCP server** (`mcp-server/server.mjs`): JSON-RPC 2.0 over `POST /mcp` with SSE responses. Tools: `lookup_order`, `change_payout`, `issue_refund`. No policy logic.
- **Gateway** (`gateway/server.mjs`): for each tool call runs `capturePlan`, `getIntentToken`, and `invoke` through `proxy.armoriq.ai`. Held calls get an immediate holding reply; the gateway relays the final decision after supervisor review.
- **Supervisor playground** (`playground/index.html`): pending holds with caller context, matched policy, and plan hash, with Approve and Deny. Local URL: `http://localhost:8790/playground`.
- **ArmorPay** (`server/armorPayService.js`): supporting treasury module with duplicate-invoice checks, a reserve floor, Airwallex sandbox rails, and signed receipts. Its blocks are business rules, not ArmorIQ decisions.

---

## Verify it yourself

Requirements: Node.js 18+, npm, and an `ARMORIQ_API_KEY` from [platform.armoriq.ai](https://platform.armoriq.ai).

```bash
npm install
npm --prefix client install
cp .env.example .env          # fill in your own values
```

**Policy check (allowed / blocked / held)**

```bash
node --env-file=.env scripts/test-enforcement.mjs
```

Expected summary: `lookup_order ALLOWED`, `change_payout BLOCKED`, `issue_refund HELD`.

**Intent binding**

```bash
node --env-file=.env scripts/test-intent-mismatch.mjs
```

Expected: wrong action raises `IntentMismatchException`; swapped amount is **not refused** (reaches upstream); expired token raises `TokenExpiredException`.

**Run the stack and the 45-second demo**

```bash
node --env-file=.env mcp-server/server.mjs
node --env-file=.env gateway/server.mjs
npm run dev
node --env-file=.env scripts/run-demo.mjs
```

---

## Latency

ElevenLabs gives a tool call about 5 seconds. Calls made directly through the SDK are much faster than the full gateway path, which adds the webhook hop, plan capture, token minting, the proxy, and the MCP (including a possible Vercel cold start). Through the gateway, expect roughly 3 to 4 seconds per call, so the margin is thin. Warm the MCP with one throwaway call before a live demo. Exact figures for each run are in the capture files under `docs/`.

---

## Known limitations

- **Action-level intent binding.** The token binds the declared action set and expiry. Changing an argument such as an amount does not invalidate the token; arguments are evaluated at the upstream tool boundary.
- **Quorum counted in the gateway.** ArmorIQ creates the hold. The two-approval tally is BeyondFlow gateway code, so the two-person rule depends on the gateway's integrity.
- **Open sandbox MCP endpoint.** The production `/mcp` endpoint currently runs without `MCP_AUTH_TOKEN` so the ArmorIQ proxy can reach it during judging. Calling `/mcp` directly bypasses ArmorIQ governance; enforcement applies to traffic that goes through `proxy.armoriq.ai`. The production conformance run shows this as its one auth-check deviation (details in [DISCLOSURES.md](DISCLOSURES.md) section 6).
- **Local business rules.** ArmorPay's duplicate-invoice and reserve-floor checks are app logic.
- **Voice caller identity.** Governing tool calls does not verify who is on the phone. Caller verification is out of scope for this demo.
- **Synthetic data only.**

---

## Disclosures

Full details are in [DISCLOSURES.md](DISCLOSURES.md): development window and git history, reused components (earlier MIT-licensed IntentGate prototype, header/footer and i18n system, UI and 3D components), third-party libraries, and AI coding assistants used.

---

<details>
<summary><strong>Additional features (not part of the core ArmorIQ demo)</strong></summary>

- **3D elements (Three.js)** in `client/src/components/3d/`: `RotatingHeroVault.jsx`, `ParticleBackgroundField.jsx`, `InteractiveIntentGyroscope.jsx`. Lazy-loaded, GPU resources disposed on unmount, `prefers-reduced-motion` respected, SVG fallback without WebGL.
- **Light and dark themes** through CSS tokens in `client/src/index.css`, with a toggle and no flash on first load.
- **English and Hindi UI** (cookie-backed). The Hindi strings are draft translations and have not been reviewed by a native specialist.
- **PDF guides**: [`docs/BeyondFlow_Overview.pdf`](docs/BeyondFlow_Overview.pdf) and [`docs/USER_GUIDE.pdf`](docs/USER_GUIDE.pdf). Regenerate with `npm run docs:overview` and `npm run docs:pdf`.

</details>

## Further reading

[DX_NOTES.md](DX_NOTES.md) · [DISCLOSURES.md](DISCLOSURES.md) · [EVIDENCE.md](EVIDENCE.md) · [ARMORIQ_ONBOARDING.md](ARMORIQ_ONBOARDING.md) · [LICENSE](LICENSE)

## License

Application code is under the [MIT License](LICENSE). Self-hosted fonts (Inter, JetBrains Mono, Noto Sans Devanagari) are under the SIL Open Font License. Contact: open an issue on this repository.
