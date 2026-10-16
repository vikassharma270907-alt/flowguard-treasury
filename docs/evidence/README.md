# Evidence captures — live ArmorIQ enforcement runs

Raw, unedited stdout of the verification scripts plus raw HTTP responses from
the deployed webhook, captured against the live ArmorIQ platform and the
production MCP endpoint. Nothing here is mocked: every
verdict, token id, hash and delegation id below was returned by
`iap.armoriq.ai` / `proxy.armoriq.ai` / `api.armoriq.ai` during the runs.

## Files

| File | Script | What it shows |
| --- | --- | --- |
| `test-enforcement-2026-10-17.txt` | `node --env-file=.env scripts/test-enforcement.mjs` | Final run (post-rename): `lookup_order` **ALLOWED** (1,200 ms), `change_payout` **BLOCKED** (`PolicyBlockedException`, HTTP 403), `issue_refund` **HELD** (`delegationId: 2c61ec81-...`) |
| `test-intent-mismatch-2026-10-17.txt` | `node --env-file=.env scripts/test-intent-mismatch.mjs` | Final run (post-rename): Case 1 `IntentMismatchException`, Case 2 `NOT REFUSED` (bounds check), Case 3 `TokenExpiredException` |
| `test-enforcement-2026-10-17-pre-rename.txt` | same scripts | Same-day pre-rename run, kept verbatim for the audit trail |
| `test-intent-mismatch-2026-10-17-pre-rename.txt` | same scripts | Same-day pre-rename run, kept verbatim |
| `test-enforcement-2026-10-16.txt` | same scripts | Baseline production run: `lookup_order` **ALLOWED** (887 ms), `change_payout` **BLOCKED** (HTTP 403), `issue_refund` **HELD** (`eb63aac7-...`) |
| `test-intent-mismatch-2026-10-16.txt` | same scripts | Baseline production run: SDK action-level intent binding and token expiration verification |
| `keyboard-pass-2026-10-17.txt` | `node scripts/verify-keyboard.mjs` | Post-promotion keyboard-only pass on the final production build: 14/14 checks, exit code 0 (see A11y section) |
| `keyboard-pass-2026-10-17-pre-rename.txt` | same | The same-day keyboard pass on the pre-rename build, kept verbatim |
| `prod-verification-2026-10-17-*.json` | `curl` (deployed webhook) | Post-deploy production-path run: governed `orderLookup` **ALLOWED**, `payoutChange` **BLOCKED** (see section below) |

Times: the 16 Oct file was written at 19:06 UTC; the 17 Oct files were written
at 02:18 IST (pre-rename) and 03:10 IST (final) — filenames use the IST day of
the run. Expiration timestamps and tokens inside the raw files are authoritative.

## Revision

- The current captures were produced on the `feat/intentgate-rebrand` branch —
  the branch that renames the project to IntentGate and re-runs the verification
  (`git log -- docs/evidence/`).
- Predecessor commit `68d04a0` fixed the MCP transport: `POST /mcp` now answers
  with Server-Sent Events (`event: message\ndata: {json}\n\n`) — the framing the
  ArmorIQ proxy expects. The Vercel deployment previously answered
  `application/json`, which made proxy invokes fail with HTTP 500.
- `.env` invokes the MCP server by its registered **name**
  (`ARMORIQ_MCP_ID=intentgate-treasury-mcp`) and carries the matching
  `ARMORIQ_MCP_INTENTGATE_TREASURY_MCP_{AUTH_TYPE,TOKEN}` credential from which
  the SDK builds the `X-Armoriq-MCP-Auth` header.

## Platform objects exercised

| Object | Value |
| --- | --- |
| Workspace / org | `dd9e9695-e58d-4e56-8cff-ef9617ba4c54` |
| MCP server record | `intentgate-treasury-mcp` — `7540cd0a-7d76-414a-a849-96b337a0c6ed` @ `https://flowguard-treasury.vercel.app/mcp` (renamed in place on 17 Oct; earlier record name `flowguard-treasury-mcp`) |
| Policy matched #1 | `cli-intentgate-agent-intentgate-treasury-mcp` — `cd50b382-4983-456e-a1a9-c30b09668ef5` |
| Policy matched #2 | `flowguard-treasury-allowlist` — `23f8f304-0f6b-44a0-9bba-fa9886ca611b` (superseded pre-rename record, still attached; both policies: allowed tools `["issue_refund","lookup_order"]`, default enforcement `block`, priority 100) |
| Agent | `intentgate-agent` — `b50e7e3f-8d11-4a35-816a-2dc30b7cf760` (registered 17 Oct; the earlier registration remains in the workspace) |
| User / operator | `intentgate-operator` |

All enforcement calls matched the two policies above
(`decision_source: "opa"`) with `domain` = `flowguard-treasury.vercel.app` —
the deployment hostname predates the rename and stays pinned.

## Run identifiers (final post-rename captures)

| Case | tokenId | planHash (prefix) | policy_ref | Outcome |
| --- | --- | --- | --- | --- |
| `lookup_order` | `6301fb8c52c4404e90912db634752f77` | `b3e6889fe267adb6…` | `armoriq:5081adc84221:1a146a7fcb9` | **ALLOWED** — real sandbox payload (order ORD-1001, Dana Whitfield, USD 89), round-trip 1,200 ms, `verified: true` |
| `change_payout` | `c2046e23139f41ff9962b670ed7c7401` | `b086c9aeb8da1343…` | `armoriq:5081adc84221:1a146a80b51` | **BLOCKED** — `PolicyBlockedException`, HTTP 403, reason `tool_not_in_allowlist` |
| `issue_refund` | `f18882afb2b04411b5fd56ec28157c00` | `5ed2b4ec3d598c42…` | `armoriq:5081adc84221:1a146a817ec` | **HELD** — delegation `2c61ec81-1434-464f-907a-1748618e3d10`, status `pending` |
| mismatch Case 1 (wrong action) | `c4a90485fe814976a7d524fa2ca75ac9` | `b3e6889fe267adb6…` | — | `IntentMismatchException` — refused before any network call |
| mismatch Case 2 (swapped amount) | `5fa1f8ed2aaf4bb2b7a4bb7a0609e01c` | `5ed2b4ec3d598c42…` | — | **NOT REFUSED** — call reached the sandbox tool; upstream bounds check returned “Refund of 5000 exceeds refundable balance 89 for ORD-1001.” |
| mismatch Case 3 (expired token) | `4efb997e4b854b44a803f3ed85b2c9e6` | `b3e6889fe267adb6…` | — | `TokenExpiredException` — refused before any network call |

## HELD is a real platform object

`issue_refund` is IntentGate's designed hold path for refunds: instead of
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
`ARMORIQ_MCP_ID=intentgate-treasury-mcp`, `ARMORIQ_AGENT_ID=intentgate-agent`
and the matching `ARMORIQ_MCP_INTENTGATE_TREASURY_MCP_*` credential.

## History

- **2026-10-15 (UTC)** — first accepted run, via a Cloudflare tunnel to the
  local server (platform record then named `intentgate-support-mcp`). Written up
  in `EVIDENCE.md` sections 1–4. That record was later migrated to the
  production URL under the pre-rename name — see the migration notes in
  `EVIDENCE.md` and `DISCLOSURES.md`.
- **2026-10-16 19:06 UTC** — re-verified on `https://flowguard-treasury.vercel.app/mcp`
  (16 Oct captures). These superseded earlier partial Oct-16 captures.
- **2026-10-17 02:18 IST** — same-day re-run ahead of the rename; kept verbatim
  as `*-pre-rename.txt`.
- **2026-10-17 03:10 IST** — final run (current captures): project and platform
  records renamed to IntentGate, allow-list policy re-applied in place, and the
  superseded pre-rename policy record still attached and matching (see Platform
  objects above).

## Post-deploy production-path verification (2026-10-17)

After the IntentGate build was promoted to production, the deployed app itself —
not the local scripts — was exercised through its public voice-gateway webhook
so the live deployment is on record as governed by ArmorIQ:

```bash
curl -X POST https://flowguard-treasury.vercel.app/api/voice/gateway/tool-call \
  -H "Content-Type: application/json" \
  --data-binary '{"rawToolName":"IntentGate_orderLookup","parameters":{"order_id":"ORD-1001"}}'

curl -X POST https://flowguard-treasury.vercel.app/api/voice/gateway/tool-call \
  -H "Content-Type: application/json" \
  --data-binary '{"rawToolName":"IntentGate_payoutChange","parameters":{"account_id":"ACC-4471","new_destination":"GB29 NWBK 6016 1331 9268 19"}}'
```

Both calls were decided by ArmorIQ (`decision_source: "opa"`, both policies
matched, `domain` = `flowguard-treasury.vercel.app`):

| Call | Verdict | Run identifiers |
| --- | --- | --- |
| `IntentGate_orderLookup` | **ALLOWED** — the agent spoke the real sandbox order back (delivered · USD 89 · refundable 89) | token `faf4e0d4faf0403aae85f95c158d4d60`, plan `b3e6889fe267adb6…`, 2,252 ms |
| `IntentGate_payoutChange` | **BLOCKED** — `tool_not_in_allowlist`, routed to supervisor hold | token `35dcb60cbe164f20bddb8723aec3e4dc`, plan `b086c9aeb8da1343…` |

Raw HTTP responses are stored byte-for-byte as
`prod-verification-2026-10-17-orderlookup.json` and
`prod-verification-2026-10-17-payoutchange.json`.

Two deployment fixes shipped with this verification:

- `2311a0e` — `armorIqEnforcement` now sanitizes `ARMORIQ_API_KEY` (strip
  surrounding quotes/whitespace) before SDK init, exactly like `armorIqService`
  does; the deployed status previously reported `NOT_CONNECTED` because the
  stored value failed the SDK's key-format check while the platform was
  reachable with the cleaned key.
- `7a2893d` — the voice gateway unwraps the MCP tool-result envelope
  (`{content:[{type:'text',text:'…'}]}`) before building the spoken response, so
  an ALLOWED lookup cites the real order fields instead of "unknown".

## Accessibility & performance verification (2026-10-17)

- **Keyboard-only pass** — `node scripts/verify-keyboard.mjs
  https://flowguard-treasury.vercel.app/` drives real Chrome (system channel,
  headless) with keyboard input only: 12 distinct Tab stops with a visible
  focus ring each, Enter activates the focused “For Judges” nav link, and the
  mobile drawer opens with Enter, traps Tab, and closes with Escape returning
  focus to the toggle. Result: 14/14 checks pass, exit code 0 — run twice: on
  the pre-rename build, and re-run post-promotion on the final IntentGate build.
  Raw outputs: `keyboard-pass-2026-10-17-pre-rename.txt` (2026-10-16 19:58 UTC)
  and `keyboard-pass-2026-10-17.txt` (2026-10-16 22:14 UTC; 17 Oct IST).
- **Lighthouse mobile** (production URL, `--form-factor=mobile`, Chrome
  `--headless=new`): Accessibility **100**, SEO **92**, Performance **81** and
  **91** across two consecutive runs — after route-level code splitting,
  self-hosted fonts, and `content-visibility` for offscreen sections took
  total blocking time from 1,780 ms to 80–530 ms.
