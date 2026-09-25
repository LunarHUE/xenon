import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'

import { NumberField } from '@xenon-ui/solid/number-field'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('number-field.pointer.15 ignores ctrl-wheel pinch gestures', async () => {
  const changed = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <NumberField defaultValue={4} onValueChange={changed}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    host
  )
  await settle()
  const input = host.querySelector('input[role="spinbutton"]') as HTMLInputElement
  input.focus()
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY: 100,
    ctrlKey: true,
  })
  input.dispatchEvent(event)
  await settle()

  expect(input).toHaveValue('4')
  expect(changed).not.toHaveBeenCalled()
  expect(event.defaultPrevented).toBe(false)
})

test('number-field.pointer.16 ignores wheel events over an unfocused input', async () => {
  const changed = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <NumberField defaultValue={4} onValueChange={changed}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    host
  )
  await settle()
  const input = host.querySelector('input[role="spinbutton"]') as HTMLInputElement
  expect(document.activeElement).not.toBe(input)
  const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 })
  input.dispatchEvent(event)
  await settle()

  expect(input).toHaveValue('4')
  expect(changed).not.toHaveBeenCalled()
  expect(event.defaultPrevented).toBe(false)
})

test('number-field.pointer.5 real primary click steps exactly once', async () => {
  const changed = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <NumberField defaultValue={4} onValueChange={changed}>
        <NumberField.Input aria-label="Amount" />
        <NumberField.IncrementTrigger />
      </NumberField>
    ),
    host
  )
  await settle()
  const input = host.querySelector('input[role="spinbutton"]') as HTMLInputElement
  const increase = host.querySelector('button') as HTMLButtonElement
  const sequence: string[] = []
  for (const type of ['pointerdown', 'pointerup', 'click'])
    increase.addEventListener(type, () => sequence.push(type))

  const { userEvent } = await import('vitest/browser')
  await userEvent.click(increase)
  await settle()

  expect(sequence).toEqual(['pointerdown', 'pointerup', 'click'])
  expect(input).toHaveValue('5')
  expect(changed).toHaveBeenCalledExactlyOnceWith(5)
})

test.each(['middle', 'right'] as const)(
  'number-field.pointer.6 real %s click leaves a dirty draft unchanged',
  async (button) => {
    const changed = vi.fn()
    host = document.createElement('div')
    document.body.append(host)
    dispose = render(
      () => (
        <NumberField defaultValue={4} onValueChange={changed}>
          <NumberField.Input aria-label="Amount" />
          <NumberField.IncrementTrigger />
        </NumberField>
      ),
      host
    )
    await settle()
    const input = host.querySelector('input[role="spinbutton"]') as HTMLInputElement
    const increase = host.querySelector('button') as HTMLButtonElement
    input.value = '9.00'
    input.dispatchEvent(new InputEvent('input', { bubbles: true }))
    await settle()

    const { userEvent } = await import('vitest/browser')
    const clicks: string[] = []
    increase.addEventListener('click', () => clicks.push('click'))
    increase.addEventListener('auxclick', () => clicks.push('auxclick'))
    await userEvent.click(increase, { button })
    await settle()

    expect(clicks).toEqual(['auxclick'])
    expect(input).toHaveValue('9.00')
    expect(changed).not.toHaveBeenCalled()
  }
)
