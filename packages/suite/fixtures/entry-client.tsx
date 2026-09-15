/**
 * Hydrates the existing #app fixture on module evaluation, then flushes Solid.
 * Requires matching server markup and query flags: calendar takes precedence over toast, floating,
 * popups, positioning, dialogs, then the default fixture. menu applies to popups;
 * async applies to the default fixture. Flags are tested for presence, not value.
 *
 * @packageDocumentation
 */
import { hydrate } from '@solidjs/web'
import { flush } from 'solid-js'
import { RoundOne } from './round-one'
import { Dialogs } from './dialogs'
import { PositioningFixture } from './positioning'
import { Popups } from './popups'
import { FloatingFixture } from './floating'
import { ToastFixture } from './toast'
import { CalendarFixture } from './calendar'
import { UtilityCoverage } from './utility-coverage'

const root = document.getElementById('app')!
/** Pre-hydration descendant elements; excludes the root and text/comment nodes. */
const serverNodes = [...root.querySelectorAll('*')]
/** Nonempty IDs in the original descendant order, retained for later test comparisons. */
const serverIds = serverNodes.filter((node) => node.id).map((node) => node.id)
const query = new URLSearchParams(location.search)
hydrate(
  () =>
    query.has('utilityCoverage') ? (
      <UtilityCoverage
        avatarPolicy={query.get('avatarPolicy') === 'origin' ? 'origin' : 'no-referrer'}
      />
    ) : query.has('calendar') ? (
      <CalendarFixture />
    ) : query.has('toast') ? (
      <ToastFixture />
    ) : query.has('floating') ? (
      <FloatingFixture />
    ) : query.has('popups') ? (
      <Popups menuOpen={query.has('menu')} />
    ) : query.has('positioning') ? (
      <PositioningFixture />
    ) : query.has('dialogs') ? (
      <Dialogs />
    ) : (
      <RoundOne asyncContent={query.has('async')} />
    ),
  root
)
flush()
// Publish markers on the next frame. Containment checks element identity survival,
// not unchanged order, attributes, text, or absence of new nodes. hydrated marks
// this checkpoint only; it does not establish completion of all asynchronous work.
requestAnimationFrame(() => {
  root.dataset.preserved = String(serverNodes.every((node) => root.contains(node)))
  root.dataset.serverIds = JSON.stringify(serverIds)
  root.dataset.hydrated = 'true'
})
