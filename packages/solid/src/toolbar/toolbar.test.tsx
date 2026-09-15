import { render } from '@solidjs/testing-library'
import { createRoot, Show, createSignal, flush } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Toolbar } from './toolbar'
import { RadioGroup } from '../radio-group'
import { ToggleGroup } from '../toggle-group'

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

describe('Toolbar composed controls', () => {
  test.each([
    { orientation: 'vertical', dir: 'ltr', forward: 'ArrowDown', backward: 'ArrowUp' },
    { orientation: 'horizontal', dir: 'rtl', forward: 'ArrowLeft', backward: 'ArrowRight' },
  ] as const)(
    'shares $orientation $dir navigation with composed groups',
    ({ orientation, dir, forward, backward }) => {
      const { getByRole, getByText, container } = render(() => (
        <Toolbar aria-label="Composed" orientation={orientation} dir={dir}>
          <Toolbar.Button>Start</Toolbar.Button>
          <RadioGroup aria-label="Choice" orientation={orientation} dir={dir} defaultValue="a">
            <RadioGroup.Item as={Toolbar.Button} value="a" aria-label="A" />
            <RadioGroup.Item as={Toolbar.Button} value="b" aria-label="B" />
          </RadioGroup>
          <ToggleGroup aria-label="Style" orientation={orientation} dir={dir}>
            <ToggleGroup.Item as={Toolbar.Button} value="bold">
              Bold
            </ToggleGroup.Item>
          </ToggleGroup>
          <Toolbar.Button>End</Toolbar.Button>
        </Toolbar>
      ))
      const start = getByText('Start')
      const a = getByRole('radio', { name: 'A' })
      const b = getByRole('radio', { name: 'B' })
      const bold = getByText('Bold')
      const end = getByText('End')
      start.focus()
      for (const [from, to] of [
        [start, a],
        [a, b],
        [b, bold],
        [bold, end],
      ] as const) {
        press(from, forward)
        expect(to).toHaveFocus()
        expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
      }
      press(end, backward)
      expect(bold).toHaveFocus()
      press(bold, 'Home')
      expect(start).toHaveFocus()
      press(start, 'End')
      expect(end).toHaveFocus()
      expect(a).toHaveAttribute('aria-checked', 'true')
      expect(b).toHaveAttribute('aria-checked', 'false')
      expect(bold).toHaveAttribute('aria-pressed', 'false')
    }
  )

  test('crosses disabled group items and preserves author cancellation', () => {
    const { getByRole, getByText, container } = render(() => (
      <Toolbar aria-label="Composed">
        <Toolbar.Button>Start</Toolbar.Button>
        <RadioGroup aria-label="Choice" orientation="horizontal" disabled>
          <RadioGroup.Item as={Toolbar.Button} value="a" aria-label="A" />
        </RadioGroup>
        <ToggleGroup aria-label="Style" disabled>
          <ToggleGroup.Item as={Toolbar.Button} value="bold">
            Bold
          </ToggleGroup.Item>
        </ToggleGroup>
        <ToggleGroup aria-label="Cancel">
          <ToggleGroup.Item
            as={Toolbar.Button}
            value="cancel"
            onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          >
            Cancel
          </ToggleGroup.Item>
        </ToggleGroup>
        <Toolbar.Button>End</Toolbar.Button>
      </Toolbar>
    ))
    const a = getByRole('radio')
    const bold = getByText('Bold')
    getByText('Start').focus()
    press(getByText('Start'), 'ArrowRight')
    expect(a).toHaveFocus()
    expect(a).toHaveAttribute('aria-disabled', 'true')
    a.click()
    flush()
    expect(a).toHaveAttribute('aria-checked', 'false')
    press(a, 'ArrowRight')
    expect(bold).toHaveFocus()
    bold.click()
    flush()
    expect(bold).toHaveAttribute('aria-pressed', 'false')
    press(bold, 'ArrowRight')
    expect(getByText('Cancel')).toHaveFocus()
    press(getByText('Cancel'), 'ArrowRight')
    expect(getByText('Cancel')).toHaveFocus()
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  test('keeps explicit composed author tab indices', () => {
    const { getByRole } = render(() => (
      <Toolbar aria-label="Explicit">
        <Toolbar.Button>Start</Toolbar.Button>
        <RadioGroup aria-label="Choice">
          <RadioGroup.Item as={Toolbar.Button} value="a" tabindex={3} aria-label="A" />
        </RadioGroup>
      </Toolbar>
    ))
    expect(getByRole('radio')).toHaveAttribute('tabindex', '3')
  })
})
