import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('video/audio/manifest.json', 'utf8'));

for (const s of manifest) {
  const align = JSON.parse(fs.readFileSync(`video/audio/${s.alignmentFile}`, 'utf8'));
  const end = align.character_end_times_seconds[align.character_end_times_seconds.length - 1];
  s.actualSpeechSeconds = parseFloat(end.toFixed(2));
}

manifest[0].text = "Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick them. The question isn't how smart the agent sounds. It's what stands between its words and your money.";
manifest[1].text = "BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it's allowed to do. Let's see how it works, then how to set it up yourself.";
manifest[2].text = "Here's the big picture. A caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only an approved call reaches our MCP server, which holds the tools. Three things can happen. Allowed: the answer comes back. Blocked: the call stops and the agent explains. Held: the call waits for two supervisors to approve.";

fs.writeFileSync('video/audio/manifest.json', JSON.stringify(manifest, null, 2));

let total = 0;
for (const s of manifest) {
  total += s.actualSpeechSeconds;
  console.log(`Scene ${s.sceneNumber} (${s.title}): ${s.actualSpeechSeconds}s`);
}
console.log(`\nTotal Speech Duration: ${total.toFixed(2)}s (${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s)`);
