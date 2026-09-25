import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { NumberField } from '@xenon-ui/solid/number-field'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function inputFor(container: HTMLElement) {
  return container.querySelector('input[role="spinbutton"]') as HTMLInputElement
}

test('number-field.notes.9 deletes the decimal separator forward and backward in native text editing', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <NumberField locale="en-US" defaultValue={123.45} onValueChange={change}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputFor(m.container)
  expect(input).toHaveValue('123.45')

  await userEvent.click(input)
  input.setSelectionRange(3, 3)
  await userEvent.keyboard('{Delete}')
  await settle()
  expect(document.activeElement).toBe(input)
  expect(input).toHaveValue('12345')
  expect(change).not.toHaveBeenCalled()

  const secondChange = vi.fn()
  const second = mount(() => (
    <NumberField locale="en-US" defaultValue={123.45} onValueChange={secondChange}>
      <NumberField.Input aria-label="Second amount" />
    </NumberField>
  ))
  const secondInput = inputFor(second.container)
  await userEvent.click(secondInput)
  secondInput.setSelectionRange(4, 4)
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(document.activeElement).toBe(secondInput)
  expect(secondInput).toHaveValue('12345')
  expect(secondChange).not.toHaveBeenCalled()
})

test('number-field.notes.9 deletes the minus sign from either caret direction', async () => {
  const forwardChange = vi.fn()
  const forward = mount(() => (
    <NumberField locale="en-US" defaultValue={-123.45} onValueChange={forwardChange}>
      <NumberField.Input aria-label="Forward amount" />
    </NumberField>
  ))
  const forwardInput = inputFor(forward.container)
  expect(forwardInput).toHaveValue('-123.45')
  await userEvent.click(forwardInput)
  forwardInput.setSelectionRange(0, 0)
  await userEvent.keyboard('{Delete}')
  await settle()
  expect(document.activeElement).toBe(forwardInput)
  expect(forwardInput).toHaveValue('123.45')
  expect(forwardChange).not.toHaveBeenCalled()

  const backwardChange = vi.fn()
  const backward = mount(() => (
    <NumberField locale="en-US" defaultValue={-123.45} onValueChange={backwardChange}>
      <NumberField.Input aria-label="Backward amount" />
    </NumberField>
  ))
  const backwardInput = inputFor(backward.container)
  await userEvent.click(backwardInput)
  backwardInput.setSelectionRange(1, 1)
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(document.activeElement).toBe(backwardInput)
  expect(backwardInput).toHaveValue('123.45')
  expect(backwardChange).not.toHaveBeenCalled()
})

test('number-field.notes.9 deletes digits on both sides of the decimal without losing adjacent text', async () => {
  const leftChange = vi.fn()
  const left = mount(() => (
    <NumberField locale="en-US" defaultValue={123.45} onValueChange={leftChange}>
      <NumberField.Input aria-label="Left amount" />
    </NumberField>
  ))
  const leftInput = inputFor(left.container)
  await userEvent.click(leftInput)
  leftInput.setSelectionRange(3, 3)
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(document.activeElement).toBe(leftInput)
  expect(leftInput).toHaveValue('12.45')
  expect(leftChange).not.toHaveBeenCalled()

  const rightChange = vi.fn()
  const right = mount(() => (
    <NumberField locale="en-US" defaultValue={123.45} onValueChange={rightChange}>
      <NumberField.Input aria-label="Right amount" />
    </NumberField>
  ))
  const rightInput = inputFor(right.container)
  await userEvent.click(rightInput)
  rightInput.setSelectionRange(4, 5)
  await userEvent.keyboard('{Delete}')
  await settle()
  expect(document.activeElement).toBe(rightInput)
  expect(rightInput).toHaveValue('123.5')
  expect(rightChange).not.toHaveBeenCalled()
})
