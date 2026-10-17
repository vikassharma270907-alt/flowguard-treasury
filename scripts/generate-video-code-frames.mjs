import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('video/src/assets/code');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function extractLines(relPath, startLine, endLine) {
  const fullPath = path.resolve(relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const slice = lines.slice(startLine - 1, endLine);
  return {
    relPath,
    startLine,
    endLine,
    code: slice.map((line, idx) => ({
      lineNumber: startLine + idx,
      content: line
    }))
  };
}

const frames = [
  {
    id: 'code_frame_1_webhook',
    title: 'ElevenLabs Webhook Dispatcher & Sub-5s Holding Pattern',
    caption: 'server/voiceGatewayService.js:239-253 & lines 890-898',
    sections: [
      extractLines('server/voiceGatewayService.js', 239, 253),
      extractLines('server/voiceGatewayService.js', 890, 898)
    ]
  },
  {
    id: 'code_frame_2_armoriq_sdk',
    title: 'ArmorIQ 3-Step SDK Flow: capturePlan -> getIntentToken -> invoke',
    caption: 'server/armorIqEnforcement.js:118-129 & line 179',
    sections: [
      extractLines('server/armorIqEnforcement.js', 118, 129),
      extractLines('server/armorIqEnforcement.js', 178, 182)
    ]
  },
  {
    id: 'code_frame_3_hold_quorum',
    title: 'Platform Delegation Request & Dual Supervisor Release Quorum',
    caption: 'server/armorIqEnforcement.js:147-160 & server/voiceGatewayService.js:752-770',
    sections: [
      extractLines('server/armorIqEnforcement.js', 147, 160),
      extractLines('server/voiceGatewayService.js', 752, 770)
    ]
  },
  {
    id: 'code_frame_4_intent_mismatch',
    title: 'Action-Level Intent Binding: Refusal of Swapped Tool Token',
    caption: 'scripts/test-intent-mismatch.mjs:54-68 (IntentMismatchException)',
    sections: [
      extractLines('scripts/test-intent-mismatch.mjs', 54, 68)
    ]
  }
];

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'codeFrames.json'),
  JSON.stringify(frames, null, 2)
);

console.log(`Successfully extracted ${frames.length} verbatim code frames directly from source files!`);
for (const f of frames) {
  console.log(` - ${f.id}: ${f.caption}`);
}
