import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const FFMPEG_PATH = 'C:\\Users\\vikas sharma\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';
const VIDEO_PATH = path.resolve('out/beyondflow-explainer.mp4');
const FRAMES_DIR = path.resolve('scratch/video-frames-audit');

if (!fs.existsSync(FRAMES_DIR)) {
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
}

console.log('Extracting one frame every 2 seconds to audit for leaked secrets...');
// Extract 1 frame every 2 seconds: fps=0.5
const cmd = `"${FFMPEG_PATH}" -y -i "${VIDEO_PATH}" -vf "fps=0.5" "${path.join(FRAMES_DIR, 'frame_%04d.jpg')}"`;
execSync(cmd, { stdio: 'inherit' });

const files = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.jpg'));
console.log(`Extracted ${files.length} frames across the video.`);
console.log('Video Duration Check:');
const probeCmd = `"${FFMPEG_PATH}" -i "${VIDEO_PATH}" 2>&1`;
try {
  const info = execSync(probeCmd).toString();
  const durMatch = info.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (durMatch) console.log(`Detected Duration: ${durMatch[1]}`);
} catch (e) {
  const out = e.stdout ? e.stdout.toString() : e.message;
  const durMatch = out.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (durMatch) console.log(`Detected Duration: ${durMatch[1]}`);
}
