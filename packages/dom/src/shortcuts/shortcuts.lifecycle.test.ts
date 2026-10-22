import { afterEach, expect, test, vi } from 'vitest'
import { registerLayer } from '../layer'
import { registerModal } from '../modal'
import { readShortcutContext, watchShortcutContext } from './shortcuts'

const cleanup: (() => void)[] = []
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((stop) => stop())
  document.body.replaceChildren()
})

test('stopping one watcher leaves another subscribed across fresh layer and modal stacks', () => {
  const first = vi.fn(),
    second = vi.fn()
  const stop = watchShortcutContext(document, first)
  cleanup.push(stop, watchShortcutContext(document, second))
  stop()
  stop()
  for (let i = 0; i < 2; i++) {
    const host = document.createElement('div')
    document.body.append(host)
    const layer = registerLayer(host)
    const modal = registerModal(host, { lockScroll: false })
    cleanup.push(layer.dispose, modal.dispose)
    expect(readShortcutContext(document)).toMatchObject({ layers: [host], modal: host })
    modal.dispose()
    layer.dispose()
  }
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledTimes(8)
})

test('stopping before mutation delivery discards queued open-attribute notifications', async () => {
  const notify = vi.fn()
  const stop = watchShortcutContext(document, notify)
  cleanup.push(stop)
  const dialog = document.createElement('dialog')
  document.body.append(dialog)
  dialog.setAttribute('open', '')
  stop()
  await Promise.resolve()
  expect(notify).not.toHaveBeenCalled()
})

test('watchers ignore unrelated attributes but observe opening and closing', async () => {
  const notify = vi.fn()
  cleanup.push(watchShortcutContext(document, notify))
  const dialog = document.createElement('dialog')
  document.body.append(dialog)
  dialog.setAttribute('aria-label', 'Settings')
  await Promise.resolve()
  expect(notify).not.toHaveBeenCalled()
  dialog.setAttribute('open', '')
  await Promise.resolve()
  expect(notify).toHaveBeenCalledTimes(1)
  dialog.removeAttribute('open')
  await Promise.resolve()
  expect(notify).toHaveBeenCalledTimes(2)
})

test('focus context follows nested open shadow roots', () => {
  const host = document.createElement('div')
  document.body.append(host)
  const inner = document.createElement('div')
  host.attachShadow({ mode: 'open' }).append(inner)
  const button = document.createElement('button')
  inner.attachShadow({ mode: 'open' }).append(button)
  button.focus()
  expect(readShortcutContext(document).focus).toBe(button)
})

test('a watcher belongs only to its document', async () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const other = frame.contentDocument!
  const local = vi.fn(),
    remote = vi.fn()
  cleanup.push(watchShortcutContext(document, local), watchShortcutContext(other, remote))
  const host = other.createElement('div')
  other.body.append(host)
  const layer = registerLayer(host)
  const modal = registerModal(host, { lockScroll: false })
  cleanup.push(layer.dispose, modal.dispose)
  host.setAttribute('open', '')
  await Promise.resolve()
  expect(local).not.toHaveBeenCalled()
  expect(remote).toHaveBeenCalledTimes(3)
  expect(readShortcutContext(document)).toMatchObject({ layers: [], modal: null })
  expect(readShortcutContext(other)).toMatchObject({ layers: [host], modal: host })
})
