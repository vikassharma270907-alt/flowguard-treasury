# Video Real Material Assets Directory

Please place the real, un-mocked platform screenshots and boundary test screen recording into this folder:

1. `armoriq_platform_onboarding.png`
   - Real screenshot of https://platform.armoriq.ai showing the onboarded agent (`flowguard-agent`) and MCP server (`flowguard-treasury-mcp`).
   - Private tokens or webhook secrets will be automatically blurred/cropped during video composition.

2. `armoriq_policies.png`
   - Real screenshot of the stored policies (`flowguard-treasury-allowlist`) showing allowed tools: `["lookup_order", "issue_refund"]` and default action `block`.

3. `elevenlabs_agent_tools.png`
   - Real screenshot of the ElevenLabs Conversational Voice Agent dashboard showing configured webhook tools (`BeyondFlow_orderLookup`, `BeyondFlow_payoutChange`, `BeyondFlow_issueRefund`).

4. `boundary_test_recording.webm` (or `boundary_test_recording.mp4`)
   - Real screen recording of the supervisor playground / boundary test execution with the three outcomes (ALLOWED, BLOCKED, HELD & RELEASED).
