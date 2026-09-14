import { describe, expect, test, vi } from 'vitest'

import { accordion } from './accordion'
import type { AccordionOptions } from './accordion'

const items = ['one', 'two', 'three'] as const

const ids = (item: string) => ({ trigger: `${item}-trigger`, content: `${item}-panel` })

function build(options: Partial<AccordionOptions<string>> = {}) {
  return accordion<string>({ items: [...items], ids, ...options })
}

function click(part: { on: { click?: (event: never) => void } }) {
  const event = { preventDefault: vi.fn() }
  part.on.click?.(event as never)
  return event
}

function press(part: { on: { keydown?: (event: never) => void } }, key: string) {
  const event = { key, preventDefault: vi.fn() }
  part.on.keydown?.(event as never)
  return event
}

describe('accordion', () => {
  test('wires the trigger and panel to each other', () => {
    const { parts } = build({ value: 'one' })
    expect(parts.trigger('one').attrs).toMatchObject({
      id: 'one-trigger',
      type: 'button',
      'aria-expanded': 'true',
      'aria-controls': 'one-panel',
      'data-orientation': 'vertical',
    })
    expect(parts.panel('one').attrs).toMatchObject({
      id: 'one-panel',
      role: 'region',
      'aria-labelledby': 'one-trigger',
      'data-state': 'open',
    })
    expect(parts.trigger('two').attrs['aria-expanded']).toBe('false')
    expect(build({ value: 'one' }).state.isPresent('two')).toBe(false)
  })

  test('no trigger carries a roving tab stop', () => {
    const { parts } = build()
    for (const item of items) expect(parts.trigger(item).attrs).not.toHaveProperty('tabindex')
  })

  test('single mode replaces the open item and reports a bare value', () => {
    const onValueChange = vi.fn()
    click(build({ value: 'one', onValueChange }).parts.trigger('two'))
    expect(onValueChange).toHaveBeenCalledWith('two')
  })

  test('a non-collapsible single accordion is a silent no-op on the open item', () => {
    const onValueChange = vi.fn()
    const event = click(build({ value: 'one', onValueChange }).parts.trigger('one'))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(build({ value: 'one' }).parts.trigger('one').attrs).not.toHaveProperty('aria-disabled')
  })

  test('collapsible single mode closes to undefined', () => {
    const onValueChange = vi.fn()
    click(build({ value: 'one', collapsible: true, onValueChange }).parts.trigger('one'))
    expect(onValueChange).toHaveBeenCalledWith(undefined)
  })

  test('multiple mode adds and removes array entries', () => {
    const onValueChange = vi.fn()
    const open = { mode: 'multiple' as const, value: ['one'], onValueChange }
    click(build(open).parts.trigger('two'))
    expect(onValueChange).toHaveBeenCalledWith(['one', 'two'])
    click(build(open).parts.trigger('one'))
    expect(onValueChange).toHaveBeenLastCalledWith([])
  })

  test('arrows travel the triggers and skip disabled items', () => {
    const onActiveChange = vi.fn()
    const options = { itemDisabled: (item: string) => item === 'two', onActiveChange }
    const event = press(build({ ...options, active: 'one' }).parts.trigger('one'), 'ArrowDown')
    expect(event.preventDefault).toHaveBeenCalled()
    expect(onActiveChange).toHaveBeenCalledWith('three')
    press(build({ ...options, active: 'three' }).parts.trigger('three'), 'ArrowDown')
    expect(onActiveChange).toHaveBeenLastCalledWith('one')
    press(build({ ...options, active: 'one' }).parts.trigger('one'), 'ArrowRight')
    expect(onActiveChange).toHaveBeenCalledTimes(2)
  })

  test('a disabled root disables every trigger and blocks the toggle', () => {
    const onValueChange = vi.fn()
    const { parts } = build({ disabled: true, onValueChange })
    expect(parts.root.attrs['data-disabled']).toBe('')
    expect(parts.trigger('one').attrs.disabled).toBe(true)
    expect(parts.item('one').attrs['data-disabled']).toBe('')
    expect(click(parts.trigger('one')).preventDefault).toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('the region role can be opted out of', () => {
    const { attrs } = build({ value: 'one', region: false }).parts.panel('one')
    expect(attrs).not.toHaveProperty('role')
    expect(attrs).not.toHaveProperty('aria-labelledby')
  })
})
