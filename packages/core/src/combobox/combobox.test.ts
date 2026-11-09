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
    expect(active).toHaveBeenLastCalledWith('c', { reason: 'keyboard' })
    expect(change).not.toHaveBeenCalled()
    const last = combobox({ items, id: 'x', open: true, activeValue: 'c', onActiveChange: active })
    press(last, 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('a', { reason: 'keyboard' })
    press(combobox({ items, id: 'x', onActiveChange: active, onOpenChange: open }), 'ArrowUp')
    expect(active).toHaveBeenLastCalledWith('c', { reason: 'keyboard' })
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
      expect(active).toHaveBeenCalledExactlyOnceWith(destination, { reason: 'keyboard' })
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
        expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
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
        expect(active).toHaveBeenCalledExactlyOnceWith(destination, { reason: 'keyboard' })
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
    expect(text).toHaveBeenCalledWith('Cherry', { reason: 'selection' })
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
    expect(active).toHaveBeenCalledWith(undefined, { reason: 'reset' })
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
  test('composing drafts publish nothing until compositionend publishes the composed text once', () => {
    const text = vi.fn(),
      open = vi.fn(),
      active = vi.fn()
    const target = { value: 'Ch' } as HTMLInputElement
    const fire = (
      engine: ReturnType<typeof combobox>,
      type: 'input' | 'compositionend',
      isComposing = false,
      inputType = 'insertText'
    ) =>
      type === 'input'
        ? engine.parts.input.on.input?.({
            currentTarget: target,
            isComposing,
            inputType,
          } as unknown as InputEvent & {
            currentTarget: HTMLInputElement
          })
        : engine.parts.input.on.compositionend?.({
            currentTarget: target,
          } as unknown as CompositionEvent & {
            currentTarget: HTMLInputElement
          })
    const options = {
      items,
      id: 'x',
      inputValue: 'Apple',
      open: true,
      activeValue: 'a',
      onInputValueChange: text,
      onOpenChange: open,
      onActiveChange: active,
    }
    const engine = combobox(options)
    fire(engine, 'input', true)
    expect(text).not.toHaveBeenCalled()
    expect(engine.state.items.map((item) => item.value)).toEqual(['a'])
    expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
    fire(engine, 'compositionend')
    expect(text).toHaveBeenCalledExactlyOnceWith('Ch', { reason: 'input' })
    // WebKit's committing input, before or after compositionend, never publishes again,
    // even while a controlled owner still holds the pre-composition text.
    fire(engine, 'input', false, 'insertFromComposition')
    expect(text).toHaveBeenCalledOnce()
    text.mockClear()
    fire(engine, 'input', false, 'insertFromComposition')
    fire(engine, 'compositionend')
    expect(text).toHaveBeenCalledExactlyOnceWith('Ch', { reason: 'input' })
    expect(open).not.toHaveBeenCalled()
    text.mockClear()
    fire(combobox({ ...options, readonly: true }), 'compositionend')
    expect(text).not.toHaveBeenCalled()
  })
  test('ordinary input publishes every attempt while a controlled owner lags', () => {
    const text = vi.fn()
    const engine = combobox({ items, id: 'x', inputValue: '', onInputValueChange: text })
    for (const value of ['a', ''])
      engine.parts.input.on.input?.({
        currentTarget: { value },
        isComposing: false,
        inputType: value ? 'insertText' : 'deleteContentBackward',
      } as unknown as InputEvent & { currentTarget: HTMLInputElement })
    expect(text.mock.calls.map(([value]) => value)).toEqual(['a', ''])
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
  test('highlight changes say whether the keyboard, the pointer or a reset moved them', () => {
    const active = vi.fn()
    const base = { items, id: 'x', open: true, onActiveChange: active }
    press(combobox(base), 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('a', { reason: 'keyboard' })
    combobox(base)
      .parts.item('c')
      .on.pointermove?.({} as never)
    expect(active).toHaveBeenLastCalledWith('c', { reason: 'pointer' })
    // Disabled rows take no hover highlight.
    active.mockClear()
    combobox(base)
      .parts.item('b')
      .on.pointermove?.({} as never)
    expect(active).not.toHaveBeenCalled()
    const highlighted = { ...base, activeValue: 'c' }
    for (const key of ['Home', 'Escape', 'Tab', 'Enter']) {
      active.mockClear()
      press(combobox(highlighted), key)
      expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
    }
    active.mockClear()
    combobox(highlighted)
      .parts.item('a')
      .on.click?.({} as never)
    expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
  })
  test('input text changes say whether they were typed or written by a selection', () => {
    const text = vi.fn()
    const engine = combobox({
      items,
      id: 'x',
      open: true,
      filter: false,
      inputValue: 'ch',
      activeValue: 'c',
      onInputValueChange: text,
    })
    engine.parts.input.on.input?.({
      currentTarget: { value: 'che' },
      isComposing: false,
      inputType: 'insertText',
    } as unknown as InputEvent & { currentTarget: HTMLInputElement })
    expect(text).toHaveBeenLastCalledWith('che', { reason: 'input' })
    engine.parts.input.on.compositionend?.({
      currentTarget: { value: 'チ' },
    } as unknown as CompositionEvent & { currentTarget: HTMLInputElement })
    expect(text).toHaveBeenLastCalledWith('チ', { reason: 'input' })
    press(engine, 'Enter')
    expect(text).toHaveBeenLastCalledWith('Cherry', { reason: 'selection' })
    engine.parts.item('a').on.click?.({} as never)
    expect(text).toHaveBeenLastCalledWith('Apple', { reason: 'selection' })
  })
  describe('automatic activation', () => {
    const many = [...items, { value: 'd', label: 'Date' }]
    function setup(extra: Partial<Parameters<typeof combobox>[0]> = {}) {
      const change = vi.fn(),
        active = vi.fn(),
        text = vi.fn(),
        open = vi.fn()
      const engine = combobox({
        items: many,
        id: 'x',
        open: true,
        filter: false,
        activationMode: 'automatic',
        onValueChange: change,
        onActiveChange: active,
        onInputValueChange: text,
        onOpenChange: open,
        ...extra,
      })
      return { engine, change, active, text, open }
    }
    test('an arrow key commits the option it reaches, skipping disabled rows', () => {
      const down = setup({ activeValue: 'a', value: 'a' })
      press(down.engine, 'ArrowDown')
      expect(down.active).toHaveBeenCalledExactlyOnceWith('c', { reason: 'keyboard' })
      expect(down.change).toHaveBeenCalledExactlyOnceWith('c')
      // The field stays a search box and the list stays open.
      expect(down.text).not.toHaveBeenCalled()
      expect(down.open).not.toHaveBeenCalled()
      const up = setup({ activeValue: 'c', value: 'c' })
      press(up.engine, 'ArrowUp')
      expect(up.change).toHaveBeenCalledExactlyOnceWith('a')
    })
    test('navigation starts from the committed option when nothing is highlighted', () => {
      const down = setup({ value: 'c' })
      press(down.engine, 'ArrowDown')
      expect(down.change).toHaveBeenCalledExactlyOnceWith('d')
      const up = setup({ value: 'c' })
      press(up.engine, 'ArrowUp')
      expect(up.change).toHaveBeenCalledExactlyOnceWith('a')
      // A pointer highlight is the newer position and wins over the selection.
      const hovered = setup({ value: 'a', activeValue: 'c' })
      press(hovered.engine, 'ArrowDown')
      expect(hovered.change).toHaveBeenCalledExactlyOnceWith('d')
      // A selection filtered out of the list gives no starting point.
      const filtered = setup({ value: 'gone' })
      press(filtered.engine, 'ArrowDown')
      expect(filtered.change).toHaveBeenCalledExactlyOnceWith('a')
    })
    test('hover highlights without committing and a click still commits', () => {
      const { engine, change, active } = setup({ value: 'a' })
      engine.parts.item('c').on.pointermove?.({} as never)
      expect(active).toHaveBeenCalledExactlyOnceWith('c', { reason: 'pointer' })
      expect(change).not.toHaveBeenCalled()
      engine.parts.item('c').on.click?.({} as never)
      expect(change).toHaveBeenCalledExactlyOnceWith('c')
    })
    test('nothing commits at an unwrapped edge, on the highlighted row, or without a move', () => {
      const edge = setup({ value: 'd', activeValue: 'd', loop: false })
      press(edge.engine, 'ArrowDown')
      expect(edge.change).not.toHaveBeenCalled()
      const same = setup({ value: 'c', activeValue: 'a' })
      press(same.engine, 'ArrowDown')
      expect(same.active).toHaveBeenCalledExactlyOnceWith('c', { reason: 'keyboard' })
      expect(same.change).not.toHaveBeenCalled()
      for (const extra of [{ isComposing: true }, { defaultPrevented: true }, { altKey: true }]) {
        const blocked = setup({ value: 'a' })
        press(blocked.engine, 'ArrowDown', extra)
        expect(blocked.change).not.toHaveBeenCalled()
      }
      for (const state of [{ readonly: true }, { disabled: true }]) {
        const blocked = setup({ value: 'a', ...state })
        press(blocked.engine, 'ArrowDown')
        expect(blocked.change).not.toHaveBeenCalled()
      }
    })
    test('typing clears the highlight and keeps a selection that is filtered out', () => {
      const { engine, change, active } = setup({
        value: 'a',
        activeValue: 'a',
        filter: (item) => item.value !== 'a',
      })
      expect(engine.state.value).toBe('a')
      expect(engine.state.items.map((item) => item.value)).toEqual(['b', 'c', 'd'])
      engine.parts.input.on.input?.({
        currentTarget: { value: 'x' },
        isComposing: false,
        inputType: 'insertText',
      } as unknown as InputEvent & { currentTarget: HTMLInputElement })
      expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
      expect(change).not.toHaveBeenCalled()
    })
    test('the key that opens a closed list highlights and commits nothing', () => {
      const { engine, change, active, open } = setup({ open: false, value: 'c' })
      press(engine, 'ArrowDown')
      expect(open).toHaveBeenCalledExactlyOnceWith(true)
      expect(active).toHaveBeenCalledExactlyOnceWith('a', { reason: 'keyboard' })
      expect(change).not.toHaveBeenCalled()
    })
    test('manual activation, the default, never commits on an arrow key', () => {
      for (const activationMode of [undefined, 'manual'] as const) {
        const { engine, change, active } = setup({ activationMode, value: 'c' })
        press(engine, 'ArrowDown')
        expect(active).toHaveBeenCalledExactlyOnceWith('a', { reason: 'keyboard' })
        expect(change).not.toHaveBeenCalled()
      }
    })
  })
})
