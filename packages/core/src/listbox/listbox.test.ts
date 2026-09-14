import { describe, expect, test, vi } from 'vitest'
import { getListboxItemId, listbox } from './listbox'
function key(key: string, init: KeyboardEventInit = {}) {
  const event = {
    key,
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true
    },
    ...init,
  }
  return event as KeyboardEvent & { currentTarget: HTMLDivElement }
}
describe('listbox', () => {
  test('separates active and selected state and skips disabled options', () => {
    const active = vi.fn(),
      change = vi.fn()
    const box = listbox({
      items: ['a', 'b', 'c'],
      value: 'a',
      isItemDisabled: (v) => v === 'b',
      onActiveChange: active,
      onValueChange: change,
    })
    box.parts.item('a').on.keydown?.(key('ArrowDown'))
    expect(active).toHaveBeenCalledWith('c')
    expect(change).not.toHaveBeenCalled()
    expect(box.parts.item('b').attrs.tabindex).toBe(-1)
    box.parts.item('c').on.keydown?.(key('Enter'))
    expect(change).toHaveBeenCalledWith('c')
  })
  test('multiple toggle, range, and select all exclude disabled options', () => {
    const change = vi.fn()
    const box = listbox({
      items: ['a', 'b', 'c'],
      value: ['a'],
      selectionMode: 'multiple',
      activeValue: 'a',
      isItemDisabled: (v) => v === 'b',
      onValueChange: change,
    })
    box.parts.item('a').on.keydown?.(key(' '))
    expect(change).toHaveBeenLastCalledWith([])
    box.parts.root.on.keydown?.(key('ArrowDown', { shiftKey: true }))
    expect(change).toHaveBeenLastCalledWith(['a', 'c'])
    box.parts.root.on.keydown?.(key('a', { ctrlKey: true }))
    expect(change).toHaveBeenLastCalledWith(['a', 'c'])
  })
  test('virtual focus has stable distinct IDs even for lone surrogates and empty values', () => {
    const values = ['', 'empty', 'a b', 'a-b', '\ud800']
    expect(new Set(values.map((v) => getListboxItemId('box', v))).size).toBe(values.length)
    const box = listbox({ id: 'box', items: values, virtualFocus: true, activeValue: 'a b' })
    expect(box.parts.root.attrs['aria-activedescendant']).toBe(box.parts.item('a b').attrs.id)
    expect(box.parts.root.attrs.tabindex).toBe(0)
    expect(box.parts.item('a b').attrs.tabindex).toBe(-1)
  })
  test('readonly navigates without selecting; cancelled and composing keys are ignored', () => {
    const change = vi.fn(),
      active = vi.fn()
    const box = listbox({
      items: ['a', 'b'],
      readonly: true,
      onValueChange: change,
      onActiveChange: active,
    })
    box.parts.root.on.keydown?.(key('Enter'))
    expect(change).not.toHaveBeenCalled()
    box.parts.root.on.keydown?.(key('ArrowDown'))
    expect(active).toHaveBeenCalledOnce()
    box.parts.root.on.keydown?.(key('ArrowDown', { isComposing: true }))
    const cancelled = key('ArrowDown')
    cancelled.preventDefault()
    box.parts.root.on.keydown?.(cancelled)
    expect(active).toHaveBeenCalledOnce()
  })
  test('typeahead cycles repeated letters, skips disabled matches, and respects RTL/clamping', () => {
    const active = vi.fn()
    const box = listbox({
      items: ['apple', 'apricot', 'banana'],
      activeValue: 'apple',
      isItemDisabled: (v) => v === 'apricot',
      search: 'a',
      onActiveChange: active,
    })
    box.parts.root.on.keydown?.(key('a'))
    expect(active).toHaveBeenLastCalledWith('apple')
    const rtl = listbox({
      items: ['a', 'b'],
      activeValue: 'b',
      orientation: 'horizontal',
      dir: 'rtl',
      loop: false,
      onActiveChange: active,
    })
    active.mockClear()
    rtl.parts.root.on.keydown?.(key('ArrowLeft'))
    expect(active).not.toHaveBeenCalled()
    rtl.parts.root.on.keydown?.(key('ArrowRight'))
    expect(active).toHaveBeenCalledWith('a')
  })
})

describe('listbox edge cases', () => {
  test('empty and all-disabled collections never propose focus or selection', () => {
    const active = vi.fn(),
      change = vi.fn()
    for (const items of [[], ['a']]) {
      const box = listbox({
        items,
        isItemDisabled: () => true,
        onActiveChange: active,
        onValueChange: change,
      })
      expect(box.state.activeValue).toBeUndefined()
      box.parts.root.on.keydown?.(key('ArrowDown'))
      box.parts.root.on.keydown?.(key('Enter'))
    }
    expect(active).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
  })
  test('single selection retains an already selected value without duplicate callbacks', () => {
    const change = vi.fn()
    const box = listbox({ items: ['a'], value: 'a', onValueChange: change })
    box.parts.root.on.keydown?.(key('Enter'))
    box.parts.root.on.keydown?.(key(' '))
    expect(change).not.toHaveBeenCalled()
  })
  test('Shift range clamps while plain arrows wrap', () => {
    const active = vi.fn(),
      change = vi.fn()
    const box = listbox({
      items: ['a', 'b'],
      selectionMode: 'multiple',
      activeValue: 'a',
      onActiveChange: active,
      onValueChange: change,
    })
    box.parts.root.on.keydown?.(key('ArrowUp', { shiftKey: true }))
    expect(active).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    box.parts.root.on.keydown?.(key('ArrowUp'))
    expect(active).toHaveBeenCalledWith('b')
  })
  test('an unavailable range anchor falls back to the currently active option', () => {
    const change = vi.fn()
    const box = listbox({
      items: ['a', 'b'],
      selectionMode: 'multiple',
      anchorValue: 'removed',
      activeValue: 'a',
      onValueChange: change,
    })
    box.parts.root.on.keydown?.(key('ArrowDown', { shiftKey: true }))
    expect(change).toHaveBeenCalledWith(['a', 'b'])
  })
  test('multi-character search uses text labels, includes spaces, and preserves unmatched buffers', () => {
    const active = vi.fn(),
      search = vi.fn()
    const options = {
      items: ['a', 'b', 'c'],
      activeValue: 'a',
      textValue: (value: string) => ({ a: 'Foo', b: 'Foo Bar', c: 'Foo Baz' })[value]!,
      onActiveChange: active,
      onSearchChange: search,
    }
    listbox({ ...options, search: 'foo' }).parts.root.on.keydown?.(key(' '))
    expect(active).toHaveBeenLastCalledWith('b')
    expect(search).toHaveBeenLastCalledWith('foo ')
    listbox({ ...options, search: 'foo ba' }).parts.root.on.keydown?.(key('z'))
    expect(active).toHaveBeenLastCalledWith('c')
    active.mockClear()
    listbox({ ...options, search: 'foo' }).parts.root.on.keydown?.(key('x'))
    expect(active).not.toHaveBeenCalled()
    expect(search).toHaveBeenLastCalledWith('foox')
  })
  test('Home and End ignore disabled endpoints and wrong-axis keys remain uncanceled', () => {
    const active = vi.fn()
    const box = listbox({
      items: ['a', 'b', 'c', 'd'],
      isItemDisabled: (v) => v === 'a' || v === 'd',
      onActiveChange: active,
    })
    box.parts.root.on.keydown?.(key('End'))
    expect(active).toHaveBeenLastCalledWith('c')
    box.parts.root.on.keydown?.(key('Home'))
    expect(active).toHaveBeenLastCalledWith('b')
    const wrong = key('ArrowRight')
    box.parts.root.on.keydown?.(wrong)
    expect(wrong.defaultPrevented).toBe(false)
  })
})
