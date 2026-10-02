import { Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import userEvent from '@testing-library/user-event'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.pointer.2', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Links',
    children: () => (
      <>
        <Toolbar.Link href="#one">One</Toolbar.Link>
        <Toolbar.Link href="#two">Two</Toolbar.Link>
      </>
    ),
  })
  const links = within(m.container).getAllByRole('link')
  await userEvent.click(links[1]!)
  await expect.poll(() => location.hash).toBe('#two')
})
