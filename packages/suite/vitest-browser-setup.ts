/**
 * Browser-project setup. Collects garbage after every test file so detached test
 * iframes release their shared-memory handles before the Chromium renderer runs
 * out. See collectGarbage in vitest.config.ts.
 *
 * @packageDocumentation
 */
import { afterAll } from 'vitest'
import { commands } from 'vitest/browser'

declare module 'vitest/browser' {
  interface BrowserCommands {
    collectGarbage: () => Promise<void>
  }
}

afterAll(() => commands.collectGarbage())
