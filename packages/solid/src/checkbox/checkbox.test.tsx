import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Checkbox } from './checkbox'

function settle(): Promise<void> {
  flush()
  return Promise.resolve()
}

describe('<Checkbox />', () => {
  test('renders a native checkbox input', () => {
    const { getByRole } = render(() => <Checkbox aria-label="Ready" />)
    const el = getByRole('checkbox')
    expect(el.tagName).toBe('INPUT')
    expect(el).toHaveAttribute('type', 'checkbox')
    expect(el).not.toHaveAttribute('aria-checked')
    expect(el).toHaveAttribute('data-state', 'unchecked')
  })

  test('as="button" gets the role and aria-checked', () => {
    const { getByRole } = render(() => <Checkbox as="button">Ready</Checkbox>)
    const el = getByRole('checkbox')
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('type', 'button')
    expect(el).toHaveAttribute('aria-checked', 'false')
  })

  test('uncontrolled toggles on click and reports the next value', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Checkbox aria-label="Ready" defaultChecked onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('checkbox') as HTMLInputElement
    expect(el.checked).toBe(true)

    fireEvent.click(el)
    await settle()
    expect(onCheckedChange).toHaveBeenCalledWith(false)
    expect(el.checked).toBe(false)
    expect(el).toHaveAttribute('data-state', 'unchecked')
  })

  test('a fixed controlled prop snaps the input back', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Checkbox aria-label="Ready" checked={false} onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('checkbox') as HTMLInputElement

    fireEvent.click(el)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    await settle()
    expect(el.checked).toBe(false)
    expect(el).toHaveAttribute('data-state', 'unchecked')
  })

  test('as="button" toggles without touching the DOM checkedness', async () => {
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Checkbox as="button" onCheckedChange={onCheckedChange}>
        Ready
      </Checkbox>
    ))
    const el = getByRole('checkbox')
    fireEvent.click(el)
    await settle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(el).toHaveAttribute('aria-checked', 'true')
  })

  test('the hidden input appears only when name is set on a non-native host', () => {
    const nameless = render(() => <Checkbox as="button">Ready</Checkbox>)
    expect(nameless.container.querySelector('input')).toBe(null)
    nameless.unmount()

    const named = render(() => (
      <Checkbox as="button" name="ready" value="yes" checked>
        Ready
      </Checkbox>
    ))
    const hidden = named.container.querySelector('input') as HTMLInputElement
    expect(hidden).toHaveAttribute('aria-hidden', 'true')
    expect(hidden).toHaveAttribute('tabindex', '-1')
    expect(hidden.name).toBe('ready')
    expect(hidden.value).toBe('yes')
    expect(hidden.checked).toBe(true)
    expect(hidden.style.position).toBe('absolute')
    expect(hidden).not.toHaveAttribute('hidden')
    named.unmount()

    const native = render(() => <Checkbox aria-label="Ready" name="ready" />)
    expect(native.container.querySelectorAll('input')).toHaveLength(1)
  })

  test('indeterminate is written as a property and survives a click', async () => {
    const { getByRole } = render(() => <Checkbox aria-label="Ready" indeterminate />)
    const el = getByRole('checkbox') as HTMLInputElement
    await settle()
    expect(el.indeterminate).toBe(true)
    expect(el).toHaveAttribute('data-state', 'indeterminate')

    fireEvent.click(el)
    await settle()
    expect(el.indeterminate).toBe(true)
    expect(el.checked).toBe(true)
  })

  test('disabled blocks user handlers and the change callback', async () => {
    const onClick = vi.fn()
    const onCheckedChange = vi.fn()
    const { getByRole } = render(() => (
      <Checkbox aria-label="Ready" disabled onClick={onClick} onCheckedChange={onCheckedChange} />
    ))
    const el = getByRole('checkbox')
    fireEvent.click(el)
    await settle()
    expect(onClick).not.toHaveBeenCalled()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('passthrough props land on the control, not the hidden input', () => {
    const { container } = render(() => (
      <Checkbox as="button" name="ready" data-test="x" class="c">
        Ready
      </Checkbox>
    ))
    const control = container.firstElementChild as HTMLElement
    const hidden = container.querySelector('input[aria-hidden="true"]') as HTMLInputElement
    expect(control).toHaveAttribute('data-test', 'x')
    expect(control).toHaveClass('c')
    expect(hidden).not.toHaveAttribute('data-test')
    expect(hidden).not.toHaveClass('c')
  })

  test('user keydown runs first and can cancel the core handler', () => {
    const { getByRole } = render(() => (
      <Checkbox as="div" aria-label="Ready" onKeyDown={(e) => e.preventDefault()} />
    ))
    const el = getByRole('checkbox')
    fireEvent.keyUp(el, { key: ' ' })
    expect(el).toHaveAttribute('aria-checked', 'false')
  })

  test('forwards the ref', () => {
    let el: HTMLElement | undefined
    render(() => <Checkbox aria-label="Ready" ref={(node) => (el = node)} />)
    expect(el?.tagName).toBe('INPUT')
  })
})

test('empty native flags govern behavior and ref arrays receive the host', async () => {
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  let first: HTMLInputElement | undefined
  let second: HTMLInputElement | undefined
  const { getByRole } = render(() => (
    <Checkbox
      disabled={disabled()}
      required=""
      readonly=""
      ref={[(el) => (first = el), (el) => (second = el)]}
      aria-label="Native flags"
    />
  ))
  await settle()
  const input = getByRole('checkbox') as HTMLInputElement
  expect(input.disabled).toBe(true)
  expect(input.required).toBe(true)
  expect(input).toHaveAttribute('aria-readonly', 'true')
  expect(first).toBe(input)
  expect(second).toBe(input)
  setDisabled(false)
  await settle()
  expect(input.disabled).toBe(false)
})

test('native bound change handlers can cancel changes and preserve this', async () => {
  const receivers: EventTarget[] = []
  const changed = vi.fn()
  const { getByRole } = render(() => (
    <Checkbox
      aria-label="Tuple"
      onCheckedChange={changed}
      onChange={[
        function (this: HTMLInputElement, cancel: boolean, event) {
          receivers.push(this)
          if (cancel) event.preventDefault()
        },
        true,
      ]}
    />
  ))
  const input = getByRole('checkbox') as HTMLInputElement
  input.checked = true
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }))
  await settle()
  expect(receivers).toEqual([input])
  expect(changed).not.toHaveBeenCalled()
  expect(input.checked).toBe(false)
})
test('empty autofocus focuses the native checked host', async () => {
  const { getByRole } = render(() => <Checkbox aria-label="Autofocus" autofocus="" />)
  await settle()
  expect(getByRole('checkbox')).toHaveFocus()
})
