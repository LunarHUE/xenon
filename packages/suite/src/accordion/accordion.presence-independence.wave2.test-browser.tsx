import { Accordion } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'
import { mount } from '../harness/solid'

test('independent multiple panels keep their own exit animation and measured dimensions', async () => {
  const m = mount('accordion', {
    mode: 'multiple',
    value: ['a', 'b'],
    children: () => (
      <>
        <Accordion.Item value="a">
          <Accordion.Trigger>First</Accordion.Trigger>
          <Accordion.Panel style={{ height: '80px', width: '160px' }}>
            First content
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>Second</Accordion.Trigger>
          <Accordion.Panel style={{ height: '120px', width: '240px' }}>
            Second content
          </Accordion.Panel>
        </Accordion.Item>
      </>
    ),
  })
  const scope = within(m.container)
  const first = scope.getByText('First content'),
    second = scope.getByText('Second content')
  await m.settle()
  const firstExit = first.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  const secondExit = second.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ value: [] })
  expect(first).toHaveAttribute('data-state', 'closed')
  expect(second).toHaveAttribute('data-state', 'closed')
  await m.settle()
  expect(first).toHaveAttribute('data-ending-style', '')
  expect(second).toHaveAttribute('data-ending-style', '')
  expect(first.style.getPropertyValue('--accordion-panel-height')).toBe('80px')
  expect(first.style.getPropertyValue('--accordion-panel-width')).toBe('160px')
  expect(second.style.getPropertyValue('--accordion-panel-height')).toBe('120px')
  expect(second.style.getPropertyValue('--accordion-panel-width')).toBe('240px')
  expect(first).toBeVisible()
  expect(second).toBeVisible()
  firstExit.finish()
  await firstExit.finished
  await m.settle()
  expect(first).not.toBeInTheDocument()
  expect(second).toBeInTheDocument()
  expect(second).toHaveAttribute('data-ending-style', '')
  expect(second.style.getPropertyValue('--accordion-panel-height')).toBe('120px')
  expect(second.style.getPropertyValue('--accordion-panel-width')).toBe('240px')
  secondExit.finish()
  await secondExit.finished
  await m.settle()
  expect(second).not.toBeInTheDocument()
})

test('switching single selection marks the incoming panel open while outgoing content still exits', async () => {
  const m = mount('accordion', {
    value: 'a',
    children: () => (
      <>
        <Accordion.Item value="a">
          <Accordion.Trigger>First</Accordion.Trigger>
          <Accordion.Panel>First content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>Second</Accordion.Trigger>
          <Accordion.Panel>Second content</Accordion.Panel>
        </Accordion.Item>
      </>
    ),
  })
  const scope = within(m.container)
  const outgoing = scope.getByText('First content')
  const exit = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ value: 'b' })
  const incoming = scope.getByText('Second content')
  expect(incoming).toHaveAttribute('data-state', 'open')
  expect(scope.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'true')
  expect(outgoing).toHaveAttribute('data-state', 'closed')
  await m.settle()
  expect(incoming).toBeVisible()
  expect(outgoing).toBeVisible()
  expect(outgoing).toHaveAttribute('data-ending-style', '')
  exit.finish()
  await exit.finished
  await m.settle()
  expect(outgoing).not.toBeInTheDocument()
  expect(scope.getByText('Second content')).toBe(incoming)
  expect(incoming).toBeVisible()
})
