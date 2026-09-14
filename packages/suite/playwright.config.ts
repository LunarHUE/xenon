import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  globalTimeout: 300_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
  webServer: [
    {
      command:
        'bun run --cwd ../../apps/example build && bun run --cwd ../../apps/example preview --host 127.0.0.1 --port 4173 --strictPort',
      wait: { stdout: /Local:.*127\.0\.0\.1:4173/ },
      timeout: 120_000,
    },
    {
      command: 'bun scripts/serve-ssr.ts',
      wait: { stdout: /SSR fixture ready/ },
      timeout: 120_000,
    },
  ],
})
