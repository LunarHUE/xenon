import axe from 'axe-core'
import { Collapsible } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('collapsible.a11y.1', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger aria-label="" />
        <Collapsible.Trigger as="div" aria-label="" />
      </>
    ),
  })
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['button-name', 'aria-command-name'] },
  })
  expect(results.violations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: 'button-name', impact: 'critical' }),
      expect.objectContaining({ id: 'aria-command-name', impact: 'serious' }),
    ])
  )
})

spec('collapsible.roles.1', async () => {
  const m = mount('collapsible', {
    defaultOpen: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const scope = within(m.container)
  expect(scope.getAllByRole('button', { name: 'Details' })).toHaveLength(1)
  expect(scope.getByText('Content')).toBeVisible()
  expect(m.container.querySelectorAll('[role="button"]')).toHaveLength(0)
  expect(m.container.querySelectorAll('[data-state="open"]')).toHaveLength(3)
})

spec('collapsible.pointer.5', async () => {
  const changed = vi.fn()
  const m = mount('collapsible', {
    defaultOpen: true,
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>
          <Collapsible.Trigger>Close panel</Collapsible.Trigger>
        </Collapsible.Content>
      </>
    ),
  })
  fireEvent.click(within(m.container).getByRole('button', { name: 'Close panel' }))
  await m.settle()
  expect(changed).toHaveBeenCalledWith(false)
  expect(within(m.container).queryByRole('button', { name: 'Close panel' })).toBeNull()
})

spec('collapsible.pointer.6', async () => {
  const changed = vi.fn()
  const adjacent = vi.fn()
  const m = mount('collapsible', {
    onOpenChange: changed,
    children: () => (
      <>
        <button onClick={adjacent}>Menu</button>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const scope = within(m.container)
  fireEvent.click(scope.getByRole('button', { name: 'Menu' }))
  await m.settle()
  expect(adjacent).toHaveBeenCalledOnce()
  expect(changed).not.toHaveBeenCalled()
  fireEvent.click(scope.getByRole('button', { name: 'Details' }))
  await m.settle()
  expect(changed).toHaveBeenCalledWith(true)
  expect(scope.getByRole('button', { name: 'Menu' })).toBeEnabled()
})
