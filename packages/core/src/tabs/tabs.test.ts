import { describe, expect, test, vi } from 'vitest'

import { tabs } from './tabs'
import type { TabsOptions } from './tabs'

const abc = ['a', 'b', 'c']

const ids = {
  tab: (item: string) => `t-${item}`,
  panel: (item: string) => `p-${item}`,
}

function build(options: Partial<TabsOptions<string>> = {}) {
  const onValueChange = vi.fn()
  const onActiveChange = vi.fn()
  const engine = tabs({ items: abc, ids, onValueChange, onActiveChange, ...options })
  return { engine, onValueChange, onActiveChange }
}

function click(init: Partial<PointerEvent> = {}) {
  return {
    button: 0,
    defaultPrevented: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
  } as unknown as PointerEvent & { currentTarget: HTMLDivElement }
}

function key(name: string) {
  return {
    key: name,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent & { currentTarget: HTMLDivElement }
}

describe('tabs', () => {
  test('selects the first tab when no value is given and fires nothing', () => {
    const { engine, onValueChange } = build()
    expect(engine.state.value).toBe('a')
    expect(engine.state.active).toBe('a')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('an implicit selection skips leading disabled tabs, an explicit one does not', () => {
    expect(build({ disabled: (item) => item === 'a' }).engine.state.value).toBe('b')
    expect(build({ value: 'a', disabled: (item) => item === 'a' }).engine.state.value).toBe('a')
    expect(build({ disabled: () => true }).engine.state.value).toBe('a')
  })

  test('every tab carries tabindex, aria-selected and aria-controls', () => {
    const { engine } = build({ value: 'b' })
    expect(engine.parts.tab('a').attrs).toMatchObject({
      id: 't-a',
      role: 'tab',
      tabindex: -1,
      'aria-selected': 'false',
      'aria-controls': 'p-a',
      'data-state': 'inactive',
      'data-selected': undefined,
    })
    expect(engine.parts.tab('b').attrs).toMatchObject({
      tabindex: 0,
      'aria-selected': 'true',
      'data-state': 'active',
      'data-selected': '',
    })
  })

  test('the list names its orientation only when it differs from the role default', () => {
    expect(build().engine.parts.list.attrs).toMatchObject({
      role: 'tablist',
      'aria-orientation': undefined,
      'data-orientation': 'horizontal',
    })
    expect(build({ orientation: 'vertical' }).engine.parts.list.attrs).toMatchObject({
      'aria-orientation': 'vertical',
      'data-orientation': 'vertical',
    })
  })

  test('an unselected panel stays labelled and hidden', () => {
    const { engine } = build({ value: 'b' })
    expect(engine.parts.panel('a').attrs).toMatchObject({
      id: 'p-a',
      role: 'tabpanel',
      'aria-labelledby': 't-a',
      hidden: true,
      tabindex: undefined,
      'data-state': 'inactive',
    })
    expect(engine.parts.panel('b').attrs).toMatchObject({
      hidden: undefined,
      tabindex: 0,
      'data-state': 'active',
    })
  })

  test('the selected panel drops its tab stop when it holds a focusable descendant', () => {
    const { engine } = build({ value: 'b', panelFocusable: (item) => item === 'b' })
    expect(engine.parts.panel('b').attrs['tabindex']).toBeUndefined()
  })

  test('clicking selects, re-clicking the selected tab fires nothing', () => {
    const { engine, onValueChange } = build({ value: 'a' })
    engine.parts.tab('c').on.click?.(click())
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('c')

    onValueChange.mockClear()
    engine.parts.tab('a').on.click?.(click())
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a disabled tab, a modified click and a prevented click all select nothing', () => {
    const { engine, onValueChange } = build({ value: 'a', disabled: (item) => item === 'b' })
    engine.parts.tab('b').on.click?.(click())
    engine.parts.tab('c').on.click?.(click({ button: 1 }))
    engine.parts.tab('c').on.click?.(click({ metaKey: true }))
    engine.parts.tab('c').on.click?.(click({ defaultPrevented: true }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('automatic activation selects as arrows move focus', () => {
    const { engine, onValueChange, onActiveChange } = build({ value: 'a' })
    engine.parts.tab('a').on.keydown?.(key('ArrowRight'))
    expect(onActiveChange).toHaveBeenCalledExactlyOnceWith('b')
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('b')
  })

  test('manual activation moves focus alone; a later click commits', () => {
    const { engine, onValueChange, onActiveChange } = build({
      value: 'a',
      activationMode: 'manual',
    })
    engine.parts.tab('a').on.keydown?.(key('End'))
    expect(onActiveChange).toHaveBeenCalledExactlyOnceWith('c')
    expect(onValueChange).not.toHaveBeenCalled()

    engine.parts.tab('c').on.click?.(click())
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith('c')
  })

  test('arrows wrap by default and skip disabled tabs', () => {
    const { engine, onActiveChange } = build({ value: 'c' })
    engine.parts.tab('c').on.keydown?.(key('ArrowRight'))
    expect(onActiveChange).toHaveBeenCalledExactlyOnceWith('a')

    const clamped = build({ value: 'c', loop: false })
    clamped.engine.parts.tab('c').on.keydown?.(key('ArrowRight'))
    expect(clamped.onActiveChange).not.toHaveBeenCalled()

    const skipping = build({ value: 'a', disabled: (item) => item === 'b' })
    skipping.engine.parts.tab('a').on.keydown?.(key('ArrowRight'))
    expect(skipping.onActiveChange).toHaveBeenCalledExactlyOnceWith('c')
  })

  test('a vertical list ignores the horizontal arrows', () => {
    const { engine, onActiveChange } = build({ value: 'a', orientation: 'vertical' })
    const event = key('ArrowRight')
    engine.parts.tab('a').on.keydown?.(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(onActiveChange).not.toHaveBeenCalled()

    engine.parts.tab('a').on.keydown?.(key('ArrowDown'))
    expect(onActiveChange).toHaveBeenCalledExactlyOnceWith('b')
  })

  test('the tab stop follows the focused tab and returns to the selection on focus out', () => {
    const { engine } = build({ value: 'a', active: 'c', activationMode: 'manual' })
    expect(engine.state.active).toBe('c')
    expect(engine.parts.tab('c').attrs['tabindex']).toBe(0)

    const { engine: reset } = build({ value: 'a', activationMode: 'manual' })
    expect(reset.state.active).toBe('a')
  })

  test('focus leaving the list clears the active tab, moving within it does not', () => {
    const { engine, onActiveChange } = build({ value: 'a' })
    const inside = { contains: () => true }
    const outside = { contains: () => false }
    const event = (host: object) =>
      ({ relatedTarget: {}, currentTarget: host }) as unknown as FocusEvent & {
        currentTarget: HTMLDivElement
      }

    engine.parts.list.on.focusout?.(event(inside))
    expect(onActiveChange).not.toHaveBeenCalled()

    engine.parts.list.on.focusout?.(event(outside))
    expect(onActiveChange).toHaveBeenCalledExactlyOnceWith(undefined)
  })
})
