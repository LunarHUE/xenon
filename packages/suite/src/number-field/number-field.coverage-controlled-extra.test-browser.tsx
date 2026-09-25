import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { NumberField } from '@xenon-ui/solid/number-field'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createSignal, flush } from 'solid-js'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})

function mount(children: () => JSX.Element) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(children, host)
  flush()
  return host
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function inputIn(root: HTMLElement) {
  return root.querySelector<HTMLInputElement>('input[role="spinbutton"]')!
}

test('number-field.state.2: default zero renders as 0 without a mount callback', () => {
  const change = vi.fn()
  const root = mount(() => (
    <NumberField defaultValue={0} onValueChange={change}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  expect(inputIn(root)).toHaveValue('0')
  expect(change).not.toHaveBeenCalled()
})

test('number-field.state.14: a finer-than-display step reports precision while text stays rounded', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <NumberField
      defaultValue={1}
      step={0.0001}
      formatOptions={{ maximumFractionDigits: 0 }}
      onValueChange={change}
    >
      <NumberField.Input aria-label="Amount" />
      <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
    </NumberField>
  ))
  const input = inputIn(root)
  expect(input).toHaveValue('1')
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(input).toHaveValue('1')
  expect(change).toHaveBeenCalledExactlyOnceWith(1.0001)
})

test('number-field.state.17: external value replaces a typing draft and survives blur', async () => {
  const [value, setValue] = createSignal<number | null>(2)
  const root = mount(() => (
    <NumberField value={value()} onValueChange={setValue}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputIn(root)
  await userEvent.click(input)
  await userEvent.fill(input, '12')
  setValue(7)
  await settle()
  expect(input).toHaveValue('7')
  await userEvent.click(root.ownerDocument.body)
  await settle()
  expect(input).toHaveValue('7')
})

test('number-field.state.18: an external value after stepping becomes the next step base', async () => {
  const [value, setValue] = createSignal<number | null>(2)
  const root = mount(() => (
    <NumberField value={value()} step={1} onValueChange={setValue}>
      <NumberField.Input aria-label="Amount" />
      <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
    </NumberField>
  ))
  const input = inputIn(root)
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(input).toHaveValue('3')
  setValue(8)
  await settle()
  expect(input).toHaveValue('8')
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(input).toHaveValue('9')
})

test('number-field.state.19: a controlled null value empties the input', async () => {
  const [value, setValue] = createSignal<number | null>(4)
  const root = mount(() => (
    <NumberField value={value()} onValueChange={setValue}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputIn(root)
  expect(input).toHaveValue('4')
  setValue(null)
  await settle()
  expect(input).toHaveValue('')
})

test('number-field.state.20: no-edit blur preserves rounded text and later stepping precision', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <NumberField
      defaultValue={1.2345}
      step={0.0001}
      formatOptions={{ maximumFractionDigits: 2 }}
      onValueChange={change}
    >
      <NumberField.Input aria-label="Amount" />
      <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
    </NumberField>
  ))
  const input = inputIn(root)
  expect(input).toHaveValue('1.23')
  await userEvent.click(input)
  await userEvent.click(root.ownerDocument.body)
  await settle()
  expect(input).toHaveValue('1.23')
  expect(change).not.toHaveBeenCalled()
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith(1.2346)
  await userEvent.click(input)
  await userEvent.fill(input, '1.23460')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(input).toHaveValue('1.23')
  expect(change).toHaveBeenCalledExactlyOnceWith(1.2346)
})
