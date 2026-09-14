import { describe, expect, test, vi } from 'vitest'
import { contextMenu } from './context-menu'
function event(values: object) {
  return { preventDefault: vi.fn(), ...values } as never
}
describe('contextMenu', () => {
  test('region gestures publish client coordinates without disclosure attributes', () => {
    const open = vi.fn()
    const result = contextMenu({ items: [], onOpenRequest: open })
    const pointer = event({ clientX: 71, clientY: 93 })
    result.parts.trigger.on.contextmenu?.(pointer)
    expect(open).toHaveBeenCalledWith({ x: 71, y: 93 })
    expect(result.parts.trigger.attrs).not.toHaveProperty('aria-haspopup')
    expect(result.parts.content.attrs.role).toBe('menu')
    result.parts.trigger.on.keydown?.(event({ key: 'ContextMenu' }))
    result.parts.trigger.on.keydown?.(event({ key: 'F10', shiftKey: true }))
    expect(open).toHaveBeenCalledTimes(3)
  })
  test('disabled or canceled events preserve native behavior and do not request opening', () => {
    const open = vi.fn()
    for (const options of [{ triggerDisabled: true }, {}]) {
      const result = contextMenu({ items: [], ...options, onOpenRequest: open })
      result.parts.trigger.on.contextmenu?.(event({ defaultPrevented: !options.triggerDisabled }))
      result.parts.trigger.on.keydown?.(event({ key: 'Enter' }))
    }
    expect(open).not.toHaveBeenCalled()
  })
})
