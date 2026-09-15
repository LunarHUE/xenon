import { afterEach, expect, test } from 'vitest'

import { registerModal } from './modal'

const cleanups: (() => void)[] = []
function node() {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}
function modal(lockScroll = true) {
  const registration = registerModal(node(), { lockScroll })
  cleanups.push(registration.dispose)
  return registration
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
})

test('prevent-scroll.state.2 reverse release keeps the page locked until the last holder releases', () => {
  const first = modal()
  const second = modal()
  expect(document.documentElement.style.overflowX).toBe('hidden')
  second.dispose()
  expect(document.documentElement.style.overflowX).toBe('hidden')
  first.dispose()
  expect(document.documentElement.style.overflowX).toBe('')
})

test('prevent-scroll.state.3 repeated release decrements a scroll lock only once', () => {
  const first = modal()
  const second = modal()
  first.dispose()
  first.dispose()
  expect(document.documentElement.style.overflowY).toBe('hidden')
  second.dispose()
  second.dispose()
  expect(document.documentElement.style.overflowY).toBe('')
})

test('prevent-scroll.state.4 a fresh lock applies again after the previous lock is fully released', () => {
  const first = modal()
  first.dispose()
  expect(document.documentElement.style.overflowX).toBe('')
  const second = modal()
  expect(document.documentElement.style.overflowX).toBe('hidden')
  second.dispose()
  expect(document.documentElement.style.overflowX).toBe('')
})

test('prevent-scroll.state.9 a registration with lockScroll false never locks the document', () => {
  document.documentElement.style.setProperty('overflow-x', 'scroll')
  document.documentElement.style.setProperty('overflow-y', 'auto')
  const registration = modal(false)
  expect(document.documentElement.style.overflowX).toBe('scroll')
  expect(document.documentElement.style.overflowY).toBe('auto')
  registration.dispose()
  expect(document.documentElement.style.overflowX).toBe('scroll')
  expect(document.documentElement.style.overflowY).toBe('auto')
})
