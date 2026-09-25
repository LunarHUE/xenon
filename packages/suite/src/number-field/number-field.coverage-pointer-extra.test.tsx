import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'

import { NumberField } from '@xenon-ui/solid/number-field'

const disposers: (() => void)[] = []
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  flush()
})

function mount(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  disposers.push(
    render(
      () => (
        <NumberField {...props}>
          <NumberField.Input aria-label="Amount" />
          <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
          <NumberField.DecrementTrigger>−</NumberField.DecrementTrigger>
        </NumberField>
      ),
      container
    )
  )
  flush()
  return { container, ...within(container) }
}

function typeDraft(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  flush()
}

test('number-field.pointer.1 clicks each stepper by one step even with a largeStep', () => {
  const changed = vi.fn()
  const view = mount({ defaultValue: 4, step: 2, largeStep: 20, onValueChange: changed })
  const input = view.getByRole('spinbutton')
  const increase = view.getByRole('button', { name: 'Increase' })
  const decrease = view.getByRole('button', { name: 'Decrease' })

  increase.click()
  flush()
  expect(input).toHaveValue('6')
  decrease.click()
  flush()
  expect(input).toHaveValue('4')
  expect(changed).toHaveBeenNthCalledWith(1, 6)
  expect(changed).toHaveBeenNthCalledWith(2, 4)
  expect(changed).toHaveBeenCalledTimes(2)
})

test.each([1, 2])(
  'number-field.pointer.6 ignores pointer button %s with a dirty draft',
  (button) => {
    const changed = vi.fn()
    const view = mount({ defaultValue: 4, onValueChange: changed })
    const input = view.getByRole('spinbutton') as HTMLInputElement
    const increase = view.getByRole('button', { name: 'Increase' }) as HTMLButtonElement
    typeDraft(input, '9.00')

    increase.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button }))
    increase.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button }))
    increase.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, button }))
    flush()

    expect(input).toHaveValue('9.00')
    expect(changed).not.toHaveBeenCalled()
  }
)

test.each([
  ['disabled', { disabled: true }],
  ['readonly', { readonly: true }],
] as const)(
  'number-field.pointer.13 leaves a %s field unchanged on either stepper click',
  (_name, props) => {
    const changed = vi.fn()
    const view = mount({ ...props, defaultValue: 4, onValueChange: changed })
    const input = view.getByRole('spinbutton')
    view.getByRole('button', { name: 'Increase' }).click()
    view.getByRole('button', { name: 'Decrease' }).click()
    flush()

    expect(input).toHaveValue('4')
    expect(changed).not.toHaveBeenCalled()
  }
)
