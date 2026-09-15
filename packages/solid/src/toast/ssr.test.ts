import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test } from 'vitest'
let server: ViteDevServer
let fixture: { renderNotifications(limit: number): string }
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  fixture = (await server.ssrLoadModule('/src/toast/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('SSR applies provider limits before rendering and resolves custom text IDs', () => {
  for (const limit of [0, 1, 3]) {
    const document = new DOMParser().parseFromString(
      fixture.renderNotifications(limit),
      'text/html'
    )
    const records = [...document.querySelectorAll('[role=group]')]
    expect(records.map((record) => record.id)).toEqual(['second', 'first'])
    expect(records.filter((record) => !record.hasAttribute('hidden'))).toHaveLength(
      Math.min(limit, 2)
    )
    for (const record of records) {
      expect(record.getAttribute('aria-labelledby')).toBe(`${record.id}-title`)
      expect(record.getAttribute('aria-describedby')).toBe(`${record.id}-description`)
      expect(document.getElementById(`${record.id}-title`)).not.toBeNull()
      if (record.hasAttribute('hidden')) expect(record.hasAttribute('inert')).toBe(true)
    }
    expect(document.querySelector('[role=status]')?.textContent).toBe('')
    expect(document.querySelector('[role=alert]')?.textContent).toBe('')
  }
})
