import { defineConfig } from 'playwright/test'

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://127.0.0.1:4323', browserName: 'chromium' },
  webServer: {
    command: 'bun run build && node tests/preview.mjs',
    wait: { stdout: /Docs preview ready/ },
    reuseExistingServer: false,
  },
})
