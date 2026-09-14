import { hydrate } from '@solidjs/web'
import { flush } from 'solid-js'
import { RoundOne } from './round-one'
import { Dialogs } from './dialogs'
import { PositioningFixture } from './positioning'
import { Popups } from './popups'

const root = document.getElementById('app')!
const serverNodes = [...root.querySelectorAll('*')]
const serverIds = serverNodes.filter((node) => node.id).map((node) => node.id)
const query = new URLSearchParams(location.search)
hydrate(
  () =>
    query.has('popups') ? (
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
requestAnimationFrame(() => {
  root.dataset.preserved = String(serverNodes.every((node) => root.contains(node)))
  root.dataset.serverIds = JSON.stringify(serverIds)
  root.dataset.hydrated = 'true'
})
