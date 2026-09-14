import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Refresh wraps component calls in lazy computations; tests need direct calls.
  plugins: [solid({ refresh: { disabled: true } })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
  },
})
