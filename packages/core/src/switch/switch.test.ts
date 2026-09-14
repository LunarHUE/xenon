import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import type { TagAttrs } from '../attrs.generated'
import { toggleSwitch } from './switch'

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

describe('switch', () => {
  test('input host: a native checkbox carrying the switch role', () => {
    const { state, parts } = toggleSwitch()
    expect(state).toEqual({
      host: 'input',
      checked: false,
      disabled: false,
      readonly: false,
      required: false,
      invalid: false,
      interactive: true,
    })
    expect(parts.root.attrs).toMatchObject({
      type: 'checkbox',
      role: 'switch',
      checked: false,
      disabled: undefined,
      required: undefined,
      'data-state': 'unchecked',
      'data-checked': undefined,
    })
    expect(parts.root.attrs).not.toHaveProperty('aria-checked')
  })

  test('there is no indeterminate state', () => {
    const { state, parts } = toggleSwitch({ checked: true })
    expect(state).not.toHaveProperty('indeterminate')
    expect(parts.root.attrs).not.toHaveProperty('data-indeterminate')
    expect(parts.root.attrs).toMatchObject({ 'data-state': 'checked', 'data-checked': '' })
    expect(toggleSwitch({ host: 'generic' }).parts.root.attrs).not.toHaveProperty(
      'data-indeterminate'
    )
  })

  test('input host: forms and validity attributes', () => {
    const { attrs } = toggleSwitch({
      name: 'notify',
      value: 'on',
      form: 'settings',
      required: true,
      invalid: true,
      autofocus: true,
    }).parts.root
    expect(attrs).toMatchObject({
      name: 'notify',
      value: 'on',
      form: 'settings',
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
    const { state, parts } = toggleSwitch({ readonly: true, onCheckedChange })
    expect(state.interactive).toBe(false)
    expect(parts.root.attrs).toMatchObject({ 'aria-readonly': 'true', 'data-readonly': '' })
    expect(parts.root.attrs).not.toHaveProperty('readonly')
    const event = click()
    parts.root.on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('input host: disabled sets the native attribute and blocks the click', () => {
    const { attrs, on } = toggleSwitch({ disabled: true }).parts.root
    expect(attrs).toMatchObject({ disabled: true, 'data-disabled': '' })
    const event = click()
    on.click?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('input host: change reports what the browser did', () => {
    const onCheckedChange = vi.fn()
    toggleSwitch({ onCheckedChange }).parts.root.on.change?.(change(true))
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    toggleSwitch({ checked: true, onCheckedChange }).parts.root.on.change?.(change(false))
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('input host: a blocked change reports nothing', () => {
    const onCheckedChange = vi.fn()
    toggleSwitch({ readonly: true, onCheckedChange }).parts.root.on.change?.(change(true))
    toggleSwitch({ disabled: true, onCheckedChange }).parts.root.on.change?.(change(true))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('input host: core binds no keyboard handlers', () => {
    const { on } = toggleSwitch().parts.root
    expect(on.keydown).toBeUndefined()
    expect(on.keyup).toBeUndefined()
  })

  test('button host: switch role, aria-checked and a native disabled attribute', () => {
    expect(toggleSwitch({ host: 'button' }).parts.root.attrs).toMatchObject({
      type: 'button',
      role: 'switch',
      'aria-checked': 'false',
    })
    expect(toggleSwitch({ host: 'button', checked: true }).parts.root.attrs).toMatchObject({
      'aria-checked': 'true',
      'data-state': 'checked',
    })
    expect(
      toggleSwitch({
        host: 'button',
        disabled: true,
        required: true,
        readonly: true,
        invalid: true,
      }).parts.root.attrs
    ).toMatchObject({
      disabled: true,
      'aria-required': 'true',
      'aria-readonly': 'true',
      'aria-invalid': 'true',
    })
  })

  test('button host: click proposes the opposite of checked', () => {
    const onCheckedChange = vi.fn()
    toggleSwitch({ host: 'button', onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    toggleSwitch({ host: 'button', checked: true, onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('button host: readonly and disabled block the click', () => {
    const onCheckedChange = vi.fn()
    for (const options of [{ readonly: true }, { disabled: true }]) {
      const event = click()
      toggleSwitch({ host: 'button', onCheckedChange, ...options }).parts.root.on.click?.(event)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('button host: Space cancels keydown and clicks on keyup', () => {
    const { on } = toggleSwitch({ host: 'button' }).parts.root
    const down = key(' ')
    on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.dispatched).toHaveLength(0)
    const up = key(' ')
    on.keyup?.(up)
    expect(up.preventDefault).toHaveBeenCalled()
    expect(up.dispatched).toHaveLength(1)
  })

  test('generic host: role, tab stop and aria state', () => {
    expect(toggleSwitch({ host: 'generic' }).parts.root.attrs).toMatchObject({
      role: 'switch',
      'aria-checked': 'false',
      tabindex: 0,
      'aria-disabled': undefined,
    })
    expect(toggleSwitch({ host: 'generic', disabled: true }).parts.root.attrs).toMatchObject({
      'aria-disabled': 'true',
      tabindex: undefined,
    })
    expect(toggleSwitch({ host: 'generic', readonly: true }).parts.root.attrs).toMatchObject({
      'aria-readonly': 'true',
      tabindex: 0,
    })
  })

  test('generic host: click proposes the opposite of checked', () => {
    const onCheckedChange = vi.fn()
    toggleSwitch({ host: 'generic', checked: true, onCheckedChange }).parts.root.on.click?.(click())
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  test('generic host: readonly and disabled block the click', () => {
    const onCheckedChange = vi.fn()
    for (const options of [{ readonly: true }, { disabled: true }]) {
      const event = click()
      toggleSwitch({ host: 'generic', onCheckedChange, ...options }).parts.root.on.click?.(event)
      expect(event.preventDefault).toHaveBeenCalled()
    }
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('generic host: Space cancels keydown and clicks on keyup', () => {
    const { on } = toggleSwitch({ host: 'generic' }).parts.root
    const down = key(' ')
    on.keydown?.(down)
    expect(down.preventDefault).toHaveBeenCalled()
    expect(down.dispatched).toHaveLength(0)
    const up = key(' ', { metaKey: true })
    on.keyup?.(up)
    expect(up.preventDefault).toHaveBeenCalled()
    expect(up.dispatched).toHaveLength(1)
    expect(up.dispatched[0]).toMatchObject({ type: 'click', init: { metaKey: true } })
  })

  test('generic host: a blocked Space synthesizes nothing', () => {
    const up = key(' ')
    toggleSwitch({ host: 'generic', disabled: true }).parts.root.on.keyup?.(up)
    expect(up.dispatched).toHaveLength(0)
  })

  test('Enter never toggles, on any host', () => {
    expect(toggleSwitch().parts.root.on.keydown).toBeUndefined()

    const button = toggleSwitch({ host: 'button' }).parts.root
    const buttonDown = key('Enter')
    button.on.keydown?.(buttonDown)
    expect(buttonDown.preventDefault).toHaveBeenCalled()
    expect(buttonDown.dispatched).toHaveLength(0)
    const buttonUp = key('Enter')
    button.on.keyup?.(buttonUp)
    expect(buttonUp.dispatched).toHaveLength(0)

    const generic = toggleSwitch({ host: 'generic' }).parts.root
    const genericDown = key('Enter')
    generic.on.keydown?.(genericDown)
    expect(genericDown.preventDefault).toHaveBeenCalled()
    expect(genericDown.dispatched).toHaveLength(0)
    const genericUp = key('Enter')
    generic.on.keyup?.(genericUp)
    expect(genericUp.dispatched).toHaveLength(0)
  })

  test('attrs are typed per host', () => {
    const native = toggleSwitch()
    expectTypeOf(native.parts.root.attrs.type).toEqualTypeOf<TagAttrs['input']['type']>()
    expectTypeOf(native.parts.root.attrs).not.toHaveProperty('href')
    const host = toggleSwitch({ host: 'button' })
    expectTypeOf(host.parts.root.attrs.type).toEqualTypeOf<
      'button' | 'submit' | 'reset' | undefined
    >()
    const generic = toggleSwitch({ host: 'generic' })
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('type')
    expectTypeOf(generic.parts.root.attrs).not.toHaveProperty('disabled')
  })
})
