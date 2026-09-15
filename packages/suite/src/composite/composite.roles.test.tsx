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

describe('composite roles and attributes', () => {
  spec('composite.roles.1', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'before' })
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    mount('button', { children: 'after' })

    await user.tab()
    expect(item('before')).toHaveFocus()
    await user.tab()
    expect(item('bold')).toHaveFocus()
    await user.tab()
    expect(item('after')).toHaveFocus()
    await user.tab({ shift: true })
    expect(item('bold')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()
  })

  spec('composite.roles.8', () => {
    mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Toolbar.Button disabled>italic</Toolbar.Button>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            underline
          </Toolbar.Button>
        </>
      ),
    })

    const soft = item('italic')
    expect(soft).toHaveAttribute('aria-disabled', 'true')
    expect(soft).not.toHaveAttribute('disabled')
    expect(soft).not.toBeDisabled()

    const hard = item('underline')
    expect(hard).toHaveAttribute('disabled')
    expect(hard).toBeDisabled()
    expect(hard).not.toHaveAttribute('aria-disabled')
  })

  spec('composite.roles.9', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })

    expect(item('bold')).toHaveAttribute('tabindex', '0')
    expect(item('italic')).toHaveAttribute('tabindex', '-1')
    expect(item('underline')).toHaveAttribute('tabindex', '-1')

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()

    expect(item('bold')).toHaveAttribute('tabindex', '-1')
    expect(item('italic')).toHaveAttribute('tabindex', '0')
    expect(item('underline')).toHaveAttribute('tabindex', '-1')
  })
})
