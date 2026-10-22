import { afterEach, expect, test, vi } from 'vitest'
import { getLayerElements, registerLayer, subscribeLayers } from './layer'

const cleanup: (() => void)[] = []
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((stop) => stop())
  document.body.replaceChildren()
})
function host() {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

test('independent subscriptions of the same callback survive an empty stack', () => {
  const listener = vi.fn()
  const first = subscribeLayers(document, listener)
  cleanup.push(first, subscribeLayers(document, listener))
  const element = host()
  const layer = registerLayer(element)
  cleanup.push(layer.dispose)
  expect(listener).toHaveBeenCalledTimes(2)
  first()
  first()
  layer.dispose()
  const reopened = registerLayer(element)
  cleanup.push(reopened.dispose)
  reopened.dispose()
  expect(listener).toHaveBeenCalledTimes(5)
})

test('stale handles and branch releases cannot affect a new registration of the same host', () => {
  const element = host(),
    branch = host()
  const stale = registerLayer(element)
  const release = stale.registerBranch(branch)
  stale.dispose()
  const dismiss = vi.fn()
  const current = registerLayer(element, { onDismiss: dismiss })
  cleanup.push(current.dispose)
  current.registerBranch(branch)
  stale.update({ escape: 'ignore' })
  stale.registerBranch(document.implementation.createHTMLDocument().body)()
  release()
  stale.dispose()
  expect(stale.isTopmost()).toBe(false)
  expect(current.isTopmost()).toBe(true)
  expect(getLayerElements(document)).toEqual([element])
  const contained: boolean[] = []
  branch.addEventListener('probe', (event) =>
    contained.push(current.contains(event), stale.contains(event))
  )
  branch.dispatchEvent(new Event('probe', { bubbles: true }))
  expect(contained).toEqual([true, false])
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  )
  expect(dismiss).toHaveBeenCalledTimes(1)
})
