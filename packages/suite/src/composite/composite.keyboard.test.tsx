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

function press(el: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  el.dispatchEvent(event)
  return event
}

describe('composite keyboard', () => {
  spec('composite.keyboard.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    const bold = item('bold')
    const italic = item('italic')

    const atFocus: string[] = []
    italic.addEventListener('focus', () => {
      atFocus.push(
        `bold=${bold.getAttribute('tabindex')}`,
        `italic=${italic.getAttribute('tabindex')}`
      )
    })

    bold.focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()

    expect(atFocus).toEqual(['bold=-1', 'italic=0'])
    expect(italic).toHaveFocus()
  })

  spec('composite.keyboard.2', async () => {
    const user = userEvent.setup()
    const horizontal = mount('toolbar', { 'aria-label': 'Format', children: three })
    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await horizontal.settle()
    expect(item('italic')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    await horizontal.settle()
    expect(item('bold')).toHaveFocus()
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
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

  spec('composite.keyboard.3', async () => {
    const horizontal = mount('toolbar', { 'aria-label': 'Format', children: three })
    item('bold').focus()
    for (const key of ['ArrowDown', 'ArrowUp']) {
      const event = press(item('bold'), key)
      await horizontal.settle()
      expect(event.defaultPrevented).toBe(false)
      expect(item('bold')).toHaveFocus()
      expect(item('bold')).toHaveAttribute('tabindex', '0')
    }
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: three,
    })
    item('bold').focus()
    for (const key of ['ArrowRight', 'ArrowLeft']) {
      const event = press(item('bold'), key)
      await vertical.settle()
      expect(event.defaultPrevented).toBe(false)
      expect(item('bold')).toHaveFocus()
    }
  })

  spec('composite.keyboard.4', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Toolbar.Group aria-label="align">
            <Toolbar.Button>left</Toolbar.Button>
            <Toolbar.Button>right</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Separator />
          <Toolbar.Link href="#help">help</Toolbar.Link>
        </>
      ),
    })

    const help = screen.getByRole('link', { name: 'help' })
    item('left').focus()
    await m.settle()

    await user.keyboard('{End}')
    await m.settle()
    expect(help).toHaveFocus()
    expect(help).toHaveAttribute('tabindex', '0')

    await user.keyboard('{Home}')
    await m.settle()
    expect(item('bold')).toHaveFocus()
    expect(item('bold')).toHaveAttribute('tabindex', '0')
    expect(help).toHaveAttribute('tabindex', '-1')
  })

  spec('composite.keyboard.8', async () => {
    const m = mount('toolbar', { 'aria-label': 'Format', loop: false, children: three })
    item('bold').focus()
    await m.settle()

    const boundary = press(item('bold'), 'ArrowLeft')
    await m.settle()
    expect(boundary.defaultPrevented).toBe(true)
    expect(item('bold')).toHaveFocus()
    expect(item('bold')).toHaveAttribute('tabindex', '0')

    const move = press(item('bold'), 'ArrowRight')
    await m.settle()
    expect(move.defaultPrevented).toBe(true)
    expect(item('italic')).toHaveFocus()
  })

  spec('composite.keyboard.9', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    item('bold').focus()

    for (const modifier of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey'] as const) {
      const event = press(item('bold'), 'ArrowRight', { [modifier]: true })
      await m.settle()
      expect(event.defaultPrevented).toBe(false)
      expect(item('bold')).toHaveFocus()
      expect(item('italic')).toHaveAttribute('tabindex', '-1')
    }

    await user.keyboard('{Control>}{ArrowRight}{/Control}')
    await m.settle()
    expect(item('bold')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()
  })

  spec('composite.keyboard.25', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => <Toolbar.Separator />,
    })
    const root = screen.getByRole('toolbar')
    expect(within(root).queryAllByRole('button')).toHaveLength(0)

    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      const event = press(root, key)
      await m.settle()
      expect(event.defaultPrevented).toBe(false)
    }
  })

  spec('composite.keyboard.26', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    item('bold').focus()

    await user.keyboard('{ArrowRight}{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('bold')).toHaveFocus()
    expect(item('bold')).toHaveAttribute('tabindex', '0')

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(item('underline')).toHaveFocus()
  })

  spec('composite.keyboard.27', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', loop: false, children: three })
    item('bold').focus()

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(item('bold')).toHaveFocus()

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()
    expect(item('underline')).toHaveAttribute('tabindex', '0')
    expect(item('bold')).toHaveAttribute('tabindex', '-1')
  })
})
