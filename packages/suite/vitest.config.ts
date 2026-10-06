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
import type { BrowserCommand } from 'vitest/node'

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

/**
 * Forces a full V8 collection in the Chromium renderer. Each test file runs in a
 * fresh iframe that keeps about 280 shared-memory file descriptors until a major
 * GC frees it. The short files at the end of the run outpace GC, and the renderer
 * dies near 15k descriptors, which Vitest reports as "Browser connection was
 * closed". Vitest's own workaround for https://issues.chromium.org/issues/530892387
 * only fires when the temp directory has under 4 GB free. Other browsers no-op.
 */
const collectGarbage: BrowserCommand<[]> = async ({ provider, project, page, context }) => {
  if (provider.name !== 'playwright' || project.config.browser.name !== 'chromium') return
  const cdp = await context.newCDPSession(page)
  try {
    await cdp.send('HeapProfiler.collectGarbage')
  } finally {
    await cdp.detach()
  }
}

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
          setupFiles: [...setupFiles, './vitest-browser-setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            commands: { collectGarbage },
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
