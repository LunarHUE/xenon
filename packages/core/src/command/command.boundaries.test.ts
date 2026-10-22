import { describe, expect, test, vi } from 'vitest'
import { command, getCommandGroupHeadingId, getCommandItemId, type CommandOptions } from './command'

function key(model: ReturnType<typeof command>, name: string, extra = {}) {
  const event = {
    key: name,
    currentTarget: { value: model.state.query },
    preventDefault: vi.fn(),
    ...extra,
  }
  model.parts.input.on.keydown?.(event as never)
  return event
}

describe('command ranking and controlled transitions', () => {
  test('equal group scores preserve author group order and equal item scores preserve item order', () => {
    const items = Object.freeze([
      { value: 'a', group: 'first' },
      { value: 'b', group: 'second' },
      { value: 'c', group: 'first' },
      { value: 'd' },
      { value: 'e', group: 'second' },
    ])
    const model = command({ id: 'p', items, query: 'q', filter: () => 1 })
    expect(model.state.groups).toEqual(['first', 'second'])
    expect(model.state.items.map((item) => item.value)).toEqual(['d', 'a', 'c', 'b', 'e'])
    expect(items.map((item) => item.value)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  test('filtering out the controlled highlight selects the first enabled match on recomputation', () => {
    const items = [{ value: 'apple' }, { value: 'banana', disabled: true }, { value: 'berry' }]
    const initial = command({ id: 'p', items, activeValue: 'apple' })
    const next = command({ id: 'p', items, activeValue: 'apple', query: 'b' })
    expect(initial.state.activeValue).toBe('apple')
    expect(next.state.activeValue).toBe('berry')
    expect(next.parts.input.attrs['aria-activedescendant']).toBe(next.parts.item('berry').attrs.id)
    expect(next.parts.item('apple').attrs).toMatchObject({
      hidden: true,
      'aria-selected': 'false',
      'data-active': undefined,
    })
  })

  test.each([{ items: [] }, { items: [{ value: 'blocked', disabled: true }] }])(
    'no navigable items means keyboard requests never emit selection or highlight',
    ({ items }) => {
      const onSelect = vi.fn(),
        onActiveChange = vi.fn()
      const model = command({ id: 'p', items, onSelect, onActiveChange })
      expect(model.state.activeValue).toBeUndefined()
      expect(model.parts.input.attrs['aria-activedescendant']).toBeUndefined()
      for (const name of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter']) key(model, name)
      expect(onSelect).not.toHaveBeenCalled()
      expect(onActiveChange).not.toHaveBeenCalled()
      expect(model.state.empty).toBe(items.length === 0)
    }
  )

  test.each([{ query: '' }, { query: 'server', shouldFilter: false }])(
    'bypasses the filter when filtering is inactive: %j',
    (options) => {
      const filter = vi.fn(() => {
        throw new Error('must not run')
      })
      const items = [{ value: 'a' }]
      expect(command({ id: 'p', items, filter, ...options }).state.items).toEqual(items)
      expect(filter).not.toHaveBeenCalled()
    }
  )

  test.each([{ defaultPrevented: true }, { isComposing: true }, { altKey: true }])(
    'ignores keyboard input with %j',
    (extra) => {
      const onSelect = vi.fn(),
        onActiveChange = vi.fn(),
        onPopPage = vi.fn()
      const model = command({
        id: 'p',
        items: [{ value: 'a' }, { value: 'b' }],
        depth: 1,
        onSelect,
        onActiveChange,
        onPopPage,
      })
      for (const name of ['ArrowDown', 'Home', 'Enter', 'Escape', 'Backspace']) {
        expect(key(model, name, extra).preventDefault).not.toHaveBeenCalled()
      }
      expect(onSelect).not.toHaveBeenCalled()
      expect(onActiveChange).not.toHaveBeenCalled()
      expect(onPopPage).not.toHaveBeenCalled()
    }
  )

  test('page backspace uses the live input value and respects command modifiers', () => {
    const onPopPage = vi.fn()
    const model = command({ id: 'p', items: [], query: 'stale', depth: 1, onPopPage })
    key(model, 'Backspace', { currentTarget: { value: '' } })
    expect(onPopPage).toHaveBeenCalledTimes(1)
    for (const modifier of ['ctrlKey', 'metaKey'])
      key(model, 'Backspace', { currentTarget: { value: '' }, [modifier]: true })
    key(model, 'Backspace', { currentTarget: { value: 'new text' } })
    expect(onPopPage).toHaveBeenCalledTimes(1)
  })

  test('hidden and unknown items cannot highlight or select and canceled clicks stay canceled', () => {
    const onSelect = vi.fn(),
      onActiveChange = vi.fn()
    const model = command({
      id: 'p',
      items: [{ value: 'apple' }, { value: 'berry' }],
      query: 'apple',
      onSelect,
      onActiveChange,
    })
    for (const value of ['berry', 'missing']) {
      const part = model.parts.item(value)
      expect(part.attrs.hidden).toBe(true)
      part.on.pointermove?.({} as never)
      part.on.click?.({ defaultPrevented: false } as never)
    }
    model.parts.item('apple').on.click?.({ defaultPrevented: true } as never)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onActiveChange).not.toHaveBeenCalled()
    const preventDefault = vi.fn()
    model.parts.item('apple').on.pointerdown?.({ button: 2, preventDefault } as never)
    expect(preventDefault).not.toHaveBeenCalled()
  })

  test('a highlight request leaves the current snapshot unchanged until recomputed', () => {
    const onActiveChange = vi.fn()
    const options: CommandOptions = {
      id: 'p',
      items: [{ value: 'a' }, { value: 'b' }],
      activeValue: 'a',
      onActiveChange,
    }
    const model = command(options)
    key(model, 'ArrowDown')
    expect(onActiveChange).toHaveBeenCalledWith('b')
    expect(model.state.activeValue).toBe('a')
    expect(command({ ...options, activeValue: 'b' }).parts.item('b').attrs['aria-selected']).toBe(
      'true'
    )
  })
})

describe('command identity', () => {
  test.each([getCommandItemId, getCommandGroupHeadingId])(
    'different values have distinct generated IDs',
    (id) => {
      const values = ['a b', 'a_20b', 'a/b', 'a_2Fb', 'a%b', 'a_25b', '', '日本語']
      expect(new Set(values.map((value) => id('p', value))).size).toBe(values.length)
    }
  )

  test.each([getCommandItemId, getCommandGroupHeadingId])(
    'IDs stay distinct and word-safe for punctuation, underscores and lone surrogates',
    (id) => {
      const values = ['a.b', "a'b", 'a(b)', 'a_b', 'a_005fb', 'a-b', '\uD800', '\uDC00', '�']
      const ids = values.map((value) => id('p', value))
      expect(new Set(ids).size).toBe(values.length)
      for (const generated of ids) expect(generated).toMatch(/^[\w-]+$/)
    }
  )
})
