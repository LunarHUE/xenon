import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from './button'

describe('<Button />', () => {
  test('renders a native button with type=button', () => {
    const { getByRole } = render(() => <Button>Go</Button>)
    const el = getByRole('button')
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('type', 'button')
    expect(el).not.toHaveAttribute('data-disabled')
  })

  test('disabled is reactive', () => {
    const [disabled, setDisabled] = createSignal(false)
    const { getByRole } = render(() => <Button disabled={disabled()}>Go</Button>)
    const el = getByRole('button')
    expect(el).not.toBeDisabled()
    setDisabled(true)
    flush()
    expect(el).toBeDisabled()
    expect(el).toHaveAttribute('data-disabled', '')
  })

  test('as="div" gets role, tab stop and keyboard activation', () => {
    const onClick = vi.fn()
    const { getByRole } = render(() => (
      <Button as="div" onClick={onClick}>
        Go
      </Button>
    ))
    const el = getByRole('button')
    expect(el.tagName).toBe('DIV')
    expect(el).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(el, { key: 'Enter' })
    expect(onClick).toHaveBeenCalledOnce()
    fireEvent.keyDown(el, { key: ' ' })
    fireEvent.keyUp(el, { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  test('user keydown runs first and can cancel the core handler', () => {
    const onClick = vi.fn()
    const { getByRole } = render(() => (
      <Button as="div" onClick={onClick} onKeyDown={(e) => e.preventDefault()}>
        Go
      </Button>
    ))
    fireEvent.keyDown(getByRole('button'), { key: 'Enter' })
    expect(onClick).not.toHaveBeenCalled()
  })

  test('user attributes win over core attributes', () => {
    const { getByRole } = render(() => <Button type="submit">Go</Button>)
    expect(getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
