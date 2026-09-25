import { Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { test, expect } from 'vitest'

import { mount } from '../harness/solid'

test('composite.focus.7: a disabled but focusable entry retains the initial tab stop', () => {
  const mounted = mount('toolbar', {
    'aria-label': 'Format',
    children: () => (
      <>
        <Toolbar.Button disabled focusableWhenDisabled>
          Bold
        </Toolbar.Button>
        <Toolbar.Button>Italic</Toolbar.Button>
      </>
    ),
  })
  const buttons = within(mounted.container).getAllByRole('button')
  expect(buttons[0]).toHaveAttribute('tabindex', '0')
  expect(buttons[1]).toHaveAttribute('tabindex', '-1')
  mounted.unmount()
})
