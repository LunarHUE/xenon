import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Popover, usePopover } from './popover'
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

describe('Popover handles', () => {
  test('detached triggers share live payload and trigger state without remounting content', () => {
    const handle = Popover.createHandle<{ name: string }>()
    const change = vi.fn()
    const { getByText, container } = render(() => (
      <>
        <Popover.Trigger handle={handle} id="first" payload={{ name: 'Alpha' }}>
          First detached
        </Popover.Trigger>
        <Popover.Trigger handle={handle} id="second" payload={{ name: 'Beta' }}>
          Second detached
        </Popover.Trigger>
        <Popover handle={handle} onOpenChange={change}>
          {(state) => (
            <Popover.Positioner>
              <Popover.Content aria-label="Shared details">
                <span>{state.payload?.name}</span>
                <span data-testid="selected">{state.triggerId}</span>
              </Popover.Content>
            </Popover.Positioner>
          )}
        </Popover>
      </>
    ))
    getByText('First detached').click()
    flush()
    const content = container.querySelector('[role="dialog"]')
    expect(content).toHaveTextContent('Alpha')
    expect(content).toHaveTextContent('first')
    expect(handle.isOpen).toBe(true)
    getByText('Second detached').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toBe(content)
    expect(content).toHaveTextContent('Beta')
    expect(content).toHaveTextContent('second')
    expect(getByText('First detached')).toHaveAttribute('aria-expanded', 'false')
    expect(getByText('Second detached')).toHaveAttribute('aria-expanded', 'true')
    expect(change.mock.calls).toEqual([[true]])
    getByText('Second detached').click()
    flush()
    expect(handle.isOpen).toBe(false)
  })

  test('imperative opening selects registered IDs and updates payload using the current anchor', () => {
    const handle = Popover.createHandle<string | undefined>()
    const { container } = render(() => (
      <>
        <Popover.Trigger handle={handle} id="imperative-first" payload="first payload">
          First
        </Popover.Trigger>
        <Popover.Trigger handle={handle} id="imperative-second" payload="second payload">
          Second
        </Popover.Trigger>
        <Popover handle={handle}>
          {(state) => (
            <Popover.Positioner>
              <Popover.Content aria-label="Details">
                {state.payload ?? 'empty'} / {state.triggerId}
              </Popover.Content>
            </Popover.Positioner>
          )}
        </Popover>
      </>
    ))
    handle.open('missing')
    flush()
    expect(handle.isOpen).toBe(false)
    handle.open('imperative-second')
    flush()
    expect(container.querySelector('[role="dialog"]')).toHaveTextContent(
      'second payload / imperative-second'
    )
    handle.openWithPayload('replacement')
    flush()
    expect(container.querySelector('[role="dialog"]')).toHaveTextContent(
      'replacement / imperative-second'
    )
    handle.openWithPayload(undefined)
    flush()
    expect(container.querySelector('[role="dialog"]')).toHaveTextContent(
      'empty / imperative-second'
    )
    handle.close()
    flush()
    expect(handle.isOpen).toBe(false)
  })

  test('a root mounted after its detached trigger attaches and releases without replay', () => {
    const handle = Popover.createHandle<string>()
    const [mounted, setMounted] = createSignal(false)
    const { getByText, container } = render(() => (
      <>
        <Popover.Trigger handle={handle} payload="later">
          Persistent trigger
        </Popover.Trigger>
        <Show when={mounted()}>
          <Popover handle={handle}>
            {(state) => (
              <Popover.Positioner>
                <Popover.Content aria-label="Details">{state.payload}</Popover.Content>
              </Popover.Positioner>
            )}
          </Popover>
        </Show>
      </>
    ))
    getByText('Persistent trigger').click()
    handle.open()
    setMounted(true)
    flush()
    expect(handle.isOpen).toBe(false)
    getByText('Persistent trigger').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toHaveTextContent('later')
    setMounted(false)
    flush()
    expect(handle.isOpen).toBe(false)
    getByText('Persistent trigger').click()
    handle.openWithPayload('ignored')
    setMounted(true)
    flush()
    expect(handle.isOpen).toBe(false)
    getByText('Persistent trigger').click()
    flush()
    expect(container.querySelector('[role="dialog"]')).toHaveTextContent('later')
  })

  test('controlled roots remain authoritative and floating commands require an anchor', () => {
    const handle = Popover.createHandle<string>()
    const change = vi.fn()
    const { unmount } = render(() => <Popover handle={handle} onOpenChange={change} />)
    handle.openWithPayload('unanchored')
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(handle.isOpen).toBe(false)
    unmount()
    const [open, setOpen] = createSignal(false)
    render(() => (
      <Popover handle={handle} open={open()} onOpenChange={change}>
        <Popover.Trigger id="controlled">Open</Popover.Trigger>
      </Popover>
    ))
    handle.open('controlled')
    flush()
    expect(change).toHaveBeenCalledWith(true)
    expect(handle.isOpen).toBe(false)
    setOpen(true)
    flush()
    expect(handle.isOpen).toBe(true)
    handle.close()
    flush()
    expect(change).toHaveBeenCalledWith(false)
    expect(handle.isOpen).toBe(true)
  })
})

test('Popover notifies viewport observers before replacing the current payload DOM', () => {
  const handle = Popover.createHandle<string>()
  const snapshots: string[] = []
  function Observe() {
    const context = usePopover('observer')
    context.beforeChange(() => snapshots.push(context.content()?.textContent ?? ''))
    return null
  }
  const { getByText, container } = render(() => (
    <Popover handle={handle}>
      {(state) => (
        <>
          <Observe />
          <Popover.Trigger id="old" payload="Old payload">
            Old trigger
          </Popover.Trigger>
          <Popover.Trigger id="new" payload="New payload">
            New trigger
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content aria-label="Details">{state.payload}</Popover.Content>
          </Popover.Positioner>
        </>
      )}
    </Popover>
  ))
  getByText('Old trigger').click()
  flush()
  expect(snapshots).toEqual([])
  getByText('New trigger').click()
  expect(snapshots).toEqual(['Old payload'])
  flush()
  expect(container.querySelector('[role="dialog"]')).toHaveTextContent('New payload')
  handle.openWithPayload('Imperative payload')
  expect(snapshots).toEqual(['Old payload', 'New payload'])
  flush()
})

test('Popover Viewport wires trigger changes into inert previous content', async () => {
  const handle = Popover.createHandle<string>()
  const previousAnimations = Object.getOwnPropertyDescriptor(Element.prototype, 'getAnimations')
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => [{ playState: 'running', finished: new Promise(() => {}) }],
  })
  const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  const view = render(() => (
    <Popover handle={handle}>
      {(state) => (
        <>
          <Popover.Trigger id="viewport-first" payload="First content">
            First
          </Popover.Trigger>
          <Popover.Trigger id="viewport-second" payload="Second content">
            Second
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content aria-label="Details">
              <Popover.Viewport>
                <span id="current-record">{state.payload}</span>
              </Popover.Viewport>
            </Popover.Content>
          </Popover.Positioner>
        </>
      )}
    </Popover>
  ))
  try {
    view.getByText('First').click()
    flush()
    await Promise.resolve()
    view.getByText('Second').click()
    flush()
    await Promise.resolve()
    expect(view.container.querySelector('[data-current]')).toHaveTextContent('Second content')
    expect(view.container.querySelector('[data-previous]')).toHaveTextContent('First content')
    expect(view.container.querySelector('[data-previous]')).toHaveAttribute('aria-hidden', 'true')
    expect(view.container.querySelectorAll('#current-record')).toHaveLength(1)
    expect(view.container.querySelector('[data-part="viewport"]')).not.toHaveAttribute('tabindex')
    handle.close()
    flush()
    expect(view.container.querySelector('[data-previous]')).toBeNull()
  } finally {
    view.unmount()
    frame.mockRestore()
    cancel.mockRestore()
    if (previousAnimations)
      Object.defineProperty(Element.prototype, 'getAnimations', previousAnimations)
    else delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  }
})

test('composes nested content refs and removes authored undefined associations', () => {
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <Popover defaultOpen>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content ref={refs} aria-label="Example">
          <Popover.Title id={undefined}>Title</Popover.Title>
          <Popover.Description id={undefined}>Description</Popover.Description>
          <Popover.Close aria-label={undefined}>Close</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  expect(host).toHaveBeenCalledWith(view.getByRole('dialog', { hidden: true }))
  expect(view.getByText('Title')).not.toHaveAttribute('id')
  expect(view.getByRole('dialog', { hidden: true })).not.toHaveAttribute('aria-describedby')
  expect(view.getByText('Close')).not.toHaveAttribute('aria-label')
})
