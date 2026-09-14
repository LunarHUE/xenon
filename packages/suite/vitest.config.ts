import solid from '@solidjs/vite-plugin'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

const browsers = (process.env.KIT_BROWSERS ?? 'chromium').split(',')
for (const browser of browsers) {
  if (!['chromium', 'firefox', 'webkit'].includes(browser))
    throw new Error(`Unknown KIT_BROWSERS entry: ${browser}`)
}

const setupFiles = ['./vitest-setup.ts']

export default defineConfig({
  plugins: [solid({ refresh: { disabled: true } })],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles,
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
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
