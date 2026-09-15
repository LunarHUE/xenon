import { describe, expect, test, vi } from 'vitest'

import { collapsible } from './collapsible'

const ids = { trigger: 'x-trigger', content: 'x-panel' }

function click(part: { on: { click?: (event: never) => void } }) {
  const event = { preventDefault: vi.fn() }
  part.on.click?.(event as never)
  return event
}

describe('collapsible', () => {
  test('closed by default and the content is absent', () => {
    const { state, parts } = collapsible({ ids })
    expect(state).toEqual({ open: false, present: false, status: 'exited', disabled: false })
    expect(parts.root.attrs['data-state']).toBe('closed')
    expect(parts.trigger.attrs).toMatchObject({
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'x-panel',
      id: 'x-trigger',
    })
  })

  test('aria-controls stays put while closed', () => {
    expect(collapsible({ ids, open: true }).parts.trigger.attrs['aria-controls']).toBe('x-panel')
    expect(collapsible({ ids, open: false }).parts.trigger.attrs['aria-controls']).toBe('x-panel')
  })

  test('the content carries no role and no label wiring', () => {
    const { attrs } = collapsible({ ids, open: true }).parts.content
    expect(attrs).not.toHaveProperty('role')
    expect(attrs).not.toHaveProperty('aria-labelledby')
    expect(attrs).toMatchObject({ id: 'x-panel', 'data-state': 'open' })
  })

  test('open reports present and the exit phase keeps it present', () => {
    expect(collapsible({ open: true }).state.present).toBe(true)
    const exiting = collapsible({ open: false, status: 'exiting' })
    expect(exiting.state.present).toBe(true)
    expect(exiting.parts.content.attrs['data-ending-style']).toBe('')
    expect(collapsible({ open: true, status: 'entering' }).parts.content.attrs).toMatchObject({
      'data-starting-style': '',
    })
  })

  test('force mount keeps the content and hides it while closed', () => {
    const closed = collapsible({ forceMount: true })
    expect(closed.state.present).toBe(true)
    expect(closed.parts.content.attrs.hidden).toBe(true)
    expect(
      collapsible({ forceMount: true, open: false, status: 'exiting' }).parts.content.attrs
    ).not.toHaveProperty('hidden', true)
  })

  test('the trigger proposes the opposite of the current state', () => {
    const onOpenChange = vi.fn()
    click(collapsible({ onOpenChange }).parts.trigger)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    click(collapsible({ open: true, onOpenChange }).parts.trigger)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  test.each([false, true])('a cancelled click does not change open=%s', (open) => {
    const onOpenChange = vi.fn()
    const { parts } = collapsible({ open, onOpenChange })
    const event = new Event('click', { cancelable: true })
    event.preventDefault()

    parts.trigger.on.click?.(event as never)

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('disabled blocks the trigger and marks every part', () => {
    const onOpenChange = vi.fn()
    const { parts } = collapsible({ ids, disabled: true, open: true, onOpenChange })
    expect(parts.trigger.attrs.disabled).toBe(true)
    expect(parts.root.attrs['data-disabled']).toBe('')
    expect(parts.content.attrs['data-disabled']).toBe('')
    expect(click(parts.trigger).preventDefault).toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
