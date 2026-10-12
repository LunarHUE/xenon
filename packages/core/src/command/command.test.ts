import { describe, expect, test, vi } from 'vitest'
import { command, defaultCommandFilter, getCommandItemId } from './command'
import type { CommandItem, CommandOptions } from './command'
import { commandScore } from './score'

const items: CommandItem[] = [
  { value: 'New file', group: 'file' },
  { value: 'Open recent', group: 'file', keywords: ['history'] },
  { value: 'Save', group: 'file', disabled: true },
  { value: 'Toggle sidebar', group: 'view' },
  { value: 'Zoom in', group: 'view' },
  { value: 'Settings' },
]

function press(
  engine: ReturnType<typeof command>,
  key: string,
  extra: Partial<KeyboardEvent> = {}
) {
  const event = {
    key,
    defaultPrevented: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: { value: engine.state.query },
    ...extra,
  } as unknown as KeyboardEvent & { currentTarget: HTMLInputElement }
  engine.parts.input.on.keydown?.(event)
  return event
}
const make = (options: Partial<CommandOptions> = {}) => command({ items, id: 'p', ...options })
const values = (engine: ReturnType<typeof command>) => engine.state.items.map((item) => item.value)

describe('commandScore', () => {
  test('requires every query character in order', () => {
    expect(commandScore('Settings', '')).toBe(1)
    expect(commandScore('Settings', 'settings')).toBeGreaterThan(0.99)
    expect(commandScore('Settings', 'stg')).toBeGreaterThan(0)
    expect(commandScore('Settings', 'gts')).toBe(0)
    expect(commandScore('Settings', 'x')).toBe(0)
  })
  test('ranks prefixes over word starts over mid-word jumps', () => {
    const prefix = commandScore('Toggle sidebar', 'tog')
    const word = commandScore('Open toggle', 'tog')
    const jump = commandScore('Gotogether', 'tog')
    expect(prefix).toBeGreaterThan(word)
    expect(word).toBeGreaterThan(jump)
    expect(jump).toBeGreaterThan(0)
  })
  test('prefers earlier, shorter and case-matching text', () => {
    expect(commandScore('zoom', 'zo')).toBeGreaterThan(commandScore('zoom in and out', 'zo'))
    expect(commandScore('Zoom', 'Zo')).toBeGreaterThan(commandScore('Zoom', 'zO'))
  })
  test('scores keywords with the value', () => {
    expect(defaultCommandFilter(items[1]!, 'history')).toBeGreaterThan(0)
    expect(defaultCommandFilter(items[0]!, 'history')).toBe(0)
  })
})

describe('command', () => {
  test('keeps author order and every item without a query', () => {
    const engine = make()
    expect(values(engine)).toEqual(items.map((item) => item.value))
    expect(engine.state.groups).toEqual(['file', 'view'])
    expect(engine.state.activeValue).toBe('New file')
    expect(engine.state.empty).toBe(false)
  })
  test('hides zero scores and sorts groups by their best item', () => {
    const engine = make({ query: 'zo' })
    expect(values(engine)).toEqual(['Zoom in'])
    expect(engine.state.groups).toEqual(['view'])
    expect(engine.parts.group('file').attrs.hidden).toBe(true)
    expect(engine.parts.group('view').attrs.hidden).toBeUndefined()
    expect(engine.parts.item('New file').attrs.hidden).toBe(true)
    const ranked = make({ query: 'o' })
    expect(ranked.state.groups[0]).toBe('file')
    expect(values(make({ query: 'o', sort: false }))).toEqual(
      items.filter((item) => item.value.toLowerCase().includes('o')).map((item) => item.value)
    )
  })
  test('custom filters and server-side mode', () => {
    const exact = make({ query: 'Save', filter: (item, query) => (item.value === query ? 1 : 0) })
    expect(values(exact)).toEqual(['Save'])
    const server = make({ query: 'nothing matches this', shouldFilter: false })
    expect(values(server)).toHaveLength(items.length)
    const empty = make({ query: 'qqq' })
    expect(empty.state.empty).toBe(true)
    expect(empty.parts.empty.attrs.hidden).toBeUndefined()
    expect(empty.parts.list.attrs['data-empty']).toBe('')
    expect(empty.parts.input.attrs['aria-activedescendant']).toBeUndefined()
  })
  test('arrows skip disabled items and wrap unless loop is off', () => {
    const active = vi.fn()
    const at = (value: string, loop?: boolean) =>
      make({ activeValue: value, onActiveChange: active, loop })
    press(at('Open recent'), 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('Toggle sidebar')
    press(at('Settings'), 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('New file')
    active.mockClear()
    press(at('Settings', false), 'ArrowDown')
    expect(active).not.toHaveBeenCalled()
    press(at('New file'), 'ArrowUp')
    expect(active).toHaveBeenLastCalledWith('Settings')
    press(at('Zoom in'), 'Home')
    expect(active).toHaveBeenLastCalledWith('New file')
    press(at('New file'), 'End')
    expect(active).toHaveBeenLastCalledWith('Settings')
  })
  test('Ctrl or Meta with an arrow jumps between groups', () => {
    const active = vi.fn()
    press(make({ activeValue: 'Open recent', onActiveChange: active }), 'ArrowDown', {
      metaKey: true,
    })
    expect(active).toHaveBeenLastCalledWith('Toggle sidebar')
    press(make({ activeValue: 'Zoom in', onActiveChange: active }), 'ArrowDown', { ctrlKey: true })
    expect(active).toHaveBeenLastCalledWith('Settings')
    press(make({ activeValue: 'Zoom in', onActiveChange: active }), 'ArrowUp', { ctrlKey: true })
    expect(active).toHaveBeenLastCalledWith('New file')
    active.mockClear()
    press(make({ activeValue: 'Open recent', onActiveChange: active }), 'ArrowUp', {
      metaKey: true,
    })
    expect(active).not.toHaveBeenCalled()
  })
  test('Enter and click run enabled items only', () => {
    const select = vi.fn()
    expect(
      press(make({ activeValue: 'Zoom in', onSelect: select }), 'Enter').preventDefault
    ).toHaveBeenCalled()
    expect(select).toHaveBeenLastCalledWith('Zoom in')
    const click = (value: string) =>
      make({ onSelect: select })
        .parts.item(value)
        .on.click?.({ defaultPrevented: false } as never)
    select.mockClear()
    click('Save')
    expect(select).not.toHaveBeenCalled()
    click('Settings')
    expect(select).toHaveBeenLastCalledWith('Settings')
    select.mockClear()
    press(make({ activeValue: 'Zoom in', onSelect: select }), 'Enter', { isComposing: true })
    expect(select).not.toHaveBeenCalled()
  })
  test('Backspace on an empty query and Escape pop pages', () => {
    const pop = vi.fn()
    expect(press(make({ onPopPage: pop }), 'Escape').preventDefault).not.toHaveBeenCalled()
    expect(pop).not.toHaveBeenCalled()
    expect(press(make({ depth: 1, onPopPage: pop }), 'Escape').preventDefault).toHaveBeenCalled()
    press(make({ depth: 1, onPopPage: pop }), 'Backspace')
    expect(pop).toHaveBeenCalledTimes(2)
    press(make({ depth: 1, query: 'a', onPopPage: pop }), 'Backspace')
    expect(pop).toHaveBeenCalledTimes(2)
  })
  test('ARIA ties the input to the list and the highlighted option', () => {
    const engine = make({ activeValue: 'Zoom in' })
    expect(engine.parts.input.attrs).toMatchObject({
      role: 'combobox',
      'aria-expanded': 'true',
      'aria-controls': 'p-list',
      'aria-activedescendant': getCommandItemId('p', 'Zoom in'),
    })
    expect(engine.parts.list.attrs).toMatchObject({ id: 'p-list', role: 'listbox' })
    expect(engine.parts.item('Zoom in').attrs).toMatchObject({
      role: 'option',
      'aria-selected': 'true',
      'data-active': '',
    })
    expect(engine.parts.item('Save').attrs).toMatchObject({
      'aria-disabled': 'true',
      'data-disabled': '',
    })
    expect(engine.parts.group('view').attrs['aria-labelledby']).toBe(
      engine.parts.groupHeading('view').attrs.id
    )
    expect(getCommandItemId('p', 'a b/c')).toMatch(/^[\w-]+$/)
    expect(make({ query: 'a' }).parts.separator.attrs.hidden).toBe(true)
  })
  test('pointer movement highlights and pointerdown keeps input focus', () => {
    const active = vi.fn()
    const engine = make({ onActiveChange: active })
    engine.parts.item('Zoom in').on.pointermove?.({} as never)
    expect(active).toHaveBeenLastCalledWith('Zoom in')
    active.mockClear()
    engine.parts.item('Save').on.pointermove?.({} as never)
    expect(active).not.toHaveBeenCalled()
    const down = { button: 0, preventDefault: vi.fn() }
    engine.parts.item('Zoom in').on.pointerdown?.(down as never)
    expect(down.preventDefault).toHaveBeenCalled()
  })
})
