import mdx from '@astrojs/mdx'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import solid from './integrations/solid/index'

export default defineConfig({
  integrations: [mdx(), solid()],
  vite: {
    plugins: [tailwindcss()],
  },
})
