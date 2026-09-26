import { satteri } from '@astrojs/markdown-satteri'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import solid from './integrations/solid/index'
import { codeFences } from './src/lib/code-fences'
import { exampleDemos } from './src/lib/example-demos'
import { sectionToc } from './src/lib/section-toc'

export default defineConfig({
  // The docs start at the overview; there is no separate landing page yet.
  redirects: { '/': '/docs/overview/' },
  integrations: [mdx({ processor: satteri({ mdastPlugins: [codeFences, exampleDemos, sectionToc] }) }), solid()],
  vite: {
    plugins: [tailwindcss()],
    // Workspace packages export TypeScript source and need Vite's SSR transform.
    ssr: { noExternal: [/^@xenon(-ui)?\//] },
  },
})
