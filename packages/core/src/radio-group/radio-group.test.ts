import { describe, expect, test, vi } from 'vitest'

import { radioGroup } from './radio-group'

type HostKeyboardEvent = KeyboardEvent & { currentTarget: never }

class FakeMouseEvent {
  type: string
  constructor(type: string) {
    this.type = type
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

const items = ['a', 'b', 'c']

describe('radioGroup', () => {
  test('the root is a radiogroup and names its orientation once', () => {
    const vertical = radioGroup({ items }).parts.root.attrs
    expect(vertical).toMatchObject({ role: 'radiogroup', 'data-orientation': 'vertical' })
    expect(vertical).not.toHaveProperty('aria-orientation', 'vertical')

    const horizontal = radioGroup({ items, orientation: 'horizontal' }).parts.root.attrs
    expect(horizontal['aria-orientation']).toBe('horizontal')
    expect(horizontal['data-orientation']).toBe('horizontal')
  })

  test('the root reports disabled, readonly, required and invalid', () => {
    const { state, parts } = radioGroup({
      items,
      disabled: true,
      readonly: true,
      required: true,
      invalid: true,
    })
    expect(state.interactive).toBe(false)
    expect(parts.root.attrs).toMatchObject({
      'aria-disabled': 'true',
      'aria-readonly': 'true',
      'aria-required': 'true',
      'aria-invalid': 'true',
      'data-disabled': '',
      'data-readonly': '',
      'data-required': '',
      'data-invalid': '',
    })
  })

  test('input host: a native radio with no role and no aria-checked', () => {
    const { parts } = radioGroup({ items, value: 'b', name: 'pick', required: true })
    const checked = parts.item('b').attrs
    expect(checked).toMatchObject({
      type: 'radio',
      name: 'pick',
      value: 'b',
      checked: true,
      required: true,
      'data-state': 'checked',
      'data-checked': '',
      tabindex: 0,
    })
    expect(checked).not.toHaveProperty('role')
    expect(checked).not.toHaveProperty('aria-checked')

    const other = parts.item('a').attrs
    expect(other).toMatchObject({ checked: false, 'data-state': 'unchecked', tabindex: -1 })
    expect(other['data-checked']).toBeUndefined()
    expect(other['required']).toBe(true)
  })

  test('input host: the browser owns the arrows, so there is no key handler', () => {
    const { parts } = radioGroup({ items, name: 'pick' })
    expect(parts.item('a').on.keydown).toBeUndefined()
    expect(parts.item('a').on.keyup).toBeUndefined()
  })

  test('the tab stop sits on the selected radio, else on the first navigable one', () => {
    const empty = radioGroup({ items })
    expect(empty.state.value).toBeUndefined()
    expect(empty.parts.item('a').attrs.tabindex).toBe(0)

    const skipped = radioGroup({ items, itemDisabled: (value) => value === 'a' })
    expect(skipped.parts.item('a').attrs.tabindex).toBe(-1)
    expect(skipped.parts.item('b').attrs.tabindex).toBe(0)

    const none = radioGroup({ items, disabled: true })
    expect(none.parts.item('a').attrs.tabindex).toBe(-1)
  })

  test('a native change commits, and re-picking the checked radio stays silent', () => {
    const onValueChange = vi.fn()
    const { parts } = radioGroup({ items, value: 'a', onValueChange })
    parts.item('b').on.change?.(new Event('change') as never)
    expect(onValueChange).toHaveBeenCalledWith('b')

    onValueChange.mockClear()
    parts.item('a').on.change?.(new Event('change') as never)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('readonly blocks the click and reports nothing', () => {
    const onValueChange = vi.fn()
    const { parts } = radioGroup({ items, readonly: true, onValueChange })
    const event = click()
    parts.item('b').on.click?.(event as never)
    expect(event.preventDefault).toHaveBeenCalled()
    parts.item('b').on.change?.(new Event('change') as never)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('button host: role, aria-checked and a click that selects', () => {
    const onValueChange = vi.fn()
    const { parts } = radioGroup({ items, value: 'a', onValueChange })
    const item = parts.item('b', { host: 'button' })
    expect(item.attrs).toMatchObject({
      role: 'radio',
      'aria-checked': 'false',
      type: 'button',
      tabindex: -1,
    })
    expect(parts.item('a', { host: 'button' }).attrs['aria-checked']).toBe('true')

    item.on.click?.(click() as never)
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  test('button host: an arrow moves the active item and selection follows it', () => {
    const onValueChange = vi.fn()
    const onActiveChange = vi.fn()
    const { parts } = radioGroup({ items, value: 'a', onValueChange, onActiveChange })
    const event = key('ArrowDown')
    parts.item('a', { host: 'button' }).on.keydown?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onActiveChange).toHaveBeenCalledWith('b')
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  test('button host: arrows skip disabled radios and wrap', () => {
    const onValueChange = vi.fn()
    const skip = { items, itemDisabled: (value: string | number) => value === 'b', onValueChange }

    radioGroup({ ...skip, value: 'a' })
      .parts.item('a', { host: 'button' })
      .on.keydown?.(key('ArrowDown'))
    expect(onValueChange).toHaveBeenCalledWith('c')

    onValueChange.mockClear()
    radioGroup({ ...skip, value: 'c' })
      .parts.item('c', { host: 'button' })
      .on.keydown?.(key('ArrowDown'))
    expect(onValueChange).toHaveBeenCalledWith('a')
  })

  test('button host: arrows move from the focused radio, not the selected one', () => {
    const onValueChange = vi.fn()
    const onActiveChange = vi.fn()
    const { parts } = radioGroup({ items, value: 'a', onValueChange, onActiveChange })
    parts.item('c', { host: 'button' }).on.keydown?.(key('ArrowUp'))
    expect(onActiveChange).toHaveBeenCalledWith('b')
    expect(onValueChange).toHaveBeenCalledWith('b')
  })

  test('button host: Enter selects nothing, Space synthesizes the click', () => {
    const onValueChange = vi.fn()
    const { parts } = radioGroup({ items, value: 'a', onValueChange })
    const item = parts.item('b', { host: 'button' })

    const enter = key('Enter')
    item.on.keydown?.(enter)
    expect(enter.preventDefault).toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()

    const space = key(' ')
    item.on.keydown?.(space)
    expect(space.dispatched).toHaveLength(0)
    item.on.keyup?.(space)
    expect(space.dispatched.map((e) => e.type)).toEqual(['click'])
  })

  test('generic host: aria-disabled and a blocked click', () => {
    const onValueChange = vi.fn()
    const { parts } = radioGroup({
      items,
      itemDisabled: (value) => value === 'b',
      onValueChange,
    })
    const item = parts.item('b', { host: 'generic' })
    expect(item.attrs).toMatchObject({
      role: 'radio',
      'aria-disabled': 'true',
      'data-disabled': '',
      tabindex: -1,
    })
    const event = click()
    item.on.click?.(event as never)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('an item describes itself first, then the group', () => {
    const { parts } = radioGroup({ items, describedBy: 'group-hint' })
    expect(parts.item('a', { describedBy: 'own-hint' }).attrs['aria-describedby']).toBe(
      'own-hint group-hint'
    )
    expect(parts.item('a').attrs['aria-describedby']).toBe('group-hint')
    expect(radioGroup({ items }).parts.item('a').attrs['aria-describedby']).toBeUndefined()
  })
})
