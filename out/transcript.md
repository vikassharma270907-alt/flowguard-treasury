# BeyondFlow — Technical Explainer Video Transcript

> **Narration**: AI voice generated with ElevenLabs (Voice: George)
> **Target Runtime**: ~3:55 (Hard cap 4:00)
> **Environment**: Sandbox / test environment. No real funds or customer data.

## Scene 1: The Problem
*Time: 00:00:00.500 – 00:00:16.339*

Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick them. The question isn't how smart the agent sounds. It's what stands between its words and your money.

## Scene 2: Meet BeyondFlow
*Time: 00:00:17.000 – 00:00:29.769*

BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it's allowed to do. Let's see how it works, then how to set it up yourself.

## Scene 3: The Big Picture
*Time: 00:00:30.500 – 00:00:55.620*

Here's the big picture. A caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only an approved call reaches our MCP server, which holds the tools. Three things can happen. Allowed: the answer comes back. Blocked: the call stops and the agent explains. Held: the call waits for two supervisors to approve.

## Scene 4: How We Used ElevenLabs
*Time: 00:00:56.500 – 00:01:21.019*

ElevenLabs serves as the voice interface. Our agent runs directly on its conversational platform, and each tool is configured as a webhook pointing at our gateway, transforming a spoken request into a structured call. The webhook expects an answer in about five seconds, so when a refund is held, the gateway replies immediately with a holding utterance, and the caller can ask for the decision once supervisors review.

## Scene 5: How We Used ArmorIQ
*Time: 00:01:22.000 – 00:01:54.370*

ArmorIQ provides the cryptographic control layer. We registered our agent and MCP servers on the ArmorIQ platform and configured three strict policies: allow reads, block payout changes, and hold refunds for two approvals. In code, the gateway uses the ArmorIQ SDK in three ordered steps: capture the plan, get an intent token, and invoke the tool through ArmorIQ's proxy. No allow or block decision lives in our own code; every verdict comes directly from ArmorIQ.

## Scene 6: Set It Up, Step by Step
*Time: 00:01:55.500 – 00:02:53.360*

Now, here is how to set it up yourself from a clean repository checkout. Step one: create an ArmorIQ account and generate an API key on platform dot armoriq dot ai. Step two: onboard your agent and your MCP server on the platform dashboard. Step three: create the three policies: allow reads, block payout changes, and hold refunds for two approvals. Step four: copy dot env dot example to dot env, set your API key, and start the MCP server and gateway with npm run dev. Step five: in ElevenLabs, create your voice agent and add each tool as a webhook pointing to the gateway. Step six: run npm run test colon enforcement and confirm you see allowed, blocked, and held. Step seven: open the supervisor playground, make a test call, and approve the held refund with two supervisors.

## Scene 7: The Boundary Test
*Time: 00:02:54.500 – 00:03:22.780*

Here is the boundary test recorded from a live, real run. Asking 'Where's my order?' Allowed: order details returned. Asking to send payouts to a new routing number? Blocked by policy: wire diversion prevented. Requesting a refund? Held under delegation, until two human supervisors submit approval, then released. Same agent, same natural voice, three distinct outcomes, each cryptographically decided by ArmorIQ.

## Scene 8: How It Differs
*Time: 00:03:23.800 – 00:03:44.879*

Typical industry safeguards check what is said, grant the same static permissions for every task, log what happened afterwards, or ask a human to approve everything. Intent enforcement checks the action itself, before it runs, against a declared plan and policy, and brings in human supervisors only when high-risk actions demand step-up approval.

## Scene 9: Close & Disclosures
*Time: 00:03:45.800 – 00:03:57.090*

BeyondFlow operates as an open-source prototype on sandbox treasury data, serving as a critical security layer among several. BeyondFlow, powered by ElevenLabs and ArmorIQ.
