import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
test('SSR renders percent sizes and preceding author ID without DOM access', async () => {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false, ws: false },
  })
  try {
    const fixture = (await server.ssrLoadModule('/src/resizable/ssr-fixture.tsx')) as {
      renderResizable(): string
      renderConstrained(): string
    }
    const doc = new DOMParser().parseFromString(fixture.renderResizable(), 'text/html')
    const handle = doc.querySelector('[role="separator"]')!
    expect(handle.getAttribute('aria-controls')).toBe('files')
    expect(handle.getAttribute('aria-label')).toBe('Files')
    expect(handle.getAttribute('aria-valuenow')).toBe('30')
    expect(handle.getAttribute('aria-valuemax')).toBe('50')
    expect(doc.querySelectorAll('[data-resizable-panel]')).toHaveLength(3)
    const constrained = new DOMParser().parseFromString(fixture.renderConstrained(), 'text/html')
    expect(constrained.querySelector('[role=separator]')?.getAttribute('aria-valuenow')).toBe('30')
    expect(constrained.querySelector('[data-resizable-panel]')?.getAttribute('style')).toContain(
      'flex:30 1 0px'
    )
    expect(constrained.documentElement.outerHTML).not.toContain('tenon-resizable-')
  } finally {
    await server.close()
  }
})
