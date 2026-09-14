import { expect, test, vi } from 'vitest'
import { menubar } from './menubar'
function key(key: string) {
  return {
    key,
    preventDefault() {
      this.defaultPrevented = true
    },
    defaultPrevented: false,
  } as unknown as KeyboardEvent & { currentTarget: HTMLButtonElement }
}
test('menubar wraps enabled triggers, reverses RTL, and requests opening edges', () => {
  const active = vi.fn(),
    change = vi.fn()
  const engine = menubar({
    items: ['file', 'disabled', 'edit'],
    disabled: (item) => item === 'disabled',
    active: 'file',
    onActiveChange: active,
    onValueChange: change,
  })
  expect(engine.parts.root.attrs.role).toBe('menubar')
  engine.parts.trigger('file').on.keydown?.(key('ArrowLeft'))
  expect(active).toHaveBeenLastCalledWith('edit')
  engine.parts.trigger('file').on.keydown?.(key('ArrowDown'))
  expect(change).toHaveBeenLastCalledWith('file', 'first')
  engine.parts.trigger('file').on.keydown?.(key('ArrowUp'))
  expect(change).toHaveBeenLastCalledWith('file', 'last')
  menubar({ items: ['file', 'edit'], dir: 'rtl', onActiveChange: active })
    .parts.trigger('file')
    .on.keydown?.(key('ArrowLeft'))
  expect(active).toHaveBeenLastCalledWith('edit')
})
test('menubar leaves Tab default intact and disabled activation silent', () => {
  const change = vi.fn()
  const engine = menubar({
    items: ['file', 'disabled'],
    disabled: (item) => item === 'disabled',
    onValueChange: change,
  })
  const tab = key('Tab')
  engine.parts.trigger('file').on.keydown?.(tab)
  expect(tab.defaultPrevented).toBe(false)
  expect(change).toHaveBeenCalledWith(undefined)
  change.mockClear()
  engine.parts.trigger('disabled').on.keydown?.(key('Enter'))
  expect(change).not.toHaveBeenCalled()
})
