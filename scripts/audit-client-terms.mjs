import { execSync } from 'node:child_process';

try {
  const res = execSync('git grep -i -n "flowguard" -- client/src/ client/index.html README.md index.html', { encoding: 'utf8' });
  console.log(res);
} catch (e) {
  console.log('Error or no matches:', e.message);
}
