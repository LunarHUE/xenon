import { describe, expect, test, vi } from 'vitest'

import { toggle } from './toggle'

type HostKeyboardEvent = KeyboardEvent & { currentTarget: never }

class FakeMouseEvent {
  type: string
  init: MouseEventInit
  constructor(type: string, init: MouseEventInit) {
    this.type = type
    this.init = init
  }
}

function key(name: string) {
  const dispatched: FakeMouseEvent[] = []
  const currentTarget = {
    dispatchEvent: (event: FakeMouseEvent) => dispatched.push(event),
    ownerDocument: { defaultView: { MouseEvent: FakeMouseEvent } },
  }
  const event = { key: name, repeat: false, preventDefault: vi.fn(), currentTarget }
  return Object.assign(event as unknown as HostKeyboardEvent & typeof event, { dispatched })
}

function click() {
  const event = { preventDefault: vi.fn() }
  return event as unknown as PointerEvent & { currentTarget: never } & typeof event
}

describe('toggle', () => {
  test('off: a native button reporting aria-pressed before any interaction', () => {
    const { state, parts } = toggle()
    expect(state).toEqual({
      host: 'button',
      pressed: false,
      disabled: false,
      pending: false,
      interactive: true,
    })
    expect(parts.root.attrs).toMatchObject({
      type: 'button',
      'aria-pressed': 'false',
      'data-state': 'off',
      'data-pressed': undefined,
    })
    expect(parts.root.attrs).not.toHaveProperty('role')
  })

  test('on: aria-pressed, data-state and the bare data-pressed move together', () => {
    expect(toggle({ pressed: true }).parts.root.attrs).toMatchObject({
      'aria-pressed': 'true',
      'data-state': 'on',
      'data-pressed': '',
    })
  })

  test('click proposes the opposite value', () => {
    const onPressedChange = vi.fn()
    toggle({ onPressedChange }).parts.root.on.click?.(click())
    expect(onPressedChange).toHaveBeenCalledWith(true)
    toggle({ pressed: true, onPressedChange }).parts.root.on.click?.(click())
    expect(onPressedChange).toHaveBeenLastCalledWith(false)
    expect(onPressedChange).toHaveBeenCalledTimes(2)
  })

  test('disabled and pending block the change and still report the state', () => {
    const onPressedChange = vi.fn()
    const disabled = toggle({ pressed: true, disabled: true, onPressedChange })
    expect(disabled.parts.root.attrs).toMatchObject({
      disabled: true,
      'data-disabled': '',
      'aria-pressed': 'true',
    })
    const event = click()
    disabled.parts.root.on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onPressedChange).not.toHaveBeenCalled()

    toggle({ pending: true, onPressedChange }).parts.root.on.click?.(click())
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  test('generic: role, tab stop, and Enter synthesizing the click', () => {
    const { parts } = toggle({ host: 'generic' })
    expect(parts.root.attrs).toMatchObject({ role: 'button', tabindex: 0 })
    const event = key('Enter')
    parts.root.on.keydown?.(event)
    expect(event.dispatched).toHaveLength(1)
    expect(event.dispatched[0]).toMatchObject({ type: 'click' })
  })
})
