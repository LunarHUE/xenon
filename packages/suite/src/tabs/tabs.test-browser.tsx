import { Tabs } from '@kit/solid'
import { within } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  return mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b">b</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">a content</Tabs.Panel>
        <Tabs.Panel value="b">b content</Tabs.Panel>
      </>
    ),
    ...props,
  })
}

describe('tabs native keyboard', () => {
  for (const [id, key] of [
    ['tabs.keyboard.14', '{Enter}'],
    ['tabs.keyboard.15', ' '],
  ] as const) {
    spec(id, async () => {
      const changed = vi.fn()
      const m = fixture({ activationMode: 'manual', onValueChange: changed })
      const tabs = within(m.container).getAllByRole('tab')
      tabs[0]!.focus()
      await userEvent.keyboard('{ArrowRight}')
      await m.settle()
      expect(tabs[1]).toHaveFocus()
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
      expect(changed).not.toHaveBeenCalled()
      await userEvent.keyboard(key)
      await m.settle()
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
      expect(changed.mock.calls).toEqual([['b']])
    })
  }
  spec('tabs.keyboard.2', async () => {
    const m = fixture({ defaultValue: 'b' })
    const tab = within(m.container).getByRole('tab', { name: 'b' })
    tab.focus()
    await userEvent.tab()
    expect(within(m.container).getByRole('tabpanel')).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(tab).toHaveFocus()
  })
  spec('tabs.focus.6', async () => {
    const m = fixture({
      children: () => (
        <>
          <Tabs.List>
            <Tabs.Tab value="a">a</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="a">
            <p>Leading text</p>
            <button>Later button</button>
          </Tabs.Panel>
        </>
      ),
    })
    const panel = within(m.container).getByRole('tabpanel')
    expect(panel).not.toHaveAttribute('tabindex')
    within(m.container).getByRole('tab').focus()
    await userEvent.tab()
    expect(within(m.container).getByRole('button', { name: 'Later button' })).toHaveFocus()
  })
})

spec('tabs.keyboard.1', async () => {
  const m = fixture({
    defaultValue: 'b',
    children: () => (
      <>
        <button>Before</button>
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b">b</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="b">b content</Tabs.Panel>
      </>
    ),
  })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  expect(scope.getByRole('tab', { name: 'b' })).toHaveFocus()
})

spec('tabs.pointer.3', async () => {
  const m = fixture()
  const scope = within(m.container)
  const tab = scope.getByRole('tab', { name: 'b' })
  await userEvent.click(tab)
  await m.settle()
  expect(tab).toHaveAttribute('tabindex', '0')
  await userEvent.tab()
  await userEvent.tab({ shift: true })
  expect(tab).toHaveFocus()
})

spec('tabs.pointer.4', async () => {
  const changed = vi.fn()
  const m = fixture({
    onValueChange: changed,
    children: () => (
      <>
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b" disabled>
            b
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">a content</Tabs.Panel>
      </>
    ),
  })
  const scope = within(m.container)
  const tab = scope.getByRole('tab', { name: 'b' })
  scope.getByRole('tab', { name: 'a' }).focus()
  // DOM click() exercises the native disabled activation algorithm without a driver timeout.
  tab.click()
  await m.settle()
  expect(changed).not.toHaveBeenCalled()
  expect(tab).not.toHaveFocus()
  expect(scope.getByRole('tabpanel')).toBeVisible()
})

spec('tabs.focus.4', async () => {
  const empty = fixture()
  within(empty.container).getByRole('tab', { name: 'a' }).focus()
  await userEvent.tab()
  expect(within(empty.container).getByRole('tabpanel')).toHaveFocus()
  empty.unmount()
  const m = fixture({
    children: () => (
      <>
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <button>Action</button>
        </Tabs.Panel>
      </>
    ),
  })
  within(m.container).getByRole('tab').focus()
  await userEvent.tab()
  expect(within(m.container).getByRole('button')).toHaveFocus()
  expect(within(m.container).getByRole('tabpanel')).not.toHaveAttribute('tabindex')
})

spec('tabs.focus.9', async () => {
  const m = fixture({
    children: () => (
      <>
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">
          <button>Action</button>
        </Tabs.Panel>
      </>
    ),
  })
  within(m.container).getByRole('button').focus()
  await userEvent.tab({ shift: true })
  expect(within(m.container).getByRole('tab')).toHaveFocus()
})

spec('tabs.focus.10', async () => {
  const m = fixture({
    disabled: true,
    children: () => (
      <>
        <button>Before</button>
        <Tabs.List>
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b">b</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">a content</Tabs.Panel>
      </>
    ),
  })
  within(m.container).getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  expect(within(m.container).getByRole('tabpanel')).toHaveFocus()
})
