import http from 'http';

async function warmup() {
  const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8790';
  const url = new URL(`${GATEWAY_URL}/tools/lookup_order`);

  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const SHARED_SECRET = process.env.GATEWAY_SHARED_SECRET || process.env.INTENTGATE_TOKEN || '';
  if (SHARED_SECRET) {
      options.headers['x-beyondflow-token'] = SHARED_SECRET;
  }

  const start = Date.now();
  console.log(`Sending warmup request to ${url.href}`);

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const latency = Date.now() - start;
        console.log(`Warmup complete in ${latency}ms. Status: ${res.statusCode}.`);
    });
  });

  req.on('error', err => {
      console.log(`Warmup request failed (server likely offline): ${err.message}`);
  });

  req.write(JSON.stringify({
      order_id: 'ORD-1004',
      __goal: 'startup warmup (real governed call)',
      __prompt: 'startup warmup'
  }));
  req.end();
}

warmup();
