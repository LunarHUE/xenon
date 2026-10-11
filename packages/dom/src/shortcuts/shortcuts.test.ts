import { afterEach, expect, test, vi } from 'vitest'
import { registerLayer } from '../layer'
import { registerModal } from '../modal'
import { detectShortcutPlatform, readShortcutContext, watchShortcutContext } from './shortcuts'

afterEach(() => {
  document.body.replaceChildren()
})

function node(parent: Element = document.body, tag = 'div') {
  const element = document.createElement(tag)
  parent.append(element)
  return element
}

test('reads focus, the layer stack and the newest modal', () => {
  const popover = node()
  const dialog = node(document.body, 'dialog')
  const button = node(dialog, 'button')
  expect(readShortcutContext(document)).toEqual({ focus: null, layers: [], modal: null })
  const layer = registerLayer(popover)
  const second = registerLayer(dialog)
  const modal = registerModal(dialog, { lockScroll: false })
  button.focus()
  expect(readShortcutContext(document)).toEqual({
    focus: button,
    layers: [popover, dialog],
    modal: dialog,
  })
  modal.dispose()
  second.dispose()
  layer.dispose()
  expect(readShortcutContext(document)).toMatchObject({ layers: [], modal: null })
})

test('reports focus, layer, modal and dialog changes until stopped', async () => {
  const onChange = vi.fn()
  const stop = watchShortcutContext(document, onChange)
  expect(onChange).not.toHaveBeenCalled()
  const button = node(document.body, 'button')
  button.focus()
  expect(onChange).toHaveBeenCalled()
  onChange.mockClear()
  const layer = registerLayer(node())
  layer.dispose()
  expect(onChange).toHaveBeenCalledTimes(2)
  onChange.mockClear()
  const modal = registerModal(node(), { lockScroll: false })
  expect(onChange).toHaveBeenCalled()
  modal.dispose()
  onChange.mockClear()
  node(document.body, 'dialog').setAttribute('open', '')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(onChange).toHaveBeenCalled()
  stop()
  onChange.mockClear()
  button.blur()
  registerLayer(node()).dispose()
  expect(onChange).not.toHaveBeenCalled()
})

test.each([
  ['MacIntel', 'apple'],
  ['iPhone', 'apple'],
  ['Win32', 'other'],
  ['Linux x86_64', 'other'],
])('platform %s is %s', (platform, expected) => {
  const spy = vi.spyOn(navigator, 'platform', 'get').mockReturnValue(platform)
  expect(detectShortcutPlatform(document)).toBe(expected)
  spy.mockRestore()
})
