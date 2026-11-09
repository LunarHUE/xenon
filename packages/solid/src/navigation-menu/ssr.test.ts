import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test } from 'vitest'
let server: ViteDevServer
let fixture: { renderNavigation(open: boolean): string }
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: false })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  fixture = (await server.ssrLoadModule('/src/navigation-menu/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('server keeps one hidden panel and resolves custom controlled-open associations', () => {
  for (const open of [false, true]) {
    const document = new DOMParser().parseFromString(fixture.renderNavigation(open), 'text/html')
    expect(document.querySelectorAll('#panel')).toHaveLength(1)
    expect(document.getElementById('panel')?.hasAttribute('hidden')).toBe(!open)
    expect(document.getElementById('trigger')?.getAttribute('aria-controls')).toBe(
      open ? 'panel' : null
    )
    expect(document.getElementById('panel')?.getAttribute('aria-labelledby')).toBe('trigger')
    expect(document.querySelector('a')?.getAttribute('href')).toBe('/products')
  }
})
