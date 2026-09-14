import { describe, expect, test, vi } from 'vitest'
import { dialog } from './dialog'

describe('dialog', () => {
  test('defaults to a closed modal without dangling text references', () => {
    const result = dialog()
    expect(result.state).toEqual({ open: false, modal: true, present: false, status: 'exited' })
    expect(result.parts.content.attrs['aria-labelledby']).toBeUndefined()
    expect(result.parts.content.attrs['aria-describedby']).toBeUndefined()
  })
  test('trigger opens and close dismisses', () => {
    const change = vi.fn()
    const result = dialog({ onOpenChange: change })
    result.parts.trigger.on.click!({} as never)
    result.parts.close.on.click!({} as never)
    expect(change.mock.calls).toEqual([[true], [false]])
  })
  test('exiting content stays present and inert', () => {
    const result = dialog({ status: 'exiting' })
    expect(result.state.present).toBe(true)
    expect(result.parts.content.attrs.inert).toBe(true)
  })
})
