import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { composite, type CompositeOptions } from './composite'

type HostKeyboardEvent = KeyboardEvent & { currentTarget: HTMLDivElement }

function key(name: string, init: Partial<KeyboardEvent> = {}) {
  const event = {
    key: name,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
    preventDefault: vi.fn(),
  }
  return event as unknown as HostKeyboardEvent & typeof event
}

function press(options: CompositeOptions<string>, name: string, init?: Partial<KeyboardEvent>) {
  const onActiveChange = vi.fn()
  const engine = composite({ ...options, onActiveChange })
  const event = key(name, init)
  engine.parts.item(engine.state.active ?? 'nothing').on.keydown?.(event)
  return {
    claimed: event.preventDefault.mock.calls.length > 0,
    moved: onActiveChange.mock.calls[0]?.[0] as string | undefined,
  }
}

const abc = ['a', 'b', 'c']
const isB = (item: string) => item === 'b'

describe('composite', () => {
  test('defaults to a horizontal ltr list that clamps', () => {
    const { state } = composite({ items: abc })
    expect(state).toEqual({ active: 'a', orientation: 'horizontal', direction: 'ltr', loop: false })
  })

  test('one tab stop: the active item is 0 and every other item is -1', () => {
    const { parts } = composite({ items: abc, active: 'b', orientation: 'vertical' })
    expect(parts.item('a').attrs).toEqual({ tabindex: -1, 'data-orientation': 'vertical' })
    expect(parts.item('b').attrs).toEqual({ tabindex: 0, 'data-orientation': 'vertical' })
    expect(parts.item('c').attrs).toEqual({ tabindex: -1, 'data-orientation': 'vertical' })
  })

  test('active falls back to the first navigable item', () => {
    expect(composite({ items: abc, active: 'z' }).state.active).toBe('a')
    expect(composite({ items: abc, active: 'a', disabled: (i) => i === 'a' }).state.active).toBe(
      'b'
    )
    expect(composite({ items: abc, disabled: (i) => i !== 'c' }).state.active).toBe('c')
  })

  test('active falls back to the first item when none is navigable', () => {
    expect(composite({ items: abc, disabled: () => true }).state.active).toBe('a')
  })

  test('an empty list has no active item and claims no key', () => {
    const { state, parts } = composite<string>({ items: [] })
    expect(state.active).toBeUndefined()
    expect(parts.item('a').attrs.tabindex).toBe(-1)
    expect(press({ items: [] }, 'ArrowRight')).toEqual({ claimed: false, moved: undefined })
    expect(press({ items: [] }, 'Home')).toEqual({ claimed: false, moved: undefined })
  })

  test('horizontal: right moves forward and left moves backward', () => {
    expect(press({ items: abc }, 'ArrowRight')).toEqual({ claimed: true, moved: 'b' })
    expect(press({ items: abc, active: 'c' }, 'ArrowLeft')).toEqual({ claimed: true, moved: 'b' })
  })

  test('horizontal: rtl mirrors the arrows', () => {
    const rtl = { items: abc, direction: 'rtl' } as const
    expect(press({ ...rtl, active: 'c' }, 'ArrowRight')).toEqual({ claimed: true, moved: 'b' })
    expect(press(rtl, 'ArrowLeft')).toEqual({ claimed: true, moved: 'b' })
  })

  test('horizontal: the vertical arrows are left alone', () => {
    expect(press({ items: abc }, 'ArrowDown')).toEqual({ claimed: false, moved: undefined })
    expect(press({ items: abc, active: 'c' }, 'ArrowUp')).toEqual({
      claimed: false,
      moved: undefined,
    })
  })

  test('vertical: down and up move, and rtl does not mirror them', () => {
    const vertical = { items: abc, orientation: 'vertical' } as const
    expect(press(vertical, 'ArrowDown')).toEqual({ claimed: true, moved: 'b' })
    expect(press({ ...vertical, active: 'c' }, 'ArrowUp')).toEqual({ claimed: true, moved: 'b' })
    expect(press({ ...vertical, direction: 'rtl' }, 'ArrowDown')).toEqual({
      claimed: true,
      moved: 'b',
    })
  })

  test('vertical: the horizontal arrows are left alone', () => {
    const vertical = { items: abc, orientation: 'vertical' } as const
    expect(press(vertical, 'ArrowRight')).toEqual({ claimed: false, moved: undefined })
    expect(press({ ...vertical, active: 'c' }, 'ArrowLeft')).toEqual({
      claimed: false,
      moved: undefined,
    })
  })

  test('both: all four arrows move, horizontal ones mirrored under rtl', () => {
    const both = { items: abc, orientation: 'both' } as const
    expect(press(both, 'ArrowRight')).toEqual({ claimed: true, moved: 'b' })
    expect(press(both, 'ArrowDown')).toEqual({ claimed: true, moved: 'b' })
    expect(press({ ...both, active: 'c' }, 'ArrowLeft')).toEqual({ claimed: true, moved: 'b' })
    expect(press({ ...both, active: 'c' }, 'ArrowUp')).toEqual({ claimed: true, moved: 'b' })
    const rtl = { ...both, direction: 'rtl' } as const
    expect(press({ ...rtl, active: 'c' }, 'ArrowRight')).toEqual({ claimed: true, moved: 'b' })
    expect(press(rtl, 'ArrowDown')).toEqual({ claimed: true, moved: 'b' })
  })

  test.each(['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'])(
    'IME composition leaves %s unclaimed without navigating',
    (name) => {
      expect(
        press({ items: abc, active: 'b', orientation: 'both' }, name, { isComposing: true })
      ).toEqual({ claimed: false, moved: undefined })
    }
  )

  test('a modifier suppresses the key entirely', () => {
    const ignored = { claimed: false, moved: undefined }
    expect(press({ items: abc }, 'ArrowRight', { ctrlKey: true })).toEqual(ignored)
    expect(press({ items: abc }, 'ArrowRight', { altKey: true })).toEqual(ignored)
    expect(press({ items: abc }, 'ArrowRight', { metaKey: true })).toEqual(ignored)
    expect(press({ items: abc }, 'ArrowRight', { shiftKey: true })).toEqual(ignored)
    expect(press({ items: abc }, 'End', { shiftKey: true })).toEqual(ignored)
  })

  test('an unmapped key is never claimed', () => {
    expect(press({ items: abc }, 'a')).toEqual({ claimed: false, moved: undefined })
    expect(press({ items: abc }, 'PageDown')).toEqual({ claimed: false, moved: undefined })
  })

  test('movement skips non-navigable items', () => {
    expect(press({ items: abc, disabled: isB }, 'ArrowRight')).toEqual({
      claimed: true,
      moved: 'c',
    })
    expect(press({ items: abc, active: 'c', disabled: isB }, 'ArrowLeft')).toEqual({
      claimed: true,
      moved: 'a',
    })
  })

  test('a boundary clamps but still claims the key', () => {
    expect(press({ items: abc }, 'ArrowLeft')).toEqual({ claimed: true, moved: undefined })
    expect(press({ items: abc, active: 'c' }, 'ArrowRight')).toEqual({
      claimed: true,
      moved: undefined,
    })
  })

  test('loop wraps to the first and last navigable item', () => {
    const loop = { items: abc, loop: true, disabled: (i: string) => i === 'c' } as const
    expect(press({ ...loop, active: 'b' }, 'ArrowRight')).toEqual({ claimed: true, moved: 'a' })
    expect(press(loop, 'ArrowLeft')).toEqual({ claimed: true, moved: 'b' })
  })

  test('Home and End reach the first and last navigable item', () => {
    const ends = { items: abc, disabled: (i: string) => i === 'a' || i === 'c' } as const
    expect(press({ items: abc, active: 'b' }, 'Home')).toEqual({ claimed: true, moved: 'a' })
    expect(press({ items: abc, active: 'b' }, 'End')).toEqual({ claimed: true, moved: 'c' })
    expect(press(ends, 'Home')).toEqual({ claimed: true, moved: undefined })
    expect(press(ends, 'End')).toEqual({ claimed: true, moved: undefined })
  })

  test('Home and End are claimed even when they do not move', () => {
    expect(press({ items: abc }, 'Home')).toEqual({ claimed: true, moved: undefined })
    expect(press({ items: abc, active: 'c' }, 'End')).toEqual({ claimed: true, moved: undefined })
  })

  test('a list with nothing navigable claims keys and never moves', () => {
    const dead = { items: abc, disabled: () => true, loop: true }
    expect(press(dead, 'ArrowRight')).toEqual({ claimed: true, moved: undefined })
    expect(press(dead, 'End')).toEqual({ claimed: true, moved: undefined })
  })

  test('focus hands the tab stop to the item that got it', () => {
    const focus = {} as FocusEvent & { currentTarget: HTMLDivElement }
    const onActiveChange = vi.fn()
    const { parts } = composite({ items: abc, active: 'a', onActiveChange })
    parts.item('c').on.focus?.(focus)
    expect(onActiveChange).toHaveBeenCalledWith('c')
    onActiveChange.mockClear()
    parts.item('a').on.focus?.(focus)
    expect(onActiveChange).not.toHaveBeenCalled()
  })

  test('the engine is generic over the item type', () => {
    const one = { id: 1 }
    const two = { id: 2 }
    const { state, parts } = composite({ items: [one, two], active: two })
    expectTypeOf(state.active).toEqualTypeOf<{ id: number } | undefined>()
    expect(state.active).toBe(two)
    expect(parts.item(two).attrs.tabindex).toBe(0)
    expect(parts.item(one).attrs.tabindex).toBe(-1)
  })
})
