import fs from 'node:fs';

export const scenes = [
  {
    id: 'scene_1',
    sceneNumber: 1,
    timeRange: '0:00 - 0:18',
    targetSeconds: 18,
    title: 'The Problem',
    text: "Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick them. The question isn't how smart the agent sounds. It's what stands between its words and your money."
  },
  {
    id: 'scene_2',
    sceneNumber: 2,
    timeRange: '0:18 - 0:35',
    targetSeconds: 17,
    title: 'Meet BeyondFlow',
    text: "BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it's allowed to do. Let's see how it works, then how to set it up yourself."
  },
  {
    id: 'scene_3',
    sceneNumber: 3,
    timeRange: '0:35 - 1:10',
    targetSeconds: 35,
    title: 'The Big Picture',
    text: "Here's the big picture. A caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only an approved call reaches our MCP server, which holds the tools. Three things can happen. Allowed: the answer comes back. Blocked: the call stops and the agent explains. Held: the call waits for two supervisors to approve."
  },
  {
    id: 'scene_4',
    sceneNumber: 4,
    timeRange: '1:10 - 1:35',
    targetSeconds: 25,
    title: 'How We Used ElevenLabs',
    text: "ElevenLabs is the voice. Our agent runs on its conversational platform, and each tool is a webhook pointing at our gateway, so a spoken request becomes a structured call. The webhook expects an answer in about five seconds, so when a refund is held, the gateway replies quickly and the caller can ask for the decision later."
  },
  {
    id: 'scene_5',
    sceneNumber: 5,
    timeRange: '1:35 - 2:05',
    targetSeconds: 30,
    title: 'How We Used ArmorIQ',
    text: "ArmorIQ is the control layer. We registered our agent and MCP servers on the ArmorIQ platform and created three policies: allow reads, block payout changes, hold refunds for two approvals. In code, the gateway uses the ArmorIQ SDK to capture a plan, get an intent token, and invoke the tool through ArmorIQ's proxy. No allow or block decision lives in our own code."
  },
  {
    id: 'scene_6',
    sceneNumber: 6,
    timeRange: '2:05 - 3:00',
    targetSeconds: 55,
    title: 'Set It Up, Step by Step',
    text: "Now, how to set it up. Step one: create an ArmorIQ account and generate an API key on the platform. Step two: register your agent and your MCP server there. Step three: create the three policies: allow reads, block payout changes, and hold refunds for two approvals. Step four: put the key in your environment file, then start the MCP server and the gateway. Step five: in ElevenLabs, create the agent and add each tool as a webhook pointing to the gateway. Step six: run the enforcement test and confirm you see allowed, blocked, and held. Step seven: open the playground, make a test call, and approve the held refund with two supervisors."
  },
  {
    id: 'scene_7',
    sceneNumber: 7,
    timeRange: '3:00 - 3:30',
    targetSeconds: 30,
    title: 'The Boundary Test',
    text: "Here it is on a real run. Where's my order? Allowed. Send the payout to a new account? Blocked by policy. Refund this order? Held, until two supervisors approve, then released. Same agent, same voice, three outcomes, each decided by ArmorIQ."
  },
  {
    id: 'scene_8',
    sceneNumber: 8,
    timeRange: '3:30 - 3:50',
    targetSeconds: 20,
    title: 'How It Differs',
    text: "Typical safeguards check what is said, grant the same permissions for every task, log what happened afterwards, or ask a human to approve everything. Intent enforcement checks the action itself, before it runs, against a plan and a policy, and brings in people only when it matters."
  },
  {
    id: 'scene_9',
    sceneNumber: 9,
    timeRange: '3:50 - 4:00',
    targetSeconds: 10,
    title: 'Close & Disclosures',
    text: "It's a prototype on sandbox data, and one layer among several. BeyondFlow, powered by ElevenLabs and ArmorIQ."
  }
];

let totalWords = 0;
let totalTargetSeconds = 0;

for (const scene of scenes) {
  const words = scene.text.trim().split(/\s+/).length;
  totalWords += words;
  totalTargetSeconds += scene.targetSeconds;
}

console.log(`Narration: ${totalWords} words, target ${totalTargetSeconds}s (4:00 hard cap)`);
