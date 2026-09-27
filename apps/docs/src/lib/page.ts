/**
 * Runs `setup` for every page the client router shows, the first one included.
 * Bundled scripts only execute once per visit, so anything bound to the page's
 * elements goes through here. The signal aborts when the router swaps the page
 * out; pass it to listeners, and use it to stop observers and timers.
 */
export function onPage(setup: (signal: AbortSignal) => void): void {
  document.addEventListener('astro:page-load', () => {
    const page = new AbortController()
    document.addEventListener('astro:before-swap', () => page.abort(), { once: true })
    setup(page.signal)
  })
}
