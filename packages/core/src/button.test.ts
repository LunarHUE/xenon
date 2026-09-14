import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { button } from './button'

type HostKeyboardEvent = KeyboardEvent & { currentTarget: HTMLDivElement }

class FakeMouseEvent {
  type: string
  init: MouseEventInit
  constructor(type: string, init: MouseEventInit) {
    this.type = type
    this.init = init
  }
}

function key(name: string, init: Partial<KeyboardEvent> = {}) {
  const dispatched: FakeMouseEvent[] = []
  const currentTarget = {
    dispatchEvent: vi.fn((e: FakeMouseEvent) => dispatched.push(e)),
    ownerDocument: { defaultView: { MouseEvent: FakeMouseEvent } },
  }
  const event = { key: name, repeat: false, preventDefault: vi.fn(), currentTarget, ...init }
  return Object.assign(event as unknown as HostKeyboardEvent & typeof event, { dispatched })
}

describe('button', () => {
  test('native: defaults type to button and sets nothing else', () => {
    const { state, parts } = button()
    expect(state).toEqual({ host: 'button', disabled: false, pending: false, interactive: true })
    expect(parts.root.attrs).toMatchObject({ type: 'button', disabled: undefined })
  })

  test('native: disabled sets the attribute and a data hook', () => {
    expect(button({ disabled: true }).parts.root.attrs).toMatchObject({
      disabled: true,
      'data-disabled': '',
    })
  })

  test('native: focusable when disabled swaps the attribute for aria-disabled', () => {
    const { attrs } = button({ disabled: true, focusableWhenDisabled: true }).parts.root
    expect(attrs).toMatchObject({ disabled: undefined, 'aria-disabled': 'true', tabindex: 0 })
  })

  test('pending is not interactive and blocks the click default', () => {
    const { state, parts } = button({ pending: true })
    expect(state.interactive).toBe(false)
    expect(parts.root.attrs).toMatchObject({ 'aria-disabled': 'true', 'data-pending': '' })
    const event = { preventDefault: vi.fn() } as unknown as PointerEvent & {
      currentTarget: HTMLButtonElement
    }
    parts.root.on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('link: no role and no tab stop', () => {
    const { attrs, on } = button({ host: 'link' }).parts.root
    expect(attrs).not.toHaveProperty('role')
    expect(attrs).not.toHaveProperty('tabindex')
    expect(on.keydown).toBeUndefined()
  })

  test('generic: role, tab stop, no aria-disabled', () => {
    expect(button({ host: 'generic' }).parts.root.attrs).toMatchObject({
      role: 'button',
      tabindex: 0,
      'aria-disabled': undefined,
    })
  })

  test('generic disabled: aria-disabled and removed from tab order', () => {
    const { attrs } = button({ host: 'generic', disabled: true }).parts.root
    expect(attrs).toMatchObject({ 'aria-disabled': 'true', tabindex: undefined })
  })

  test('generic: Enter clicks on keydown with modifier state', () => {
    const event = key('Enter', { shiftKey: true })
    button({ host: 'generic' }).parts.root.on.keydown?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.dispatched).toHaveLength(1)
    expect(event.dispatched[0]).toMatchObject({ type: 'click', init: { shiftKey: true } })
  })

  test('generic: Space cancels keydown and clicks on keyup', () => {
    const part = button({ host: 'generic' }).parts.root
    const down = key(' ')
    part.on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.dispatched).toHaveLength(0)
    const up = key(' ')
    part.on.keyup?.(up)
    expect(up.dispatched).toHaveLength(1)
  })

  test('generic: key repeat and non-interactive states do not activate', () => {
    const repeat = key('Enter', { repeat: true })
    button({ host: 'generic' }).parts.root.on.keydown?.(repeat)
    expect(repeat.dispatched).toHaveLength(0)
    const pending = key('Enter')
    button({ host: 'generic', pending: true }).parts.root.on.keydown?.(pending)
    expect(pending.dispatched).toHaveLength(0)
  })

  test('generic: other keys are ignored', () => {
    const event = key('a')
    button({ host: 'generic' }).parts.root.on.keydown?.(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('attrs are typed per host', () => {
    const native = button()
    expectTypeOf(native.parts.root.attrs.type).toEqualTypeOf<
      'button' | 'submit' | 'reset' | undefined
    >()
    expectTypeOf(native.parts.root.attrs).not.toHaveProperty('href')
    const generic = button({ host: 'generic' })
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('type')
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('disabled')
  })
})
