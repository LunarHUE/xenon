import { satteri } from '@astrojs/markdown-satteri'
import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import solid from './integrations/solid/index'
import { codeFences } from './src/lib/code-fences'

export default defineConfig({
  integrations: [mdx({ processor: satteri({ mdastPlugins: [codeFences] }) }), solid()],
  vite: {
    plugins: [tailwindcss()],
    // Workspace packages export TypeScript source and need Vite's SSR transform.
    ssr: { noExternal: [/^@xenon(-ui)?\//] },
  },
})
