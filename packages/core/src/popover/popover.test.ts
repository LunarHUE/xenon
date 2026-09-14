import { describe, expect, test, vi } from 'vitest'
import { popover } from './popover'
describe('popover', () => {
  test('defaults to a closed non-modal dialog with no dangling controls', () => {
    const result = popover({ ids: { content: 'popup' } })
    expect(result.state.open).toBe(false)
    expect(result.state.modal).toBe(false)
    expect(result.parts.trigger.attrs['aria-expanded']).toBe('false')
    expect(result.parts.trigger.attrs['aria-controls']).toBeUndefined()
    expect(result.parts.content.attrs.role).toBe('dialog')
    expect(result.parts.content.attrs.tabindex).toBe('-1')
    expect(result.parts.content.attrs['aria-modal']).toBeUndefined()
  })
  test('toggles, closes, and names parts without calling changes on construction', () => {
    const change = vi.fn()
    const result = popover({
      open: true,
      modal: true,
      ids: { content: 'popup', title: 'title', description: 'description' },
      onOpenChange: change,
    })
    expect(change).not.toHaveBeenCalled()
    expect(result.parts.trigger.attrs['aria-controls']).toBe('popup')
    expect(result.parts.content.attrs['aria-labelledby']).toBe('title')
    expect(result.parts.content.attrs['aria-describedby']).toBe('description')
    expect(result.parts.content.attrs['aria-modal']).toBe('true')
    result.parts.trigger.on.click?.(
      {} as Parameters<NonNullable<typeof result.parts.trigger.on.click>>[0]
    )
    expect(change).toHaveBeenLastCalledWith(false)
    result.parts.close.on.click?.(
      {} as Parameters<NonNullable<typeof result.parts.close.on.click>>[0]
    )
    expect(change).toHaveBeenLastCalledWith(false)
    expect(result.parts.close.attrs['aria-label']).toBe('Close popover')
  })
  test('exit stays present and inert', () => {
    const result = popover({ open: false, status: 'exiting' })
    expect(result.state.present).toBe(true)
    expect(result.parts.content.attrs.inert).toBe(true)
  })
})
