import { Tabs } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('tabs.positioning.12', async () => {
  const m = mount('tabs', {
    children: () => (
      <div style={{ width: '80px', overflow: 'auto' }}>
        <Tabs.List aria-label="Sections" style={{ width: '300px' }}>
          <Tabs.Tab value="a" style={{ width: '100px' }}>
            A
          </Tabs.Tab>
          <Tabs.Tab value="b" style={{ width: '100px' }}>
            B
          </Tabs.Tab>
          <Tabs.Tab value="c" style={{ width: '100px' }}>
            C
          </Tabs.Tab>
        </Tabs.List>
      </div>
    ),
  })
  const list = within(m.container).getByRole('tablist')
  const first = within(m.container).getByRole('tab', { name: 'A' })
  first.focus()
  await userEvent.keyboard('{ArrowRight}{ArrowRight}')
  const tab = within(m.container).getByRole('tab', { name: 'C' })
  expect(tab).toHaveAttribute('aria-selected', 'true')
  expect(tab).toHaveFocus()
  expect((list.parentElement as HTMLElement).scrollLeft).toBeGreaterThan(0)
})
