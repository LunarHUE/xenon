import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Listbox } from './index'

test('normalizes reactive native disabled and forwards ref arrays', async () => {
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  let first: HTMLDivElement | undefined
  let second: HTMLDivElement | undefined
  const refs = [(el: HTMLDivElement) => (first = el), [(el: HTMLDivElement) => (second = el)]]
  const { container } = render(() => (
    <Listbox disabled={disabled()} ref={refs}>
      <Listbox.Item value="a">A</Listbox.Item>
    </Listbox>
  ))
  flush()
  await Promise.resolve()
  const host = container.querySelector('div')!
  expect(host).toHaveAttribute('data-disabled')
  expect(first).toBe(host)
  expect(second).toBe(host)
  setDisabled(false)
  flush()
  expect(host).not.toHaveAttribute('data-disabled')
  setDisabled(true)
  flush()
  expect(host).toHaveAttribute('data-disabled')
  setDisabled(undefined)
  flush()
  expect(host).not.toHaveAttribute('data-disabled')
})
