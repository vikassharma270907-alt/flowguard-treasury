/**
 * BeyondFlow Navigation & Footer Configuration
 * Centralized configuration driving Header and Footer links and metadata.
 */

export const headerConfig = {
  brand: {
    name: 'BeyondFlow',
    href: '/',
    badge: 'B'
  },
  navLinks: [
    { label: 'Home', href: '/', id: 'overview', isExternal: false },
    { label: 'How it works', href: '#how-it-works', id: 'enclave', isExternal: false },
    { label: 'In production', href: '#production', id: 'voice', isExternal: false },
    { label: 'Docs', href: 'https://docs.armoriq.ai', isExternal: true },
    { label: 'GitHub', href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury', isExternal: true },
  ],
  statusIndicator: {
    label: 'PLAYGROUND',
    href: '#playground',
    id: 'voice'
  },
  actionButton: {
    label: 'HACKATHON',
    href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury#readme',
    isExternal: true
  }
};

export const footerConfig = {
  brand: {
    name: 'BeyondFlow',
    tagline: 'Intent enforcement for any MCP client and ElevenLabs voice agent, powered by ArmorIQ.',
    badge: 'B',
    socials: [
      {
        name: 'GitHub',
        href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury',
        icon: 'github'
      },
      {
        name: 'X (Twitter)',
        href: 'https://x.com/armoriq_ai',
        icon: 'x'
      }
    ]
  },
  columns: [
    {
      title: 'PRODUCT',
      links: [
        { label: 'Quickstart', href: '#quickstart', id: 'overview' },
        { label: 'How it works', href: '#how-it-works', id: 'enclave' },
        { label: 'CLI reference', href: '#cli', id: 'admin' },
        { label: 'Flight Recorder', href: '#flight-recorder', id: 'audit' },
        { label: 'Security model', href: '#security', id: 'invoices' }
      ]
    },
    {
      title: 'INTEGRATIONS',
      links: [
        { label: 'Claude Desktop', href: 'https://docs.armoriq.ai/integrations/claude', isExternal: true },
        { label: 'Cursor', href: 'https://docs.armoriq.ai/integrations/cursor', isExternal: true },
        { label: 'ElevenLabs agents', href: 'https://elevenlabs.io/docs', isExternal: true },
        { label: 'ArmorIQ', href: 'https://armoriq.ai', isExternal: true }
      ]
    },
    {
      title: 'PROJECT',
      links: [
        { label: 'GitHub', href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury', isExternal: true },
        { label: 'npm', href: 'https://www.npmjs.com/package/@armoriq/sdk', isExternal: true },
        { label: 'DX notes on ArmorIQ', href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury/blob/main/DX_NOTES.md', isExternal: true },
        { label: 'Hackathon', href: 'https://github.com/vikassharma270907-alt/beyondflow-treasury#readme', isExternal: true }
      ]
    }
  ]
};
