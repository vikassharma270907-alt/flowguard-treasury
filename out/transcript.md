# BeyondFlow — 3-Minute Hackathon Explainer Video Transcript

**Project**: BeyondFlow — Autonomous Treasury & Intent Vault Governed by ArmorIQ  
**Target Audience**: Hackathon Judges and General Technical Audience  
**Duration**: 03:05 (185 seconds)  
**Narration**: AI voice generated with ElevenLabs (Sarah Voice)  
**Governance & Intent Attestation**: ArmorIQ Platform (CSRG-IAP & PEP Proxy)  

---

### Scene 1: The Problem (0:00 – 0:18)
> "Voice AI agents can now answer calls and take action: look up an order, change a payout, issue a refund. But callers can pressure or trick an agent into doing what it should never do. The question isn't whether the agent sounds smart. It's what stands between its words and your money."

### Scene 2: What It Is (0:18 – 0:32)
> "BeyondFlow is a voice support agent for a sandbox treasury team. ElevenLabs gives it a natural voice. ArmorIQ decides what it is allowed to do."

### Scene 3: How It Works (0:32 – 1:00)
> "Here's the flow. The caller talks to an ElevenLabs voice agent. When the agent needs to act, it calls our gateway. The gateway asks ArmorIQ to approve the action, and only then does the request reach our MCP server, which holds the tools. Allowed calls return an answer. Blocked calls stop. Risky calls are held for human approval."

### Scene 4: How We Used ElevenLabs (1:00 – 1:25)
> "First, ElevenLabs. We built a conversational voice agent on it. Its tools are webhooks that point at our gateway, so every spoken request becomes a structured tool call. Because the webhook expects an answer in about five seconds, our gateway replies quickly when a call is held, and the caller can ask for the supervisor's decision. ElevenLabs also generated the narration you're hearing."

### Scene 5: How We Used ArmorIQ (1:25 – 2:00)
> "Now ArmorIQ. We registered our agent and MCP servers on the ArmorIQ platform and set three policies: allow reads, block payout changes, and hold refunds for two approvals. In code, our gateway uses the ArmorIQ SDK in three steps: capture the plan, get an intent token, and invoke the tool through ArmorIQ's proxy. For held refunds, we open a delegation request and release the call once two supervisors approve. No allow or block decision lives in our code. A separate test shows ArmorIQ refusing a token used on the wrong tool."

### Scene 6: The Boundary Test (2:00 – 2:30)
> "Now the boundary test, recorded from a real run. 'Where is my order?' Allowed. Asking the agent to send a payout to a new account? Blocked by policy. A refund request? Held until two supervisors approve, then released. Same agent, same voice, three outcomes, each decided by ArmorIQ."

### Scene 7: How It Differs (2:30 – 2:52)
> "Typical safeguards check what is said, grant the same permissions for every task, log what happened afterwards, or ask a human to approve everything. Intent enforcement checks the action itself, before it runs, against a plan and a policy, and involves people only when it matters."

### Scene 8: Close & Disclosures (2:52 – 3:05)
> "It's a prototype on sandbox data, and one layer among several. BeyondFlow, powered by ElevenLabs and ArmorIQ."
