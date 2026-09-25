import { NumberField } from '@xenon-ui/solid/number-field'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
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

test('number-field.rtl.1: locale props use each locale’s grouping and decimal separators', async () => {
  const us = fixture({ locale: 'en-US', defaultValue: 1234.5 })
  const de = fixture({ locale: 'de-DE', defaultValue: 1234.5 })
  const pl = fixture({ locale: 'pl', defaultValue: 10000.5 })
  await Promise.all([us.settle(), de.settle(), pl.settle()])
  expect(within(us.container).getByRole('spinbutton')).toHaveValue('1,234.5')
  expect(within(de.container).getByRole('spinbutton')).toHaveValue('1.234,5')
  expect(within(pl.container).getByRole('spinbutton')).toHaveValue('10 000,5')
})

test('number-field.rtl.2: format options render Intl currency percent unit sign and fractions and update reactively', async () => {
  const [options, setOptions] = createSignal<Intl.NumberFormatOptions>({
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <NumberField locale="en-US" defaultValue={10} formatOptions={options()}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  await Promise.resolve()
  flush()
  const input = within(container).getByRole('spinbutton')
  expect(input).toHaveValue('EUR 10.00')
  setOptions({ style: 'percent', maximumFractionDigits: 0 })
  flush()
  await Promise.resolve()
  flush()
  expect(input).toHaveValue('1,000%')
  setOptions({ style: 'unit', unit: 'inch', unitDisplay: 'long' })
  flush()
  await Promise.resolve()
  flush()
  expect(input).toHaveValue('10 inches')
  setOptions({ signDisplay: 'always', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  flush()
  await Promise.resolve()
  flush()
  expect(input).toHaveValue('+10.0')
})

test('number-field.rtl.2: currency symbol, accounting negatives, percent, units and fraction rounding match Intl', async () => {
  const examples = [
    [{ style: 'currency', currency: 'USD' }, 10, '$10.00'],
    [{ style: 'currency', currency: 'USD', currencySign: 'accounting' }, -10, '($10.00)'],
    [{ style: 'percent', maximumFractionDigits: 0 }, 0.05, '5%'],
    [{ style: 'unit', unit: 'minute', unitDisplay: 'short' }, 13, '13 min'],
    [{ minimumFractionDigits: 2, maximumFractionDigits: 2 }, 1.236, '1.24'],
  ] as const
  for (const [formatOptions, value, expected] of examples) {
    const m = fixture({ locale: 'en-US', defaultValue: value, formatOptions })
    await m.settle()
    expect(within(m.container).getByRole('spinbutton')).toHaveValue(expected)
  }
})

test('number-field.rtl.3: percent drafts report fractions and unit style does not divide by 100', async () => {
  const percentChange = vi.fn()
  const percent = fixture({
    locale: 'en-US',
    formatOptions: { style: 'percent', maximumFractionDigits: 2 },
    onValueChange: percentChange,
  })
  const unitChange = vi.fn()
  const unit = fixture({
    locale: 'en-US',
    formatOptions: { style: 'unit', unit: 'percent', unitDisplay: 'short' },
    onValueChange: unitChange,
  })
  await Promise.all([percent.settle(), unit.settle()])
  const percentInput = within(percent.container).getByRole('spinbutton')
  const unitInput = within(unit.container).getByRole('spinbutton')
  fireEvent.input(percentInput, { target: { value: '2.11' } })
  await percent.settle()
  fireEvent.keyDown(percentInput, { key: 'Enter' })
  fireEvent.input(unitInput, { target: { value: '5' } })
  await unit.settle()
  fireEvent.keyDown(unitInput, { key: 'Enter' })
  await Promise.all([percent.settle(), unit.settle()])
  expect(percentChange).toHaveBeenCalledTimes(1)
  expect(percentChange.mock.calls[0]![0]).toBeCloseTo(0.0211, 12)
  expect(unitChange).toHaveBeenCalledExactlyOnceWith(5)
})

test('number-field.rtl.5: Arabic, Persian, Devanagari, Bengali, Han and fullwidth digits parse with locale separators', async () => {
  const cases = [
    ['ar-EG', '١٬٢٣٤٫٥'],
    ['fa-IR', '۱٬۲۳۴٫۵'],
    ['hi-IN-u-nu-deva', '१,२३४.५'],
    ['bn-BD', '১,২৩৪.৫'],
    ['zh-CN-u-nu-hanidec', '一,二三四.五'],
    ['en-US-u-nu-fullwide', '１,２３４.５'],
  ] as const
  for (const [locale, text] of cases) {
    const changed = vi.fn()
    const m = fixture({ locale, onValueChange: changed })
    await m.settle()
    const input = within(m.container).getByRole('spinbutton')
    fireEvent.input(input, { target: { value: text } })
    await m.settle()
    fireEvent.keyDown(input, { key: 'Enter' })
    await m.settle()
    expect(changed, locale).toHaveBeenCalledExactlyOnceWith(1234.5)
  }
})

test('number-field.rtl.5: fullwidth digits and punctuation parse together', async () => {
  const changed = vi.fn()
  const m = fixture({ locale: 'en-US-u-nu-fullwide', onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  fireEvent.input(input, { target: { value: '１，２３４．５' } })
  await m.settle()
  fireEvent.keyDown(input, { key: 'Enter' })
  await m.settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(1234.5)
})
