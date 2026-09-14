import { generateHydrationScript, renderToStream, renderToString } from '@solidjs/web'
import { RoundOne } from './round-one'
import { Dialogs } from './dialogs'
import { PositioningFixture } from './positioning'
import { Popups } from './popups'

/**
 * Renders popup fixture HTML prefixed by the hydration script.
 * @param menuOpen - Initial menu state, false by default; match the client menu query flag.
 */
export function renderPopups(menuOpen = false) {
  return generateHydrationScript() + renderToString(() => <Popups menuOpen={menuOpen} />)
}

/**
 * Renders positioning fixture HTML prefixed by the hydration script for the positioning query flag.
 */
export function renderPositioning() {
  return generateHydrationScript() + renderToString(() => <PositioningFixture />)
}

/**
 * Renders dialog fixture HTML prefixed by the hydration script for the dialogs query flag.
 */
export function renderDialogs() {
  return generateHydrationScript() + renderToString(() => <Dialogs />)
}

/**
 * Renders the synchronous default fixture HTML prefixed by the hydration script.
 */
export function render() {
  return generateHydrationScript() + renderToString(() => <RoundOne />)
}

/**
 * Buffers the default fixture stream into HTML and prefixes the hydration script.
 * @param asyncContent - Include the asynchronous field fixture, false by default; match the client async query flag.
 * @returns Complete HTML after the stream resolves, not a stream for incremental delivery.
 * @throws An AggregateError if rendering reports errors through onError; other rejections propagate.
 */
export async function renderStream(asyncContent = false) {
  const errors: unknown[] = []
  const html = await renderToStream(() => <RoundOne asyncContent={asyncContent} />, {
    onError: (error) => errors.push(error),
  })
  if (errors.length) throw new AggregateError(errors, 'SSR stream failed')
  return generateHydrationScript() + html
}
