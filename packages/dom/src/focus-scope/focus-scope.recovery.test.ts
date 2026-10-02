import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { registerFocusScope } from './focus-scope'
import type { FocusScopeHandle } from './focus-scope'

const scopes: FocusScopeHandle[] = []

function fixture(label: string) {
  const container = document.createElement('div')
  const button = document.createElement('button')
  button.textContent = label
  container.append(button)
  document.body.append(container)
  return { container, button }
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    if (this.hasAttribute('hidden') || (this as HTMLElement).style?.display === 'none') {
      return [] as unknown as DOMRectList
    }
    let current: Element | null = this.parentElement
    while (current) {
      if (current.hasAttribute('hidden') || (current as HTMLElement).style?.display === 'none') {
        return [] as unknown as DOMRectList
      }
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

test.each(['hidden', 'display-none', 'inert'])(
  'making an entire noncontained child region %s returns lost focus to its containing parent',
  async (mutation) => {
    const parentRegion = fixture('Parent')
    const parent = registerFocusScope(parentRegion.container)
    scopes.push(parent)
    const childRegion = fixture('Child')
    scopes.push(registerFocusScope(childRegion.container, { parent, contain: false }))
    expect(document.activeElement).toBe(childRegion.button)
    if (mutation === 'display-none') childRegion.container.style.display = 'none'
    else childRegion.container.setAttribute(mutation, '')
    await Promise.resolve()
    expect(document.activeElement).toBe(parentRegion.button)
  }
)

test('mutation recovery respects a newly registered owning scope from a focus callback', async () => {
  const parentRegion = fixture('Parent')
  const parent = registerFocusScope(parentRegion.container)
  scopes.push(parent)
  const childRegion = fixture('Child')
  const child = registerFocusScope(childRegion.container, { parent, contain: false })
  scopes.push(child)
  const newerRegion = fixture('New owner')
  const parentFocus = vi.fn()
  parentRegion.button.addEventListener('focus', parentFocus)
  childRegion.container.addEventListener(
    'focus',
    () => scopes.push(registerFocusScope(newerRegion.container, { parent: child, contain: false })),
    { once: true }
  )
  childRegion.button.remove()
  await Promise.resolve()
  expect(document.activeElement).toBe(newerRegion.button)
  expect(parentFocus).not.toHaveBeenCalled()
})
