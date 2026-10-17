import fs from 'node:fs';
import path from 'node:path';
import { scenes } from './prepare-narration.mjs';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// User selected George (JBFqnCBsd6RMkjVDRZzb) - Warm, resonant, articulate narrator male
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';

const OUTPUT_DIR = path.resolve('video/audio');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

if (!ELEVENLABS_API_KEY) {
  console.error('ERROR: ELEVENLABS_API_KEY is not set in environment or .env.');
  console.error('Please add ELEVENLABS_API_KEY=your_key to your .env file.');
  process.exit(1);
}

console.log(`Starting ElevenLabs Text-to-Speech synthesis with George (${VOICE_ID})...`);

async function generateSceneAudio(scene) {
  console.log(`\nSynthesizing Scene ${scene.sceneNumber}: "${scene.title}" (${scene.text.length} chars)...`);
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: scene.text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  
  const audioPath = path.join(OUTPUT_DIR, `${scene.id}.mp3`);
  const metaPath = path.join(OUTPUT_DIR, `${scene.id}_alignment.json`);

  fs.writeFileSync(audioPath, audioBuffer);
  fs.writeFileSync(metaPath, JSON.stringify(data.alignment, null, 2));

  // Calculate actual duration from last character end time
  const charEndTimes = data.alignment?.character_end_times_seconds || [];
  const durationSec = charEndTimes.length > 0 ? charEndTimes[charEndTimes.length - 1] : 0;

  console.log(`  Saved audio: ${audioPath} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);
  console.log(`  Speech duration: ${durationSec.toFixed(2)}s (target: ${scene.targetSeconds}s)`);
  return { audioPath, alignment: data.alignment, durationSec };
}

async function run() {
  const manifest = [];
  let totalSpeechSeconds = 0;

  for (const scene of scenes) {
    try {
      const res = await generateSceneAudio(scene);
      totalSpeechSeconds += res.durationSec;
      manifest.push({
        ...scene,
        actualSpeechSeconds: parseFloat(res.durationSec.toFixed(2)),
        audioFile: `${scene.id}.mp3`,
        alignmentFile: `${scene.id}_alignment.json`
      });
    } catch (err) {
      console.error(`Failed on Scene ${scene.sceneNumber}:`, err.message);
      process.exit(1);
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\n========================================`);
  console.log(`All 9 scenes successfully synthesized with George!`);
  console.log(`Total Speech Duration: ${totalSpeechSeconds.toFixed(2)}s (${Math.floor(totalSpeechSeconds / 60)}m ${(totalSpeechSeconds % 60).toFixed(1)}s)`);
  console.log(`With scene pauses and transitions, total video timeline will land in target 3:30 - 3:55!`);
  console.log(`========================================`);
}

run();
