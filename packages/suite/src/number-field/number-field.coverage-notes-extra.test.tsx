import { NumberField } from '@xenon/solid/number-field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
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

test('number-field.notes.1 supports a small arrow step and a large paged step', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <NumberField defaultValue={0} step={1} largeStep={25} onValueChange={changed}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  fireEvent.keyDown(input, { key: 'ArrowUp' })
  await m.settle()
  expect(input).toHaveValue('1')
  expect(changed.mock.calls.map(([value]) => value)).toEqual([1])

  const large = mount(() => (
    <NumberField defaultValue={0} step={1} largeStep={25}>
      <NumberField.Input aria-label="Large amount" />
    </NumberField>
  ))
  await large.settle()
  const largeInput = within(large.container).getByRole('spinbutton')
  fireEvent.keyDown(largeInput, { key: 'PageUp' })
  await large.settle()
  expect(largeInput).toHaveValue('25')
})

test('number-field.notes.20 preserves an uncommitted draft across fresh format option rerenders', async () => {
  const [formatOptions, setFormatOptions] = createSignal<Intl.NumberFormatOptions>({
    style: 'currency',
    currency: 'EUR',
  })
  const m = mount(() => (
    <NumberField defaultValue={12} locale="en-US" formatOptions={formatOptions()}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  expect(input).toHaveValue('€12.00')
  setFormatOptions({ style: 'currency', currency: 'USD' })
  await m.settle()
  expect(input).toHaveValue('$12.00')
  fireEvent.input(input, { target: { value: '123' } })
  await m.settle()
  setFormatOptions({ style: 'currency', currency: 'USD' })
  await m.settle()
  expect(input).toHaveValue('123')

  const [tick, setTick] = createSignal(0)
  const undefinedOptions = mount(() => (
    <NumberField defaultValue={12} formatOptions={undefined}>
      <NumberField.Input aria-label={`Unformatted ${tick()}`} />
    </NumberField>
  ))
  await undefinedOptions.settle()
  const unformatted = within(undefinedOptions.container).getByRole('spinbutton')
  fireEvent.input(unformatted, { target: { value: '456' } })
  await undefinedOptions.settle()
  setTick(1)
  await undefinedOptions.settle()
  expect(unformatted).toHaveValue('456')

  setFormatOptions({ style: 'currency', currency: 'EUR' })
  await m.settle()
  expect(input).toHaveValue('€123.00')
})

test('number-field.notes.23 a canceled cancelable blur does not reformat or commit', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <NumberField
      defaultValue={12}
      locale="en-US"
      formatOptions={{ style: 'currency', currency: 'USD' }}
      onValueChange={changed}
    >
      <NumberField.Input aria-label="Amount" onBlur={(event) => event.preventDefault()} />
    </NumberField>
  ))
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  fireEvent.input(input, { target: { value: '13' } })
  await m.settle()
  fireEvent.blur(input, { cancelable: true })
  await m.settle()
  expect(input).toHaveValue('13')
  expect(changed).not.toHaveBeenCalled()

  // Native blur is not cancelable; this positive control must still commit.
  fireEvent.blur(input)
  await m.settle()
  expect(input).toHaveValue('$13.00')
  expect(changed).toHaveBeenCalledExactlyOnceWith(13)
})
