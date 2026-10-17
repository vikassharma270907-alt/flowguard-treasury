import { execSync } from 'node:child_process';
import fs from 'node:fs';

const terms = ['beyondflow', 'veratone', 'yourbrand', 'intentgate'];
const report = {};

for (const term of terms) {
  try {
    const res = execSync(`git grep -i -n "${term}"`, { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
    const lines = res.trim().split('\n').filter(Boolean);
    report[term] = lines;
  } catch {
    report[term] = [];
  }
}

console.log('=== BRAND SEARCH AUDIT RESULTS ===\n');

for (const [term, lines] of Object.entries(report)) {
  console.log(`\n========================================`);
  console.log(`TERM: "${term}" (${lines.length} total matches)`);
  console.log(`========================================`);
  
  const files = {};
  for (const l of lines) {
    const parts = l.split(':');
    const file = parts[0];
    const lineNum = parts[1];
    const text = parts.slice(2).join(':').trim();
    if (!files[file]) files[file] = [];
    files[file].push({ lineNum, text });
  }

  for (const [file, items] of Object.entries(files)) {
    console.log(`\nFile: ${file} (${items.length} hits)`);
    for (const item of items.slice(0, 5)) {
      console.log(`  Line ${item.lineNum}: ${item.text.slice(0, 120)}`);
    }
    if (items.length > 5) {
      console.log(`  ... and ${items.length - 5} more lines in this file`);
    }
  }
}
