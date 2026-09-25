import { ToggleGroup } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

test('toggle-group removes keyed items without halting reactive updates', async () => {
  const [items, setItems] = createSignal(['a', 'b', 'c'])
  const m = mount('toggle-group', {
    value: 'b',
    'aria-label': 'Choices',
    children: () => (
      <For each={items()}>
        {(value) => <ToggleGroup.Item value={value}>{value}</ToggleGroup.Item>}
      </For>
    ),
  })
  setItems(['b', 'c', 'd'])
  await m.settle()
  const scope = within(m.container)
  expect(scope.queryByRole('button', { name: 'a' })).toBeNull()
  expect(scope.getAllByRole('button')).toHaveLength(3)
  expect(scope.getByRole('button', { name: 'b' })).toHaveAttribute('aria-pressed', 'true')
  const second = scope.getByRole('button', { name: 'b' })
  second.focus()
  await m.settle()
  fireEvent.keyDown(second, { key: 'ArrowRight' })
  await m.settle()
  expect(scope.getByRole('button', { name: 'c' })).toHaveFocus()
  setItems(['b', 'd'])
  await m.settle()
  expect(scope.queryByRole('button', { name: 'c' })).toBeNull()
  expect(scope.getAllByRole('button')).toHaveLength(2)
  expect(scope.getByRole('button', { name: 'b' })).toHaveAttribute('aria-pressed', 'true')
})
