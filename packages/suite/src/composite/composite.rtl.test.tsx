import { Toolbar } from '@tenon/solid'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished } from 'vitest'

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

function documentDir(dir: string) {
  const previous = document.documentElement.dir
  onTestFinished(() => {
    document.documentElement.dir = previous
  })
  document.documentElement.dir = dir
}

describe('composite rtl and i18n', () => {
  spec('composite.rtl.1', async () => {
    const user = userEvent.setup()
    const horizontal = mount('toolbar', { 'aria-label': 'Format', dir: 'rtl', children: three })

    item('bold').focus()
    await user.keyboard('{ArrowLeft}')
    await horizontal.settle()
    expect(item('italic')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    await horizontal.settle()
    expect(item('underline')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    await horizontal.settle()
    expect(item('italic')).toHaveFocus()
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      dir: 'rtl',
      orientation: 'vertical',
      children: three,
    })
    item('bold').focus()
    await user.keyboard('{ArrowDown}')
    await vertical.settle()
    expect(item('italic')).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    await vertical.settle()
    expect(item('bold')).toHaveFocus()
  })

  spec('composite.rtl.5', async () => {
    const user = userEvent.setup()
    documentDir('rtl')

    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    await m.settle()

    item('bold').focus()
    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(item('italic')).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('bold')).toHaveFocus()
  })
})
