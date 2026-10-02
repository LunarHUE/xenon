import { fileURLToPath } from 'node:url'
import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vite'

/** Build only the suite-owned interaction fixtures consumed by Playwright on port 4173. */
export default defineConfig({
  root: fileURLToPath(new URL('./fixtures/e2e-app', import.meta.url)),
  plugins: [solid({ refresh: { disabled: true } })],
  build: {
    outDir: fileURLToPath(new URL('./.vitest/e2e-app', import.meta.url)),
    emptyOutDir: true,
  },
})
