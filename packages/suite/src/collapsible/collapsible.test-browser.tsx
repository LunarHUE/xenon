import { Collapsible } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { userEvent } from 'vitest/browser'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

for (const [id, key] of [
  ['collapsible.keyboard.1', '{Enter}'],
  ['collapsible.keyboard.2', ' '],
] as const) {
  spec(id, async () => {
    const changed = vi.fn()
    const m = mount('collapsible', {
      onOpenChange: changed,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <button>Inside</button>
          </Collapsible.Content>
        </>
      ),
    })
    const trigger = within(m.container).getByRole('button', { name: 'Details' })
    trigger.focus()
    await userEvent.keyboard(key)
    await m.settle()
    expect(within(m.container).getByRole('button', { name: 'Inside' })).toBeVisible()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard(key)
    await m.settle()
    expect(within(m.container).queryByRole('button', { name: 'Inside' })).toBeNull()
    expect(changed.mock.calls).toEqual([[true], [false]])
  })
}

describe('collapsible native focus order', () => {
  spec('collapsible.focus.3', async () => {
    const m = mount('collapsible', {
      defaultOpen: true,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <button>First</button>
            <a href="#last">Last</a>
          </Collapsible.Content>
        </>
      ),
    })
    const scope = within(m.container)
    scope.getByRole('button', { name: 'Details' }).focus()
    await userEvent.tab()
    expect(scope.getByRole('button', { name: 'First' })).toHaveFocus()
    await userEvent.tab()
    expect(scope.getByRole('link', { name: 'Last' })).toHaveFocus()
  })
  spec('collapsible.focus.2', async () => {
    const m = mount('collapsible', {
      forceMount: true,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <button>Hidden</button>
          </Collapsible.Content>
          <button>After</button>
        </>
      ),
    })
    const scope = within(m.container)
    scope.getByRole('button', { name: 'Details' }).focus()
    await userEvent.tab()
    expect(scope.getByRole('button', { name: 'After' })).toHaveFocus()
  })
})

spec('collapsible.keyboard.8', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger as="div">Generic</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Generic' })
  expect(trigger).toHaveAttribute('tabindex', '0')
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard(' ')
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

spec('collapsible.keyboard.3', async () => {
  const changed = vi.fn()
  const m = mount('collapsible', {
    disabled: true,
    onOpenChange: changed,
    children: () => (
      <>
        <button>Before</button>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'Before' }).focus()
  scope.getByRole('button', { name: 'Details' }).focus()
  await userEvent.keyboard('{Enter} ')
  await m.settle()
  expect(scope.queryByText('Contents')).toBeNull()
  expect(changed).not.toHaveBeenCalled()
})

spec('collapsible.pointer.3', async () => {
  const changed = vi.fn()
  const m = mount('collapsible', {
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Contents</Collapsible.Content>
      </>
    ),
  })
  await userEvent.click(within(m.container).getByRole('button'), { button: 'right' })
  await m.settle()
  expect(changed).not.toHaveBeenCalled()
  expect(within(m.container).queryByText('Contents')).toBeNull()
})

spec('collapsible.focus.1', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <button>Before</button>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
      </>
    ),
  })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'Details' })).toHaveFocus()
})
