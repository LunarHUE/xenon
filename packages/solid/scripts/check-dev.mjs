/**
 * Compile public component implementations through Vite's development pipeline with Solid refresh
 * enabled. Production builds and refresh-disabled unit tests cannot detect
 * duplicate bindings introduced when refresh encounters component overloads.
 * Run with test:dev; the temporary loopback server closes even on failure.
 */
import assert from 'node:assert/strict'
import { log } from 'node:console'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import solid from '@solidjs/vite-plugin'
import { createServer } from 'vite'

const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  configFile: false,
  logLevel: 'silent',
  plugins: [solid()],
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { host: '127.0.0.1', port: 0 },
})
try {
  await server.listen()
  for (const family of [
    'calendar',
    'range-calendar',
    'avatar',
    'visually-hidden',
    'accessible-icon',
    'meter',
    'pagination',
    'breadcrumbs',
    'resizable',
    'scroll-area',
  ]) {
    const file = ['avatar', 'visually-hidden', 'accessible-icon'].includes(family)
      ? 'index'
      : family
    const result = await server.transformRequest(`/src/${family}/${file}.tsx`)
    assert(result?.code, `${family} must compile in development`)
    assert.match(result.code, /\$RefreshReg\$|_\$\$component/, 'Solid refresh must remain enabled')
  }
  log('Calendar and alpha utility/layout roots compile with Solid development refresh enabled.')
} finally {
  await server.close()
}
// A handle stays open after close() and would keep the process alive, so exit
// explicitly once the checks have passed. Failures throw before reaching this.
process.exit(0)
