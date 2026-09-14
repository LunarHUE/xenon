import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import solid from '@solidjs/vite-plugin'
import { createServer as createViteServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const vite = await createViteServer({
  configFile: false,
  root,
  appType: 'custom',
  plugins: [solid({ ssr: true, refresh: { disabled: true } })],
  server: { middlewareMode: true, hmr: false },
})
const server = createServer((request, response) => {
  vite.middlewares(request, response, async () => {
    try {
      const { render, renderStream, renderDialogs } = await vite.ssrLoadModule(
        '/fixtures/entry-server.tsx'
      )
      const query = new URL(request.url ?? '/', 'http://localhost').searchParams
      const body = (
        query.has('dialogs')
          ? renderDialogs()
          : query.has('stream')
            ? await renderStream(query.has('async'))
            : render()
      ) as string
      const template = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Hydration fixture</title></head><body><div id="app">${body}</div><script type="module" src="/fixtures/entry-client.tsx"></script></body></html>`
      response.setHeader('Content-Type', 'text/html')
      response.end(await vite.transformIndexHtml(request.url ?? '/', template))
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error))
      vite.ssrFixStacktrace(failure)
      response.statusCode = 500
      response.end(failure.stack)
    }
  })
})
server.listen(4174, '127.0.0.1', () => console.log('SSR fixture ready'))
