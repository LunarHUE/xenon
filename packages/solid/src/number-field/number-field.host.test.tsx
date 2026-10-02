import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { NumberField } from './index'

test('normalizes reactive native disabled and forwards ref arrays', async () => {
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  let first: HTMLInputElement | undefined
  let second: HTMLInputElement | undefined
  const refs = [(el: HTMLInputElement) => (first = el), [(el: HTMLInputElement) => (second = el)]]
  const { container } = render(() => (
    <NumberField disabled={disabled()}>
      <NumberField.Input ref={refs} />
    </NumberField>
  ))
  flush()
  await Promise.resolve()
  const host = container.querySelector('input')!
  expect((host as HTMLInputElement).disabled).toBe(true)
  expect(first).toBe(host)
  expect(second).toBe(host)
  setDisabled(false)
  flush()
  expect((host as HTMLInputElement).disabled).toBe(false)
  setDisabled(true)
  flush()
  expect((host as HTMLInputElement).disabled).toBe(true)
  setDisabled(undefined)
  flush()
  expect((host as HTMLInputElement).disabled).toBe(false)
})
