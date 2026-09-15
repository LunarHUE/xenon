import { Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect, onTestFinished } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('composite.focus.4', async () => {
  const previous = { x: window.scrollX, y: window.scrollY }
  onTestFinished(() => window.scrollTo(previous.x, previous.y))
  const wrapped = mount('toolbar', {
    orientation: 'vertical',
    'aria-label': 'Scrollable actions',
    style: { height: '100px', overflow: 'auto' },
    children: () => (
      <>
        <Toolbar.Button>First</Toolbar.Button>
        <div style={{ height: '500px' }} />
        <Toolbar.Button>Last</Toolbar.Button>
      </>
    ),
  })
  const wrapper = within(wrapped.container).getByRole('toolbar')
  const first = within(wrapper).getByRole('button', { name: 'First' })
  const last = within(wrapper).getByRole('button', { name: 'Last' })
  first.focus()
  await wrapped.settle()
  expect(wrapper.scrollTop).toBe(0)
  await userEvent.keyboard('{End}')
  await wrapped.settle()
  expect(last).toHaveFocus()
  expect(wrapper.scrollTop).toBeGreaterThan(0)
  expect(last.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    wrapper.getBoundingClientRect().top
  )
  expect(last.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    wrapper.getBoundingClientRect().bottom
  )
  wrapped.unmount()

  const page = mount('toolbar', {
    orientation: 'vertical',
    'aria-label': 'Page actions',
    children: () => (
      <>
        <Toolbar.Button>Top</Toolbar.Button>
        <div style={{ height: '200vh' }} />
        <Toolbar.Button>Bottom</Toolbar.Button>
      </>
    ),
  })
  within(page.container).getByRole('button', { name: 'Top' }).focus()
  await page.settle()
  const initialScroll = window.scrollY
  await userEvent.keyboard('{End}')
  await page.settle()
  const bottom = within(page.container).getByRole('button', { name: 'Bottom' })
  expect(bottom).toHaveFocus()
  expect(window.scrollY).toBeGreaterThan(initialScroll)
  expect(bottom.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
  expect(bottom.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
})
