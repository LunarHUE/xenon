import { describe, expect, test, vi } from 'vitest'
import { menu } from './menu'

function key(key: string) {
  return { key, preventDefault: vi.fn(), defaultPrevented: false } as unknown as KeyboardEvent & {
    currentTarget: HTMLDivElement & HTMLButtonElement
  }
}
describe('menu', () => {
  test('opens at the last edge with ArrowUp and only exposes controls while open', () => {
    const change = vi.fn()
    const closed = menu({ items: [], ids: { content: 'menu' }, onOpenChange: change })
    expect(closed.parts.trigger.attrs['aria-controls']).toBeUndefined()
    closed.parts.trigger.on.keydown?.(key('ArrowUp'))
    expect(change).toHaveBeenCalledWith(true, 'last')
    expect(
      menu({ items: [], open: true, ids: { content: 'menu' } }).parts.trigger.attrs['aria-controls']
    ).toBe('menu')
  })
  test('roves through disabled items and wraps by default', () => {
    const change = vi.fn()
    const options = {
      items: ['a', 'b'],
      active: 'a',
      disabled: (item: string) => item === 'b',
      onActiveChange: change,
    }
    const result = menu(options)
    result.parts.item('a').on.keydown?.(key('ArrowDown'))
    expect(change).toHaveBeenLastCalledWith('b')
    expect(result.parts.item('b').attrs['aria-disabled']).toBe('true')
    menu({ ...options, active: 'b' })
      .parts.item('b')
      .on.keydown?.(key('ArrowDown'))
    expect(change).toHaveBeenLastCalledWith('a')
  })
  test('buffers typeahead, keeps a prefix match, cycles repeated letters, skips disabled', () => {
    const active = vi.fn()
    const search = vi.fn()
    const options = {
      items: ['apple', 'apricot', 'avocado', 'banana'],
      active: 'apple',
      textValue: (value: string) => value,
      disabled: (value: string) => value === 'apricot',
      onActiveChange: active,
      onSearchChange: search,
    }
    menu(options).parts.item('apple').on.keydown?.(key('a'))
    expect(active).toHaveBeenLastCalledWith('avocado')
    menu({ ...options, search: 'a' })
      .parts.item('apple')
      .on.keydown?.(key('p'))
    expect(active).toHaveBeenLastCalledWith('apple')
    expect(search).toHaveBeenLastCalledWith('ap')
    menu({ ...options, search: 'a' })
      .parts.item('apple')
      .on.keydown?.(key('a'))
    expect(active).toHaveBeenLastCalledWith('avocado')
  })
})
