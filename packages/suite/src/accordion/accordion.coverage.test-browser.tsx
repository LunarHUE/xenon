import { Accordion } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('accordion.focus.1', async () => {
  const m = mount('accordion', {
    children: () => (
      <>
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
      </>
    ),
  })
  const scope = within(m.container)
  const [first, second] = scope.getAllByRole('button', { name: /^[ab]$/ })
  first!.focus()
  await userEvent.tab()
  expect(second).toHaveFocus()
  await userEvent.tab()
  expect(document.body).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(second).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(first).toHaveFocus()
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
