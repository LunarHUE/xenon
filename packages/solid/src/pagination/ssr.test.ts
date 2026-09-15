import solid from '@solidjs/vite-plugin'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, expect, test } from 'vitest'
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
  fixture = (await server.ssrLoadModule('/src/pagination/ssr-fixture.tsx')) as typeof fixture
})
afterAll(async () => {
  await server?.close()
})
test('server output includes named measurement, current pages, lists and navigable hrefs', () => {
  const document = new DOMParser().parseFromString(fixture.renderFixture(), 'text/html')
  expect(document.querySelector('meter')?.getAttribute('value')).toBe('40')
  expect(document.querySelector('meter')?.getAttribute('aria-label')).toBe('Storage')
  expect(
    document.querySelector('[aria-label="Pagination"] a[aria-current="page"]')?.getAttribute('href')
  ).toBe('/page/2')
  expect(document.querySelector('[aria-label="Next page"]')?.getAttribute('href')).toBe('/page/3')
  expect(document.querySelectorAll('[aria-label="Breadcrumbs"] ol > li')).toHaveLength(2)
  expect(document.querySelector('[aria-label="Breadcrumbs"] a')?.getAttribute('href')).toBe('/')
  expect(
    document.querySelector('[aria-label="Breadcrumbs"] [aria-current="page"]')?.textContent
  ).toBe('Page two')
})
