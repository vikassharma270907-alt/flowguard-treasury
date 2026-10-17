# DISCLOSURES.md updates

Edit the existing `DISCLOSURES.md` as follows. Fill every `<FILL: ...>` from your own git history before committing. These facts can only come from you; if you can't confirm one, say that plainly instead of guessing.

---

## Replace section 1 with:

## 1. Development Window & Git History

- **Official window**: October 10 to 17, 2026.
- **First commit in this repository**: `<FILL: date from "git log --reverse --format='%h %ad %s' --date=short | head -1">`.
- **Commits before October 10, 2026**: `<FILL: number from "git log --until=2026-10-09 --oneline | wc -l". If zero, write "none".>`
- **What predates the window** (if anything): `<FILL: list directories or features that existed before Oct 10, or write "nothing in this repository predates the window; earlier work is limited to the separate prototypes listed in section 2">`.
- **Built fresh in the window**: ArmorIQ plan capture and intent-token flow, PEP enforcement for `lookup_order`, `change_payout`, and `issue_refund`, the voice-gateway holding pattern as integrated here, the dual-supervisor quorum, the verification scripts, and the explainer video.

## Replace section 2 with:

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

## Add to section 4 (AI Coding Assistants):

- **Claude (Anthropic)**: used for project review, documentation and README drafting, and drafting prompts for coding agents. It had no access to the repository or API credentials.

## Add as section 7:

## 7. Known Security Limitations

- **Open production MCP endpoint.** See section 6. `/mcp` currently runs without `MCP_AUTH_TOKEN`; direct calls bypass ArmorIQ governance. `<FILL: if you enabled the token before submitting, replace this with: "The endpoint requires a bearer token; the ArmorIQ proxy supplies it through ARMORIQ_MCP_FLOWGUARD_TREASURY_MCP_TOKEN. A direct call without it is rejected (verified <date>).">`
- **Intent binding is action-level.** Argument changes are not rejected by the intent token.
- **Approval quorum is counted in the BeyondFlow gateway,** not by ArmorIQ.
- **No caller identity verification** on the voice channel.
- **Credential hygiene.** An API key fragment was visible in an earlier version of the demo video. The key was rotated on `<FILL: date, or remove this bullet if the video was re-cut before publication and the key was rotated>`.
