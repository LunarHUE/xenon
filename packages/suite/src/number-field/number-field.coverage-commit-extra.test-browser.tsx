import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { NumberField } from '@xenon/solid/number-field'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { flush } from 'solid-js'

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

test('number-field.state.21 keeps more than 15 significant digits while focused and reports both callbacks', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const root = mount(() => (
    <NumberField onValueChange={change} onValueCommit={commit}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputIn(root)
  const text = '1234567890123456'
  await userEvent.click(input)
  await userEvent.fill(input, text)
  await settle()
  expect(document.activeElement).toBe(input)
  expect(input).toHaveValue(text)
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith(1234567890123456)
  expect(commit).toHaveBeenCalledExactlyOnceWith(1234567890123456)
})

test('number-field.state.29: clearing then blurring above a positive minimum stays empty', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const root = mount(() => (
    <NumberField min={2} defaultValue={5} onValueChange={change} onValueCommit={commit}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputIn(root)
  await userEvent.click(input)
  await userEvent.fill(input, '')
  await userEvent.click(root.ownerDocument.body)
  await settle()
  expect(input).toHaveValue('')
  expect(change).toHaveBeenCalledExactlyOnceWith(null)
  expect(commit).toHaveBeenCalledExactlyOnceWith(null)
})

test('number-field.state.8: untouched and unparseable blur do not commit', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const root = mount(() => (
    <NumberField defaultValue={4} onValueChange={change} onValueCommit={commit}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = inputIn(root)
  await userEvent.click(input)
  await userEvent.click(root.ownerDocument.body)
  await settle()
  expect(input).toHaveValue('4')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  await userEvent.click(input)
  await userEvent.fill(input, 'not-a-number')
  await userEvent.click(root.ownerDocument.body)
  await settle()
  expect(input).toHaveValue('4')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})
