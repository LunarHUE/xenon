import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
test('SSR renders percent sizes and preceding author ID without DOM access', async () => {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false },
  })
  try {
    const fixture = (await server.ssrLoadModule('/src/resizable/ssr-fixture.tsx')) as {
      renderResizable(): string
    }
    const doc = new DOMParser().parseFromString(fixture.renderResizable(), 'text/html')
    const handle = doc.querySelector('[role="separator"]')!
    expect(handle.getAttribute('aria-controls')).toBe('files')
    expect(handle.getAttribute('aria-label')).toBe('Files')
    expect(handle.getAttribute('aria-valuenow')).toBe('30')
    expect(doc.querySelectorAll('[data-resizable-panel]')).toHaveLength(3)
  } finally {
    await server.close()
  }
})
