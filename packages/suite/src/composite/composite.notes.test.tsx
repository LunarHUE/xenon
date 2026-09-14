import { Toolbar } from '@tenon/solid'
import { screen, within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const three = () => (
  <>
    <Toolbar.Button>bold</Toolbar.Button>
    <Toolbar.Button>italic</Toolbar.Button>
    <Toolbar.Button>underline</Toolbar.Button>
  </>
)

function item(name: string): HTMLElement {
  return screen.getByRole('button', { name })
}

describe('composite notes and edge cases', () => {
  spec('composite.notes.2', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()

    m.setProps({ 'data-pass': '2' })
    await m.settle()

    expect(item('italic')).toHaveAttribute('tabindex', '0')
    expect(item('bold')).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()
  })

  spec('composite.notes.7', async () => {
    const user = userEvent.setup()
    const first = mount('toolbar', {
      'aria-label': 'first',
      children: () => (
        <>
          <Toolbar.Button>one</Toolbar.Button>
          <Toolbar.Button>two</Toolbar.Button>
        </>
      ),
    })
    const second = mount('toolbar', {
      'aria-label': 'second',
      children: () => (
        <>
          <Toolbar.Button>three</Toolbar.Button>
          <Toolbar.Button>four</Toolbar.Button>
        </>
      ),
    })

    expect(within(first.container).getAllByRole('button')).toHaveLength(2)

    item('one').focus()
    await user.keyboard('{ArrowRight}')
    await first.settle()
    expect(item('two')).toHaveFocus()
    expect(item('three')).toHaveAttribute('tabindex', '0')
    expect(item('four')).toHaveAttribute('tabindex', '-1')

    item('three').focus()
    await user.keyboard('{ArrowRight}')
    await second.settle()
    expect(item('four')).toHaveFocus()
    expect(item('two')).toHaveAttribute('tabindex', '0')
    expect(item('one')).toHaveAttribute('tabindex', '-1')
  })
})
