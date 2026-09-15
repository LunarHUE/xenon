import { Tabs } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import { vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('tabs.focus.17', async () => {
  const m = mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">a</Tabs.Tab>
          <Tabs.Tab value="b">b</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">a content</Tabs.Panel>
        <Tabs.Panel value="b">
          <input aria-label="Entry" />
        </Tabs.Panel>
      </>
    ),
  })
  const scope = within(m.container)
  const tab = scope.getByRole('tab', { name: 'b' })
  const tabA = scope.getByRole('tab', { name: 'a' })
  await userEvent.click(tab)
  const input = scope.getByRole('textbox')
  const blur = vi.fn()
  input.addEventListener('blur', blur)
  input.focus()
  await userEvent.click(tabA)
  expect(input).not.toHaveFocus()
  expect(tabA).toHaveAttribute('aria-selected', 'true')
  expect(blur).toHaveBeenCalledTimes(1)
  expect(scope.getByRole('tabpanel', { name: 'a' })).toBeVisible()
})
