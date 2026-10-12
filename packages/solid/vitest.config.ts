import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Refresh wraps component calls in lazy computations; tests need direct calls.
  plugins: [solid({ refresh: { disabled: true } })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    // SSR tests start a Vite server each. Alone they take about a second, but
    // a full parallel run can push one past the 5s default.
    testTimeout: 20_000,
  },
})
