import fs from 'node:fs';
import path from 'node:path';

const filesToProcess = [
  'client/src/components/OverviewScreen.jsx',
  'client/src/components/JudgesPage.jsx',
  'client/src/components/VoiceGatewayScreen.jsx',
  'client/src/components/EnclaveScreen.jsx',
  'client/src/components/HowWeUseArmorIQSection.jsx',
  'client/src/components/BoundaryTestSection.jsx',
  'client/src/components/CredentialsModal.jsx',
  'client/src/components/OAuthModal.jsx',
  'client/src/components/PricingSection.jsx',
  'client/src/components/InvoiceGuardScreen.jsx',
  'client/src/components/ArmorPayModal.jsx',
  'client/src/components/3d/RotatingHeroVault.jsx',
  'client/src/components/Navbar.jsx',
  'client/src/components/Header.jsx',
  'client/src/components/Footer.jsx',
  'client/src/components/AdminPanel.jsx',
  'client/src/components/navConfig.js',
  'client/src/App.jsx',
  'server/server.js',
  'server/voiceGatewayService.js',
  'server/armorPayService.js',
  'server/armorIqService.js',
  'server/armorIqEnforcement.js',
  'server/mcpServer.js',
  'server/auditLedger.js',
  'server/securityEngine.js',
  'server/rulesEngine.js',
  'server/duplicateDetector.js',
  'server/mockData.js',
  'server/authService.js',
  'server/airwallexService.js',
  'README.md',
  'DISCLOSURES.md',
  'DX_NOTES.md',
  'EVIDENCE.md',
  'docs/ARMORIQ_MCP_INTEGRATION.md',
  'docs/evidence/README.md',
  'scripts/run-demo.mjs',
  'scripts/record-demo-video.mjs',
  'scripts/generate-flowguard-overview.mjs',
  'playground/index.html'
];

let totalChanges = 0;

for (const relPath of filesToProcess) {
  const fullPath = path.resolve(relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;

  // 1. Direct word replacements for titles and descriptions
  content = content.replace(/\bFlowGuard\b/g, 'BeyondFlow');
  content = content.replace(/\bFLOWGUARD\b/g, 'BEYONDFLOW');

  // 2. ElevenLabs tool prefixes
  content = content.replace(/FlowGuard_/g, 'BeyondFlow_');

  // 3. Email handles if any
  content = content.replace(/@flowguard\.io/g, '@beyondflow.io');

  // 4. Special cases preservation for ArmorIQ platform entities and URLs
  // If github repo was modified, restore it:
  content = content.replace(
    /https:\/\/github\.com\/vikassharma270907-alt\/beyondflow-treasury/g,
    'https://github.com/vikassharma270907-alt/flowguard-treasury'
  );
  content = content.replace(
    /https:\/\/beyondflow-treasury\.vercel\.app/g,
    'https://flowguard-treasury.vercel.app'
  );

  // Preserve registered platform entity IDs where needed for live tests
  // flowguard-agent, flowguard-treasury-mcp, flowguard-treasury-allowlist
  content = content.replace(/beyondflow-treasury-mcp/g, 'flowguard-treasury-mcp');
  content = content.replace(/beyondflow-treasury-allowlist/g, 'flowguard-treasury-allowlist');
  content = content.replace(/'beyondflow-agent'/g, "'flowguard-agent'");
  content = content.replace(/"beyondflow-agent"/g, '"flowguard-agent"');
  content = content.replace(/'beyondflow-operator'/g, "'flowguard-operator'");
  content = content.replace(/"beyondflow-operator"/g, '"flowguard-operator"');

  // But in display text: "BeyondFlow MCP Server" or "BeyondFlow Agent" is great!
  content = content.replace(/flowguard MCP Server/gi, 'BeyondFlow MCP Server');
  content = content.replace(/flowguard Agent/gi, 'BeyondFlow Agent');

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf8');
    totalChanges++;
    console.log(`Updated ${relPath}`);
  }
}

console.log(`\nSuccessfully updated ${totalChanges} files to BeyondFlow!`);
