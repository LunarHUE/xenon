/**
 * Runs e2e tests against the built example app and the SSR/hydration fixture server.
 * All three browser projects are defined. The package test:e2e script selects
 * chromium; test:e2e:all leaves project selection open to run all three.
 * Browser selection here is independent of Vitest's TENON_BROWSERS variable.
 *
 * @packageDocumentation
 */
import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './e2e',
  /** Permit parallel test execution, bounded by the two configured workers. */
  fullyParallel: true,
  /** A truthy CI environment forbids focused tests; CI also enables one retry below. */
  forbidOnly: !!process.env.CI,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  /** Per-test timeout in milliseconds; globalTimeout bounds the entire run separately. */
  timeout: 30_000,
  globalTimeout: 300_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  /** Relative navigation targets the example server; failed runs retain trace/screenshots. */
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  /**
   * Playwright starts both processes and waits up to 120 seconds for each stdout
   * readiness marker. It owns their test-run lifetime; neither server is reused
   * through an explicit reuseExistingServer setting.
   */
  webServer: [
    {
      /** Build before serving on strict port 4173; readiness requires the preview URL log. */
      command:
        'bun run --cwd ../../apps/example build && bun run --cwd ../../apps/example preview --host 127.0.0.1 --port 4173 --strictPort',
      wait: { stdout: /Local:.*127\.0\.0\.1:4173/ },
      timeout: 120_000,
    },
    {
      /** SSR fixtures bind 127.0.0.1:4174 and log readiness only after the listener opens. */
      command: 'bun scripts/serve-ssr.ts',
      wait: { stdout: /SSR fixture ready/ },
      timeout: 120_000,
    },
  ],
})
