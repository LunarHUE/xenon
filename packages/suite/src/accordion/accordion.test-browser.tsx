import { Accordion } from '@kit/solid'
import { within } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  return mount('accordion', {
    children: () => (
      <>
        <Accordion.Item value="a">
          <h3>
            <Accordion.Trigger>a</Accordion.Trigger>
          </h3>
          <Accordion.Panel>a content</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <h3>
            <Accordion.Trigger>b</Accordion.Trigger>
          </h3>
          <Accordion.Panel>b content</Accordion.Panel>
        </Accordion.Item>
      </>
    ),
    ...props,
  })
}

describe('accordion native keyboard', () => {
  for (const [id, key] of [
    ['accordion.keyboard.1', '{Enter}'],
    ['accordion.keyboard.2', ' '],
  ] as const) {
    spec(id, async () => {
      const changed = vi.fn()
      const m = fixture({ defaultValue: 'a', onValueChange: changed })
      const triggers = within(m.container).getAllByRole('button')
      triggers[1]!.focus()
      await m.settle()
      await userEvent.keyboard(key)
      await m.settle()
      expect(triggers[1]).toHaveAttribute('aria-expanded', 'true')
      expect(triggers[0]).toHaveAttribute('aria-expanded', 'false')
      expect(changed.mock.calls).toEqual([['b']])
    })
  }
  spec('accordion.keyboard.5', async () => {
    const m = fixture()
    const [first, second] = within(m.container).getAllByRole('button')
    first!.focus()
    await userEvent.tab()
    expect(second).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(first).toHaveFocus()
    expect(first).not.toHaveAttribute('tabindex', '-1')
    expect(second).not.toHaveAttribute('tabindex', '-1')
  })
})

spec('accordion.roles.26', async () => {
  const m = mount('accordion', {
    collapsible: true,
    children: () => (
      <Accordion.Item value="a">
        <Accordion.Trigger as="div">Generic</Accordion.Trigger>
        <Accordion.Panel>Content</Accordion.Panel>
      </Accordion.Item>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Generic' })
  expect(trigger).toHaveAttribute('tabindex', '0')
  expect(trigger).not.toHaveAttribute('type')
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard(' ')
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

spec('accordion.keyboard.3', async () => {
  const m = fixture({ defaultValue: 'a', collapsible: true })
  const first = within(m.container).getByRole('button', { name: 'a' })
  first.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  expect(first).toHaveAttribute('aria-expanded', 'false')
  await userEvent.keyboard(' ')
  await m.settle()
  expect(first).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard(' ')
  await m.settle()
  expect(first).toHaveAttribute('aria-expanded', 'false')
})

spec('accordion.keyboard.16', async () => {
  const m = fixture({ defaultValue: 'a' })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'a' }).focus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'b' })).toHaveFocus()
})

spec('accordion.focus.1', async () => {
  const m = mount('accordion', {
    defaultValue: 'a',
    children: () => (
      <>
        <Accordion.Item value="a">
          <Accordion.Trigger>a</Accordion.Trigger>
          <Accordion.Panel>
            <button>Inside</button>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="b">
          <Accordion.Trigger>b</Accordion.Trigger>
          <Accordion.Panel>
            <button>Hidden</button>
          </Accordion.Panel>
        </Accordion.Item>
      </>
    ),
  })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'a' }).focus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'Inside' })).toHaveFocus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'b' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(scope.getByRole('button', { name: 'Inside' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(scope.getByRole('button', { name: 'a' })).toHaveFocus()
})

spec('accordion.animation.3', async () => {
  const m = fixture({ forceMount: true, collapsible: true })
  const panel = within(m.container).getByText('a content')
  m.setProps({ value: 'a' })
  expect(panel).toHaveAttribute('data-starting-style', '')
  await m.settle()
  expect(panel).not.toHaveAttribute('data-starting-style')
  const animation = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ value: 'b' })
  await m.settle()
  expect(panel).toHaveAttribute('data-ending-style', '')
  expect(panel).not.toHaveAttribute('hidden')
  animation.finish()
  await animation.finished
  await m.settle()
  expect(panel).toHaveAttribute('hidden')
  expect(panel).not.toHaveAttribute('data-ending-style')
})

spec('accordion.animation.6', async () => {
  const m = fixture({ defaultValue: 'a', forceMount: true })
  const panel = within(m.container).getByText('a content')
  expect(panel.style.getPropertyValue('--accordion-panel-height')).toBe('auto')
  expect(panel.style.getPropertyValue('--accordion-panel-width')).toBe('auto')
  const animation = panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 10000 })
  m.setProps({ value: 'b' })
  await m.settle()
  expect(panel.style.getPropertyValue('--accordion-panel-height')).toBe(`${panel.scrollHeight}px`)
  expect(panel.style.getPropertyValue('--accordion-panel-width')).toBe(`${panel.scrollWidth}px`)
  animation.finish()
  await animation.finished
  await m.settle()
  expect(panel.style.getPropertyValue('--accordion-panel-height')).toBe('')
  expect(panel.style.getPropertyValue('--accordion-panel-width')).toBe('')
})
