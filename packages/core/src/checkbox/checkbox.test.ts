import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { TagAttrs } from '../attrs.generated'
import { checkbox } from './checkbox'

type HostKeyboardEvent = KeyboardEvent & { currentTarget: never }

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

function click() {
  const event = { preventDefault: vi.fn() }
  return event as unknown as PointerEvent & { currentTarget: never } & typeof event
}

function change(checked: boolean) {
  const event = { currentTarget: { checked } }
  return event as unknown as Event & { currentTarget: HTMLInputElement }
}

describe('checkbox', () => {
  test('input host: native checkbox with no role and no aria-checked', () => {
    const { state, parts } = checkbox()
    expect(state).toEqual({
      host: 'input',
      checked: false,
      indeterminate: false,
      disabled: false,
      readonly: false,
      required: false,
      invalid: false,
      interactive: true,
    })
    expect(parts.root.attrs).toMatchObject({
      type: 'checkbox',
      checked: false,
      disabled: undefined,
      required: undefined,
      'data-state': 'unchecked',
      'data-checked': undefined,
      'data-indeterminate': undefined,
    })
    expect(parts.root.attrs).not.toHaveProperty('role')
    expect(parts.root.attrs).not.toHaveProperty('aria-checked')
  })

  test('input host: checked and indeterminate drive data-state', () => {
    expect(checkbox({ checked: true }).parts.root.attrs).toMatchObject({
      checked: true,
      'data-state': 'checked',
      'data-checked': '',
    })
    const mixed = checkbox({ checked: true, indeterminate: true })
    expect(mixed.state.indeterminate).toBe(true)
    expect(mixed.parts.root.attrs).toMatchObject({
      'data-state': 'indeterminate',
      'data-indeterminate': '',
    })
    expect(mixed.parts.root.attrs).not.toHaveProperty('aria-checked')
  })

  test('input host: forms and validity attributes', () => {
    const { attrs } = checkbox({
      name: 'agree',
      value: 'yes',
      form: 'signup',
      required: true,
      invalid: true,
      autofocus: true,
    }).parts.root
    expect(attrs).toMatchObject({
      name: 'agree',
      value: 'yes',
      form: 'signup',
      required: true,
      'aria-invalid': 'true',
      'data-required': '',
      'data-invalid': '',
      autofocus: true,
      'data-autofocus': '',
    })
  })

  test('input host: readonly is aria-only and blocks the click', () => {
    const onCheckedChange = vi.fn()
    const { state, parts } = checkbox({ readonly: true, onCheckedChange })
    expect(state.interactive).toBe(false)
    expect(parts.root.attrs).toMatchObject({ 'aria-readonly': 'true', 'data-readonly': '' })
    expect(parts.root.attrs).not.toHaveProperty('readonly')
    const event = click()
    parts.root.on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('input host: disabled sets the native attribute and blocks the click', () => {
    const { attrs, on } = checkbox({ disabled: true }).parts.root
    expect(attrs).toMatchObject({ disabled: true, 'data-disabled': '' })
    const event = click()
    on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('input host: change reports what the browser did', () => {
    const onCheckedChange = vi.fn()
    checkbox({ onCheckedChange }).parts.root.on.change?.(change(true))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    checkbox({ checked: true, onCheckedChange }).parts.root.on.change?.(change(false))
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('input host: a blocked change reports nothing', () => {
    const onCheckedChange = vi.fn()
    checkbox({ readonly: true, onCheckedChange }).parts.root.on.change?.(change(true))
    checkbox({ disabled: true, onCheckedChange }).parts.root.on.change?.(change(true))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('input host: core binds no keyboard handlers', () => {
    const { on } = checkbox().parts.root
    expect(on.keydown).toBeUndefined()
    expect(on.keyup).toBeUndefined()
  })

  test('button host: role, aria-checked and a native disabled attribute', () => {
    expect(checkbox({ host: 'button' }).parts.root.attrs).toMatchObject({
      type: 'button',
      role: 'checkbox',
      'aria-checked': 'false',
      'data-state': 'unchecked',
    })
    expect(checkbox({ host: 'button', checked: true }).parts.root.attrs).toMatchObject({
      'aria-checked': 'true',
    })
    expect(
      checkbox({ host: 'button', checked: true, indeterminate: true }).parts.root.attrs
    ).toMatchObject({ 'aria-checked': 'mixed' })
    expect(
      checkbox({ host: 'button', disabled: true, required: true, readonly: true, invalid: true })
        .parts.root.attrs
    ).toMatchObject({
      disabled: true,
      'aria-required': 'true',
      'aria-readonly': 'true',
      'aria-invalid': 'true',
    })
  })

  test('button host: click proposes the opposite of checked', () => {
    const onCheckedChange = vi.fn()
    checkbox({ host: 'button', onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    checkbox({ host: 'button', checked: true, onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('button host: indeterminate is sticky, activation proposes !checked', () => {
    const onCheckedChange = vi.fn()
    const part = checkbox({ host: 'button', indeterminate: true, onCheckedChange }).parts.root
    part.on.click?.(click())
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  test('button host: readonly and disabled block the click', () => {
    const onCheckedChange = vi.fn()
    for (const options of [{ readonly: true }, { disabled: true }]) {
      const event = click()
      checkbox({ host: 'button', onCheckedChange, ...options }).parts.root.on.click?.(event)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('button host: Space cancels keydown and leaves the click to the browser', () => {
    const { on } = checkbox({ host: 'button' }).parts.root
    const down = key(' ')
    on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.dispatched).toHaveLength(0)
    expect(on.keyup).toBeUndefined()
  })

  test('generic host: role, tab stop and aria state', () => {
    expect(checkbox({ host: 'generic' }).parts.root.attrs).toMatchObject({
      role: 'checkbox',
      'aria-checked': 'false',
      tabindex: 0,
      'aria-disabled': undefined,
    })
    expect(checkbox({ host: 'generic', disabled: true }).parts.root.attrs).toMatchObject({
      'aria-disabled': 'true',
      tabindex: undefined,
    })
    expect(checkbox({ host: 'generic', readonly: true }).parts.root.attrs).toMatchObject({
      'aria-readonly': 'true',
      tabindex: 0,
    })
  })

  test('generic host: click proposes the opposite of checked', () => {
    const onCheckedChange = vi.fn()
    checkbox({ host: 'generic', checked: true, onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  test('generic host: readonly and disabled block the click', () => {
    const onCheckedChange = vi.fn()
    for (const options of [{ readonly: true }, { disabled: true }]) {
      const event = click()
      checkbox({ host: 'generic', onCheckedChange, ...options }).parts.root.on.click?.(event)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('generic host: Space cancels keydown and clicks on keyup', () => {
    const { on } = checkbox({ host: 'generic' }).parts.root
    const down = key(' ')
    on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.dispatched).toHaveLength(0)
    const up = key(' ', { shiftKey: true })
    on.keyup?.(up)
    expect(up.preventDefault).toHaveBeenCalled()
    expect(up.dispatched).toHaveLength(1)
    expect(up.dispatched[0]).toMatchObject({ type: 'click', init: { shiftKey: true } })
  })

  test('generic host: a blocked Space synthesizes nothing', () => {
    const up = key(' ')
    checkbox({ host: 'generic', readonly: true }).parts.root.on.keyup?.(up)
    expect(up.dispatched).toHaveLength(0)
  })

  test('Enter never toggles, on any host', () => {
    expect(checkbox().parts.root.on.keydown).toBeUndefined()

    const button = checkbox({ host: 'button' }).parts.root
    const buttonDown = key('Enter')
    button.on.keydown?.(buttonDown)
    expect(buttonDown.preventDefault).not.toHaveBeenCalled()
    expect(buttonDown.dispatched).toHaveLength(0)

    const generic = checkbox({ host: 'generic' }).parts.root
    const genericDown = key('Enter')
    generic.on.keydown?.(genericDown)
    expect(genericDown.preventDefault).not.toHaveBeenCalled()
    expect(genericDown.dispatched).toHaveLength(0)
    const genericUp = key('Enter')
    generic.on.keyup?.(genericUp)
    expect(genericUp.dispatched).toHaveLength(0)
  })

  test('attrs are typed per host', () => {
    const native = checkbox()
    expectTypeOf(native.parts.root.attrs.type).toEqualTypeOf<TagAttrs['input']['type']>()
    expectTypeOf(native.parts.root.attrs).not.toHaveProperty('href')
    const host = checkbox({ host: 'button' })
    expectTypeOf(host.parts.root.attrs.type).toEqualTypeOf<
      'button' | 'submit' | 'reset' | undefined
    >()
    const generic = checkbox({ host: 'generic' })
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('type')
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('disabled')
  })
})
