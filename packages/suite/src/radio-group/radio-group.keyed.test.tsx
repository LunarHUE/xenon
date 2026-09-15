import { RadioGroup } from '@xenon/solid'
import { fireEvent, within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

test('radio-group removes keyed items without halting reactive updates', async () => {
  const [items, setItems] = createSignal(['a', 'b', 'c'])
  const m = mount('radio-group', {
    value: 'b',
    'aria-label': 'Choices',
    children: () => (
      <For each={items()}>
        {(value) => <RadioGroup.Item as="button" value={value} aria-label={value} />}
      </For>
    ),
  })
  setItems(['b', 'c', 'd'])
  await m.settle()
  const scope = within(m.container)
  expect(scope.queryByRole('radio', { name: 'a' })).toBeNull()
  expect(scope.getAllByRole('radio')).toHaveLength(3)
  expect(scope.getByRole('radio', { name: 'b' })).toHaveAttribute('data-state', 'checked')
  const second = scope.getByRole('radio', { name: 'b' })
  second.focus()
  await m.settle()
  fireEvent.keyDown(second, { key: 'ArrowDown' })
  await m.settle()
  expect(scope.getByRole('radio', { name: 'c' })).toHaveFocus()
  setItems(['b', 'd'])
  await m.settle()
  expect(scope.queryByRole('radio', { name: 'c' })).toBeNull()
  expect(scope.getAllByRole('radio')).toHaveLength(2)
  expect(scope.getByRole('radio', { name: 'b' })).toHaveAttribute('data-state', 'checked')
})
