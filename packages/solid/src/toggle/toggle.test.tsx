import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Toggle } from './toggle'

describe('<Toggle />', () => {
  test('renders an unpressed native button', () => {
    const { getByRole } = render(() => <Toggle>Mute</Toggle>)
    const el = getByRole('button')
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('type', 'button')
    expect(el).toHaveAttribute('aria-pressed', 'false')
    expect(el).toHaveAttribute('data-state', 'off')
    expect(el).not.toHaveAttribute('data-pressed')
  })

  test('uncontrolled: defaultPressed starts on and clicks flip it', () => {
    const onPressedChange = vi.fn()
    const { getByRole } = render(() => (
      <Toggle defaultPressed onPressedChange={onPressedChange}>
        Mute
      </Toggle>
    ))
    const el = getByRole('button')
    expect(el).toHaveAttribute('aria-pressed', 'true')
    expect(el).toHaveAttribute('data-pressed', '')

    fireEvent.click(el)
    flush()
    expect(onPressedChange).toHaveBeenCalledWith(false)
    expect(el).toHaveAttribute('aria-pressed', 'false')
    expect(el).toHaveAttribute('data-state', 'off')
  })

  test('controlled: the DOM follows the prop and never moves on its own', () => {
    const [pressed, setPressed] = createSignal(false)
    const onPressedChange = vi.fn()
    const { getByRole } = render(() => (
      <Toggle pressed={pressed()} onPressedChange={onPressedChange}>
        Mute
      </Toggle>
    ))
    const el = getByRole('button')

    fireEvent.click(el)
    flush()
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(el).toHaveAttribute('aria-pressed', 'false')

    setPressed(true)
    flush()
    expect(el).toHaveAttribute('aria-pressed', 'true')
  })

  test('disabled blocks the change and keeps reporting the pressed state', () => {
    const onPressedChange = vi.fn()
    const { getByRole } = render(() => (
      <Toggle pressed disabled onPressedChange={onPressedChange}>
        Mute
      </Toggle>
    ))
    const el = getByRole('button')
    expect(el).toBeDisabled()
    expect(el).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(el)
    flush()
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  test('as="div" gets the button role and keyboard activation', () => {
    const onPressedChange = vi.fn()
    const { getByRole } = render(() => (
      <Toggle as="div" onPressedChange={onPressedChange}>
        Mute
      </Toggle>
    ))
    const el = getByRole('button')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(el, { key: 'Enter' })
    flush()
    expect(onPressedChange).toHaveBeenCalledWith(true)
    expect(el).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(el, { key: ' ' })
    fireEvent.keyUp(el, { key: ' ' })
    flush()
    expect(el).toHaveAttribute('aria-pressed', 'false')
  })

  test('a link host warns, because role="button" would hide its navigation', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(() => (
      <Toggle as="a" href="#somewhere">
        Mute
      </Toggle>
    ))
    flush()
    expect(error).toHaveBeenCalledOnce()
    expect(error.mock.calls[0]?.[0]).toContain('a link cannot be a toggle')
    error.mockRestore()
  })

  test('ref and unconsumed props land on the host', () => {
    let el: HTMLElement | undefined
    const { getByRole } = render(() => (
      <Toggle ref={(node: HTMLElement) => (el = node)} data-foo="bar">
        Mute
      </Toggle>
    ))
    expect(el).toBe(getByRole('button'))
    expect(getByRole('button')).toHaveAttribute('data-foo', 'bar')
  })

  test('a user click handler runs first and can cancel the toggle', () => {
    const onPressedChange = vi.fn()
    const { getByRole } = render(() => (
      <Toggle onPressedChange={onPressedChange} onClick={(e: MouseEvent) => e.preventDefault()}>
        Mute
      </Toggle>
    ))
    fireEvent.click(getByRole('button'))
    flush()
    expect(onPressedChange).not.toHaveBeenCalled()
  })
})
