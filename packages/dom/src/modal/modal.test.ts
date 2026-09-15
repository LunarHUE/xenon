import { afterEach, describe, expect, test, vi } from 'vitest'

import { registerModal, subscribeModalContent } from './modal'

const cleanups: (() => void)[] = []
function modal(element: HTMLElement, lockScroll = true) {
  const registration = registerModal(element, { lockScroll })
  cleanups.push(registration.dispose)
  return registration
}
function node(parent: Element = document.body) {
  const element = document.createElement('div')
  parent.append(element)
  return element
}
async function mutations() {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})

describe('registerModal', () => {
  test('isolates siblings along the content path and restores exact attributes', () => {
    const background = node()
    background.setAttribute('inert', 'original')
    background.setAttribute('aria-hidden', 'false')
    const root = node()
    const sibling = node(root)
    const content = node(root)
    const registration = modal(content)
    expect(root.hasAttribute('inert')).toBe(false)
    expect(content.hasAttribute('aria-hidden')).toBe(false)
    expect(sibling.getAttribute('aria-hidden')).toBe('true')
    expect(background.getAttribute('aria-hidden')).toBe('true')
    registration.dispose()
    registration.dispose()
    expect(background.getAttribute('inert')).toBe('original')
    expect(background.getAttribute('aria-hidden')).toBe('false')
    expect(sibling.hasAttribute('aria-hidden')).toBe(false)
    expect(sibling.hasAttribute('inert')).toBe(false)
  })

  test('shares the modal stack across roots and restores the lower modal and its branches', () => {
    const parent = node()
    const parentModal = modal(parent)
    const branch = node()
    parentModal.registerBranch(branch)
    const child = node()
    const childModal = modal(child)
    expect(parent.hasAttribute('inert')).toBe(true)
    expect(branch.hasAttribute('inert')).toBe(true)
    expect(child.hasAttribute('inert')).toBe(false)
    childModal.dispose()
    expect(parent.hasAttribute('inert')).toBe(false)
    expect(branch.hasAttribute('inert')).toBe(false)
    expect(child.hasAttribute('inert')).toBe(true)
  })

  test('nested content leaves its ancestor exposed and isolates sibling content', () => {
    const parent = node()
    modal(parent)
    const sibling = node(parent)
    const child = node(parent)
    const childModal = modal(child)
    expect(parent.hasAttribute('inert')).toBe(false)
    expect(sibling.hasAttribute('inert')).toBe(true)
    childModal.dispose()
    expect(sibling.hasAttribute('inert')).toBe(false)
  })

  test('duplicate branch registration has independent idempotent cleanup', () => {
    const content = node()
    const branch = node()
    const registration = modal(content)
    const first = registration.registerBranch(branch)
    const second = registration.registerBranch(branch)
    first()
    first()
    expect(branch.hasAttribute('inert')).toBe(false)
    second()
    expect(branch.hasAttribute('inert')).toBe(true)
  })

  test('observes new background nodes and restores detached nodes', async () => {
    const content = node()
    const registration = modal(content)
    const background = node()
    await mutations()
    expect(background.getAttribute('aria-hidden')).toBe('true')
    background.remove()
    await mutations()
    expect(background.hasAttribute('aria-hidden')).toBe(false)
    content.remove()
    registration.dispose()
    expect(document.body.style.overflow).toBe('')
  })

  test('follows open shadow and slot paths and observes shadow mutations', async () => {
    const host = node()
    const shadow = host.attachShadow({ mode: 'open' })
    const slot = document.createElement('slot')
    shadow.append(slot)
    const content = node(host)
    modal(content)
    expect(host.hasAttribute('inert')).toBe(false)
    expect(slot.hasAttribute('inert')).toBe(false)
    expect(content.hasAttribute('inert')).toBe(false)
    const sibling = document.createElement('div')
    shadow.append(sibling)
    await mutations()
    expect(sibling.hasAttribute('inert')).toBe(true)
  })

  test('scroll locking compensates once and preserves inline values, priorities and unrelated writes', () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(window.innerWidth - 20)
    document.body.style.setProperty('padding-right', '7px', 'important')
    document.body.style.setProperty('overflow-x', 'scroll', 'important')
    document.body.style.setProperty('overflow-y', 'auto')
    document.documentElement.style.setProperty('overflow', 'auto', 'important')
    const first = modal(node())
    const second = modal(node())
    const unlocked = modal(node(), false)
    expect(document.body.style.paddingRight).toBe('27px')
    expect(document.documentElement.style.overflowX).toBe('hidden')
    expect(document.body.style.overflowX).toBe('scroll')
    expect(document.body.style.overflowY).toBe('auto')
    document.body.style.color = 'red'
    first.dispose()
    expect(document.body.style.paddingRight).toBe('27px')
    second.dispose()
    expect(document.body.style.paddingRight).toBe('7px')
    expect(document.body.style.getPropertyPriority('padding-right')).toBe('important')
    expect(document.body.style.overflowX).toBe('scroll')
    expect(document.body.style.getPropertyPriority('overflow-x')).toBe('important')
    expect(document.body.style.overflowY).toBe('auto')
    expect(document.body.style.getPropertyPriority('overflow-y')).toBe('')
    expect(document.documentElement.style.overflow).toBe('auto')
    expect(document.documentElement.style.getPropertyPriority('overflow')).toBe('important')
    expect(document.body.style.color).toBe('red')
    unlocked.dispose()
  })

  test('owner documents keep separate isolation and scroll locks', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const other = frame.contentDocument!
    const content = other.createElement('div')
    const background = other.createElement('div')
    other.body.append(content, background)
    const registration = modal(content)
    expect(background.hasAttribute('inert')).toBe(true)
    expect(frame.hasAttribute('inert')).toBe(false)
    expect(document.body.style.overflow).toBe('')
    expect(other.documentElement.style.overflowX).toBe('hidden')
    expect(other.body.style.overflowX).toBe('')
    registration.dispose()
    expect(other.body.style.overflow).toBe('')
  })
})

describe('subscribeModalContent', () => {
  test('emits the current destination immediately and follows nested registration order', () => {
    const destinations: (HTMLElement | undefined)[] = []
    cleanups.push(subscribeModalContent(document, (content) => destinations.push(content)))
    const first = node()
    const firstContent = node(first)
    const firstModal = registerModal(first, { content: firstContent })
    cleanups.push(firstModal.dispose)
    const second = node()
    const secondContent = node(second)
    const secondModal = registerModal(second, { content: secondContent })
    cleanups.push(secondModal.dispose)
    secondModal.dispose()
    firstModal.dispose()
    expect(destinations).toEqual([undefined, firstContent, secondContent, firstContent, undefined])
  })

  test('subscribers added during a modal receive its content and see isolation already reconciled', () => {
    const background = node()
    const root = node()
    const registration = modal(root)
    const callback = vi.fn((content: HTMLElement | undefined) => {
      expect(background.hasAttribute('inert')).toBe(Boolean(content))
    })
    cleanups.push(subscribeModalContent(document, callback))
    expect(callback).toHaveBeenCalledExactlyOnceWith(root)
    registration.dispose()
    expect(callback).toHaveBeenLastCalledWith(undefined)
  })

  test('branch changes, background mutations and non-top disposal do not repeat a destination', async () => {
    const first = modal(node())
    const top = node()
    const second = modal(top)
    const callback = vi.fn()
    cleanups.push(subscribeModalContent(document, callback))
    const release = second.registerBranch(node())
    release()
    node()
    await mutations()
    first.dispose()
    expect(callback).toHaveBeenCalledExactlyOnceWith(top)
  })

  test('unsubscription is independent and idempotent', () => {
    const first = vi.fn()
    const second = vi.fn()
    const release = subscribeModalContent(document, first)
    cleanups.push(release)
    cleanups.push(subscribeModalContent(document, second))
    release()
    release()
    const root = node()
    modal(root)
    expect(first).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(second.mock.calls).toEqual([[undefined], [root]])
  })

  test('subscriptions allocate no listeners or observers and modal observers stop after disposal', async () => {
    const observe = vi.spyOn(window.MutationObserver.prototype, 'observe')
    const disconnect = vi.spyOn(window.MutationObserver.prototype, 'disconnect')
    const listen = vi.spyOn(document, 'addEventListener')
    const unsubscribe = subscribeModalContent(document, () => {})
    cleanups.push(unsubscribe)
    expect(observe).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
    const registration = modal(node())
    expect(observe).toHaveBeenCalled()
    registration.dispose()
    expect(disconnect).toHaveBeenCalled()
    observe.mockClear()
    node()
    await mutations()
    expect(observe).not.toHaveBeenCalled()
  })

  test('a persistent subscription survives a completely new modal stack', () => {
    const callback = vi.fn()
    cleanups.push(subscribeModalContent(document, callback))
    const first = node()
    modal(first).dispose()
    const second = node()
    modal(second).dispose()
    expect(callback.mock.calls).toEqual([[undefined], [first], [undefined], [second], [undefined]])
  })

  test('content must remain in its host document and composed subtree', () => {
    const host = node()
    expect(() => registerModal(host, { content: node() })).toThrow('same-document descendant')
    const frame = document.createElement('iframe')
    document.body.append(frame)
    expect(() => registerModal(host, { content: frame.contentDocument!.body })).toThrow(
      'same-document descendant'
    )
    const shadow = host.attachShadow({ mode: 'open' })
    const content = document.createElement('div')
    shadow.append(content)
    const registration = registerModal(host, { content })
    cleanups.push(registration.dispose)
    const callback = vi.fn()
    cleanups.push(subscribeModalContent(document, callback))
    expect(callback).toHaveBeenCalledExactlyOnceWith(content)
  })

  test('subscriptions observe only their owner document', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const other = frame.contentDocument!
    const callback = vi.fn()
    cleanups.push(subscribeModalContent(other, callback))
    modal(node())
    expect(callback).toHaveBeenCalledExactlyOnceWith(undefined)
    const root = other.createElement('div')
    other.body.append(root)
    modal(root)
    expect(callback).toHaveBeenLastCalledWith(root)
  })
})

test('moving an isolated portal in a destination callback restores its attributes synchronously', () => {
  const portal = node()
  const host = node()
  cleanups.push(
    subscribeModalContent(document, (content) => (content ?? document.body).append(portal))
  )
  const registration = modal(host)
  expect(host.contains(portal)).toBe(true)
  expect(portal.hasAttribute('inert')).toBe(false)
  expect(portal.hasAttribute('aria-hidden')).toBe(false)
  registration.dispose()
  expect(portal.parentElement).toBe(document.body)
  expect(portal.hasAttribute('inert')).toBe(false)
})
