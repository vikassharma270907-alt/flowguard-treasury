import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(fs.readFileSync('video/audio/manifest.json', 'utf8'));

// Exact planned timeline offsets for all 9 scenes (seconds)
const sceneOffsets = [
  0.5,    // Scene 1: 0:00.5 -> 16.34s
  17.0,   // Scene 2: 0:17.0 -> 29.77s
  30.5,   // Scene 3: 0:30.5 -> 55.62s
  56.5,   // Scene 4: 0:56.5 -> 81.02s
  82.0,   // Scene 5: 1:22.0 -> 114.37s
  115.5,  // Scene 6: 1:55.5 -> 173.36s
  174.5,  // Scene 7: 2:54.5 -> 202.78s
  203.8,  // Scene 8: 3:23.8 -> 224.88s
  225.8   // Scene 9: 3:45.8 -> 237.09s
];

function formatSrtTime(totalSec) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  const ms = Math.floor((totalSec % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function formatVttTime(totalSec) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  const ms = Math.floor((totalSec % 1) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

let srtEntries = [];
let vttEntries = [];
let transcriptLines = [
  '# BeyondFlow — Technical Explainer Video Transcript',
  '',
  '> **Narration**: AI voice generated with ElevenLabs (Voice: George)',
  '> **Target Runtime**: ~3:55 (Hard cap 4:00)',
  '> **Environment**: Sandbox / test environment. No real funds or customer data.',
  ''
];

let counter = 1;

for (let i = 0; i < manifest.length; i++) {
  const scene = manifest[i];
  const offset = sceneOffsets[i];
  const alignPath = path.join('video/audio', scene.alignmentFile);
  const align = JSON.parse(fs.readFileSync(alignPath, 'utf8'));

  const chars = align.characters;
  const starts = align.character_start_times_seconds;
  const ends = align.character_end_times_seconds;

  // Add to transcript
  transcriptLines.push(`## Scene ${scene.sceneNumber}: ${scene.title}`);
  transcriptLines.push(`*Time: ${formatVttTime(offset)} – ${formatVttTime(offset + scene.actualSpeechSeconds)}*`);
  transcriptLines.push('');
  transcriptLines.push(scene.text);
  transcriptLines.push('');

  // 1. Group into words first
  let words = [];
  let currentWord = '';
  let wordStart = null;
  let wordEnd = null;

  for (let c = 0; c < chars.length; c++) {
    const ch = chars[c];
    if (ch === ' ' || ch === '\n') {
      if (currentWord.length > 0) {
        words.push({ word: currentWord, start: wordStart, end: wordEnd });
        currentWord = '';
        wordStart = null;
        wordEnd = null;
      }
    } else {
      if (wordStart === null) wordStart = starts[c];
      wordEnd = ends[c];
      currentWord += ch;
    }
  }
  if (currentWord.length > 0) {
    words.push({ word: currentWord, start: wordStart, end: wordEnd });
  }

  // 2. Group words into natural subtitle chunks (4 to 7 words, or ending with punctuation)
  let phraseWords = [];
  for (let w = 0; w < words.length; w++) {
    phraseWords.push(words[w]);
    const wordText = words[w].word;
    const hasPunctuation = /[.,!?;:]$/.test(wordText);
    const count = phraseWords.length;

    if ((hasPunctuation && count >= 3) || count >= 6 || w === words.length - 1) {
      const pStart = phraseWords[0].start;
      const pEnd = phraseWords[phraseWords.length - 1].end;
      const text = phraseWords.map(pw => pw.word).join(' ');

      srtEntries.push(`${counter}\n${formatSrtTime(offset + pStart)} --> ${formatSrtTime(offset + pEnd + 0.15)}\n${text}\n`);
      vttEntries.push(`${formatVttTime(offset + pStart)} --> ${formatVttTime(offset + pEnd + 0.15)}\n${text}\n`);
      counter++;
      phraseWords = [];
    }
  }
}

if (!fs.existsSync('out')) {
  fs.mkdirSync('out', { recursive: true });
}

fs.writeFileSync('out/captions.srt', srtEntries.join('\n'));
fs.writeFileSync('client/public/captions.vtt', 'WEBVTT\n\n' + vttEntries.join('\n'));
fs.writeFileSync('out/transcript.md', transcriptLines.join('\n'));

console.log(`Successfully generated ${counter - 1} word-aligned subtitle cues for 9 scenes!`);
console.log(`Saved: out/captions.srt, client/public/captions.vtt, out/transcript.md`);
