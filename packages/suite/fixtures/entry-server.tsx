import { generateHydrationScript, renderToStream, renderToString } from '@solidjs/web'
import { RoundOne } from './round-one'
import { Dialogs } from './dialogs'
import { PositioningFixture } from './positioning'
import { Popups } from './popups'

export function renderPopups(menuOpen = false) {
  return generateHydrationScript() + renderToString(() => <Popups menuOpen={menuOpen} />)
}

export function renderPositioning() {
  return generateHydrationScript() + renderToString(() => <PositioningFixture />)
}

export function renderDialogs() {
  return generateHydrationScript() + renderToString(() => <Dialogs />)
}

export function render() {
  return generateHydrationScript() + renderToString(() => <RoundOne />)
}

export async function renderStream(asyncContent = false) {
  const errors: unknown[] = []
  const html = await renderToStream(() => <RoundOne asyncContent={asyncContent} />, {
    onError: (error) => errors.push(error),
  })
  if (errors.length) throw new AggregateError(errors, 'SSR stream failed')
  return generateHydrationScript() + html
}
