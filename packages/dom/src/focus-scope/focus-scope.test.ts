import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { registerFocusScope } from './focus-scope'
import type { FocusScopeHandle, FocusScopeOptions } from './focus-scope'

const scopes: FocusScopeHandle[] = []
function register(container: HTMLElement, options?: FocusScopeOptions) {
  const handle = registerFocusScope(container, options)
  scopes.push(handle)
  return handle
}
function fixture(html: string) {
  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)
  return container
}
function tab(shiftKey = false, target: EventTarget = document) {
  const event = new KeyboardEvent('keydown', {
    key: 'Tab',
    shiftKey,
    bubbles: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}
beforeEach(() => {
  // jsdom does not lay out elements. Keep visibility decisions in the production helper.
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    let current: Element | null = this.parentElement
    if (this.hasAttribute('hidden') || (this as HTMLElement).style?.display === 'none')
      return [] as unknown as DOMRectList
    while (current) {
      if (current.hasAttribute('hidden') || (current as HTMLElement).style?.display === 'none')
        return [] as unknown as DOMRectList
      current = current.parentElement
    }
    return [{ width: 10, height: 10 }] as unknown as DOMRectList
  })
})
afterEach(() => {
  for (const scope of scopes.splice(0).reverse()) scope.dispose()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('registerFocusScope', () => {
  test('selects explicit, existing, autofocus, and first focus in priority order', () => {
    const container = fixture('<button>A</button><button autofocus>B</button><button>C</button>')
    const [a, b, c] = container.querySelectorAll('button')
    const explicit = register(container, { initialFocus: c })
    expect(document.activeElement).toBe(c)
    explicit.dispose()
    a!.focus()
    const existing = register(container)
    expect(document.activeElement).toBe(a)
    existing.dispose()
    a!.blur()
    const automatic = register(container)
    expect(document.activeElement).toBe(b)
    automatic.dispose()
    b!.removeAttribute('autofocus')
    b!.blur()
    register(container)
    expect(document.activeElement).toBe(a)
  })

  test('defers initial focus but traps subsequent Tab and programmatic focus', () => {
    const outside = fixture('<button>outside</button>').firstElementChild as HTMLElement
    outside.focus()
    const container = fixture('<button>A</button><button>B</button>')
    register(container, { initialFocus: false })
    expect(document.activeElement).toBe(outside)
    tab(true)
    expect(document.activeElement).toBe(container.lastElementChild)
    outside.focus()
    expect(document.activeElement).toBe(container.lastElementChild)
    tab()
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('honors consumed and modified Tab, and leaves Escape alone', () => {
    const container = fixture('<button>A</button><button>B</button>')
    register(container)
    container.addEventListener('keydown', (event) => event.preventDefault(), { once: true })
    tab(false, container)
    expect(document.activeElement).toBe(container.firstElementChild)
    for (const init of [
      { key: 'Tab', altKey: true },
      { key: 'Tab', ctrlKey: true },
      { key: 'Tab', metaKey: true },
      { key: 'Escape' },
    ]) {
      const event = new KeyboardEvent('keydown', { ...init, cancelable: true, bubbles: true })
      document.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
    }
  })

  test('orders portal branches and noncontained children with duplicate cleanup', () => {
    const container = fixture('<button>A</button>')
    const parent = register(container)
    const branch = fixture('<button>B</button>')
    const removeOne = parent.registerBranch(branch)
    const removeTwo = parent.registerBranch(branch)
    const child = fixture('<button>C</button>')
    register(child, { parent, contain: false, initialFocus: false })
    removeOne()
    tab()
    expect(document.activeElement).toBe(branch.firstElementChild)
    tab()
    expect(document.activeElement).toBe(child.firstElementChild)
    removeTwo()
    tab()
    expect(document.activeElement).toBe(container.firstElementChild)
    tab()
    expect(document.activeElement).toBe(child.firstElementChild)
  })

  test('pauses parent traps and restores nested focus synchronously', () => {
    const opener = fixture('<button>open</button>').firstElementChild as HTMLElement
    opener.focus()
    const parentContainer = fixture('<button>parent</button>')
    const parent = register(parentContainer)
    const childContainer = fixture('<button>child</button>')
    const child = register(childContainer, { parent })
    tab()
    expect(document.activeElement).toBe(childContainer.firstElementChild)
    child.dispose()
    expect(document.activeElement).toBe(parentContainer.firstElementChild)
    parent.dispose()
    expect(document.activeElement).toBe(opener)
  })

  test('disposing an inactive parent does not steal focus and preserves opener chain', () => {
    const opener = fixture('<button>open</button>').firstElementChild as HTMLElement
    opener.focus()
    const parentContainer = fixture('<button>parent</button>')
    const parent = register(parentContainer)
    const childContainer = fixture('<button>child</button>')
    const child = register(childContainer, { parent })
    parent.dispose()
    expect(document.activeElement).toBe(childContainer.firstElementChild)
    child.dispose()
    expect(document.activeElement).toBe(opener)
  })

  test('does not restore over deliberate outside focus for noncontained scopes', () => {
    const outside = fixture('<button>outside</button>').firstElementChild as HTMLElement
    const container = fixture('<button>inside</button>')
    const scope = register(container, { contain: false })
    outside.focus()
    scope.dispose()
    expect(document.activeElement).toBe(outside)
  })

  test('updates replace defaults without rerunning initial focus', () => {
    const outside = fixture('<button>outside</button>').firstElementChild as HTMLElement
    const container = fixture('<button>inside</button>')
    const scope = register(container, { contain: false, initialFocus: false, restoreFocus: false })
    outside.focus()
    scope.update({})
    expect(document.activeElement).toBe(container.firstElementChild)
    tab()
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('recovers removed and disabled focus, preserving focused replacements', async () => {
    const container = fixture('<button>A</button><button>B</button><button>C</button>')
    register(container)
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(container.firstElementChild)
    ;(container.firstElementChild as HTMLButtonElement).disabled = true
    await Promise.resolve()
    expect(document.activeElement).toBe(container.lastElementChild)
    const replacement = document.createElement('button')
    container.append(replacement)
    replacement.focus()
    await Promise.resolve()
    expect(document.activeElement).toBe(replacement)
  })

  test('a noncontained scope recovers its container after the only focused child is removed', async () => {
    const container = fixture('<button>inside</button>')
    register(container, { contain: false })
    expect(document.activeElement).toBe(container.firstElementChild)
    container.firstElementChild!.remove()
    expect(document.activeElement).toBe(document.body)
    await Promise.resolve()
    expect(document.activeElement).toBe(container)
    expect(container.getAttribute('tabindex')).toBe('-1')
  })

  test('noncontained mutation recovery handles hiding and disabling the final focused control', async () => {
    for (const mutation of ['hidden', 'disabled']) {
      const container = fixture('<button>inside</button>')
      register(container, { contain: false })
      const button = container.firstElementChild as HTMLButtonElement
      button.setAttribute(mutation, '')
      await Promise.resolve()
      expect(document.activeElement).toBe(container)
    }
  })

  test('noncontained recovery neither traps Tab nor steals deliberate outside focus after mutation', async () => {
    const outside = fixture('<button>outside</button>').firstElementChild as HTMLElement
    const container = fixture('<button>inside</button>')
    register(container, { contain: false })
    expect(tab(false, container.firstElementChild!)).not.toHaveProperty('defaultPrevented', true)
    outside.focus()
    expect(document.activeElement).toBe(outside)
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(outside)
    expect(container.hasAttribute('tabindex')).toBe(false)
  })

  test('noncontained mutations preserve a focused replacement and a newer owning region', async () => {
    const container = fixture('<button>inside</button>')
    register(container, { contain: false })
    container.firstElementChild!.remove()
    const replacement = document.createElement('button')
    container.append(replacement)
    replacement.focus()
    await Promise.resolve()
    expect(document.activeElement).toBe(replacement)
    const newer = fixture('<button>newer</button>')
    register(newer, { contain: false })
    replacement.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(newer.firstElementChild)
  })

  test('an older noncontained owner cannot recover across a newer containing scope', async () => {
    const container = fixture('<button>older</button>')
    register(container, { contain: false })
    const newer = fixture('<button>newer</button>')
    register(newer, { initialFocus: false })
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(document.body)
    expect(container.hasAttribute('tabindex')).toBe(false)
    expect(tab().defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(newer.firstElementChild)
  })

  test('a newer unfocused noncontained scope does not block mutation recovery by the owning region', async () => {
    const container = fixture('<button>owner</button>')
    register(container, { contain: false })
    const newer = fixture('<button>unfocused</button>')
    register(newer, { contain: false, initialFocus: false })
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(container)
    expect(newer.firstElementChild).not.toBe(document.activeElement)
  })

  test('a noncontained child recovers its own region inside a containing parent, then removal resumes the parent', async () => {
    const parentContainer = fixture('<button>parent</button>')
    const parent = register(parentContainer)
    const childContainer = fixture('<button>child</button>')
    register(childContainer, { parent, contain: false })
    childContainer.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(childContainer)
    childContainer.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(parentContainer.firstElementChild)
  })

  test('a removed noncontained region is not given fallback tabindex or refocused', async () => {
    const container = fixture('<button>inside</button>')
    register(container, { contain: false })
    container.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(document.body)
    expect(container.hasAttribute('tabindex')).toBe(false)
  })

  test('owns only its temporary fallback tabindex', () => {
    const container = fixture('')
    const scope = register(container)
    expect(document.activeElement).toBe(container)
    expect(container.getAttribute('tabindex')).toBe('-1')
    scope.dispose()
    expect(container.hasAttribute('tabindex')).toBe(false)
    const second = register(container)
    container.setAttribute('tabindex', '0')
    second.dispose()
    expect(container.getAttribute('tabindex')).toBe('0')
  })

  test('rejects foreign branches and inactive parents without focusing foreign targets', () => {
    const foreign = document.implementation.createHTMLDocument()
    const container = fixture('<button>inside</button>')
    const scope = register(container, { initialFocus: foreign.createElement('button') })
    expect(document.activeElement).toBe(container.firstElementChild)
    expect(() => scope.registerBranch(foreign.body)).toThrow()
    scope.dispose()
    expect(() => register(container, { parent: scope })).toThrow()
  })

  test('uses one stop for unchecked radio groups spanning branches', () => {
    const container = fixture('<input type="radio" name="choice"><button>next</button>')
    const scope = register(container)
    const branch = fixture('<input type="radio" name="choice">')
    scope.registerBranch(branch)
    tab()
    expect(document.activeElement).toBe(container.lastElementChild)
    tab()
    expect(document.activeElement).toBe(container.firstElementChild)
  })
  test('resumes containment when child declines restoration', () => {
    const container = fixture('<button>parent</button>')
    const parent = register(container)
    const childContainer = fixture('<button>child</button>')
    const child = register(childContainer, { parent, restoreFocus: false })
    child.dispose()
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('initialFocus false still tracks focus already in the region', async () => {
    const container = fixture('<button>A</button><button>B</button>')
    ;(container.firstElementChild as HTMLElement).focus()
    register(container, { initialFocus: false })
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('removing the final focused branch registration recovers focus', () => {
    const container = fixture('<button>A</button>')
    const scope = register(container)
    const branch = fixture('<button>B</button>')
    const remove = scope.registerBranch(branch)
    ;(branch.firstElementChild as HTMLElement).focus()
    remove()
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('a focus handler can synchronously register a child during recovery', () => {
    const container = fixture('<button>parent</button>')
    const childContainer = fixture('<button>child</button>')
    const parent = register(container, { initialFocus: false })
    container.firstElementChild!.addEventListener(
      'focus',
      () => {
        register(childContainer, { parent })
      },
      { once: true }
    )
    const outside = fixture('<button>outside</button>').firstElementChild as HTMLElement
    outside.focus()
    expect(document.activeElement).toBe(childContainer.firstElementChild)
  })
  test('a body scope selects a focusable descendant instead of preserving default body focus', () => {
    const container = fixture('<input><button>next</button>')
    expect(document.activeElement).toBe(document.body)
    register(document.body)
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('an unrelated noncontained scope without focus does not suppress restoration', () => {
    const opener = fixture('<button>open</button>').firstElementChild as HTMLElement
    opener.focus()
    const container = fixture('<button>inside</button>')
    const scope = register(container)
    register(fixture('<button>unrelated</button>'), { contain: false, initialFocus: false })
    scope.dispose()
    expect(document.activeElement).toBe(opener)
  })

  test('a newer noncontained child that owns focus suppresses parent restoration', () => {
    const opener = fixture('<button>open</button>').firstElementChild as HTMLElement
    opener.focus()
    const parent = register(fixture('<button>parent</button>'))
    const child = fixture('<button>child</button>')
    register(child, { parent, contain: false })
    parent.dispose()
    expect(document.activeElement).toBe(child.firstElementChild)
  })
  test('skips a connected portal opener belonging to a disposed parent', () => {
    const opener = fixture('<button>open</button>').firstElementChild as HTMLElement
    opener.focus()
    const parent = register(fixture('<button>parent</button>'))
    const branch = fixture('<button>portal opener</button>')
    parent.registerBranch(branch)
    ;(branch.firstElementChild as HTMLElement).focus()
    const child = register(fixture('<button>child</button>'), { parent })
    parent.dispose()
    child.dispose()
    expect(document.activeElement).toBe(opener)
  })

  test('registering a branch after removing focus recovers despite observer refresh', () => {
    const container = fixture('<button>A</button><button>B</button>')
    const scope = register(container)
    container.firstElementChild!.remove()
    scope.registerBranch(fixture('<button>branch</button>'))
    expect(document.activeElement).toBe(container.firstElementChild)
  })

  test('updating after removing focus recovers despite observer refresh', () => {
    const container = fixture('<button>A</button><button>B</button>')
    const scope = register(container)
    container.firstElementChild!.remove()
    scope.update({})
    expect(document.activeElement).toBe(container.firstElementChild)
  })
  test('recovers removed focus when the container is already inside an open shadow root', async () => {
    const host = fixture('')
    const outer = host.attachShadow({ mode: 'open' })
    const innerHost = document.createElement('div')
    outer.append(innerHost)
    const inner = innerHost.attachShadow({ mode: 'open' })
    const container = document.createElement('div')
    container.innerHTML = '<button>A</button><button>B</button>'
    inner.append(container)
    register(container)
    expect(inner.activeElement).toBe(container.firstElementChild)
    container.firstElementChild!.remove()
    await Promise.resolve()
    expect(inner.activeElement).toBe(container.firstElementChild)
  })
})
