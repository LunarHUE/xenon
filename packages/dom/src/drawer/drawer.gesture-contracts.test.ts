import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerDrawerHandle } from './drawer'
import type { DrawerDragThreshold } from './drawer'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
function fixture() {
  const content = document.createElement('div')
  const handle = document.createElement('button')
  content.append(handle)
  document.body.append(content)
  const rect = vi
    .spyOn(content, 'getBoundingClientRect')
    .mockReturnValue({ width: 200, height: 400 } as DOMRect)
  const dismiss = vi.fn()
  const controller = registerDrawerHandle(handle, content, { side: 'bottom', onDismiss: dismiss })
  cleanups.push(controller.dispose)
  function pointer(type: string, y: number, init: PointerEventInit = {}) {
    const event = new PointerEvent(type, {
      pointerId: 7,
      isPrimary: true,
      button: 0,
      clientY: y,
      bubbles: true,
      cancelable: true,
      ...init,
    })
    handle.dispatchEvent(event)
    return event
  }
  return { content, handle, rect, dismiss, controller, pointer }
}

describe('drawer gesture ownership', () => {
  for (const type of ['pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
    it(`ignores foreign ${type} without ending the captured gesture`, () => {
      const h = fixture()
      h.pointer('pointerdown', 0)
      h.pointer('pointermove', 80)
      h.pointer(type, 200, { pointerId: 8 })
      expect(h.content.hasAttribute('data-swiping')).toBe(true)
      expect(h.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('80px')
      expect(h.dismiss).not.toHaveBeenCalled()
      h.pointer('pointerup', 100)
      expect(h.dismiss).toHaveBeenCalledExactlyOnceWith()
    })
  }
  it('captures dimensions once per gesture while reading the latest threshold and callback at release', () => {
    const h = fixture()
    h.pointer('pointerdown', 0)
    h.rect.mockReturnValue({ width: 200, height: 1000 } as DOMRect)
    const replacement = vi.fn()
    h.controller.update({ side: 'bottom', dragThreshold: '25%', onDismiss: replacement })
    h.pointer('pointerup', 100)
    expect(replacement).toHaveBeenCalledExactlyOnceWith()
    expect(h.dismiss).not.toHaveBeenCalled()
    expect(h.rect).toHaveBeenCalledTimes(1)
    h.pointer('pointerdown', 0)
    h.pointer('pointerup', 100)
    expect(replacement).toHaveBeenCalledTimes(1)
  })
  it('disposal in mid-drag removes all later event and click effects', () => {
    const h = fixture()
    h.pointer('pointerdown', 0)
    h.pointer('pointermove', 80)
    h.controller.dispose()
    const click = new MouseEvent('click', { detail: 1, cancelable: true, bubbles: true })
    const clicked = vi.fn()
    h.handle.addEventListener('click', clicked)
    h.pointer('pointermove', 200)
    h.pointer('pointerup', 200)
    h.handle.dispatchEvent(click)
    expect(h.dismiss).not.toHaveBeenCalled()
    expect(h.content.hasAttribute('data-swiping')).toBe(false)
    expect(h.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
    expect(click.defaultPrevented).toBe(false)
    expect(clicked).toHaveBeenCalledTimes(1)
  })
  it('prevents only moved events and suppresses exactly the next pointer click across reset', () => {
    const h = fixture()
    h.pointer('pointerdown', 0)
    expect(h.pointer('pointermove', 5).defaultPrevented).toBe(false)
    expect(h.pointer('pointermove', 6).defaultPrevented).toBe(true)
    h.controller.reset()
    const keyboard = new MouseEvent('click', { detail: 0, cancelable: true })
    h.handle.dispatchEvent(keyboard)
    expect(keyboard.defaultPrevented).toBe(false)
    const first = new MouseEvent('click', { detail: 1, cancelable: true })
    h.handle.dispatchEvent(first)
    expect(first.defaultPrevented).toBe(true)
    const second = new MouseEvent('click', { detail: 1, cancelable: true })
    h.handle.dispatchEvent(second)
    expect(second.defaultPrevented).toBe(false)
  })
})

describe('drawer threshold validation', () => {
  for (const value of [
    '-1px',
    ' 20px',
    '20px ',
    '20',
    '20PX',
    '1e2px',
    'Infinitypx',
    '20.0.1%',
    '',
  ]) {
    it(`invalid threshold ${JSON.stringify(value)} falls back to captured 25 percent`, () => {
      const h = fixture()
      h.controller.update({
        side: 'bottom',
        dragThreshold: value as DrawerDragThreshold,
        onDismiss: h.dismiss,
      })
      h.pointer('pointerdown', 0)
      h.pointer('pointerup', 99)
      expect(h.dismiss).not.toHaveBeenCalled()
      h.pointer('pointerdown', 0)
      h.pointer('pointerup', 100)
      expect(h.dismiss).toHaveBeenCalledTimes(1)
    })
  }
  for (const extent of [0, -10]) {
    it(`nonpositive captured extent ${extent} cannot dismiss even with a zero threshold`, () => {
      const h = fixture()
      h.rect.mockReturnValue({ width: 200, height: extent } as DOMRect)
      h.controller.update({ side: 'bottom', dragThreshold: '0px', onDismiss: h.dismiss })
      h.pointer('pointerdown', 0)
      h.pointer('pointerup', 100)
      expect(h.dismiss).not.toHaveBeenCalled()
      expect(h.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
    })
  }
})

describe('drawer registration cleanup', () => {
  for (const replacement of ['pan-x', 'auto']) {
    it(`preserves a consumer touch-action replacement of ${replacement} on disposal`, () => {
      const h = fixture()
      expect(h.handle.style.getPropertyValue('touch-action')).toBe('none')
      h.handle.style.setProperty('touch-action', replacement, 'important')
      h.controller.dispose()
      expect(h.handle.style.getPropertyValue('touch-action')).toBe(replacement)
      expect(h.handle.style.getPropertyPriority('touch-action')).toBe('important')
    })
  }
  it('restores a preexisting touch-action value and priority when it still owns the style', () => {
    const content = document.createElement('div')
    const handle = document.createElement('button')
    handle.style.setProperty('touch-action', 'pan-y', 'important')
    content.append(handle)
    document.body.append(content)
    const controller = registerDrawerHandle(handle, content, { side: 'bottom', onDismiss: vi.fn() })
    cleanups.push(controller.dispose)
    expect(handle.style.getPropertyValue('touch-action')).toBe('none')
    controller.dispose()
    expect(handle.style.getPropertyValue('touch-action')).toBe('pan-y')
    expect(handle.style.getPropertyPriority('touch-action')).toBe('important')
  })
  it('an invalid fresh press cancels the old pointer gesture before rejecting its own start', () => {
    const h = fixture()
    h.pointer('pointerdown', 0)
    h.pointer('pointermove', 80)
    h.pointer('pointerdown', 10, { pointerId: 8, button: 2 })
    expect(h.content.hasAttribute('data-swiping')).toBe(false)
    expect(h.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
    h.pointer('pointerup', 200)
    h.pointer('pointerup', 200, { pointerId: 8 })
    expect(h.dismiss).not.toHaveBeenCalled()
  })
})
