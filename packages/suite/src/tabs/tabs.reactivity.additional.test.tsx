import { Tabs } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'

describe('tabs reactive identity', () => {
  test('removing the selected tab selects the first remaining enabled tab', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const changed = vi.fn()
    const m = mount('tabs', {
      defaultValue: 'b',
      onValueChange: changed,
      children: () => (
        <>
          <Tabs.List aria-label="Sections">
            <For each={items()}>{(value) => <Tabs.Tab value={value}>{value}</Tabs.Tab>}</For>
          </Tabs.List>
          <For each={items()}>
            {(value) => <Tabs.Panel value={value}>{value} content</Tabs.Panel>}
          </For>
        </>
      ),
    })
    expect(within(m.container).getByRole('tab', { name: 'b' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    setItems(['a', 'c'])
    await m.settle()
    const scope = within(m.container)
    expect(scope.getByRole('tab', { name: 'a' })).toHaveAttribute('aria-selected', 'true')
    expect(scope.getByRole('tabpanel')).toHaveAccessibleName('a')
    expect(changed).not.toHaveBeenCalled()
  })

  test.each(['automatic', 'manual'] as const)(
    'reordering keyed tabs preserves selection and follows the new document order in %s mode',
    async (activationMode) => {
      const [items, setItems] = createSignal(['a', 'b', 'c'])
      const m = mount('tabs', {
        defaultValue: 'b',
        activationMode,
        children: () => (
          <>
            <Tabs.List aria-label="Sections">
              <For each={items()}>{(value) => <Tabs.Tab value={value}>{value}</Tabs.Tab>}</For>
            </Tabs.List>
            <For each={items()}>
              {(value) => <Tabs.Panel value={value}>{value} content</Tabs.Panel>}
            </For>
          </>
        ),
      })
      const scope = within(m.container)
      const selected = scope.getByRole('tab', { name: 'b' })
      setItems(['c', 'b', 'a'])
      await m.settle()
      expect(scope.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['c', 'b', 'a'])
      expect(scope.getByRole('tab', { name: 'b' })).toBe(selected)
      expect(selected).toHaveAttribute('aria-selected', 'true')
      selected.focus()
      await m.settle()
      fireEvent.keyDown(selected, { key: 'ArrowRight' })
      await m.settle()
      expect(scope.getByRole('tab', { name: 'a' })).toHaveFocus()
      expect(
        scope.getByRole('tab', { name: activationMode === 'automatic' ? 'a' : 'b' })
      ).toHaveAttribute('aria-selected', 'true')
      fireEvent.keyDown(scope.getByRole('tab', { name: 'a' }), { key: 'Home' })
      await m.settle()
      expect(scope.getByRole('tab', { name: 'c' })).toHaveFocus()
      fireEvent.keyDown(scope.getByRole('tab', { name: 'c' }), { key: 'End' })
      await m.settle()
      expect(scope.getByRole('tab', { name: 'a' })).toHaveFocus()
    }
  )
})
