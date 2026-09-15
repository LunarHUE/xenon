import { afterEach, expect, test, vi } from 'vitest'

import { registerModal } from './modal'

const cleanups: (() => void)[] = []
function modal(document: Document, lockScroll = true) {
  const element = document.createElement('div')
  document.body.append(element)
  const registration = registerModal(element, { lockScroll })
  cleanups.push(registration.dispose)
  return registration
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

test('prevent-scroll.notes.1 final release removes an originally absent empty style attribute', () => {
  expect(document.body.getAttribute('style')).toBeNull()
  expect(document.documentElement.getAttribute('style')).toBeNull()
  const registration = modal(document)
  registration.dispose()
  expect(document.body.getAttribute('style')).toBeNull()
  expect(document.documentElement.getAttribute('style')).toBeNull()
})

test('prevent-scroll.positioning.2 zero scrollbar width leaves padding and margin untouched', () => {
  vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(window.innerWidth)
  document.body.style.paddingRight = '7px'
  document.body.style.marginRight = '11px'
  const registration = modal(document)
  expect(document.body.style.paddingRight).toBe('7px')
  expect(document.body.style.marginRight).toBe('11px')
  expect(document.body.style.getPropertyValue('--scrollbar-width')).toBe('')
  registration.dispose()
  expect(document.body.style.paddingRight).toBe('7px')
  expect(document.body.style.marginRight).toBe('11px')
  expect(document.body.style.getPropertyValue('--scrollbar-width')).toBe('')
})

test('prevent-scroll.state.10 simultaneous owner documents lock and release independently', () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const other = frame.contentDocument!
  const top = modal(document)
  const nested = modal(other)
  expect(document.documentElement.style.overflowX).toBe('hidden')
  expect(other.documentElement.style.overflowX).toBe('hidden')
  top.dispose()
  expect(document.documentElement.style.overflowX).toBe('')
  expect(other.documentElement.style.overflowX).toBe('hidden')
  nested.dispose()
  expect(other.documentElement.style.overflowX).toBe('')
})
