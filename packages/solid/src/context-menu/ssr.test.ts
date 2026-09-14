import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test } from 'vitest'
let server: ViteDevServer
let fixture: { renderFixture(open: boolean): string }
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false },
  })
  fixture = (await server.ssrLoadModule('/src/context-menu/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('server renders a focusable region without disclosure ARIA and resolves controlled-open content IDs', () => {
  for (const open of [false, true]) {
    const document = new DOMParser().parseFromString(fixture.renderFixture(open), 'text/html')
    const trigger = document.getElementById('trigger')!
    expect(trigger.getAttribute('tabindex')).toBe('0')
    expect(trigger.hasAttribute('aria-expanded')).toBe(false)
    expect(trigger.hasAttribute('aria-controls')).toBe(false)
    expect(document.getElementById('panel') !== null).toBe(open)
    if (open)
      expect(document.getElementById('panel')?.getAttribute('aria-labelledby')).toBe('trigger')
  }
})
