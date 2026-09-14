import { fireEvent, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Switch } from './switch'

function settle(): Promise<void> {
  flush()
  return Promise.resolve()
}

describe('<Switch />', () => {
  test('renders a native checkbox input with role=switch', () => {
    const { getByRole } = render(() => <Switch aria-label="Lights" />)
    const el = getByRole('switch')
    expect(el.tagName).toBe('INPUT')
    expect(el).toHaveAttribute('type', 'checkbox')
    expect(el).not.toHaveAttribute('aria-checked')
    expect(el).toHaveAttribute('data-state', 'unchecked')
    expect(el).not.toHaveAttribute('data-indeterminate')
  })

  test('as="button" gets the role and aria-checked', () => {
    const { getByRole } = render(() => <Switch as="button">Lights</Switch>)
    const el = getByRole('switch')
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('type', 'button')
    expect(el).toHaveAttribute('aria-checked', 'false')
  })

  test('uncontrolled toggles on click and reports the next value', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Switch aria-label="Lights" onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('switch') as HTMLInputElement

    fireEvent.click(el)
    await settle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(el.checked).toBe(true)
    expect(el).toHaveAttribute('data-state', 'checked')
  })

  test('a fixed controlled prop snaps the input back', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Switch aria-label="Lights" checked={true} onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('switch') as HTMLInputElement

    fireEvent.click(el)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    await settle()
    expect(el.checked).toBe(true)
    expect(el).toHaveAttribute('data-state', 'checked')
  })

  test('as="div" toggles on Space keyup', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Switch as="div" aria-label="Lights" onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('switch')
    expect(el).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(el, { key: ' ' })
    fireEvent.keyUp(el, { key: ' ' })
    await settle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(el).toHaveAttribute('aria-checked', 'true')
  })

  test('the hidden input appears only when name is set on a non-native host', () => {
    const nameless = render(() => <Switch as="div" aria-label="Lights" />)
    expect(nameless.container.querySelector('input')).toBe(null)
    nameless.unmount()

    const named = render(() => <Switch as="div" aria-label="Lights" name="lights" checked />)
    const hidden = named.container.querySelector('input') as HTMLInputElement
    expect(hidden.type).toBe('checkbox')
    expect(hidden).toHaveAttribute('aria-hidden', 'true')
    expect(hidden).toHaveAttribute('tabindex', '-1')
    expect(hidden).not.toHaveAttribute('role')
    expect(hidden.name).toBe('lights')
    expect(hidden.checked).toBe(true)
    expect(hidden.style.position).toBe('absolute')
    named.unmount()

    const native = render(() => <Switch aria-label="Lights" name="lights" />)
    expect(native.container.querySelectorAll('input')).toHaveLength(1)
  })

  test('readonly blocks activation but keeps the tab stop', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Switch as="div" aria-label="Lights" readonly onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('switch')
    expect(el).toHaveAttribute('tabindex', '0')
    expect(el).toHaveAttribute('aria-readonly', 'true')

    fireEvent.click(el)
    await settle()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('user click runs first and can cancel the core handler', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Switch as="button" onCheckedChange={onCheckedChange} onClick={(e) => e.preventDefault()}>
        Lights
      </Switch>
    ))
    fireEvent.click(getByRole('switch'))
    await settle()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('forwards the ref', () => {
    let el: HTMLElement | undefined
    render(() => <Switch aria-label="Lights" ref={(node) => (el = node)} />)
    expect(el?.tagName).toBe('INPUT')
  })
})
