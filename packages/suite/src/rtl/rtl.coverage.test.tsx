import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'
import { Toolbar } from '@xenon/solid'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const items = () => (
  <>
    <Toolbar.Button>One</Toolbar.Button>
    <Toolbar.Button>Two</Toolbar.Button>
    <Toolbar.Button>Three</Toolbar.Button>
  </>
)

describe('directional composite coverage', () => {
  spec('rtl.5', async () => {
    const user = userEvent.setup()
    const mounted = mount('toolbar', {
      'aria-label': 'Actions',
      dir: 'rtl',
      orientation: 'vertical',
      children: items,
    })
    await mounted.settle()
    const one = mounted.container.querySelector('button')!
    const two = mounted.container.querySelectorAll('button')[1]!
    one.focus()

    await user.keyboard('{ArrowDown}')
    await mounted.settle()
    expect(two).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    await mounted.settle()
    expect(one).toHaveFocus()
    mounted.unmount()
  })
})
