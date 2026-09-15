import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
test('SSR retains native overflow and readable content without browser geometry', async () => {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    const fixture = (await server.ssrLoadModule('/src/scroll-area/ssr-fixture.tsx')) as {
      renderFixture(): string
    }
    const doc = new DOMParser().parseFromString(fixture.renderFixture(), 'text/html')
    const viewport = doc.querySelector<HTMLElement>('[role="region"]')!
    expect(viewport.id).toBe('messages')
    expect(viewport.style.overflow).toBe('auto')
    expect(viewport.style.scrollbarWidth).toBe('')
    expect(viewport.textContent).toContain('Readable without JavaScript.')
    expect(doc.querySelector('[role="scrollbar"]')?.getAttribute('aria-controls')).toBe('messages')
  } finally {
    await server.close()
  }
})
