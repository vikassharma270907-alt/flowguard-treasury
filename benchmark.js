const { performance } = require('perf_hooks');

const start = performance.now();

const airwallexService = {
  getBalances: () => new Promise(resolve => setTimeout(() => resolve({ balances: [] }), 100)),
  getFxRates: () => new Promise(resolve => setTimeout(() => resolve({ rates: {} }), 100))
};

async function testSequential() {
  const t0 = performance.now();
  const balanceResult = await airwallexService.getBalances();
  const fxResult = await airwallexService.getFxRates();
  const t1 = performance.now();
  return t1 - t0;
}

async function testParallel() {
  const t0 = performance.now();
  const [balanceResult, fxResult] = await Promise.all([
    airwallexService.getBalances(),
    airwallexService.getFxRates()
  ]);
  const t1 = performance.now();
  return t1 - t0;
}

async function run() {
  console.log("Warming up...");
  await testSequential();
  await testParallel();

  const seqTime = await testSequential();
  console.log(`Sequential time: ${seqTime.toFixed(2)}ms`);

  const parTime = await testParallel();
  console.log(`Parallel time: ${parTime.toFixed(2)}ms`);

  const improvement = ((seqTime - parTime) / seqTime * 100).toFixed(2);
  console.log(`Improvement: ${improvement}%`);
}

run();
