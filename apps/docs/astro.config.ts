import { satteri } from '@astrojs/markdown-satteri'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import solid from './integrations/solid/index'
import { codeFences } from './src/lib/code-fences'
import { sectionToc } from './src/lib/section-toc'

export default defineConfig({
  integrations: [mdx({ processor: satteri({ mdastPlugins: [codeFences, sectionToc] }) }), solid()],
  vite: {
    plugins: [tailwindcss()],
    // Workspace packages export TypeScript source and need Vite's SSR transform.
    ssr: { noExternal: [/^@xenon(-ui)?\//] },
  },
})
