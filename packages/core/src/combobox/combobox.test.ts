import { describe, expect, test, vi } from 'vitest'
import { combobox } from './combobox'

const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Apricot', disabled: true },
  { value: 'c', label: 'Cherry' },
]
function press(engine: ReturnType<typeof combobox>, key: string, extra = {}) {
  const event = {
    key,
    preventDefault: vi.fn(),
    defaultPrevented: false,
    ...extra,
  } as unknown as KeyboardEvent & { currentTarget: HTMLInputElement }
  engine.parts.input.on.keydown?.(event)
  return event
}
describe('combobox', () => {
  test('filters labels, supports consumer filtering, and preserves absent committed values', () => {
    expect(
      combobox({ items, id: 'x', inputValue: 'AP' }).state.items.map((item) => item.value)
    ).toEqual(['a', 'b'])
    expect(combobox({ items, id: 'x', inputValue: 'AP', filter: false }).state.items).toEqual(items)
    expect(
      combobox({
        items,
        id: 'x',
        inputValue: '',
        filter: (item) => item.value === 'c',
      }).state.items.map((item) => item.value)
    ).toEqual(['c'])
    const engine = combobox({ items: [], id: 'x', value: 'pending' })
    expect(engine.state.value).toBe('pending')
    expect(engine.parts.input.attrs['aria-activedescendant']).toBeUndefined()
  })
  test('arrow navigation skips disabled options and does not commit', () => {
    const active = vi.fn(),
      change = vi.fn(),
      open = vi.fn()
    const engine = combobox({
      items,
      id: 'x',
      open: true,
      activeValue: 'a',
      onActiveChange: active,
      onValueChange: change,
      onOpenChange: open,
    })
    expect(press(engine, 'ArrowDown').preventDefault).toHaveBeenCalled()
    expect(active).toHaveBeenLastCalledWith('c')
    expect(change).not.toHaveBeenCalled()
    const last = combobox({ items, id: 'x', open: true, activeValue: 'c', onActiveChange: active })
    press(last, 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('a')
    press(combobox({ items, id: 'x', onActiveChange: active, onOpenChange: open }), 'ArrowUp')
    expect(active).toHaveBeenLastCalledWith('c')
    expect(open).toHaveBeenLastCalledWith(true)
  })
  test('nonwrapping arrows retain the first and last enabled highlight at a boundary', () => {
    for (const [activeValue, key] of [
      ['a', 'ArrowUp'],
      ['c', 'ArrowDown'],
    ] as const) {
      const active = vi.fn()
      const change = vi.fn()
      const engine = combobox({
        items,
        id: 'x',
        open: true,
        loop: false,
        activeValue,
        onActiveChange: active,
        onValueChange: change,
      })
      expect(press(engine, key).preventDefault).toHaveBeenCalledExactlyOnceWith()
      expect(engine.state.activeValue).toBe(activeValue)
      expect(active).not.toHaveBeenCalled()
      expect(change).not.toHaveBeenCalled()
    }
  })
  test('nonwrapping arrows still skip disabled options in both directions', () => {
    for (const [activeValue, key, destination] of [
      ['a', 'ArrowDown', 'c'],
      ['c', 'ArrowUp', 'a'],
    ] as const) {
      const active = vi.fn()
      const engine = combobox({
        items,
        id: 'x',
        open: true,
        loop: false,
        activeValue,
        onActiveChange: active,
      })
      press(engine, key)
      expect(active).toHaveBeenCalledExactlyOnceWith(destination)
    }
  })
  test('nonwrapping arrows clear stale highlights when no enabled options remain', () => {
    for (const remaining of [[], items.map((item) => ({ ...item, disabled: true }))]) {
      for (const key of ['ArrowUp', 'ArrowDown']) {
        const active = vi.fn()
        const change = vi.fn()
        const engine = combobox({
          items: remaining,
          id: 'x',
          open: true,
          loop: false,
          activeValue: 'a',
          onActiveChange: active,
          onValueChange: change,
        })
        expect(engine.state.activeValue).toBeUndefined()
        expect(engine.parts.input.attrs['aria-activedescendant']).toBeUndefined()
        press(engine, key)
        expect(active).toHaveBeenCalledExactlyOnceWith(undefined)
        press(engine, 'Enter')
        expect(change).not.toHaveBeenCalled()
      }
    }
  })
  test('default and explicitly looping arrows still wrap between both enabled endpoints', () => {
    for (const loop of [undefined, true]) {
      for (const [activeValue, key, destination] of [
        ['a', 'ArrowUp', 'c'],
        ['c', 'ArrowDown', 'a'],
      ] as const) {
        const active = vi.fn()
        const engine = combobox({
          items,
          id: 'x',
          open: true,
          loop,
          activeValue,
          onActiveChange: active,
        })
        press(engine, key)
        expect(active).toHaveBeenCalledExactlyOnceWith(destination)
      }
    }
  })
  test('Enter commits only a visible enabled highlight and updates display text', () => {
    const change = vi.fn(),
      text = vi.fn(),
      open = vi.fn()
    const engine = combobox({
      items,
      id: 'x',
      open: true,
      activeValue: 'c',
      onValueChange: change,
      onInputValueChange: text,
      onOpenChange: open,
    })
    expect(press(engine, 'Enter').preventDefault).toHaveBeenCalled()
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    expect(text).toHaveBeenCalledWith('Cherry')
    expect(open).toHaveBeenCalledWith(false)
    expect(
      press(
        combobox({ items, id: 'x', open: true, activeValue: 'b', onValueChange: change }),
        'Enter'
      ).preventDefault
    ).not.toHaveBeenCalled()
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('Tab and caret keys preserve native behavior; Escape only dismisses an open popup', () => {
    const active = vi.fn(),
      change = vi.fn(),
      open = vi.fn()
    const engine = combobox({
      items,
      id: 'x',
      open: true,
      activeValue: 'a',
      onActiveChange: active,
      onValueChange: change,
      onOpenChange: open,
    })
    for (const key of ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'Tab'])
      expect(press(engine, key).preventDefault).not.toHaveBeenCalled()
    expect(active).toHaveBeenCalledWith(undefined)
    expect(change).not.toHaveBeenCalled()
    expect(press(engine, 'Escape').preventDefault).toHaveBeenCalled()
    expect(press(combobox({ items, id: 'x' }), 'Escape').preventDefault).not.toHaveBeenCalled()
  })
  test('composition, modifier shortcuts, readonly, and disabled controls do not navigate', () => {
    const active = vi.fn(),
      open = vi.fn()
    for (const extra of [
      { isComposing: true },
      { ctrlKey: true },
      { metaKey: true },
      { altKey: true },
      { defaultPrevented: true },
    ]) {
      expect(
        press(
          combobox({ items, id: 'x', onActiveChange: active, onOpenChange: open }),
          'ArrowDown',
          extra
        ).preventDefault
      ).not.toHaveBeenCalled()
    }
    for (const state of [{ readonly: true }, { disabled: true }])
      press(
        combobox({ items, id: 'x', ...state, onActiveChange: active, onOpenChange: open }),
        'ArrowDown'
      )
    expect(active).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
  })
  test('pointer press retains input focus but only click commits; closed and disabled items cannot commit', () => {
    const change = vi.fn()
    const event = { button: 0, preventDefault: vi.fn() } as unknown as PointerEvent & {
      currentTarget: HTMLDivElement
    }
    const engine = combobox({ items, id: 'x', open: true, onValueChange: change })
    engine.parts.item('a').on.pointerdown?.(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    engine.parts.item('a').on.click?.({} as never)
    expect(change).toHaveBeenCalledExactlyOnceWith('a')
    engine.parts.item('b').on.click?.({} as never)
    combobox({ items, id: 'x', onValueChange: change })
      .parts.item('c')
      .on.click?.({} as never)
    expect(change).toHaveBeenCalledTimes(1)
  })
})
