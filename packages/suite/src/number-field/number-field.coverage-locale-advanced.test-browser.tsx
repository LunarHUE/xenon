import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'
import { userEvent } from 'vitest/browser'
import { NumberField } from '@xenon-ui/solid/number-field'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
function mount(props: Record<string, unknown>) {
  dispose?.()
  host?.remove()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <NumberField {...props}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    host
  )
}

test('number-field.rtl.9: currency and locale literals tolerate editing and trailing symbol deletion', async () => {
  const changed = vi.fn()
  mount({
    locale: 'de-DE',
    formatOptions: { style: 'currency', currency: 'EUR' },
    onValueChange: changed,
  })
  await settle()
  const input = within(host!).getByRole('spinbutton') as HTMLInputElement
  await userEvent.fill(input, '12,50 €')
  await settle()
  expect(input).toHaveValue('12,50 €')
  expect(changed).not.toHaveBeenCalled()
  input.setSelectionRange(input.value.length, input.value.length)
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(input).toHaveValue('12,50 ')
  expect(changed).not.toHaveBeenCalled()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(12.5)

  const multi = vi.fn()
  mount({
    locale: 'pt-BR',
    formatOptions: { style: 'currency', currency: 'BRL' },
    onValueChange: multi,
  })
  await settle()
  const multiInput = within(host!).getByRole('spinbutton') as HTMLInputElement
  await userEvent.fill(multiInput, 'R$ 12,50')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(multi).toHaveBeenCalledExactlyOnceWith(12.5)
})

test('number-field.rtl.10: accounting parentheses parse negative and closing-parenthesis deletion is exercised natively', async () => {
  const changed = vi.fn()
  mount({
    locale: 'en-US',
    formatOptions: { style: 'currency', currency: 'USD', currencySign: 'accounting' },
    onValueChange: changed,
  })
  await settle()
  const input = within(host!).getByRole('spinbutton') as HTMLInputElement
  await userEvent.fill(input, '($10.00)')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(-10)
  expect.soft(input).toHaveAttribute('aria-valuetext', '−$10.00')
  await userEvent.fill(input, '($10.00)')
  await settle()
  input.setSelectionRange(input.value.length, input.value.length)
  await userEvent.keyboard('{Backspace}')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  // The contract requires this edit to flip positive; this assertion exposes regressions in that path.
  expect(changed).toHaveBeenLastCalledWith(10)
  expect(input).toHaveAttribute('aria-valuetext', '$10.00')
})

test('number-field.rtl.10: minus-sign accounting locale parses and removes its native sign', async () => {
  const changed = vi.fn()
  mount({
    locale: 'de-DE',
    formatOptions: { style: 'currency', currency: 'EUR', currencySign: 'accounting' },
    onValueChange: changed,
  })
  await settle()
  const input = within(host!).getByRole('spinbutton') as HTMLInputElement
  await userEvent.fill(input, '-10,00 €')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(-10)
  expect(input).toHaveValue('-10,00 €')
  expect.soft(input).toHaveAttribute('aria-valuetext', '−10,00 €')
  input.setSelectionRange(0, 0)
  await userEvent.keyboard('{Delete}')
  await settle()
  expect(input).toHaveValue('10,00 €')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(changed.mock.calls.map(([value]) => value)).toEqual([-10, 10])
  expect(input).toHaveAttribute('aria-valuetext', '10,00 €')
})

test('number-field.rtl.13: native Arabic stepping visits plural categories 0, 1 and 2', async () => {
  const changed = vi.fn()
  mount({
    locale: 'ar-EG',
    defaultValue: 0,
    formatOptions: { style: 'unit', unit: 'hour', unitDisplay: 'long' },
    onValueChange: changed,
  })
  await settle()
  const input = within(host!).getByRole('spinbutton') as HTMLInputElement
  expect(input).toHaveValue(
    new Intl.NumberFormat('ar-EG', { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(0)
  )
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(input).toHaveValue(
    new Intl.NumberFormat('ar-EG', { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(1)
  )
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(input).toHaveValue(
    new Intl.NumberFormat('ar-EG', { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(2)
  )
  expect(changed.mock.calls.map(([value]) => value)).toEqual([1, 2])
})
