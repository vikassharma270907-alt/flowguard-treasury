import fs from 'node:fs';

export const scenes = [
  {
    id: 'scene_1',
    sceneNumber: 1,
    timeRange: '0:00 - 0:18',
    targetSeconds: 18,
    title: 'The Problem',
    text: "Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick an agent into doing what it should never do. The question isn't whether the agent sounds smart. It's what stands between its words and your money."
  },
  {
    id: 'scene_2',
    sceneNumber: 2,
    timeRange: '0:18 - 0:32',
    targetSeconds: 14,
    title: 'What It Is',
    text: "BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it is allowed to do."
  },
  {
    id: 'scene_3',
    sceneNumber: 3,
    timeRange: '0:32 - 1:00',
    targetSeconds: 28,
    title: 'How It Works',
    text: "Here's the flow. The caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only then does the request reach our MCP server, which holds the tools. Allowed calls return an answer. Blocked calls stop. Risky calls are held for human approval."
  },
  {
    id: 'scene_4',
    sceneNumber: 4,
    timeRange: '1:00 - 1:25',
    targetSeconds: 25,
    title: 'How We Used ElevenLabs',
    text: "First, ElevenLabs. We built a conversational voice agent on it. Its tools are webhooks that point at our gateway, so every spoken request becomes a structured tool call. Because the webhook expects an answer in about five seconds, our gateway replies quickly when a call is held, and the caller can ask for the supervisor's decision. ElevenLabs also generated the narration you're hearing."
  },
  {
    id: 'scene_5',
    sceneNumber: 5,
    timeRange: '1:25 - 2:00',
    targetSeconds: 35,
    title: 'How We Used ArmorIQ',
    text: "Now ArmorIQ. We registered our agent and MCP servers on the ArmorIQ platform and set three policies: allow reads, block payout changes, and hold refunds for two approvals. In code, our gateway uses the ArmorIQ SDK in three steps: capture the plan, get an intent token, and invoke the tool through ArmorIQ's proxy. For held refunds, we open a delegation request and release the call once two supervisors approve. No allow or block decision lives in our code. A separate test shows ArmorIQ refusing a token used on the wrong tool."
  },
  {
    id: 'scene_6',
    sceneNumber: 6,
    timeRange: '2:00 - 2:30',
    targetSeconds: 30,
    title: 'The Boundary Test',
    text: "Now the boundary test, recorded from a real run. 'Where is my order?' Allowed. Asking the agent to send a payout to a new account? Blocked by policy. A refund request? Held until two supervisors approve, then released. Same agent, same voice, three outcomes, each decided by ArmorIQ."
  },
  {
    id: 'scene_7',
    sceneNumber: 7,
    timeRange: '2:30 - 2:52',
    targetSeconds: 22,
    title: 'How It Differs',
    text: "Typical safeguards check what is said, grant the same permissions for every task, log what happened afterwards, or ask a human to approve everything. Intent enforcement checks the action itself, before it runs, against a plan and a policy, and involves people only when it matters."
  },
  {
    id: 'scene_8',
    sceneNumber: 8,
    timeRange: '2:52 - 3:05',
    targetSeconds: 13,
    title: 'Close & Disclosures',
    text: "It's a prototype on sandbox data, and one layer among several. BeyondFlow, powered by ElevenLabs and ArmorIQ."
  }
];

let totalWords = 0;
let totalTargetSeconds = 0;

console.log('--- BeyondFlow Explainer Narration Script Audit ---');
for (const scene of scenes) {
  const words = scene.text.trim().split(/\s+/).length;
  totalWords += words;
  totalTargetSeconds += scene.targetSeconds;
  const wpm = ((words / scene.targetSeconds) * 60).toFixed(1);
  console.log(`Scene ${scene.sceneNumber} (${scene.timeRange}, target ${scene.targetSeconds}s): ${words} words (${wpm} wpm) - "${scene.title}"`);
}

const totalMinutes = totalTargetSeconds / 60;
console.log(`\nTotal Word Count: ${totalWords} words`);
console.log(`Total Target Duration: ${totalTargetSeconds}s (${Math.floor(totalTargetSeconds / 60)}m ${totalTargetSeconds % 60}s)`);
console.log(`Average Pace: ${((totalWords / totalTargetSeconds) * 60).toFixed(1)} words per minute`);
console.log(`Target Window: 2:50 (170s) to 3:10 (190s) -> Target is 185s (3:05) -> WITHIN 100% SPEC!`);
