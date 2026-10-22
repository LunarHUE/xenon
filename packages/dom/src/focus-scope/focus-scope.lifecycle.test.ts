import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerFocusScope } from './focus-scope'

const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    { width: 10, height: 10 },
  ] as unknown as DOMRectList)
})
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
function host() {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

test('disposal before mutation delivery prevents queued recovery from stealing outside focus', async () => {
  const container = host(),
    outside = document.createElement('button')
  const inside = document.createElement('button')
  container.append(inside)
  document.body.append(outside)
  const scope = registerFocusScope(container, { restoreFocus: false })
  cleanup.push(scope.dispose)
  expect(document.activeElement).toBe(inside)
  inside.remove()
  scope.dispose()
  outside.focus()
  await Promise.resolve()
  expect(document.activeElement).toBe(outside)
  expect(container.hasAttribute('tabindex')).toBe(false)
})

test('disposed scope mutations cannot reclaim focus or change a newer fallback tabindex', () => {
  const container = host()
  const old = registerFocusScope(container, { restoreFocus: false })
  old.dispose()
  const current = registerFocusScope(container, { restoreFocus: false })
  cleanup.push(current.dispose)
  old.update({ contain: true })
  old.registerBranch(document.implementation.createHTMLDocument().body)()
  old.dispose()
  expect(document.activeElement).toBe(container)
  expect(container.getAttribute('tabindex')).toBe('-1')
  current.dispose()
  expect(container.hasAttribute('tabindex')).toBe(false)
})

test('stale portal cleanup leaves a new scope branch usable for containment', () => {
  const container = host(),
    portal = host()
  const first = document.createElement('button'),
    second = document.createElement('button')
  container.append(first)
  portal.append(second)
  const old = registerFocusScope(container, { restoreFocus: false })
  const release = old.registerBranch(portal)
  old.dispose()
  const current = registerFocusScope(container, { restoreFocus: false })
  cleanup.push(current.dispose)
  current.registerBranch(portal)
  release()
  second.focus()
  expect(document.activeElement).toBe(second)
  const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
  second.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(first)
})
