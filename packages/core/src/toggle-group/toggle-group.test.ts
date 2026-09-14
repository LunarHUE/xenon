import { describe, expect, test, vi } from 'vitest'

import { toggleGroup } from './toggle-group'

const items = ['bold', 'italic', 'underline']

function click() {
  const event = { preventDefault: vi.fn() }
  return event as unknown as PointerEvent & { currentTarget: never } & typeof event
}

function key(name: string) {
  const event = { key: name, preventDefault: vi.fn() }
  return event as unknown as KeyboardEvent & { currentTarget: never } & typeof event
}

describe('toggleGroup', () => {
  test('the root is a group with no aria-orientation', () => {
    const { state, parts } = toggleGroup({ items })
    expect(state).toMatchObject({ mode: 'single', values: [], active: 'bold', disabled: false })
    expect(parts.root.attrs).toMatchObject({ role: 'group', 'data-orientation': 'horizontal' })
    expect(parts.root.attrs).not.toHaveProperty('aria-orientation')
  })

  test('items report aria-pressed in both modes and the first holds the tab stop', () => {
    const single = toggleGroup({ items, value: 'italic' })
    expect(single.parts.item('italic').attrs).toMatchObject({
      'aria-pressed': 'true',
      'data-state': 'on',
      'data-pressed': '',
      tabindex: -1,
    })
    expect(single.parts.item('bold').attrs).toMatchObject({
      'aria-pressed': 'false',
      'data-state': 'off',
      tabindex: 0,
    })
    const multiple = toggleGroup({ items, mode: 'multiple', value: ['bold', 'underline'] })
    expect(multiple.parts.item('underline').attrs).toMatchObject({ 'aria-pressed': 'true' })
    expect(multiple.parts.item('italic').attrs).toMatchObject({ 'aria-pressed': 'false' })
  })

  test('single mode replaces on click and clears when the pressed item is clicked again', () => {
    const onValueChange = vi.fn()
    const group = toggleGroup({ items, value: 'bold', onValueChange })
    group.parts.item('italic').on.click?.(click())
    expect(onValueChange).toHaveBeenLastCalledWith('italic')
    group.parts.item('bold').on.click?.(click())
    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
  })

  test('multiple mode accumulates and removes one value at a time', () => {
    const onValueChange = vi.fn()
    const group = toggleGroup({ items, mode: 'multiple', value: ['bold'], onValueChange })
    group.parts.item('italic').on.click?.(click())
    expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'italic'])
    group.parts.item('bold').on.click?.(click())
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  test('arrows move the active item without changing the value', () => {
    const onActiveChange = vi.fn()
    const onValueChange = vi.fn()
    const group = toggleGroup({ items, onActiveChange, onValueChange })
    const event = key('ArrowRight')
    group.parts.item('bold').on.keydown?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onActiveChange).toHaveBeenCalledWith('italic')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a disabled group disables every item, a disabled item only itself', () => {
    const onValueChange = vi.fn()
    const all = toggleGroup({ items, disabled: true, onValueChange })
    expect(all.parts.root.attrs).toMatchObject({ 'data-disabled': '' })
    expect(all.parts.item('bold').attrs).toMatchObject({
      'aria-disabled': 'true',
      'data-disabled': '',
      tabindex: 0,
    })
    all.parts.item('bold').on.click?.(click())
    expect(onValueChange).not.toHaveBeenCalled()

    const one = toggleGroup({ items, itemDisabled: (item) => item === 'italic', onValueChange })
    expect(one.parts.item('italic').attrs).toMatchObject({ 'aria-disabled': 'true' })
    expect(one.parts.item('bold').attrs).toMatchObject({
      'aria-disabled': undefined,
      'data-disabled': undefined,
    })
    one.parts.item('italic').on.click?.(click())
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
