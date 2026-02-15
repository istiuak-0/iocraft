import { VPCarbon } from 'vitepress-carbon'
 import { h } from 'vue'
import type { EnhanceAppContext, Theme } from 'vitepress'

// uncomment to test CSS variables override
// import './override.css'

const theme = {
  ...VPCarbon,
  enhanceApp(ctx: EnhanceAppContext) {
    if (VPCarbon.enhanceApp) {
      VPCarbon.enhanceApp(ctx)
    }

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    }
  },
  Layout: () => {
    return h(VPCarbon.Layout!, {}, {})
  }
} satisfies Theme

export default theme