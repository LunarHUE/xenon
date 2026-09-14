import { defineConfig } from 'vitest/config'

/**
 * DOM-controller unit tests use jsdom for document/event APIs. Layout, native
 * presentation, and real input behavior are covered separately by the suite's
 * browser and E2E runners; jsdom assertions do not establish those behaviors.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
