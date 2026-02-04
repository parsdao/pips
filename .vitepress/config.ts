import { defineConfig } from 'vitepress'

export default defineConfig({
  ignoreDeadLinks: true,
  title: 'Pars PIPs',
  description: 'Pars Improvement Proposals - Governance framework for Pars Network',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#D4A846' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Pars Improvement Proposals' }],
    ['meta', { property: 'og:description', content: 'Governance and standardization framework for Pars Network' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'All PIPs', link: '/PIPs/' },
      { text: 'Pars Network', link: 'https://pars.network' },
      { text: 'Docs', link: 'https://docs.pars.network' },
    ],

    sidebar: {
      '/PIPs/': [
        {
          text: 'Core (0xxx)',
          collapsed: false,
          items: [
            { text: 'PIP-0000: Network Architecture', link: '/PIPs/pip-0000-network-architecture' },
            { text: 'PIP-0001: Mesh Network', link: '/PIPs/pip-0001-mesh-network' },
            { text: 'PIP-0002: Post-Quantum', link: '/PIPs/pip-0002-post-quantum' },
            { text: 'PIP-0003: Coercion Resistance', link: '/PIPs/pip-0003-coercion-resistance' },
            { text: 'PIP-0004: Mobile Embedded Node', link: '/PIPs/pip-0004-mobile-embedded-node' },
            { text: 'PIP-0005: Session Protocol', link: '/PIPs/pip-0005-session-protocol' },
            { text: 'PIP-0006: AI Mining Integration', link: '/PIPs/pip-0006-ai-mining-integration' },
            { text: 'PIP-0007: Parsd Architecture', link: '/PIPs/pip-0007-parsd-architecture' },
            { text: 'PIP-0008: Pars Economics', link: '/PIPs/pip-0008-pars-economics' },
          ]
        },
        {
          text: 'Governance (7xxx)',
          collapsed: false,
          items: [
            { text: 'PIP-7000: DAO Governance', link: '/PIPs/pip-7000-dao-governance-framework' },
            { text: 'PIP-7001: Town Hall Protocol', link: '/PIPs/pip-7001-town-hall-protocol' },
            { text: 'PIP-7002: Treasury Management', link: '/PIPs/pip-7002-treasury-management' },
            { text: 'PIP-7003: Fee Routing', link: '/PIPs/pip-7003-fee-routing' },
            { text: 'PIP-7004: Gauge Controller', link: '/PIPs/pip-7004-gauge-controller' },
            { text: 'PIP-7005: Vault Registry', link: '/PIPs/pip-7005-vault-registry' },
            { text: 'PIP-7006: Asha Reserve Token', link: '/PIPs/pip-7006-asha-reserve-token' },
            { text: 'PIP-7007: Fractal Governance', link: '/PIPs/pip-7007-fractal-governance' },
            { text: 'PIP-7008: Liquid Staking', link: '/PIPs/pip-7008-liquid-staking' },
            { text: 'PIP-7009: Reticulum Network', link: '/PIPs/pip-7009-reticulum-network-stack' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/parsdao/pips' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-2026 Pars Network'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/parsdao/pips/edit/main/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    }
  }
})
