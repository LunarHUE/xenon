import { render } from '@solidjs/testing-library'
import { createRoot, Show, createSignal, flush } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Toolbar } from './toolbar'

function three() {
  return (
    <>
      <Toolbar.Button>bold</Toolbar.Button>
      <Toolbar.Button>italic</Toolbar.Button>
      <Toolbar.Button>underline</Toolbar.Button>
    </>
  )
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}

function tabstops(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="toolbar"] > *')].map(
    (el) => `${el.textContent}=${el.getAttribute('tabindex')}`
  )
}

describe('<Toolbar />', () => {
  test('renders a toolbar and marks its orientation', () => {
    const { getByRole, unmount } = render(() => <Toolbar aria-label="Format">{three()}</Toolbar>)
    const root = getByRole('toolbar')
    expect(root).toHaveAttribute('data-orientation', 'horizontal')
    expect(root).not.toHaveAttribute('aria-orientation')
    expect(root).not.toHaveAttribute('tabindex')
    unmount()

    const vertical = render(() => (
      <Toolbar aria-label="Format" orientation="vertical">
        {three()}
      </Toolbar>
    ))
    const el = vertical.getByRole('toolbar')
    expect(el).toHaveAttribute('aria-orientation', 'vertical')
    expect(el).toHaveAttribute('data-orientation', 'vertical')
  })

  test('holds a single tab stop on the first item', () => {
    const { container } = render(() => <Toolbar aria-label="Format">{three()}</Toolbar>)
    expect(tabstops(container)).toEqual(['bold=0', 'italic=-1', 'underline=-1'])
  })

  test('arrows, Home and End move focus and the tab stop', () => {
    const { container, getByText } = render(() => <Toolbar aria-label="Format">{three()}</Toolbar>)
    getByText('bold').focus()

    expect(press(getByText('bold'), 'ArrowRight').defaultPrevented).toBe(true)
    expect(getByText('italic')).toHaveFocus()
    expect(tabstops(container)).toEqual(['bold=-1', 'italic=0', 'underline=-1'])

    press(getByText('italic'), 'End')
    expect(getByText('underline')).toHaveFocus()

    press(getByText('underline'), 'Home')
    expect(getByText('bold')).toHaveFocus()

    press(getByText('bold'), 'ArrowLeft')
    expect(getByText('underline')).toHaveFocus()
  })

  test('rtl mirrors the horizontal arrows', () => {
    const { getByText } = render(() => (
      <Toolbar aria-label="Format" dir="rtl">
        {three()}
      </Toolbar>
    ))
    getByText('bold').focus()
    press(getByText('bold'), 'ArrowLeft')
    expect(getByText('italic')).toHaveFocus()
    press(getByText('italic'), 'ArrowRight')
    expect(getByText('bold')).toHaveFocus()
  })

  test('an ancestor dir sets the direction', () => {
    const host = document.createElement('div')
    host.setAttribute('dir', 'rtl')
    document.body.appendChild(host)
    const { getByText } = render(() => <Toolbar aria-label="Format">{three()}</Toolbar>, {
      container: host,
    })
    getByText('bold').focus()
    press(getByText('bold'), 'ArrowLeft')
    expect(getByText('italic')).toHaveFocus()
  })

  test('loop={false} clamps at both ends', () => {
    const { getByText } = render(() => (
      <Toolbar aria-label="Format" loop={false}>
        {three()}
      </Toolbar>
    ))
    getByText('bold').focus()
    expect(press(getByText('bold'), 'ArrowLeft').defaultPrevented).toBe(true)
    expect(getByText('bold')).toHaveFocus()

    press(getByText('bold'), 'End')
    press(getByText('underline'), 'ArrowRight')
    expect(getByText('underline')).toHaveFocus()
  })

  test('a natively disabled item is skipped, an aria-disabled one stays in the ring', () => {
    const { getByText } = render(() => (
      <Toolbar aria-label="Format">
        <Toolbar.Button>bold</Toolbar.Button>
        <Toolbar.Button disabled focusableWhenDisabled={false}>
          italic
        </Toolbar.Button>
        <Toolbar.Button disabled>underline</Toolbar.Button>
      </Toolbar>
    ))
    expect(getByText('italic')).toBeDisabled()
    expect(getByText('underline')).toHaveAttribute('aria-disabled', 'true')

    getByText('bold').focus()
    press(getByText('bold'), 'ArrowRight')
    expect(getByText('underline')).toHaveFocus()
  })

  test('a disabled toolbar disables its buttons but not its links', () => {
    const { getByText } = render(() => (
      <Toolbar aria-label="Format" disabled>
        <Toolbar.Button>bold</Toolbar.Button>
        <Toolbar.Group disabled>
          <Toolbar.Button>italic</Toolbar.Button>
        </Toolbar.Group>
        <Toolbar.Link href="#help">help</Toolbar.Link>
      </Toolbar>
    ))
    expect(getByText('bold')).toHaveAttribute('aria-disabled', 'true')
    expect(getByText('italic')).toHaveAttribute('aria-disabled', 'true')
    expect(getByText('help')).not.toHaveAttribute('aria-disabled')
    expect(getByText('help')).not.toHaveAttribute('data-disabled')
  })

  test('the root takes the tab stop when no item is navigable', () => {
    const { getByRole } = render(() => (
      <Toolbar aria-label="Format">
        <Toolbar.Button disabled focusableWhenDisabled={false}>
          bold
        </Toolbar.Button>
      </Toolbar>
    ))
    expect(getByRole('toolbar')).toHaveAttribute('tabindex', '-1')
  })

  test('unmounting the active item hands the tab stop to a survivor', () => {
    const [shown, setShown] = createSignal(true)
    const { container, getByText } = render(() => (
      <Toolbar aria-label="Format">
        <Show when={shown()}>
          <Toolbar.Button>bold</Toolbar.Button>
        </Show>
        <Toolbar.Button>italic</Toolbar.Button>
      </Toolbar>
    ))
    expect(tabstops(container)).toEqual(['bold=0', 'italic=-1'])

    setShown(false)
    flush()
    expect(tabstops(container)).toEqual(['italic=0'])

    getByText('italic').focus()
    press(getByText('italic'), 'ArrowRight')
    expect(getByText('italic')).toHaveFocus()
  })

  test('a separator is perpendicular to the toolbar and is not an item', () => {
    const { container, getByRole } = render(() => (
      <Toolbar aria-label="Format">
        <Toolbar.Button>bold</Toolbar.Button>
        <Toolbar.Separator />
        <Toolbar.Button>italic</Toolbar.Button>
      </Toolbar>
    ))
    expect(getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
    expect(tabstops(container)).toEqual(['bold=0', '=null', 'italic=-1'])
  })

  test('a separator orientation prop wins', () => {
    const { getByRole } = render(() => (
      <Toolbar aria-label="Format" orientation="vertical">
        <Toolbar.Separator orientation="vertical" />
      </Toolbar>
    ))
    expect(getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })

  test('a group carries role and orientation', () => {
    const { getByRole } = render(() => (
      <Toolbar aria-label="Format" orientation="vertical">
        <Toolbar.Group aria-label="align">
          <Toolbar.Button>left</Toolbar.Button>
        </Toolbar.Group>
      </Toolbar>
    ))
    const group = getByRole('group')
    expect(group).toHaveAttribute('data-orientation', 'vertical')
    expect(group).not.toHaveAttribute('tabindex')
  })

  test('items outside a toolbar throw', () => {
    expect(() =>
      createRoot((dispose) => {
        try {
          return Toolbar.Button({ children: 'bold' })
        } finally {
          dispose()
        }
      })
    ).toThrow(/Toolbar/)
    expect(() =>
      createRoot((dispose) => {
        try {
          return Toolbar.Separator({})
        } finally {
          dispose()
        }
      })
    ).toThrow(/Toolbar/)
  })

  test('user handlers run before the item handlers', () => {
    const { getByText } = render(() => (
      <Toolbar aria-label="Format">
        <Toolbar.Button onKeyDown={(event: KeyboardEvent) => event.preventDefault()}>
          bold
        </Toolbar.Button>
        <Toolbar.Button>italic</Toolbar.Button>
      </Toolbar>
    ))
    getByText('bold').focus()
    press(getByText('bold'), 'ArrowRight')
    expect(getByText('bold')).toHaveFocus()
  })
})
