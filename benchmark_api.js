const { performance } = require('perf_hooks');
const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.get(`http://localhost:3001${path}`, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        const end = performance.now();
        resolve(end - start);
      });
    });
    req.on('error', reject);
  });
}

async function runBenchmark() {
  console.log('Warming up server...');
  await new Promise(r => setTimeout(r, 1000)); // Give server time to boot

  try {
    // Warm up
    await makeRequest('/api/planner');

    // Test planner
    const plannerTimes = [];
    for (let i = 0; i < 5; i++) {
      plannerTimes.push(await makeRequest('/api/planner'));
    }

    const avgPlanner = plannerTimes.reduce((a, b) => a + b, 0) / plannerTimes.length;
    console.log(`Average /api/planner latency: ${avgPlanner.toFixed(2)}ms`);

  } catch (err) {
    console.error('Benchmark failed:', err.message);
  }
}

runBenchmark();
