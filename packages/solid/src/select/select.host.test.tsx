import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Select } from './index'

test('normalizes reactive native disabled and forwards ref arrays', async () => {
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  let first: HTMLButtonElement | undefined
  let second: HTMLButtonElement | undefined
  const refs = [(el: HTMLButtonElement) => (first = el), [(el: HTMLButtonElement) => (second = el)]]
  const { container } = render(() => (
    <Select items={[]} disabled={disabled()}>
      <Select.Trigger ref={refs}>Flags</Select.Trigger>
    </Select>
  ))
  flush()
  await Promise.resolve()
  const host = container.querySelector('button')!
  expect((host as HTMLButtonElement).disabled).toBe(true)
  expect(first).toBe(host)
  expect(second).toBe(host)
  setDisabled(false)
  flush()
  expect((host as HTMLButtonElement).disabled).toBe(false)
  setDisabled(true)
  flush()
  expect((host as HTMLButtonElement).disabled).toBe(true)
  setDisabled(undefined)
  flush()
  expect((host as HTMLButtonElement).disabled).toBe(false)
})
