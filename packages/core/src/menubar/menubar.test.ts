import { expect, test, vi } from 'vitest'
import { menubar } from './menubar'
function key(key: string) {
  const event = {
    key,
    preventDefault() {
      event.defaultPrevented = true
    },
    defaultPrevented: false,
  }
  return event as unknown as KeyboardEvent & { currentTarget: HTMLButtonElement }
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
test('all disabled triggers stay outside the tab order', () => {
  const engine = menubar({ items: ['file', 'edit'], disabled: () => true })
  expect(engine.parts.trigger('file').attrs.tabindex).toBe(-1)
  expect(engine.parts.trigger('edit').attrs.tabindex).toBe(-1)
})

test('menubar omits default horizontal ARIA orientation and exposes vertical explicitly', () => {
  const horizontal = menubar({ items: [] }).parts.root.attrs
  expect(horizontal['aria-orientation']).toBeUndefined()
  expect(horizontal['data-orientation']).toBe('horizontal')
  const vertical = menubar({ items: [], orientation: 'vertical' }).parts.root.attrs
  expect(vertical['aria-orientation']).toBe('vertical')
  expect(vertical['data-orientation']).toBe('vertical')
})
