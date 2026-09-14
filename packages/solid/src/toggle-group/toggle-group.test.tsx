import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { ToggleGroup } from './toggle-group'

function three() {
  return (
    <>
      <ToggleGroup.Item value="bold">bold</ToggleGroup.Item>
      <ToggleGroup.Item value="italic">italic</ToggleGroup.Item>
      <ToggleGroup.Item value="underline">underline</ToggleGroup.Item>
    </>
  )
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}

function pressed(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="group"] > *')].map(
    (el) => `${el.textContent}=${el.getAttribute('aria-pressed')}`
  )
}

function tabstops(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="group"] > *')].map(
    (el) => `${el.textContent}=${el.getAttribute('tabindex')}`
  )
}

describe('<ToggleGroup />', () => {
  test('renders a group, never a radiogroup, with no aria-orientation', () => {
    const { getByRole } = render(() => (
      <ToggleGroup aria-label="Format" orientation="vertical">
        {three()}
      </ToggleGroup>
    ))
    const root = getByRole('group')
    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(root).not.toHaveAttribute('aria-orientation')
  })

  test('items are toggle buttons and the first holds the tab stop', () => {
    const { container, getByText } = render(() => (
      <ToggleGroup aria-label="Format" defaultValue="italic">
        {three()}
      </ToggleGroup>
    ))
    expect(getByText('bold')).toHaveAttribute('type', 'button')
    expect(pressed(container)).toEqual(['bold=false', 'italic=true', 'underline=false'])
    expect(tabstops(container)).toEqual(['bold=0', 'italic=-1', 'underline=-1'])
    expect(getByText('italic')).toHaveAttribute('data-state', 'on')
  })

  test('single mode replaces the value and deselects on a second press', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(() => (
      <ToggleGroup aria-label="Format" defaultValue="bold" onValueChange={onValueChange}>
        {three()}
      </ToggleGroup>
    ))
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.click(getByText('italic'))
    flush()
    expect(onValueChange).toHaveBeenLastCalledWith('italic')
    expect(pressed(container)).toEqual(['bold=false', 'italic=true', 'underline=false'])

    fireEvent.click(getByText('italic'))
    flush()
    expect(onValueChange).toHaveBeenLastCalledWith(undefined)
    expect(pressed(container)).toEqual(['bold=false', 'italic=false', 'underline=false'])
  })

  test('multiple mode accumulates an array', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(() => (
      <ToggleGroup aria-label="Format" mode="multiple" onValueChange={onValueChange}>
        {three()}
      </ToggleGroup>
    ))
    fireEvent.click(getByText('bold'))
    flush()
    fireEvent.click(getByText('underline'))
    flush()
    expect(onValueChange).toHaveBeenLastCalledWith(['bold', 'underline'])
    expect(pressed(container)).toEqual(['bold=true', 'italic=false', 'underline=true'])

    fireEvent.click(getByText('bold'))
    flush()
    expect(onValueChange).toHaveBeenLastCalledWith(['underline'])
  })

  test('controlled: the value follows the prop and never moves on its own', () => {
    const [value, setValue] = createSignal<string | undefined>('bold')
    const { container, getByText } = render(() => (
      <ToggleGroup aria-label="Format" value={value()}>
        {three()}
      </ToggleGroup>
    ))
    fireEvent.click(getByText('italic'))
    flush()
    expect(pressed(container)).toEqual(['bold=true', 'italic=false', 'underline=false'])

    setValue('underline')
    flush()
    expect(pressed(container)).toEqual(['bold=false', 'italic=false', 'underline=true'])
  })

  test('arrows move focus and the tab stop without changing the value', () => {
    const onValueChange = vi.fn()
    const { container, getByText } = render(() => (
      <ToggleGroup aria-label="Format" onValueChange={onValueChange}>
        {three()}
      </ToggleGroup>
    ))
    getByText('bold').focus()
    expect(press(getByText('bold'), 'ArrowRight').defaultPrevented).toBe(true)
    expect(getByText('italic')).toHaveFocus()
    expect(tabstops(container)).toEqual(['bold=-1', 'italic=0', 'underline=-1'])

    press(getByText('italic'), 'End')
    expect(getByText('underline')).toHaveFocus()
    press(getByText('underline'), 'ArrowRight')
    expect(getByText('bold')).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('as="div" items keep both the keyboard activation and the arrows', () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <ToggleGroup aria-label="Format" onValueChange={onValueChange}>
        <ToggleGroup.Item as="div" value="bold">
          bold
        </ToggleGroup.Item>
        <ToggleGroup.Item as="div" value="italic">
          italic
        </ToggleGroup.Item>
      </ToggleGroup>
    ))
    expect(getByText('bold')).toHaveAttribute('role', 'button')

    fireEvent.keyDown(getByText('bold'), { key: 'Enter' })
    flush()
    expect(onValueChange).toHaveBeenLastCalledWith('bold')

    getByText('bold').focus()
    press(getByText('bold'), 'ArrowRight')
    expect(getByText('italic')).toHaveFocus()
  })

  test('a disabled group and a disabled item stay focusable but never change the value', () => {
    const onValueChange = vi.fn()
    const all = render(() => (
      <ToggleGroup aria-label="Format" disabled onValueChange={onValueChange}>
        {three()}
      </ToggleGroup>
    ))
    expect(all.getByRole('group')).toHaveAttribute('data-disabled', '')
    expect(all.getByText('bold')).toHaveAttribute('aria-disabled', 'true')
    expect(all.getByText('bold')).not.toBeDisabled()
    fireEvent.click(all.getByText('bold'))
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
    all.unmount()

    const one = render(() => (
      <ToggleGroup aria-label="Format" onValueChange={onValueChange}>
        <ToggleGroup.Item value="bold">bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic" disabled>
          italic
        </ToggleGroup.Item>
      </ToggleGroup>
    ))
    expect(one.getByText('italic')).toHaveAttribute('data-disabled', '')
    expect(one.getByText('bold')).not.toHaveAttribute('data-disabled')
    fireEvent.click(one.getByText('italic'))
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a user click handler runs first and can cancel the selection', () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <ToggleGroup aria-label="Format" onValueChange={onValueChange}>
        <ToggleGroup.Item value="bold" onClick={(e: MouseEvent) => e.preventDefault()}>
          bold
        </ToggleGroup.Item>
      </ToggleGroup>
    ))
    fireEvent.click(getByText('bold'))
    flush()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('unmounting the active item hands the tab stop to a survivor', () => {
    const [shown, setShown] = createSignal(true)
    const { container } = render(() => (
      <ToggleGroup aria-label="Format">
        {shown() ? <ToggleGroup.Item value="bold">bold</ToggleGroup.Item> : null}
        <ToggleGroup.Item value="italic">italic</ToggleGroup.Item>
      </ToggleGroup>
    ))
    expect(tabstops(container)).toEqual(['bold=0', 'italic=-1'])
    setShown(false)
    flush()
    expect(tabstops(container)).toEqual(['italic=0'])
  })

  test('an item outside a group throws', () => {
    expect(() => render(() => <ToggleGroup.Item value="bold">bold</ToggleGroup.Item>)).toThrow(
      /ToggleGroup/
    )
  })
})
