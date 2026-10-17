import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(fs.readFileSync('video/audio/manifest.json', 'utf8'));

// Planned start offsets for each scene in the timeline (seconds)
const sceneOffsets = [
  0.5,    // Scene 1: 0:00.5
  19.5,   // Scene 2: 0:19.5
  31.0,   // Scene 3: 0:31.0
  59.0,   // Scene 4: 0:59.0
  85.0,   // Scene 5: 1:25.0
  126.0,  // Scene 6: 2:06.0
  153.0,  // Scene 7: 2:33.0
  173.0   // Scene 8: 2:53.0
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
let counter = 1;

for (let i = 0; i < manifest.length; i++) {
  const scene = manifest[i];
  const offset = sceneOffsets[i];
  const alignPath = path.join('video/audio', scene.alignmentFile);
  const align = JSON.parse(fs.readFileSync(alignPath, 'utf8'));

  const chars = align.characters;
  const starts = align.character_start_times_seconds;
  const ends = align.character_end_times_seconds;

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

fs.writeFileSync('out/captions.srt', srtEntries.join('\n'));
fs.writeFileSync('client/public/captions.vtt', 'WEBVTT\n\n' + vttEntries.join('\n'));

console.log(`Successfully generated ${counter - 1} word-aligned subtitle cues!`);
