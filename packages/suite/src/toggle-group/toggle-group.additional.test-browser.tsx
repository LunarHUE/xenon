import { ToggleGroup } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('toggle-group.keyboard.5 updates roving tabindex when Home and End move focus', async () => {
  const m = mount('toggle-group', {
    children: () => (
      <>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </>
    ),
  })
  const scope = within(m.container)
  const bold = scope.getByRole('button', { name: 'Bold' })
  const underline = scope.getByRole('button', { name: 'Underline' })
  underline.focus()
  await userEvent.keyboard('{Home}')
  await m.settle()
  expect(bold).toHaveFocus()
  expect(bold).toHaveAttribute('tabindex', '0')
  expect(underline).toHaveAttribute('tabindex', '-1')
  await userEvent.keyboard('{End}')
  await m.settle()
  expect(underline).toHaveFocus()
  expect(underline).toHaveAttribute('tabindex', '0')
  expect(bold).toHaveAttribute('tabindex', '-1')
  m.unmount()
})
