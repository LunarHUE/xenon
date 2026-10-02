import { render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Select } from '../select'

test('selection positioner forwards nested native div refs', async () => {
  let first: HTMLDivElement | undefined
  let second: HTMLDivElement | undefined
  const { container } = render(() => (
    <Select items={[]} defaultOpen>
      <Select.Trigger>Open</Select.Trigger>
      <Select.Positioner ref={[(el) => (first = el), [(el) => (second = el)]]}>
        <Select.Content />
      </Select.Positioner>
    </Select>
  ))
  flush()
  await Promise.resolve()
  expect(first).toBe(container.querySelector('[popover]'))
  expect(second).toBe(first)
})
