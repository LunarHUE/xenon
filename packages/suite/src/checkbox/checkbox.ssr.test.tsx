import { Checkbox, Field } from '@kit/solid'
import { screen } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('checkbox.ssr.3', async () => {
  const [items, setItems] = createSignal<Array<{ id?: string }>>([{ id: 'old-checkbox' }])
  const m = mount('field', {
    children: () => (
      <>
        <Field.Label>Accept</Field.Label>
        <For each={items()}>{(item) => <Checkbox id={item.id} />}</For>
      </>
    ),
  })
  await m.settle()
  const old = screen.getByRole('checkbox', { name: 'Accept' })
  expect(old).toHaveAttribute('id', 'old-checkbox')
  setItems([{}])
  await m.settle()
  const replacement = screen.getByRole('checkbox', { name: 'Accept' })
  expect(replacement).not.toBe(old)
  expect(replacement.id).not.toBe('')
  expect(replacement.id).not.toBe('old-checkbox')
  expect(screen.getByText('Accept')).toHaveAttribute('for', replacement.id)
  expect(old.isConnected).toBe(false)
})
