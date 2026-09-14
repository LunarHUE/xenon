import { afterEach, describe, expect, test, vi } from 'vitest'

import { registerModal } from './modal'

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
    expect(other.body.style.overflowX).toBe('hidden')
    registration.dispose()
    expect(other.body.style.overflow).toBe('')
  })
})
