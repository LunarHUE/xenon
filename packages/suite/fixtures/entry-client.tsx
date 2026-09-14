import { hydrate } from '@solidjs/web'
import { flush } from 'solid-js'
import { RoundOne } from './round-one'

const root = document.getElementById('app')!
const serverNodes = [...root.querySelectorAll('*')]
const serverIds = serverNodes.filter((node) => node.id).map((node) => node.id)
hydrate(() => <RoundOne />, root)
flush()
requestAnimationFrame(() => {
  root.dataset.preserved = String(serverNodes.every((node) => root.contains(node)))
  root.dataset.serverIds = JSON.stringify(serverIds)
  root.dataset.hydrated = 'true'
})
