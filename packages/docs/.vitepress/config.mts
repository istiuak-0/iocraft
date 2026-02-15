import { defineConfigWithTheme } from 'vitepress'
import type { ThemeConfig } from 'vitepress-carbon'
import baseConfig from 'vitepress-carbon/config'

export default defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,
  title: "iocraft",
  description: "A lightweight dependency injection container for Vue 3",
  srcDir: 'src',
  appearance: false,

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/introduction/getting-started' },
      { text: 'API', link: '/api/register-decorator' },
    ],

    search: {
      provider: 'local'
    },

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is iocraft?', link: '/introduction/what-is-iocraft' },
          { text: 'Installation', link: '/introduction/installation' },
          { text: 'Getting Started', link: '/introduction/getting-started' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Service Registration', link: '/core-concepts/service-registration' },
          { text: 'Dependency Injection', link: '/core-concepts/dependency-injection' },
          { text: 'Lifecycle Hooks', link: '/core-concepts/lifecycle-hooks' },
          { text: 'Reactivity Handling', link: '/core-concepts/reactivity-handling' }
        ]
      },
      {
        text: 'Advanced Features',
        items: [
          { text: 'Plugin System', link: '/advanced/plugin-system' },
          { text: 'Router Integration', link: '/advanced/router-integration' },
          { text: 'Circular Dependencies', link: '/advanced/circular-dependencies' },
          { text: 'Component Context', link: '/advanced/component-context' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: '@Register Decorator', link: '/api/register-decorator' },
          { text: 'obtain Methods', link: '/api/obtain-methods' },
          { text: 'Helper Services', link: '/api/helper-services' },
          { text: 'Utility Functions', link: '/api/utility-functions' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/istiuak-0/iocraft' }
    ]
  }
})
