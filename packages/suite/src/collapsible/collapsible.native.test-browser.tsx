/**
 * Native trigger cancellation, focus interaction with present/exiting panels, and
 * geometry-dependent measurement for Collapsible. Complements the shared suite
 * (which uses synthetic dispatch for cancel and composition) and the presence
 * browser suite (which compares published sizes against the same element's live
 * scroll size) with real-pointer, real-focus and fixed-geometry cases.
 */
import { Collapsible } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import domUserEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('an author click handler runs before the core toggle, which proposes exactly one change per click', async () => {
  const seen: Array<string | null> = []
  const changed = vi.fn()
  let trigger!: HTMLButtonElement
  const m = mount('collapsible', {
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger
          ref={(el) => {
            trigger = el as HTMLButtonElement
          }}
          onClick={() => seen.push(trigger.getAttribute('aria-expanded'))}
        >
          Details
        </Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  await userEvent.click(trigger)
  await m.settle()
  // Author-first ordering: the handler still sees the pre-toggle attribute.
  expect(seen).toEqual(['false'])
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(within(m.container).getByText('Contents')).toBeVisible()
  await userEvent.click(trigger)
  await m.settle()
  expect(seen).toEqual(['false', 'true'])
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(within(m.container).queryByText('Contents')).toBeNull()
  expect(changed.mock.calls).toEqual([[true], [false]])
})

test('a generic trigger that cancels its synthesized activation click does not toggle', async () => {
  const cancelled = vi.fn((event: MouseEvent) => event.preventDefault())
  const changed = vi.fn()
  const m = mount('collapsible', {
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger as="div" onClick={cancelled}>
          Generic
        </Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Generic' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  expect(cancelled).toHaveBeenCalledTimes(1)
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(within(m.container).queryByText('Contents')).toBeNull()
  await userEvent.keyboard(' ')
  await m.settle()
  expect(cancelled).toHaveBeenCalledTimes(2)
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(changed).not.toHaveBeenCalled()
})

test('a disabled native trigger delivers no click to the author handler while a disabled generic trigger still does', async () => {
  // user-event models the browser rule that a disabled control dispatches no click.
  const user = domUserEvent.setup()
  const nativeAuthor = vi.fn()
  const genericAuthor = vi.fn()
  const changed = vi.fn()
  const m = mount('collapsible', {
    disabled: true,
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger onClick={nativeAuthor}>Native</Collapsible.Trigger>
        <Collapsible.Trigger as="div" onClick={genericAuthor}>
          Generic
        </Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  const native = within(m.container).getByRole('button', { name: 'Native' })
  const generic = within(m.container).getByRole('button', { name: 'Generic' })
  expect(native.matches(':disabled')).toBe(true)
  expect(generic.matches(':disabled')).toBe(false)
  await user.click(native)
  await m.settle()
  expect(nativeAuthor).not.toHaveBeenCalled()
  await user.click(generic)
  await m.settle()
  expect(genericAuthor).toHaveBeenCalledTimes(1)
  expect(generic).toHaveAttribute('aria-expanded', 'false')
  expect(within(m.container).queryByText('Contents')).toBeNull()
  expect(changed).not.toHaveBeenCalled()
})

test('reopening mid-exit clears inert and restores tab access before a stale exit animation finishes', async () => {
  let content!: HTMLElement
  const m = mount('collapsible', {
    defaultOpen: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content
          ref={(el) => {
            content = el
          }}
        >
          <button>Panel action</button>
        </Collapsible.Content>
        <button>After</button>
      </>
    ),
  })
  const scope = within(m.container)
  const trigger = scope.getByRole('button', { name: 'Details' })
  const stale = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  await userEvent.click(trigger)
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(content).toHaveAttribute('inert')
  await userEvent.click(trigger)
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(document.contains(content)).toBe(true)
  expect(content).not.toHaveAttribute('inert')
  expect(content).not.toHaveAttribute('data-ending-style')
  stale.finish()
  await stale.finished
  await m.settle()
  expect(document.contains(content)).toBe(true)
  expect(content).not.toHaveAttribute('inert')
  trigger.focus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'Panel action' })).toHaveFocus()
  await userEvent.click(trigger)
  await m.settle()
  expect(document.contains(content)).toBe(false)
})

test('panel size properties publish the scroll box, not the laid-out box, while entering and exiting', async () => {
  let content!: HTMLElement
  const m = mount('collapsible', {
    open: false,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content
          ref={(el) => {
            content = el
          }}
          style={{ width: '240px', height: '40px', overflow: 'hidden' }}
        >
          <div style={{ height: '96px' }}>Tall contents</div>
        </Collapsible.Content>
      </>
    ),
  })
  expect(within(m.container).queryByText('Tall contents')).toBeNull()
  m.setProps({ open: true })
  expect(within(m.container).getByText('Tall contents')).toBeVisible()
  expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('96px')
  expect(content.style.getPropertyValue('--collapsible-panel-width')).toBe('240px')
  await m.settle()
  // Fixed geometry so the published scroll size is distinguishable from the 40px box.
  expect(content.scrollHeight).toBe(96)
  expect(content.scrollWidth).toBe(240)
  expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
  expect(content.style.getPropertyValue('--collapsible-panel-width')).toBe('auto')
  const exit = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ open: false })
  expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('96px')
  expect(content.style.getPropertyValue('--collapsible-panel-width')).toBe('240px')
  await m.settle()
  exit.finish()
  await exit.finished
  await m.settle()
  expect(document.contains(content)).toBe(false)
})
