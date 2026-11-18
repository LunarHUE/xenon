import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createDialogController } from '../dialog'
import { createFloatingLayer } from '../floating-layer'
import type { FloatingLayerOptions } from '../floating-layer'
import type { LayerHandle } from './layer'

// A press outside an open layer that opens an unrelated layer closes the old one,
// whichever event the new layer opens on. Menus open on pointerdown, popovers on click.

const cleanups: (() => void)[] = []

type Extra = Partial<Omit<FloatingLayerOptions, 'content' | 'open' | 'active' | 'onDismiss'>>

/** A controlled floating layer whose trigger opens it on the given event. */
function floating(
  openOn: 'pointerdown' | 'click',
  extra: Extra | (() => Extra) = {},
  host: HTMLElement = document.body
) {
  const trigger = document.createElement('button')
  const wrapper = document.createElement('div')
  const content = document.createElement('div')
  const item = document.createElement('button')
  content.append(item)
  wrapper.append(content)
  host.append(trigger)
  document.body.append(wrapper)
  const dismissals: string[] = []
  let open = false
  const options = (): FloatingLayerOptions => ({
    ...(typeof extra === 'function' ? extra() : extra),
    content,
    trigger,
    open,
    active: open,
    positioned: true,
    initialFocus: false,
    onDismiss(reason) {
      dismissals.push(reason)
      set(false)
    },
  })
  const controller = createFloatingLayer(wrapper, options())
  cleanups.push(() => controller.dispose())
  const set = (next: boolean) => {
    open = next
    controller.update(options())
  }
  trigger.addEventListener(openOn, () => set(!open))
  return {
    trigger,
    item,
    dismissals,
    set,
    get open() {
      return open
    },
    get layer(): LayerHandle | undefined {
      return controller.layer
    },
  }
}

function pointer(type: string, target: EventTarget) {
  const event = new PointerEvent(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
    pointerId: 1,
    isPrimary: true,
    button: 0,
  })
  target.dispatchEvent(event)
  return event
}

/** A full primary press: pointerdown, pointerup, click, then the deferred dismissal turn. */
function press(target: HTMLElement) {
  pointer('pointerdown', target)
  pointer('pointerup', target)
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  vi.runAllTimers()
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('a press that opens an unrelated layer', () => {
  test('closes an open popover when it opens a menu', () => {
    const popover = floating('click')
    const menu = floating('pointerdown')
    press(popover.trigger)
    expect(popover.open).toBe(true)
    press(menu.trigger)
    expect(menu.open).toBe(true)
    expect(popover.open).toBe(false)
    expect(popover.dismissals).toEqual(['pointer-outside'])
  })

  test('closes an open menu when it opens a popover', () => {
    const menu = floating('pointerdown')
    const popover = floating('click')
    press(menu.trigger)
    press(popover.trigger)
    expect(popover.open).toBe(true)
    expect(menu.open).toBe(false)
  })

  test('leaves one menu open when pressing another menu trigger', () => {
    const first = floating('pointerdown')
    const second = floating('pointerdown')
    press(first.trigger)
    press(second.trigger)
    expect([first.open, second.open]).toEqual([false, true])
    press(first.trigger)
    expect([first.open, second.open]).toEqual([true, false])
  })

  test('closes every layer the press escaped, not only the newest', () => {
    const parent = floating('click')
    parent.set(true)
    const child = floating('click', () => ({ parent: parent.layer }))
    child.set(true)
    const menu = floating('pointerdown')
    press(menu.trigger)
    expect([parent.open, child.open, menu.open]).toEqual([false, false, true])
  })

  test('closes only the newest layer when the press opens nothing', () => {
    const parent = floating('click')
    parent.set(true)
    const child = floating('click', () => ({ parent: parent.layer }))
    child.set(true)
    press(document.body)
    expect([parent.open, child.open]).toEqual([true, false])
  })
})

describe('nesting', () => {
  test('a layer opened from inside another keeps it open', () => {
    const popover = floating('click')
    popover.set(true)
    // The nested menu's trigger lives in the popover's content.
    const nested = floating('pointerdown', () => ({ parent: popover.layer }), popover.item)
    press(nested.trigger)
    expect([popover.open, nested.open]).toEqual([true, true])
  })

  test('a press outside the child that opens a sibling closes only the child', () => {
    const popover = floating('click')
    popover.set(true)
    const first = floating('pointerdown', () => ({ parent: popover.layer }), popover.item)
    const second = floating('pointerdown', () => ({ parent: popover.layer }), popover.item)
    press(first.trigger)
    press(second.trigger)
    expect([popover.open, first.open, second.open]).toEqual([true, false, true])
  })

  test('a press outside a layer that opens its descendant keeps it open', () => {
    const popover = floating('click')
    popover.set(true)
    const outside = document.createElement('button')
    document.body.append(outside)
    const child = floating('click', () => ({ parent: popover.layer }))
    outside.addEventListener('pointerdown', () => child.set(true))
    press(outside)
    expect([popover.open, child.open]).toEqual([true, true])
  })
})

describe('modal dialogs', () => {
  function dialog() {
    const element = document.createElement('dialog')
    const content = document.createElement('div')
    element.append(content)
    document.body.append(element)
    Object.assign(element, {
      showModal: vi.fn(() => element.setAttribute('open', '')),
      close: vi.fn(() => element.removeAttribute('open')),
    })
    const onOpenChange = vi.fn()
    const controller = createDialogController(element, {
      content,
      open: true,
      active: true,
      initialFocus: false,
      onOpenChange,
    })
    cleanups.push(() => controller.dispose())
    return { content, onOpenChange }
  }

  test('a menu opened inside a modal dialog leaves the dialog and layers beneath it open', () => {
    const popover = floating('click')
    popover.set(true)
    const modal = dialog()
    const menu = floating('pointerdown', {}, modal.content)
    press(menu.trigger)
    expect(menu.open).toBe(true)
    expect(modal.onOpenChange).not.toHaveBeenCalled()
    expect(popover.open).toBe(true)
  })

  test('a press outside a modal dialog still dismisses only the dialog', () => {
    const popover = floating('click')
    popover.set(true)
    const modal = dialog()
    press(document.body)
    expect(modal.onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
    expect(popover.open).toBe(true)
  })
})

describe('outside-press policies', () => {
  test('closeOnOutside false keeps the layer open, and shields the layers beneath it', () => {
    const lower = floating('click')
    lower.set(true)
    const pinned = floating('click', { closeOnOutside: false })
    pinned.set(true)
    const menu = floating('pointerdown')
    press(menu.trigger)
    expect([lower.open, pinned.open, menu.open]).toEqual([true, true, true])
  })

  test('a preventDefault veto in onPointerOutside keeps the layer open', () => {
    const onPointerOutside = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
    const popover = floating('click', { onPointerOutside })
    popover.set(true)
    const menu = floating('pointerdown')
    press(menu.trigger)
    expect(onPointerOutside).toHaveBeenCalledOnce()
    expect([popover.open, menu.open]).toEqual([true, true])
  })

  test('the veto applies per layer and stops at the layer that vetoed', () => {
    const lower = floating('click')
    lower.set(true)
    const upper = floating('click', {
      onPointerOutside: (event) => event.preventDefault(),
    })
    upper.set(true)
    const menu = floating('pointerdown')
    press(menu.trigger)
    expect([lower.open, upper.open, menu.open]).toEqual([true, true, true])
  })

  test('a canceled pointerdown on the trigger keeps the old layer open', () => {
    const popover = floating('click')
    popover.set(true)
    const menu = floating('pointerdown')
    menu.trigger.addEventListener('pointerdown', (event) => event.preventDefault())
    press(menu.trigger)
    expect([popover.open, menu.open]).toEqual([true, true])
  })

  test('Escape still closes only the newest layer', () => {
    const popover = floating('click')
    popover.set(true)
    const menu = floating('pointerdown')
    menu.set(true)
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
    expect([popover.open, menu.open]).toEqual([true, false])
  })
})
