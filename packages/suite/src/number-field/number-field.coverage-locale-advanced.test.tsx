import { NumberField } from '@xenon-ui/solid/number-field'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))
function fixture(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <NumberField {...props}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  return {
    container,
    async settle() {
      flush()
      await Promise.resolve()
      flush()
    },
  }
}

test('number-field.rtl.13: Arabic long unit formatting preserves singular dual and plural values', async () => {
  for (const value of [0, 1, 2, 5]) {
    const m = fixture({
      locale: 'ar-EG',
      defaultValue: value,
      formatOptions: { style: 'unit', unit: 'hour', unitDisplay: 'long' },
    })
    await m.settle()
    expect(within(m.container).getByRole('spinbutton')).toHaveValue(
      new Intl.NumberFormat('ar-EG', { style: 'unit', unit: 'hour', unitDisplay: 'long' }).format(
        value
      )
    )
  }
})

test('number-field.rtl.14: locale numbering systems format and parse Latin Arabic Han Devanagari and Bengali digits', async () => {
  const cases = [
    ['en-US', 1234.5],
    ['ar-EG', 1234.5],
    ['zh-CN-u-nu-hanidec', 1234.5],
    ['hi-IN-u-nu-deva', 1234.5],
    ['bn-BD', 1234.5],
  ] as const
  for (const [locale, value] of cases) {
    const changed = vi.fn()
    const m = fixture({ locale, onValueChange: changed })
    await m.settle()
    const input = within(m.container).getByRole('spinbutton')
    const typed = new Intl.NumberFormat(locale).format(value)
    ;(input as HTMLInputElement).value = typed
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    await m.settle()
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await m.settle()
    expect(changed).toHaveBeenCalledExactlyOnceWith(value)
    expect(input).toHaveValue(typed)
  }
})

test('number-field.rtl.16: comma-decimal stepping follows the step grid rather than typed fraction', async () => {
  const changed = vi.fn()
  const m = fixture({ locale: 'de-DE', defaultValue: 1.1, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('2')
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('1')
  expect(changed.mock.calls.map(([value]) => value)).toEqual([2, 1])
})
