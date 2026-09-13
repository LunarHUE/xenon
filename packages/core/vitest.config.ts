import { defineConfig } from 'vitest/config'

// Core has no DOM. Tests run in plain Node so anything that reaches for
// document fails here instead of in an adapter.
export default defineConfig({
  test: {
    environment: 'node',
  },
})
