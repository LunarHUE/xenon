import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { For, flush } from 'solid-js'
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

function mountPin({
  length = 4,
  name,
  defaultValue,
  type,
  onValueComplete,
  placeholders = false,
  form = false,
}: {
  length?: number
  name?: string
  defaultValue?: string
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  onValueComplete?: (value: string) => void
  placeholders?: boolean
  form?: boolean
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(() => {
    const pin = (
      <PinInput
        name={name}
        defaultValue={defaultValue}
        length={length}
        type={type}
        onValueComplete={onValueComplete}
      >
        <For each={Array.from({ length }, (_value, index) => index)}>
          {(index) => (
            <PinInput.Input
              index={index}
              placeholder={placeholders ? String(index + 1) : undefined}
            />
          )}
        </For>
      </PinInput>
    )
    return form ? <form>{pin}</form> : pin
  }, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const root = container.querySelector('[data-index]')!.parentElement!
  const slots = Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
  return {
    container,
    root,
    slots,
    form: container.querySelector('form'),
    proxy: container.querySelector<HTMLInputElement>('input[aria-hidden="true"]')!,
  }
}

function paste(slot: HTMLInputElement, text: string) {
  const clipboard = new DataTransfer()
  clipboard.setData('text', text)
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: clipboard })
  slot.dispatchEvent(event)
  flush()
}

test('pin-input.state.17 native reset on the mounted instance restores empty slots and placeholders', async () => {
  const fixture = mountPin({ length: 4, placeholders: true, form: true })
  const reset = document.createElement('button')
  reset.type = 'reset'
  reset.textContent = 'Reset'
  fixture.form!.append(reset)

  await userEvent.click(fixture.slots[0]!)
  await userEvent.type(fixture.slots[0]!, '1234')
  expect(fixture.slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4'])
  expect(fixture.slots.map((slot) => slot.placeholder)).toEqual(['1', '2', '3', '4'])
  expect(fixture.slots.every((slot) => !slot.matches(':placeholder-shown'))).toBe(true)

  await userEvent.click(reset)
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(fixture.slots.map((slot) => slot.value)).toEqual(['', '', '', ''])
  expect(fixture.slots.map((slot) => slot.placeholder)).toEqual(['1', '2', '3', '4'])
  expect(fixture.slots.every((slot) => slot.matches(':placeholder-shown'))).toBe(true)
})

test('pin-input.state.2 completion repeats after clearing and refilling the same last character', async () => {
  const completed = vi.fn()
  const fixture = mountPin({ length: 2, onValueComplete: completed })

  await userEvent.click(fixture.slots[0]!)
  await userEvent.type(fixture.slots[0]!, '12')
  expect(completed).toHaveBeenCalledExactlyOnceWith('12')

  await userEvent.keyboard('{Backspace}')
  expect(fixture.slots.map((slot) => slot.value)).toEqual(['1', ''])
  await userEvent.click(fixture.slots[1]!)
  await userEvent.type(fixture.slots[1]!, '2')
  expect(completed).toHaveBeenCalledTimes(2)
  expect(completed).toHaveBeenLastCalledWith('12')

  await userEvent.keyboard('{Control>}{Backspace}{/Control}')
  expect(fixture.slots.map((slot) => slot.value)).toEqual(['', ''])
  await userEvent.type(fixture.slots[0]!, '12')
  expect(completed).toHaveBeenCalledTimes(3)
  expect(completed).toHaveBeenLastCalledWith('12')
})

test('pin-input.state.3 incomplete edits remain silent for completion', async () => {
  const completed = vi.fn()
  const fixture = mountPin({ length: 4, onValueComplete: completed })

  await userEvent.click(fixture.slots[0]!)
  await userEvent.type(fixture.slots[0]!, '12')
  expect(fixture.slots.map((slot) => slot.value)).toEqual(['1', '2', '', ''])
  expect(completed).not.toHaveBeenCalled()
})

test('pin-input.state.6 overlong default values clamp slots and the submitted proxy', () => {
  const fixture = mountPin({ length: 4, defaultValue: '123456', name: 'otp', form: true })

  expect(fixture.slots.map((slot) => slot.value)).toEqual(['1', '2', '3', '4'])
  expect(fixture.proxy).toHaveValue('1234')
  expect([...new FormData(fixture.form!)].filter(([key]) => key === 'otp')).toEqual([
    ['otp', '1234'],
  ])
})

test('pin-input.state.8 typed and pasted filtering supports numeric alphabetic and alphanumeric modes', async () => {
  const cases = [
    { type: 'numeric' as const, input: '1a2b3C', expected: '123' },
    { type: 'alphabetic' as const, input: '1a2b3C', expected: 'abC' },
    { type: 'alphanumeric' as const, input: 'A1-B2c3', expected: 'A1B2c3' },
  ]

  for (const { type, input, expected } of cases) {
    const typed = mountPin({ length: 6, type })
    await userEvent.click(typed.slots[0]!)
    await userEvent.type(typed.slots[0]!, input)
    expect(typed.slots.map((slot) => slot.value).join('')).toBe(expected)

    const pasted = mountPin({ length: 6, type })
    pasted.slots[0]!.focus()
    paste(pasted.slots[0]!, input)
    expect(pasted.slots.map((slot) => slot.value).join('')).toBe(expected)
  }
})
