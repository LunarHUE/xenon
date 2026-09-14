import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Popover } from './popover'
afterEach(cleanup)
describe('Popover', () => {
  test('toggles and registers author IDs on its dialog', () => {
    const change = vi.fn()
    const { getByText, container } = render(() => (
      <Popover onOpenChange={change}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content id="popup">
            <Popover.Title id="heading">Heading</Popover.Title>
            <Popover.Description id="description">Explanation</Popover.Description>
            <Popover.Close />
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    ))
    expect(change).not.toHaveBeenCalled()
    expect(getByText('Open')).not.toHaveAttribute('aria-controls')
    getByText('Open').click()
    flush()
    const content = container.querySelector('[role="dialog"]')!
    expect(content).toHaveAttribute('aria-labelledby', 'heading')
    expect(content).toHaveAttribute('aria-describedby', 'description')
    expect(content).toHaveAttribute('tabindex', '-1')
    expect(getByText('Open')).toHaveAttribute('aria-controls', 'popup')
    expect(content.parentElement).toHaveAttribute('popover', 'manual')
    expect(content.querySelector('button')).toHaveAttribute('aria-label', 'Close popover')
    getByText('Open').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(change.mock.calls).toEqual([[true], [false]])
  })
  test('controlled state, author cancellation, and disabled trigger', () => {
    const change = vi.fn()
    const { getByText } = render(() => (
      <Popover open={false} onOpenChange={change}>
        <Popover.Trigger onClick={(e) => e.preventDefault()}>Veto</Popover.Trigger>
        <Popover.Trigger as="div" disabled>
          Disabled
        </Popover.Trigger>
        <Popover.Trigger>Open</Popover.Trigger>
      </Popover>
    ))
    getByText('Veto').click()
    getByText('Disabled').click()
    flush()
    expect(change).not.toHaveBeenCalled()
    getByText('Open').click()
    flush()
    expect(change).toHaveBeenCalledWith(true)
    expect(getByText('Open')).toHaveAttribute('aria-expanded', 'false')
  })
  test('switching active triggers preserves content and only expands the active trigger', () => {
    const { getByText, container } = render(() => (
      <Popover>
        <Popover.Trigger>First</Popover.Trigger>
        <Popover.Trigger>Second</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details" />
        </Popover.Positioner>
      </Popover>
    ))
    getByText('First').click()
    flush()
    const content = container.querySelector('[role="dialog"]')
    getByText('Second').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toBe(content)
    expect(getByText('First')).toHaveAttribute('aria-expanded', 'false')
    expect(getByText('First')).not.toHaveAttribute('aria-controls')
    expect(getByText('Second')).toHaveAttribute('aria-expanded', 'true')
  })
  test('force mounting retains content while IDs update reactively', () => {
    const [id, setId] = createSignal('first')
    const { getByText, container } = render(() => (
      <Popover forceMount>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title id={id()}>Title</Popover.Title>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    ))
    const content = container.querySelector('[role="dialog"]')!
    expect(content).toHaveAttribute('hidden')
    setId('second')
    flush()
    expect(content).toHaveAttribute('aria-labelledby', 'second')
    getByText('Open').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toBe(content)
    expect(content).not.toHaveAttribute('hidden')
  })
  test('removing the active trigger falls back to a remaining mounted trigger', () => {
    const [visible, setVisible] = createSignal(true)
    const { getByText } = render(() => (
      <Popover>
        <Show when={visible()}>
          <Popover.Trigger>First</Popover.Trigger>
        </Show>
        <Popover.Trigger>Second</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details" />
        </Popover.Positioner>
      </Popover>
    ))
    getByText('First').click()
    flush()
    setVisible(false)
    flush()
    expect(getByText('Second')).toHaveAttribute('aria-expanded', 'true')
    getByText('Second').click()
    flush()
    expect(getByText('Second')).toHaveAttribute('aria-expanded', 'false')
  })
})
