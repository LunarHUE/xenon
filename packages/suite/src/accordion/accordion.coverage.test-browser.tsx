import { Accordion } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('accordion.focus.1', async () => {
  const m = mount('accordion', {
    children: () => (
      <>
        <button>Before accordion</button>
        <Accordion.Item value="a">
          <Accordion.Trigger>a</Accordion.Trigger>
          <Accordion.Panel>
            <button>Hidden a</button>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>b</Accordion.Trigger>
          <Accordion.Panel>
            <button>Hidden b</button>
          </Accordion.Panel>
        </Accordion.Item>
        <button>After accordion</button>
      </>
    ),
  })
  const scope = within(m.container)
  const [first, second] = scope.getAllByRole('button', { name: /^[ab]$/ })
  const before = scope.getByRole('button', { name: 'Before accordion' })
  const after = scope.getByRole('button', { name: 'After accordion' })
  before.focus()
  await userEvent.tab()
  expect(first).toHaveFocus()
  await userEvent.tab()
  expect(second).toHaveFocus()
  await userEvent.tab()
  expect(after).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(second).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(first).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(before).toHaveFocus()
})

spec('accordion.keyboard.11', async () => {
  const m = mount('accordion', {
    loop: false,
    children: () => (
      <Accordion.Item value="a">
        <Accordion.Trigger>a</Accordion.Trigger>
      </Accordion.Item>
    ),
  })
  const trigger = within(m.container).getByRole('button')
  trigger.focus()
  await userEvent.keyboard('{ArrowUp}')
  expect(trigger).toHaveFocus()
})
