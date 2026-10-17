import { ArmorIQClient } from '@armoriq/sdk';
import { server } from '../gateway/server.mjs';

const MCP = process.env.ARMORIQ_MCP_ID || 'flowguard-treasury-mcp';
const AGENT = process.env.ARMORIQ_AGENT_ID || 'flowguard-agent';
const USER = process.env.USER_ID || 'flowguard-operator';
const TOKEN = process.env.GATEWAY_SHARED_SECRET || '';

const client = new ArmorIQClient({
  apiKey: process.env.ARMORIQ_API_KEY,
  userId: USER,
  agentId: AGENT,
});

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function stats(arr) {
  return {
    min: Math.min(...arr),
    median: median(arr),
    max: Math.max(...arr),
  };
}

async function runDirectPoint1(runs = 10) {
  console.log(`\n======================================================================`);
  console.log(`MEASUREMENT POINT 1: ArmorIQ platform/proxy call only (Direct SDK)`);
  console.log(`Runs: ${runs} per tool`);
  console.log(`======================================================================`);

  const results = {
    lookup_order: [],
    change_payout: [],
    issue_refund: [],
  };

  for (let i = 0; i < runs; i++) {
    process.stdout.write(`Run ${i + 1}/${runs}: `);

    // 1. lookup_order (ALLOWED via proxy)
    {
      const plan = { goal: 'Check order', steps: [{ action: 'lookup_order', tool: 'lookup_order', mcp: MCP, inputs: { order_id: 'ORD-1001' } }] };
      const cap = client.capturePlan('gpt-4', 'Check order ORD-1001', plan);
      const token = await client.getIntentToken(cap);
      const t0 = Date.now();
      await client.invoke(MCP, 'lookup_order', token, { order_id: 'ORD-1001' });
      const ms = Date.now() - t0;
      results.lookup_order.push(ms);
      process.stdout.write(`lookup=${ms}ms `);
    }

    // 2. change_payout (BLOCKED at proxy)
    {
      const plan = { goal: 'Change payout', steps: [{ action: 'change_payout', tool: 'change_payout', mcp: MCP, inputs: { account_id: 'ACC-4471', new_destination: 'GB29 NWBK...' } }] };
      const cap = client.capturePlan('gpt-4', 'Change payout', plan);
      const token = await client.getIntentToken(cap);
      const t0 = Date.now();
      try {
        await client.invoke(MCP, 'change_payout', token, { account_id: 'ACC-4471', new_destination: 'GB29 NWBK...' });
      } catch (err) {
        // Expected PolicyBlockedException
      }
      const ms = Date.now() - t0;
      results.change_payout.push(ms);
      process.stdout.write(`change=${ms}ms `);
    }

    // 3. issue_refund (HELD via delegation API)
    {
      const plan = { goal: 'Refund order', steps: [{ action: 'issue_refund', tool: 'issue_refund', mcp: MCP, inputs: { order_id: 'ORD-1001', amount: 89 } }] };
      const cap = client.capturePlan('gpt-4', 'Refund order', plan);
      const token = await client.getIntentToken(cap);
      const t0 = Date.now();
      await client.createDelegationRequest({
        tool: 'issue_refund',
        action: 'issue_refund',
        arguments: { order_id: 'ORD-1001', amount: 89 },
        amount: 89,
        requesterEmail: `${USER}@armoriq.ai`,
        requesterRole: 'support_agent',
        requesterLimit: 0,
        domain: MCP,
        planId: token.planId,
        intentReference: token.tokenId,
        reason: 'Refund requires dual supervisor approval before disbursement'
      });
      const ms = Date.now() - t0;
      results.issue_refund.push(ms);
      process.stdout.write(`refund=${ms}ms\n`);
    }
  }

  console.log(`\nPoint 1 Raw Results:`);
  console.log(JSON.stringify(results, null, 2));

  console.log(`\nPoint 1 Summary (min / median / max):`);
  for (const [tool, times] of Object.entries(results)) {
    const s = stats(times);
    console.log(`  ${tool.padEnd(16)}: min=${s.min}ms, median=${s.median}ms, max=${s.max}ms`);
  }

  return results;
}

async function runGatewayPoint2(runs = 10) {
  console.log(`\n======================================================================`);
  console.log(`MEASUREMENT POINT 2: End-to-end through Gateway (HTTP POST /tools/...)`);
  console.log(`Runs: ${runs} per tool`);
  console.log(`======================================================================`);

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const results = {
    lookup_order: [],
    change_payout: [],
    issue_refund: [],
  };

  const headers = {
    'content-type': 'application/json',
    ...(TOKEN ? { 'x-flowguard-token': TOKEN } : {})
  };

  for (let i = 0; i < runs; i++) {
    process.stdout.write(`Run ${i + 1}/${runs}: `);

    // 1. lookup_order
    {
      const t0 = Date.now();
      const res = await fetch(`${base}/tools/BeyondFlow_lookup_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_id: 'ORD-1001' })
      });
      await res.json();
      const ms = Date.now() - t0;
      results.lookup_order.push(ms);
      process.stdout.write(`lookup=${ms}ms `);
    }

    // 2. change_payout
    {
      const t0 = Date.now();
      const res = await fetch(`${base}/tools/BeyondFlow_change_payout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ account_id: 'ACC-4471', new_destination: 'GB29 NWBK 6016 1331 9268 19' })
      });
      await res.json();
      const ms = Date.now() - t0;
      results.change_payout.push(ms);
      process.stdout.write(`change=${ms}ms `);
    }

    // 3. issue_refund
    {
      const t0 = Date.now();
      const res = await fetch(`${base}/tools/BeyondFlow_issue_refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ order_id: 'ORD-1001', amount: 89 })
      });
      await res.json();
      const ms = Date.now() - t0;
      results.issue_refund.push(ms);
      process.stdout.write(`refund=${ms}ms\n`);
    }
  }

  server.close();

  console.log(`\nPoint 2 Raw Results:`);
  console.log(JSON.stringify(results, null, 2));

  console.log(`\nPoint 2 Summary (min / median / max):`);
  for (const [tool, times] of Object.entries(results)) {
    const s = stats(times);
    console.log(`  ${tool.padEnd(16)}: min=${s.min}ms, median=${s.median}ms, max=${s.max}ms`);
  }

  return results;
}

async function main() {
  const p1 = await runDirectPoint1(10);
  const p2 = await runGatewayPoint2(10);

  client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
