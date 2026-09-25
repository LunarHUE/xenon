import { Tabs } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture() {
  return mount('tabs', {
    children: () => (
      <>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab value="a">First</Tabs.Tab>
          <Tabs.Tab value="b">Second</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="a">Content</Tabs.Panel>
        <Tabs.Panel value="b">
          <button>Hidden action</button>
        </Tabs.Panel>
      </>
    ),
  })
}

spec('tabs.a11y.1', async () => {
  const m = fixture()
  for (const tab of within(m.container).getAllByRole('tab')) expect(tab).toHaveAccessibleName()
  await expectNoViolations(m.container, ['aria-command-name'])
})
spec('tabs.a11y.3', async () => {
  const m = fixture()
  await expectNoViolations(m.container, ['aria-required-parent'])
})
spec('tabs.a11y.5', async () => {
  const m = fixture()
  await expectNoViolations(m.container, ['nested-interactive'])
})
spec('tabs.a11y.6', async () => {
  const m = fixture()
  await expectNoViolations(m.container, [
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr-value',
  ])
})
spec('tabs.a11y.10', async () => {
  const m = fixture()
  for (const el of m.container.querySelectorAll('[tabindex]'))
    expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
  await expectNoViolations(m.container, ['tabindex'])
})
spec('tabs.a11y.11', async () => {
  const first = fixture()
  const second = fixture()
  const ids = [
    ...first.container.querySelectorAll('[id]'),
    ...second.container.querySelectorAll('[id]'),
  ].map((el) => el.id)
  expect(new Set(ids).size).toBe(ids.length)
  await expectNoViolations(document.body, ['duplicate-id-aria'])
})
