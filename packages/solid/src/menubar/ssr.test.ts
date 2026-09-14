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
  fixture = (await server.ssrLoadModule('/src/menubar/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('server renders one enabled menubar tab stop and resolves controlled-open menu associations', () => {
  for (const open of [false, true]) {
    const document = new DOMParser().parseFromString(fixture.renderFixture(open), 'text/html')
    expect(document.querySelector('[role="menubar"]')).not.toBeNull()
    expect(document.getElementById('trigger')?.getAttribute('aria-controls')).toBe(
      open ? 'panel' : null
    )
    expect(document.getElementById('trigger')?.getAttribute('tabindex')).toBe('0')
    expect(document.getElementById('other')?.getAttribute('tabindex')).toBe('-1')
    expect(document.getElementById('panel') !== null).toBe(open)
  }
})
