import solid from '@solidjs/vite-plugin'
import type { AstroIntegration } from 'astro'

// @astrojs/solid-js currently targets Solid 1. Keep the Solid 2 bridge local
// until the official integration supports the workspace's runtime.
export default function solidIntegration(): AstroIntegration {
  return {
    name: 'xenon/solid',
    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig }) => {
        addRenderer({
          name: 'xenon/solid',
          clientEntrypoint: new URL('./client.ts', import.meta.url).pathname,
          serverEntrypoint: new URL('./server.ts', import.meta.url).pathname,
        })
        updateConfig({
          vite: { plugins: [solid({ ssr: true })] },
        })
      },
    },
  }
}
