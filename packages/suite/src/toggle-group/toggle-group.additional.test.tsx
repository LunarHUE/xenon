import { ToggleGroup } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'

function setup(props = {}) {
  return mount('toggle-group', {
    'aria-labelledby': 'format-label',
    children: () => (
      <>
        <span id="format-label">Formatting</span>
        <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>
        <ToggleGroup.Item value="italic">Italic</ToggleGroup.Item>
        <ToggleGroup.Item value="underline">Underline</ToggleGroup.Item>
      </>
    ),
    ...props,
  })
}

test('toggle-group.roles.1 names the group through aria-labelledby', () => {
  const m = setup()
  expect(within(m.container).getByRole('group')).toHaveAccessibleName('Formatting')
  m.unmount()
})

test('toggle-group.roles.3 keeps group semantics and omits invalid aria-orientation', () => {
  for (const orientation of ['horizontal', 'vertical'] as const) {
    for (const mode of ['single', 'multiple'] as const) {
      const m = setup({ orientation, mode })
      const root = within(m.container).getByRole('group')
      expect(root).toHaveAttribute('data-orientation', orientation)
      expect(root).not.toHaveAttribute('aria-orientation')
      m.unmount()
    }
  }
})

test('toggle-group.notes.3 forwards root ref, style and click while retaining selection', async () => {
  const rootRef = vi.fn()
  const rootClick = vi.fn()
  const m = mount('toggle-group', {
    ref: rootRef,
    class: 'root-author',
    style: { color: 'red' },
    onClick: rootClick,
    children: () => <ToggleGroup.Item value="bold">Bold</ToggleGroup.Item>,
  })
  const root = within(m.container).getByRole('group')
  const item = within(m.container).getByRole('button', { name: 'Bold' })
  expect(rootRef).toHaveBeenCalledWith(root)
  expect(root).toHaveClass('root-author')
  expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  fireEvent.click(item)
  await m.settle()
  expect(rootClick).toHaveBeenCalledOnce()
  expect(item).toHaveAttribute('aria-pressed', 'true')
  m.unmount()
})
