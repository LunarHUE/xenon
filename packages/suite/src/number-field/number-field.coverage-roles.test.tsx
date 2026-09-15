import { NumberField } from '@xenon/solid/number-field'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function fixture(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <NumberField {...props}>
        <NumberField.Input aria-label="Amount" />
        <NumberField.IncrementTrigger>
          <span aria-hidden="true">+</span>
        </NumberField.IncrementTrigger>
        <NumberField.DecrementTrigger>
          <span aria-hidden="true">−</span>
        </NumberField.DecrementTrigger>
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

test('number-field.roles.2 and number-field.roles.26 synchronize numeric ARIA values and valuetext', async () => {
  const [value, setValue] = createSignal<number | null>(5)
  const [min, setMin] = createSignal(0)
  const [max, setMax] = createSignal(10)
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <NumberField
        value={value()}
        min={min()}
        max={max()}
        locale="en-US"
        formatOptions={{ style: 'currency', currency: 'USD' }}
      >
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  const m = {
    container,
    settle: async () => {
      flush()
      await Promise.resolve()
      flush()
    },
  }
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  expect(input).toHaveAttribute('aria-valuenow', '5')
  expect(input).toHaveAttribute('aria-valuemin', '0')
  expect(input).toHaveAttribute('aria-valuemax', '10')
  expect(input).toHaveAttribute('aria-valuetext', '$5.00')
  expect(input).toHaveAttribute('type', 'text')
  setValue(8)
  setMin(2)
  setMax(12)
  await m.settle()
  expect(input).toHaveAttribute('aria-valuenow', '8')
  expect(input).toHaveAttribute('aria-valuemin', '2')
  expect(input).toHaveAttribute('aria-valuemax', '12')
  expect(input).toHaveAttribute('aria-valuetext', '$8.00')
  setValue(null)
  await m.settle()
  expect(input).not.toHaveAttribute('aria-valuenow')
  expect(input).not.toHaveAttribute('aria-valuetext')
})

test('number-field.roles.3 omits unset spinbutton bounds', async () => {
  const m = fixture({ defaultValue: 5 })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  expect(input).toHaveAttribute('aria-valuenow', '5')
  expect(input).not.toHaveAttribute('aria-valuemin')
  expect(input).not.toHaveAttribute('aria-valuemax')
})

test('number-field.roles.3 omits empty value and supports one-sided bounds', async () => {
  const empty = fixture()
  await empty.settle()
  const emptyInput = within(empty.container).getByRole('spinbutton')
  expect(emptyInput).not.toHaveAttribute('aria-valuenow')
  expect(emptyInput).not.toHaveAttribute('aria-valuemin')
  expect(emptyInput).not.toHaveAttribute('aria-valuemax')
  const minimum = fixture({ defaultValue: 5, min: 0 })
  await minimum.settle()
  expect(within(minimum.container).getByRole('spinbutton')).toHaveAttribute('aria-valuemin', '0')
  expect(within(minimum.container).getByRole('spinbutton')).not.toHaveAttribute('aria-valuemax')
  const maximum = fixture({ defaultValue: 5, max: 10 })
  await maximum.settle()
  expect(within(maximum.container).getByRole('spinbutton')).not.toHaveAttribute('aria-valuemin')
  expect(within(maximum.container).getByRole('spinbutton')).toHaveAttribute('aria-valuemax', '10')
})

test('number-field.roles.26 omits numeric ARIA for a malformed public draft', async () => {
  const m = fixture({ defaultValue: 5 })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  expect(input).toHaveAttribute('aria-valuenow', '5')
  fireEvent.input(input, { target: { value: 'not-a-number' } })
  await m.settle()
  expect(input).not.toHaveAttribute('aria-valuenow')
  expect(input).not.toHaveAttribute('aria-valuetext')
})

test('number-field.roles.7 uses a text host for numeric parsing', async () => {
  const m = fixture({ defaultValue: 1 })
  await m.settle()
  expect(within(m.container).getByRole('spinbutton')).toHaveAttribute('type', 'text')
})

test('number-field.roles.9 names both steppers, controls the input, and hides glyphs', async () => {
  const m = fixture({ defaultValue: 1 })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  const increment = within(m.container).getByRole('button', { name: 'Increase' })
  const decrement = within(m.container).getByRole('button', { name: 'Decrease' })
  expect(increment).toHaveAttribute('aria-controls', input.id)
  expect(decrement).toHaveAttribute('aria-controls', input.id)
  expect(input.id).not.toBe('')
  expect(increment.querySelector('span')).toHaveAttribute('aria-hidden', 'true')
  expect(decrement.querySelector('span')).toHaveAttribute('aria-hidden', 'true')
})

test('number-field.roles.11 conditionally disables steppers at both bounds', async () => {
  const m = fixture({ defaultValue: 0, min: 0, max: 1 })
  await m.settle()
  const increment = within(m.container).getByRole('button', { name: 'Increase' })
  const decrement = within(m.container).getByRole('button', { name: 'Decrease' })
  expect(decrement).toHaveAttribute('aria-disabled', 'true')
  expect(increment).not.toHaveAttribute('aria-disabled')
  const interior = fixture({ defaultValue: 1, min: 0, max: 2 })
  await interior.settle()
  expect(within(interior.container).getByRole('button', { name: 'Increase' })).not.toHaveAttribute(
    'aria-disabled'
  )
  expect(within(interior.container).getByRole('button', { name: 'Decrease' })).not.toHaveAttribute(
    'aria-disabled'
  )
  const max = fixture({ defaultValue: 1, min: 0, max: 1 })
  await max.settle()
  expect(within(max.container).getByRole('button', { name: 'Increase' })).toHaveAttribute(
    'aria-disabled',
    'true'
  )
  expect(within(max.container).getByRole('button', { name: 'Decrease' })).not.toHaveAttribute(
    'aria-disabled'
  )
})
