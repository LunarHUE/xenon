/**
 * Defines separate jsdom and browser projects using the Solid client transform.
 * The package test script selects jsdom; test:browser selects browser. Running
 * Vitest without a project filter can select both, duplicating shared test files.
 * Browser coverage adds .test-browser.tsx cases to the shared .test.tsx suite.
 *
 * @packageDocumentation
 */
import solid from '@solidjs/vite-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

/**
 * Comma-separated browser instances, defaulting to chromium only when the variable
 * is absent. Entries must exactly match chromium, firefox, or webkit; whitespace,
 * empty entries, and other names fail configuration loading. Duplicates are retained.
 */
const browsers = (process.env.xenon_BROWSERS ?? 'chromium').split(',')
for (const browser of browsers) {
  if (!['chromium', 'firefox', 'webkit'].includes(browser))
    throw new Error(`Unknown xenon_BROWSERS entry: ${browser}`)
}

/** Installs DOM matchers and harness cleanup in both projects. */
const setupFiles = ['./vitest-setup.ts']

export default defineConfig({
  /** Disable refresh wrappers so tests exercise direct component execution. */
  plugins: [solid({ refresh: { disabled: true } })],
  test: {
    projects: [
      {
        extends: true,
        test: {
          /** Shared DOM-contract tests run without launching a browser. */
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles,
        },
      },
      {
        extends: true,
        test: {
          /** Headless Playwright instances execute shared and browser-specific tests. */
          name: 'browser',
          // Concurrent pages compete for native focus and pointer input in Firefox.
          fileParallelism: false,
          include: ['src/**/*.test.tsx', 'src/**/*.test-browser.tsx'],
          setupFiles,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: browsers.map((browser) => ({
              browser: browser as 'chromium' | 'firefox' | 'webkit',
            })),
          },
        },
      },
    ],
  },
})
