import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { focusable, getTabIndex, isFocusable, tabbable } from './tabbable'
import type { CheckOptions } from './tabbable'

// Ported from tabbable 6.5.0 test/unit/unit.test.js and test/unit/node.test.js.

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, 'fixtures', `${name}.html`), 'utf8')
const fixtures = {
  basic: fixture('basic'),
  inert: fixture('inert'),
  tabindex: fixture('tabindex'),
}

const getElementIds = function (elements: Element[]) {
  return elements.map((el) => el.id)
}

const expectElementsInOrder = function (receivedIds: string[], expectedIds: string[]) {
  expect(receivedIds).toStrictEqual(expectedIds)
}

describe('unit tests', () => {
  // Upstream runs these with `displayCheck: 'none'`, the only mode jsdom
  // supports. This copy keeps only the default 'full' mode, which differs
  // from 'none' by asking `getClientRects()` whether an attached node is
  // displayed. jsdom always answers with no rects, so report one for every
  // element: 'full' then behaves exactly like 'none'. The visibility and
  // closed-details checks still run in both.
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
      new DOMRect(0, 0, 1, 1),
    ] as unknown as DOMRectList)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.replaceChildren()
  })

  // Upstream passes no `getShadowRoot`. Xenon always passes `true`, which
  // takes the shadow-aware traversal; the fixtures have no shadow roots, so
  // both paths must find the same elements in the same order.
  const modes: [string, CheckOptions][] = [
    ['light DOM path', {}],
    ['getShadowRoot path', { getShadowRoot: true }],
  ]

  describe.each(modes)('tabbable (%s)', (_mode, options) => {
    // NOTE: the attached node check only applies when displayCheck is NOT 'none'
    //  and since that's the only displayCheck we can use in JSDom, we expect to
    //  find the same nodes regardless of whether they're attached or not

    describe('basic example', () => {
      let container: HTMLElement

      beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = fixtures.basic
        document.body.append(container)
      })

      it('correctly identifies tabbable elements', () => {
        const elements = tabbable(container, options)

        expectElementsInOrder(getElementIds(elements), [
          'tabindex-hrefless-anchor',
          'contenteditable-true', // JSDom doesn't appear to support contenteditable
          'contenteditable-nesting', // JSDom doesn't appear to support contenteditable
          'contenteditable-NaN-tabindex',
          'input',
          'input-readonly',
          'select',
          'select-readonly',
          'href-anchor',
          'textarea',
          'textarea-readonly',
          'button',
          'tabindex-div',
          'displaynone-textarea',
          'hiddenParentVisible-button',
          'contentVisibilityHidden-button',
          'contentVisibilityHiddenParent-button',
          'opacityZero-button',
          'opacityZeroParent-button',
          'displaycontents',
          'displaycontents-child',
          'displaycontents-child-displaynone',
          'audio-control',
          'audio-control-NaN-tabindex',
          'video-control',
          'video-control-NaN-tabindex',
        ])
      })
    })

    describe('inert example', () => {
      let container: HTMLElement

      beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = fixtures.inert
        document.body.append(container)
      })

      it('correctly identifies tabbable elements', () => {
        const elements = tabbable(container, options)

        expectElementsInOrder(getElementIds(elements), [])
      })
    })
  })

  describe.each(modes)('focusable (%s)', (_mode, options) => {
    // NOTE: the attached node check only applies when displayCheck is NOT 'none'
    //  and since that's the only displayCheck we can use in JSDom, we expect to
    //  find the same nodes regardless of whether they're attached or not

    describe('basic example', () => {
      let container: HTMLElement

      beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = fixtures.basic
        document.body.append(container)
      })

      it('correctly identifies focusable elements', () => {
        const elements = focusable(container, options)

        expectElementsInOrder(getElementIds(elements), [
          'contenteditable-true',
          'contenteditable-nesting',
          'contenteditable-negative-tabindex',
          'contenteditable-NaN-tabindex',
          'input',
          'input-readonly',
          'select',
          'select-readonly',
          'href-anchor',
          'tabindex-hrefless-anchor',
          'textarea',
          'textarea-readonly',
          'button',
          'tabindex-div',
          'negative-select',
          'displaynone-textarea',
          'hiddenParentVisible-button',
          'contentVisibilityHidden-button',
          'contentVisibilityHiddenParent-button',
          'opacityZero-button',
          'opacityZeroParent-button',
          'displaycontents',
          'displaycontents-child',
          'displaycontents-child-displaynone',
          'audio-control',
          'audio-control-NaN-tabindex',
          'video-control',
          'video-control-NaN-tabindex',
        ])
      })
    })

    describe('inert example', () => {
      let container: HTMLElement

      beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = fixtures.inert
        document.body.append(container)
      })

      it('correctly identifies focusable elements', () => {
        const elements = focusable(container, options)

        expectElementsInOrder(getElementIds(elements), [])
      })
    })
  })

  describe('getTabIndex', () => {
    describe('tabindex example', () => {
      let container: HTMLElement

      beforeEach(() => {
        container = document.createElement('div')
        container.innerHTML = fixtures.tabindex
        document.body.append(container)
      })

      it('correctly identifies tab index of elements', () => {
        const results = Array.from(container.children).map((child) => [
          child.id,
          getTabIndex(child as HTMLElement),
        ])

        expect(results).toEqual([
          ['anchor-tabindex-none', 0],
          ['btn-tabindex-1', 1],
          ['contenteditable-tabindex-none', 0],
          ['contenteditable-tabindex-neg', -1],
          ['audio-control-tabindex-none', 0],
          ['audio-nocontrol-tabindex-none', 0],
          ['audio-control-tabindex-invalid', 0],
          ['audio-control-tabindex-2', 2],
          ['video-control-tabindex-none', 0],
          ['video-nocontrol-tabindex-none', 0],
          ['video-control-tabindex-invalid', 0],
          ['video-control-tabindex-3', 3],
          ['details-tabindex-none', 0],
          ['details-tabindex-neg', -1],
        ])
      })
    })
  })

  it('should throw with no input node', () => {
    // @ts-expect-error upstream calls these without arguments
    expect(() => isFocusable()).toThrow()
    // @ts-expect-error upstream calls these without arguments
    expect(() => getTabIndex()).toThrow()
  })
})
