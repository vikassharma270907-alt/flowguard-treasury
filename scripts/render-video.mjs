import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const FFMPEG_PATH = 'C:\\Users\\vikas sharma\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

const OUT_DIR = path.resolve('out');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const inputVideo = path.resolve('client/public/videos/beyondflow-explainer.webm');
const inputAudio = path.resolve('client/public/audio/beyondflow-narration-master.mp3');
const outputMp4 = path.resolve(OUT_DIR, 'beyondflow-explainer.mp4');
const outputWebm = path.resolve(OUT_DIR, 'beyondflow-explainer.webm');
const outputCutMp4 = path.resolve(OUT_DIR, 'beyondflow-60s-cut.mp4');

console.log('Rendering full explainer MP4 (target ~3:55)...');
// Loop real screen recording over the audio duration and encode as H.264 + AAC
const fullCmd = `"${FFMPEG_PATH}" -y -stream_loop -1 -i "${inputVideo}" -i "${inputAudio}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -c:a aac -b:a 192k -shortest "${outputMp4}"`;
console.log('Executing:', fullCmd);
execSync(fullCmd, { stdio: 'inherit' });

console.log(`\nRendered: ${outputMp4} (${(fs.statSync(outputMp4).size / (1024 * 1024)).toFixed(2)} MB)`);

// Also copy or mux webm version for web browsers
fs.copyFileSync(inputVideo, outputWebm);
console.log(`Saved WebM fallback: ${outputWebm}`);

// 60-Second Short Cut (Scenes 1, 2, 7, 9)
console.log('\nRendering 60-second cut MP4 for short forms...');
// Stitch scenes 1, 2, 7, 9 audio
const manifest = JSON.parse(fs.readFileSync('video/audio/manifest.json', 'utf8'));
const cutScenes = [manifest[0], manifest[1], manifest[6], manifest[8]]; // Scene 1, 2, 7, 9
const cutAudioBuffers = cutScenes.map(s => fs.readFileSync(path.join('video/audio', s.audioFile)));
const cutAudioPath = path.resolve(OUT_DIR, 'cut-audio.mp3');
fs.writeFileSync(cutAudioPath, Buffer.concat(cutAudioBuffers));

const cutCmd = `"${FFMPEG_PATH}" -y -stream_loop -1 -i "${inputVideo}" -i "${cutAudioPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 22 -c:a aac -b:a 192k -t 60 -shortest "${outputCutMp4}"`;
console.log('Executing cut command:', cutCmd);
execSync(cutCmd, { stdio: 'inherit' });

if (fs.existsSync(cutAudioPath)) fs.unlinkSync(cutAudioPath);

console.log(`\nRendered 60s Cut: ${outputCutMp4} (${(fs.statSync(outputCutMp4).size / (1024 * 1024)).toFixed(2)} MB)`);
console.log('\nAll video outputs generated successfully!');
