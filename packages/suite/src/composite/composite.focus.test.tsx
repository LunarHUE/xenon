import { Toolbar } from '@kit/solid'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { Show, createSignal } from 'solid-js'
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

describe('composite focus management', () => {
  spec('composite.focus.1', async () => {
    const user = userEvent.setup()
    mount('toolbar', { 'aria-label': 'Format', children: three })

    expect(item('bold')).toHaveAttribute('tabindex', '0')
    expect(item('italic')).toHaveAttribute('tabindex', '-1')
    expect(item('underline')).toHaveAttribute('tabindex', '-1')

    await user.tab()
    expect(item('bold')).toHaveFocus()
  })

  spec('composite.focus.2', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: three })
    mount('button', { children: 'after' })

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()

    await user.tab()
    expect(item('after')).toHaveFocus()
    expect(item('italic')).toHaveAttribute('tabindex', '0')
    expect(item('bold')).toHaveAttribute('tabindex', '-1')

    await user.tab({ shift: true })
    expect(item('italic')).toHaveFocus()
  })

  spec.todo('composite.focus.3')

  spec.todo('composite.focus.4')

  spec.todo('composite.focus.5')

  spec.todo('composite.focus.6')

  spec('composite.focus.7', async () => {
    const user = userEvent.setup()
    const skipped = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            bold
          </Toolbar.Button>
          <Toolbar.Button>italic</Toolbar.Button>
          <Toolbar.Button>underline</Toolbar.Button>
        </>
      ),
    })

    expect(item('bold')).toHaveAttribute('tabindex', '-1')
    expect(item('italic')).toHaveAttribute('tabindex', '0')
    await user.tab()
    expect(item('italic')).toHaveFocus()
    skipped.unmount()

    mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            bold
          </Toolbar.Button>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            italic
          </Toolbar.Button>
        </>
      ),
    })

    expect(item('bold')).toHaveAttribute('tabindex', '0')
    expect(item('italic')).toHaveAttribute('tabindex', '-1')
  })

  spec('composite.focus.8', async () => {
    const user = userEvent.setup()
    const [present, setPresent] = createSignal(true)
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Show when={present()}>
            <Toolbar.Button>italic</Toolbar.Button>
          </Show>
          <Toolbar.Button>underline</Toolbar.Button>
        </>
      ),
    })

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()
    expect(item('italic')).toHaveAttribute('tabindex', '0')

    setPresent(false)
    await m.settle()

    expect(screen.queryByRole('button', { name: 'italic' })).toBeNull()
    expect(item('bold')).toHaveAttribute('tabindex', '0')
    expect(item('underline')).toHaveAttribute('tabindex', '-1')
  })

  spec('composite.focus.9', async () => {
    const user = userEvent.setup()
    const [present, setPresent] = createSignal(true)
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Show when={present()}>
            <Toolbar.Button>italic</Toolbar.Button>
          </Show>
          <Toolbar.Button>underline</Toolbar.Button>
        </>
      ),
    })

    item('bold').focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()

    setPresent(false)
    await m.settle()

    expect(item('underline')).toHaveAttribute('tabindex', '0')
    expect(item('underline')).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(item('bold')).toHaveFocus()
  })

  spec('composite.focus.10', async () => {
    const user = userEvent.setup()
    const [present, setPresent] = createSignal(true)
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>bold</Toolbar.Button>
          <Show when={present()}>
            <Toolbar.Button>italic</Toolbar.Button>
          </Show>
          <Toolbar.Button>underline</Toolbar.Button>
        </>
      ),
    })
    mount('button', { children: 'after' })

    item('bold').focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('italic')).toHaveFocus()

    await user.tab()
    expect(item('after')).toHaveFocus()

    setPresent(false)
    await m.settle()

    await user.tab({ shift: true })
    expect(item('bold')).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(item('underline')).toHaveFocus()
  })

  spec.todo('composite.focus.11')

  spec.todo('composite.focus.12')

  spec.todo('composite.focus.13')

  spec.todo('composite.focus.14')

  spec.todo('composite.focus.15')

  spec.todo('composite.focus.16')

  spec.todo('composite.focus.17')

  spec.todo('composite.focus.18')

  spec.todo('composite.focus.19')

  spec.todo('composite.focus.20')

  spec.todo('composite.focus.21')

  spec.todo('composite.focus.22')
})
