# Evidence captures — live ArmorIQ enforcement runs

Raw, unedited stdout of the two verification scripts, captured against the live
ArmorIQ platform and the production MCP endpoint. Nothing here is mocked: every
verdict, token id, hash and delegation id below was returned by
`iap.armoriq.ai` / `proxy.armoriq.ai` / `api.armoriq.ai` during the runs.

## Files

| File | Script | What it shows |
| --- | --- | --- |
| `test-enforcement-2026-10-16.txt` | `node --env-file=.env scripts/test-enforcement.mjs` | `lookup_order` **ALLOWED**, `change_payout` **BLOCKED** (HTTP 403, `tool_not_in_allowlist`), `issue_refund` **HELD** (real pending platform delegation) |
| `test-intent-mismatch-2026-10-16.txt` | `node --env-file=.env scripts/test-intent-mismatch.mjs` | SDK refuses a wrong-action token and an expired token before any network call; the swapped-amount case is reported honestly as **NOT REFUSED** (the platform binds actions, not call arguments — the sandbox tool's own bounds check rejects the amount) |

Captured: 2026-10-16, 19:06–19:07 UTC (the `expiresAt` values inside the
captures are authoritative).

## Revision

- Captured from repo revision **`11de761`** — the commit that adds these
  captures together with the exact script versions that produced them
  (`git log -- docs/evidence/`).
- Predecessor commit `68d04a0` fixed the MCP transport: `POST /mcp` now answers
  with Server-Sent Events (`event: message\ndata: {json}\n\n`) — the framing the
  ArmorIQ proxy expects. The Vercel deployment previously answered
  `application/json`, which made proxy invokes fail with HTTP 500.
- `.env` invokes the MCP server by its registered **name**
  (`ARMORIQ_MCP_ID=flowguard-treasury-mcp`) and carries the matching
  `ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_{AUTH_TYPE,TOKEN}` credential from which
  the SDK builds the `X-Armoriq-MCP-Auth` header.

## Platform objects exercised

| Object | Value |
| --- | --- |
| Workspace / org | `dd9e9695-e58d-4e56-8cff-ef9617ba4c54` |
| MCP server record | `flowguard-treasury-mcp` — `7540cd0a-7d76-414a-a849-96b337a0c6ed` @ `https://flowguard-treasury.vercel.app/mcp` |
| Policy | `flowguard-treasury-allowlist` — `23f8f304-0f6b-44a0-9bba-fa9886ca611b`, status `active`, allowed tools `["issue_refund","lookup_order"]`, default enforcement `block`, priority 100 |
| Agent | `flowguard-agent` — `c8bcbe51-dea4-4459-9fd8-38f88ebc714e` |
| User / operator | `flowguard-operator` |

All enforcement calls matched `flowguard-treasury-allowlist`
(`decision_source: "opa"`) with `domain` = `flowguard-treasury.vercel.app`.

## Run identifiers (final captures)

| Case | tokenId | planHash (prefix) | policy_ref | Outcome |
| --- | --- | --- | --- | --- |
| `lookup_order` | `951f7625efe24fb18039b62fadfed910` | `b3e6889fe267adb6…` | `armoriq:5081adc84221:1a1461bc656` | **ALLOWED** — real sandbox payload (order ORD-1001, Dana Whitfield, USD 89), exec 0.885 s, `verified: true` |
| `change_payout` | `3a280ab1a5f74beea90b4b459b71b498` | `b086c9aeb8da1343…` | `armoriq:5081adc84221:1a1461bd394` | **BLOCKED** — `PolicyBlockedException`, HTTP 403, reason `tool_not_in_allowlist` |
| `issue_refund` | `df327b9275b74d43b008c4e1e10ccf00` | `5ed2b4ec3d598c42…` | `armoriq:5081adc84221:1a1461be00c` | **HELD** — delegation `eb63aac7-349a-4cf0-a156-a2f3c469f427`, status `pending` |
| mismatch Case 1 (wrong action) | `90916da4116f4900bcd85e588714e785` | `b3e6889fe267adb6…` | — | `IntentMismatchException` — refused before any network call |
| mismatch Case 2 (swapped amount) | `86401740b0e8428fa5807abd4676dc84` | `5ed2b4ec3d598c42…` | — | **NOT REFUSED** — call reached the sandbox tool; upstream bounds check returned “Refund of 5000 exceeds refundable balance 89 for ORD-1001.” |
| mismatch Case 3 (expired token) | `464314b10ac44edd8c20da15adde40b2` | `b3e6889fe267adb6…` | — | `TokenExpiredException` — refused before any network call |

## HELD is a real platform object

`issue_refund` is FlowGuard's designed hold path for refunds: instead of
executing, the script creates a delegation through the platform API
(`POST /delegation/request`). The platform's own response — “Delegation request
created. Awaiting approval from senior officer.” with a real delegation id — is
what the capture shows. The refund only proceeds after a supervisor approves
(see the app's dual-supervisor playground flow).

## Re-running

```bash
node --env-file=.env scripts/test-enforcement.mjs
node --env-file=.env scripts/test-intent-mismatch.mjs
```

`.env` must hold the production `ARMORIQ_API_KEY`,
`ARMORIQ_MCP_ID=flowguard-treasury-mcp`, `ARMORIQ_AGENT_ID=flowguard-agent`
and the matching `ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_*` credential.

## History

- **2026-10-15 (UTC)** — first accepted run, via a Cloudflare tunnel to the
  local server (platform record then named `intentgate-support-mcp`). Written up
  in `EVIDENCE.md` sections 1–4. That record was later migrated to the
  production URL and the consolidated FlowGuard naming — see the migration note
  in `EVIDENCE.md` and `DISCLOSURES.md`.
- **2026-10-16 19:06 UTC** — re-verified on `https://flowguard-treasury.vercel.app/mcp`
  (this folder). These captures supersede earlier partial Oct-16 captures.

## Accessibility & performance verification (2026-10-17)

- **Keyboard-only pass** — `node scripts/verify-keyboard.mjs
  https://flowguard-treasury.vercel.app/` drives real Chrome (system channel,
  headless) with keyboard input only: 12 distinct Tab stops with a visible
  focus ring each, Enter activates the focused “For Judges” nav link, and the
  mobile drawer opens with Enter, traps Tab, and closes with Escape returning
  focus to the toggle. Result: 14/14 checks pass, exit code 0. Raw output:
  `keyboard-pass-2026-10-17.txt`.
- **Lighthouse mobile** (production URL, `--form-factor=mobile`, Chrome
  `--headless=new`): Accessibility **100**, SEO **92**, Performance **81** and
  **91** across two consecutive runs — after route-level code splitting,
  self-hosted fonts, and `content-visibility` for offscreen sections took
  total blocking time from 1,780 ms to 80–530 ms.
