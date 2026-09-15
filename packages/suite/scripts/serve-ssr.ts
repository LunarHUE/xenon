/**
 * Starts the local SSR/hydration fixture server on 127.0.0.1:4174.
 * Logs "SSR fixture ready" only after the HTTP listener binds. Vite serves module
 * requests first; requests left to the fallback renderer receive fixture HTML.
 * Keep this process alive for browser tests and terminate it afterward. No signal
 * handlers or explicit HTTP/Vite shutdown are installed by this script.
 */
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import solid from '@solidjs/vite-plugin'
import { createServer as createViteServer } from 'vite'

/** Suite package directory used for Vite module resolution and fixture paths. */
const root = fileURLToPath(new URL('..', import.meta.url))
/**
 * Config-file-independent Vite middleware server with the Solid SSR transform.
 * Custom app mode leaves HTML generation to this script; HMR and refresh are disabled.
 */
const vite = await createViteServer({
  configFile: false,
  root,
  appType: 'custom',
  plugins: [solid({ ssr: true, refresh: { disabled: true } })],
  server: { middlewareMode: true, hmr: false },
})
/**
 * HTTP server that delegates assets to Vite before rendering the selected fixture.
 * Render/load/HTML-transform failures become status 500 responses with a Vite-fixed
 * stack trace. This error response is for the local test server, not a production handler.
 */
const server = createServer((request, response) => {
  vite.middlewares(request, response, async () => {
    try {
      const {
        render,
        renderStream,
        renderDialogs,
        renderPositioning,
        renderPopups,
        renderFloating,
        renderToast,
        renderCalendar,
      } = await vite.ssrLoadModule('/fixtures/entry-server.tsx')
      /** Presence-based flags; priority is calendar, toast, floating, popups, positioning, dialogs, stream, then the default fixture. */
      const query = new URL(request.url ?? '/', 'http://localhost').searchParams
      /**
       * Buffer the full rendered string before sending a response, including renderStream.
       * Stream selects Solid's streaming renderer, not incremental HTTP transport.
       * Menu affects only popups; async affects only the server's stream branch.
       */
      const body = (
        query.has('calendar')
          ? renderCalendar()
          : query.has('toast')
            ? renderToast()
            : query.has('floating')
              ? renderFloating()
              : query.has('popups')
                ? renderPopups(query.has('menu'))
                : query.has('positioning')
                  ? renderPositioning()
                  : query.has('dialogs')
                    ? renderDialogs()
                    : query.has('stream')
                      ? await renderStream(query.has('async'))
                      : render()
      ) as string
      /**
       * Hydrate #app using the client entry's matching fixture priority. For RoundOne,
       * pair async with stream so server and client receive the same async-content flag.
       * Vite transforms the complete document before the single response.end call.
       */
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
