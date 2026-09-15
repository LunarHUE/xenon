import { expect, test, vi } from 'vitest'
import { contextMenu } from '../context-menu/context-menu'
import { menu } from './menu'
import { menubar } from '../menubar/menubar'

function event(key: string, extra: Partial<KeyboardEvent> = {}) {
  return {
    key,
    preventDefault: vi.fn(),
    defaultPrevented: false,
    ...extra,
  } as unknown as KeyboardEvent
}

test('menu ignores modified and composing trigger keys without callbacks or cancellation', () => {
  const change = vi.fn()
  const trigger = menu({ items: [], onOpenChange: change }).parts.trigger
  for (const input of [
    event('ArrowDown', { altKey: true }),
    event('Enter', { ctrlKey: true }),
    event(' ', { metaKey: true }),
    event('ArrowUp', { isComposing: true }),
  ]) {
    trigger.on.keydown?.(input as never)
    expect(input.preventDefault).not.toHaveBeenCalled()
  }
  expect(change).not.toHaveBeenCalled()
})

test('menu opening requests use the captured open state and exact focus edge', () => {
  const change = vi.fn()
  const closed = menu({ items: [], open: false, onOpenChange: change })
  closed.parts.trigger.on.click?.({} as never)
  closed.parts.trigger.on.keydown?.(event('ArrowUp') as never)
  expect(change.mock.calls).toEqual([
    [true, 'first'],
    [true, 'last'],
  ])
  const open = menu({ items: [], open: true, onOpenChange: change })
  open.parts.trigger.on.click?.({} as never)
  expect(change).toHaveBeenLastCalledWith(false, 'first')
})

test('context menu suppresses modified keyboard gestures while preserving point payloads', () => {
  const request = vi.fn()
  const trigger = contextMenu({ items: [], onOpenRequest: request }).parts.trigger
  const modified = event('ContextMenu', { shiftKey: true, altKey: true })
  trigger.on.keydown?.(modified as never)
  expect(request).not.toHaveBeenCalled()
  expect(modified.preventDefault).not.toHaveBeenCalled()
  trigger.on.contextmenu?.({
    defaultPrevented: false,
    preventDefault: vi.fn(),
    clientX: 12,
    clientY: 34,
  } as never)
  expect(request).toHaveBeenCalledExactlyOnceWith({ x: 12, y: 34 })
})

test('context menu leaves canceled secondary clicks entirely to the author', () => {
  const request = vi.fn()
  const trigger = contextMenu({ items: [], onOpenRequest: request }).parts.trigger
  const canceled = {
    defaultPrevented: true,
    preventDefault: vi.fn(),
    clientX: 1,
    clientY: 2,
  } as never
  trigger.on.contextmenu?.(canceled as never)
  expect(request).not.toHaveBeenCalled()
  expect(
    (canceled as { preventDefault: ReturnType<typeof vi.fn> }).preventDefault
  ).not.toHaveBeenCalled()
})

test('menubar typeahead cancels only a matching unmodified character and skips disabled entries', () => {
  const active = vi.fn()
  const bar = menubar({
    items: ['file', 'edit', 'view'],
    active: 'file',
    disabled: (item) => item === 'edit',
    textValue: (item) => item,
    onActiveChange: active,
  })
  const match = event('v')
  bar.parts.trigger('file').on.keydown?.(match as never)
  expect(match.preventDefault).toHaveBeenCalledOnce()
  expect(active).toHaveBeenCalledExactlyOnceWith('view')
  const modified = event('v', { ctrlKey: true })
  bar.parts.trigger('file').on.keydown?.(modified as never)
  expect(modified.preventDefault).not.toHaveBeenCalled()
  for (const character of ['e', 'z']) {
    const unmatched = event(character)
    bar.parts.trigger('file').on.keydown?.(unmatched as never)
    expect(unmatched.preventDefault).not.toHaveBeenCalled()
  }
  expect(active).toHaveBeenCalledTimes(1)
})
