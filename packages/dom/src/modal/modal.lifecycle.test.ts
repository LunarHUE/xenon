import { afterEach, expect, test } from 'vitest'
import { getTopModal, registerModal } from './modal'

const cleanup: (() => void)[] = []
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  document.body.replaceChildren()
})
function host() {
  const element = document.createElement('div')
  document.body.append(element)
  return element
}

test('a stale branch release cannot isolate a branch belonging to a reopened modal', () => {
  const element = host(),
    branch = host()
  branch.setAttribute('aria-hidden', 'false')
  const old = registerModal(element, { lockScroll: false })
  const release = old.registerBranch(branch)
  old.dispose()
  const current = registerModal(element, { lockScroll: false })
  cleanup.push(current.dispose)
  const currentRelease = current.registerBranch(branch)
  release()
  old.dispose()
  expect(branch.hasAttribute('inert')).toBe(false)
  expect(branch.getAttribute('aria-hidden')).toBe('false')
  currentRelease()
  expect(branch.hasAttribute('inert')).toBe(true)
  current.dispose()
  expect(branch.hasAttribute('inert')).toBe(false)
  expect(branch.getAttribute('aria-hidden')).toBe('false')
})

test('a disposed modal cannot expose a new branch through the current modal', () => {
  const old = registerModal(host(), { lockScroll: false })
  old.dispose()
  const currentHost = host(),
    background = host()
  const current = registerModal(currentHost, { lockScroll: false })
  cleanup.push(current.dispose)
  const release = old.registerBranch(background)
  release()
  release()
  expect(background.hasAttribute('inert')).toBe(true)
  expect(getTopModal(document)).toBe(currentHost)
})

test('removing the only scroll-lock holder unlocks while another modal keeps isolation', () => {
  const background = host()
  const locking = registerModal(host())
  const topHost = host()
  const top = registerModal(topHost, { lockScroll: false })
  cleanup.push(locking.dispose, top.dispose)
  expect(document.documentElement.style.overflowY).toBe('hidden')
  locking.dispose()
  expect(document.documentElement.style.overflowY).toBe('')
  expect(background.hasAttribute('inert')).toBe(true)
  expect(getTopModal(document)).toBe(topHost)
  top.dispose()
  expect(background.hasAttribute('inert')).toBe(false)
})
