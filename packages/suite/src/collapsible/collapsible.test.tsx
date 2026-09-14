import { Collapsible } from '@tenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { createRoot, createSignal } from 'solid-js'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
    ...props,
  })
  return {
    ...m,
    trigger: within(m.container).getByRole('button'),
    content: () => within(m.container).queryByText('Contents'),
  }
}

describe('collapsible conformance', () => {
  spec('collapsible.pointer.1', async () => {
    const m = fixture()
    expect(m.content()).toBeNull()
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toBeVisible()
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toBeNull()
  })
  spec('collapsible.roles.3', () => {
    const m = mount('collapsible', {
      children: () => (
        <>
          <Collapsible.Trigger>Default</Collapsible.Trigger>
          <Collapsible.Trigger type="submit">Submit</Collapsible.Trigger>
          <Collapsible.Trigger as="div">Generic</Collapsible.Trigger>
        </>
      ),
    })
    const scope = within(m.container)
    expect(scope.getByText('Default')).toHaveAttribute('type', 'button')
    expect(scope.getByText('Submit')).toHaveAttribute('type', 'submit')
    expect(scope.getByText('Generic')).not.toHaveAttribute('type')
  })

  spec('collapsible.roles.2', async () => {
    const m = fixture()
    expect(m.trigger).toHaveAttribute('aria-expanded', 'false')
    m.setProps({ open: true })
    await m.settle()
    expect(m.trigger).toHaveAttribute('aria-expanded', 'true')
  })
  spec('collapsible.roles.6', async () => {
    const m = fixture()
    const id = m.trigger.getAttribute('aria-controls')
    expect(id).toBeTruthy()
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toHaveAttribute('id', id!)
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.trigger).toHaveAttribute('aria-controls', id!)
  })
  spec('collapsible.roles.7', async () => {
    const [id, setId] = createSignal<string | undefined>('custom')
    const m = fixture({
      defaultOpen: true,
      children: () => (
        <>
          <Collapsible.Trigger id="trigger">Details</Collapsible.Trigger>
          <Collapsible.Content id={id()}>Contents</Collapsible.Content>
        </>
      ),
    })
    expect(m.trigger).toHaveAttribute('id', 'trigger')
    expect(m.trigger).toHaveAttribute('aria-controls', 'custom')
    setId('replacement')
    await m.settle()
    expect(m.trigger).toHaveAttribute('aria-controls', 'replacement')
    setId(undefined)
    await m.settle()
    expect(m.content()!.id).toBeTruthy()
    expect(m.content()!.id).not.toBe('replacement')
    expect(m.trigger).toHaveAttribute('aria-controls', m.content()!.id)
  })
  spec('collapsible.roles.10', () => {
    const m = fixture({ defaultOpen: true })
    expect(m.content()).not.toHaveAttribute('role')
    expect(m.content()).not.toHaveAttribute('aria-labelledby')
  })
  spec('collapsible.roles.11', () => {
    const m = fixture({ disabled: true })
    expect(m.trigger).toBeDisabled()
    expect(m.trigger).toHaveAttribute('data-disabled', '')
  })
  spec('collapsible.roles.12', async () => {
    const m = fixture({ forceMount: true })
    for (const el of [m.container.firstElementChild, m.trigger, m.content()])
      expect(el).toHaveAttribute('data-state', 'closed')
    fireEvent.click(m.trigger)
    await m.settle()
    for (const el of [m.container.firstElementChild, m.trigger, m.content()])
      expect(el).toHaveAttribute('data-state', 'open')
  })
  spec('collapsible.pointer.2', async () => {
    const changed = vi.fn()
    const m = fixture({ disabled: true, onOpenChange: changed })
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toBeNull()
    expect(changed).not.toHaveBeenCalled()
  })
  spec('collapsible.pointer.4', async () => {
    const changed = vi.fn()
    const author = vi.fn((event: MouseEvent) => {
      expect(changed).not.toHaveBeenCalled()
      event.preventDefault()
    })
    const m = fixture({
      onOpenChange: changed,
      children: () => (
        <>
          <Collapsible.Trigger onClick={author}>Details</Collapsible.Trigger>
          <Collapsible.Content>Contents</Collapsible.Content>
        </>
      ),
    })
    fireEvent.click(m.trigger)
    await m.settle()
    expect(author).toHaveBeenCalledOnce()
    expect(changed).not.toHaveBeenCalled()
    expect(m.content()).toBeNull()
  })
  spec('collapsible.state.1', () => {
    const changed = vi.fn()
    const closed = fixture({ onOpenChange: changed })
    const open = fixture({ defaultOpen: true, onOpenChange: changed })
    expect(closed.content()).toBeNull()
    expect(open.content()).toBeVisible()
    expect(changed).not.toHaveBeenCalled()
  })
  spec('collapsible.state.2', async () => {
    const changed = vi.fn()
    const m = fixture({ onOpenChange: changed })
    fireEvent.click(m.trigger)
    await m.settle()
    fireEvent.click(m.trigger)
    await m.settle()
    expect(changed.mock.calls).toEqual([[true], [false]])
  })
  spec('collapsible.state.3', async () => {
    const changed = vi.fn()
    const m = fixture({ open: false, onOpenChange: changed })
    fireEvent.click(m.trigger)
    await m.settle()
    expect(changed.mock.calls).toEqual([[true]])
    expect(m.trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.content()).toBeNull()
  })
  spec('collapsible.state.4', async () => {
    const changed = vi.fn()
    const m = fixture({ open: false, onOpenChange: changed })
    m.setProps({ open: true })
    await m.settle()
    expect(m.content()).toBeVisible()
    expect(m.trigger).toHaveAttribute('aria-controls', m.content()!.id)
    m.setProps({ open: false })
    await m.settle()
    expect(m.content()).toBeNull()
    expect(m.trigger).toHaveAttribute('aria-expanded', 'false')
    expect(changed).not.toHaveBeenCalled()
  })
  spec('collapsible.state.8', () => {
    const m = fixture({ open: true, disabled: true })
    expect(m.content()).toBeVisible()
    expect(m.trigger).toBeDisabled()
  })
  spec('collapsible.animation.8', async () => {
    const m = fixture({ forceMount: true })
    const panel = m.content()
    expect(panel).toHaveAttribute('hidden')
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toBe(panel)
    expect(panel).not.toHaveAttribute('hidden')
    fireEvent.click(m.trigger)
    await m.settle()
    expect(m.content()).toBe(panel)
    expect(panel).toHaveAttribute('hidden')
  })
})

spec('collapsible.roles.1', () => {
  const m = mount('collapsible', {
    defaultOpen: true,
    children: () => (
      <>
        <Collapsible.Trigger as="input" value="Details" />
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Details' })
  expect(trigger.tagName).toBe('INPUT')
  expect(trigger).toHaveAttribute('type', 'button')
  expect(within(m.container).getByText('Contents')).toBeVisible()
})

spec('collapsible.state.11', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger>Outer</Collapsible.Trigger>
        <Collapsible.Content>
          <Collapsible>
            <Collapsible.Trigger>Inner</Collapsible.Trigger>
            <Collapsible.Content>Nested content</Collapsible.Content>
          </Collapsible>
        </Collapsible.Content>
      </>
    ),
  })
  const scope = within(m.container)
  fireEvent.click(scope.getByRole('button', { name: 'Outer' }))
  await m.settle()
  expect(scope.queryByText('Nested content')).toBeNull()
  fireEvent.click(scope.getByRole('button', { name: 'Inner' }))
  await m.settle()
  expect(scope.getByText('Nested content')).toBeVisible()
  expect(scope.getByRole('button', { name: 'Outer' })).toHaveAttribute('aria-expanded', 'true')
})

spec('collapsible.notes.3', async () => {
  const a = fixture()
  const b = fixture()
  fireEvent.click(a.trigger)
  await a.settle()
  fireEvent.click(b.trigger)
  await b.settle()
  expect(a.content()).toBeVisible()
  expect(b.content()).toBeVisible()
})

spec('collapsible.notes.4', () => {
  const triggerRef = vi.fn()
  const contentRef = vi.fn()
  const rootRef = vi.fn()
  const m = mount('collapsible', {
    as: 'section',
    defaultOpen: true,
    ref: rootRef,
    'data-author': 'root',
    children: () => (
      <>
        <Collapsible.Trigger as="div" ref={triggerRef} data-author="trigger">
          Details
        </Collapsible.Trigger>
        <Collapsible.Content
          as="article"
          ref={contentRef}
          data-author="content"
          style={{ color: 'red' }}
        >
          Contents
        </Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button')
  const content = within(m.container).getByText('Contents')
  expect(m.container.firstElementChild!.tagName).toBe('SECTION')
  expect(rootRef).toHaveBeenCalledWith(m.container.firstElementChild)
  expect(triggerRef).toHaveBeenCalledWith(trigger)
  expect(contentRef).toHaveBeenCalledWith(content)
  expect(trigger).toHaveAttribute('data-author', 'trigger')
  expect(content).toHaveAttribute('data-author', 'content')
  expect(content.tagName).toBe('ARTICLE')
  expect(content.style.color).toBe('red')
  expect(content.style.getPropertyValue('--collapsible-panel-height')).toBe('auto')
})

spec('collapsible.notes.6', () => {
  expect(() =>
    createRoot((dispose) => {
      try {
        return Collapsible.Trigger({})
      } finally {
        dispose()
      }
    })
  ).toThrow(/Collapsible/)
  expect(() =>
    createRoot((dispose) => {
      try {
        return Collapsible.Content({})
      } finally {
        dispose()
      }
    })
  ).toThrow(/Collapsible/)
})
