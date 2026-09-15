import { Collapsible } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('collapsible.a11y.8', async () => {
  for (const props of [{}, { open: true }, { forceMount: true }]) {
    const m = mount('collapsible', {
      ...props,
      children: () => (
        <>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <button>Inside</button>
          </Collapsible.Content>
        </>
      ),
    })
    await expectNoViolations(m.container)
    m.unmount()
  }
})

spec('collapsible.a11y.1', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger>Native</Collapsible.Trigger>
        <Collapsible.Trigger as="div">Generic</Collapsible.Trigger>
      </>
    ),
  })
  expect(within(m.container).getByRole('button', { name: 'Native' })).toHaveAccessibleName('Native')
  expect(within(m.container).getByRole('button', { name: 'Generic' })).toHaveAccessibleName(
    'Generic'
  )
  await expectNoViolations(m.container, ['button-name', 'aria-command-name'])
})

spec('collapsible.a11y.5', async () => {
  const m = mount('collapsible', {
    forceMount: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button')
  const target = trigger.getAttribute('aria-controls')!
  expect([...document.querySelectorAll('[id]')].filter((el) => el.id === target)).toHaveLength(1)
  await expectNoViolations(m.container, ['duplicate-id-aria', 'aria-valid-attr-value'])
})
