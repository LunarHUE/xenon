import { Toolbar } from '@xenon/solid'
import { screen } from '@testing-library/dom'
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

describe('composite pointer', () => {
  spec('composite.pointer.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })

    await user.click(item('underline'))
    await m.settle()
    expect(item('underline')).toHaveFocus()
    expect(item('underline')).toHaveAttribute('tabindex', '0')
    expect(item('bold')).toHaveAttribute('tabindex', '-1')
    expect(item('italic')).toHaveAttribute('tabindex', '-1')

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(item('italic')).toHaveFocus()
    expect(item('italic')).toHaveAttribute('tabindex', '0')
    expect(item('underline')).toHaveAttribute('tabindex', '-1')
  })
})
