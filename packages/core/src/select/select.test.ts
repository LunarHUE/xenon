import { describe, expect, test, vi } from 'vitest'
import { select } from './select'
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
]
function press(engine: ReturnType<typeof select>, key: string) {
  const event = {
    key,
    preventDefault: vi.fn(),
    defaultPrevented: false,
  } as unknown as KeyboardEvent & { currentTarget: HTMLButtonElement }
  engine.parts.trigger.on.keydown?.(event)
  return event
}
describe('select', () => {
  test('construction is silent and options expose explicit selection', () => {
    const change = vi.fn()
    const engine = select({ items, value: 'a', onValueChange: change })
    expect(change).not.toHaveBeenCalled()
    expect(engine.parts.item('c').attrs['aria-selected']).toBe('false')
    expect(engine.parts.trigger.attrs.role).toBe('combobox')
  })
  test('navigation skips disabled and clamps without committing', () => {
    const active = vi.fn()
    const change = vi.fn()
    press(
      select({
        items,
        open: true,
        activeValue: 'a',
        onActiveChange: active,
        onValueChange: change,
      }),
      'ArrowDown'
    )
    expect(active).toHaveBeenLastCalledWith('c')
    expect(change).not.toHaveBeenCalled()
    press(select({ items, open: true, activeValue: 'c', onActiveChange: active }), 'ArrowDown')
    expect(active).toHaveBeenLastCalledWith('c')
  })
  test('Enter commits, Escape cancels, Tab leaves default intact', () => {
    const change = vi.fn()
    const open = vi.fn()
    const engine = select({
      items,
      open: true,
      value: 'a',
      activeValue: 'c',
      onValueChange: change,
      onOpenChange: open,
    })
    press(engine, 'Escape')
    expect(change).not.toHaveBeenCalled()
    expect(open).toHaveBeenCalledWith(false)
    expect(press(engine, 'Tab').preventDefault).not.toHaveBeenCalled()
    press(engine, 'Enter')
    expect(change).toHaveBeenCalledWith('c')
  })
  test('closed typeahead commits and disabled or readonly controls ignore keys', () => {
    const change = vi.fn()
    const open = vi.fn()
    press(select({ items, onValueChange: change, onOpenChange: open }), 'c')
    expect(change).toHaveBeenCalledWith('c')
    expect(open).not.toHaveBeenCalled()
    change.mockClear()
    press(select({ items, readonly: true, onValueChange: change }), 'c')
    press(select({ items, disabled: true, onValueChange: change }), 'c')
    expect(change).not.toHaveBeenCalled()
  })
  test('empty collection does not open and canceled events do nothing', () => {
    const open = vi.fn()
    press(select({ items: [], onOpenChange: open }), 'Enter')
    const event = {
      key: 'Enter',
      defaultPrevented: true,
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent & { currentTarget: HTMLButtonElement }
    select({ items, onOpenChange: open }).parts.trigger.on.keydown?.(event)
    expect(open).not.toHaveBeenCalled()
  })
})
