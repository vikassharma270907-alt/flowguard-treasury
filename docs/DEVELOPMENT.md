# Development & Operational Guide

### Running Locally
- MCP server: `npm run mcp:server`
- Gateway: `npm run gateway`
- Frontend: `cd client && npm run dev`

### Regenerating Guide PDF
- `node scripts/generate-user-guide.mjs` (mirrors to `client/public/docs/flowguard-guide.pdf`)
- `node scripts/generate-beyondflow-overview.mjs`

### Verification Scripts
- Unit tests: `npm test`
- Policy enforcement: `node --env-file=.env scripts/test-enforcement.mjs`
- Intent mismatch: `node --env-file=.env scripts/test-intent-mismatch.mjs`
- Approval quorum: `node --env-file=.env scripts/test-approval-hardening.mjs`
