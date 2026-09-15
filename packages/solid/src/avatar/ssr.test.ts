import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test, vi } from 'vitest'

let server: ViteDevServer
let fixture: { renderFixture(): string }
beforeAll(async () => {
  server = await createServer({
    configFile: false,
    root: process.cwd(),
    appType: 'custom',
    plugins: [solid({ ssr: true, refresh: { disabled: true } })],
    server: { middlewareMode: true, hmr: false },
  })
  fixture = (await server.ssrLoadModule('/src/avatar/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})

test('SSR renders fallback and utility semantics without constructing a native image', () => {
  const image = vi.fn(() => {
    throw new Error('Server attempted image loading')
  })
  vi.stubGlobal('Image', image)
  try {
    const document = new DOMParser().parseFromString(fixture.renderFixture(), 'text/html')
    expect(image).not.toHaveBeenCalled()
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('[data-state="idle"]')?.textContent).toBe('Ada')
    expect(document.querySelector('button')?.textContent).toBe('Save')
    expect(document.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Close')
    expect(document.querySelector('svg')?.parentElement?.getAttribute('aria-hidden')).toBe('true')
  } finally {
    vi.unstubAllGlobals()
  }
})
