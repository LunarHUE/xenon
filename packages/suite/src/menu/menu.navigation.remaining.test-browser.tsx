import { Menu } from '@xenon-ui/solid/menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
async function focused(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(element)
}

test('typeahead wraps before the active item and an unmatched character preserves focus menu.keyboard.18', async () => {
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item onSelect={selected}>Apple</Menu.Item>
          <Menu.Item onSelect={selected}>Apricot</Menu.Item>
          <Menu.Item onSelect={selected}>Banana</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  await focused(m.getByRole('menuitem', { name: 'Apple' }))
  await userEvent.keyboard('{End}')
  await focused(m.getByRole('menuitem', { name: 'Banana' }))
  await userEvent.keyboard('a')
  await focused(m.getByRole('menuitem', { name: 'Apple' }))
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => m.queryByRole('menu')).toBeNull()
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  await focused(m.getByRole('menuitem', { name: 'Apple' }))
  await userEvent.keyboard('{End}')
  await focused(m.getByRole('menuitem', { name: 'Banana' }))
  await userEvent.keyboard('z')
  expect(m.getByRole('menuitem', { name: 'Banana' })).toHaveFocus()
  expect(selected).not.toHaveBeenCalled()
})

for (const [label, key] of [
  ['apple', 'A'],
  ['BANANA', 'b'],
]) {
  test(`typeahead matches ${JSON.stringify(key)} against ${label} menu.keyboard.22`, async () => {
    const m = mount(() => (
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Start</Menu.Item>
            <Menu.Item>{label}</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    await userEvent.click(m.getByRole('button', { name: 'Actions' }))
    await focused(m.getByRole('menuitem', { name: 'Start' }))
    await userEvent.keyboard(key!)
    await focused(m.getByRole('menuitem', { name: label }))
  })
}

test('a diacritic keydown matches the same diacritic in item text menu.keyboard.22', async () => {
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item>Start</Menu.Item>
          <Menu.Item>Éclair</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  const first = m.getByRole('menuitem', { name: 'Start' })
  await focused(first)
  // Vitest's Playwright provider uses insertText for non-US keys, which emits
  // no keydown on a menu item. Exercise the Unicode event contract explicitly;
  // this synthetic event does not claim OS keyboard-layout or IME coverage.
  const event = new KeyboardEvent('keydown', { key: 'é', bubbles: true, cancelable: true })
  first.dispatchEvent(event)
  flush()
  expect(event.defaultPrevented).toBe(true)
  await focused(m.getByRole('menuitem', { name: 'Éclair' }))
})

function NestedMenu(props: {
  onRootChange?: (open: boolean) => void
  onSubChange?: (open: boolean) => void
  onSelect?: (event: Event) => void
}) {
  return (
    <Menu onOpenChange={props.onRootChange}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="Outer actions">
          <Menu.Sub onOpenChange={props.onSubChange}>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Item onSelect={props.onSelect}>Beta</Menu.Item>
                <Menu.Item onSelect={props.onSelect}>Able</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
          <Menu.Item onSelect={props.onSelect}>Zebra</Menu.Item>
          <Menu.Item onSelect={props.onSelect}>Alpha</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  )
}

test('submenu typeahead ignores outer-only matches and matches its own prefix menu.keyboard.30', async () => {
  const selected = vi.fn()
  const m = mount(() => <NestedMenu onSelect={selected} />)
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  await focused(m.getByRole('menuitem', { name: 'Export' }))
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('menuitem', { name: 'Beta' }))
  await userEvent.keyboard('z')
  expect(m.getByRole('menuitem', { name: 'Beta' })).toHaveFocus()
  expect(m.getByRole('menuitem', { name: 'Zebra' })).not.toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  await focused(m.getByRole('menuitem', { name: 'Export' }))
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('menuitem', { name: 'Beta' }))
  await userEvent.keyboard('a')
  await focused(m.getByRole('menuitem', { name: 'Able' }))
  expect(m.getByRole('menuitem', { name: 'Alpha' })).not.toHaveFocus()
  expect(selected).not.toHaveBeenCalled()
})

for (const key of ['{Enter}', ' ']) {
  test(`submenu ${key === ' ' ? 'Space' : 'Enter'} opens at its first item menu.keyboard.24 menu.keyboard.33`, async () => {
    const rootChange = vi.fn(),
      subChange = vi.fn(),
      selected = vi.fn()
    const m = mount(() => (
      <NestedMenu onRootChange={rootChange} onSubChange={subChange} onSelect={selected} />
    ))
    const trigger = m.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    const subtrigger = m.getByRole('menuitem', { name: 'Export' })
    await focused(subtrigger)
    await userEvent.keyboard(key)
    await focused(m.getByRole('menuitem', { name: 'Beta' }))
    expect(subtrigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(rootChange.mock.calls).toEqual([[true]])
    expect(subChange.mock.calls).toEqual([[true]])
    expect(selected).not.toHaveBeenCalled()
  })
}

test('clicking a submenu trigger twice keeps both menus open without duplicate requests menu.pointer.25', async () => {
  const rootChange = vi.fn(),
    subChange = vi.fn(),
    selected = vi.fn()
  const m = mount(() => (
    <NestedMenu onRootChange={rootChange} onSubChange={subChange} onSelect={selected} />
  ))
  const trigger = m.getByRole('button', { name: 'Actions' })
  await userEvent.click(trigger)
  const subtrigger = m.getByRole('menuitem', { name: 'Export' })
  await focused(subtrigger)
  await userEvent.click(subtrigger)
  await focused(m.getByRole('menuitem', { name: 'Beta' }))
  const submenu = m.getByRole('menu', { name: 'Export formats' })
  await userEvent.click(subtrigger)
  await focused(m.getByRole('menuitem', { name: 'Beta' }))
  expect(m.getByRole('menu', { name: 'Export formats' })).toBe(submenu)
  expect(submenu).toBeVisible()
  expect(m.getByRole('menu', { name: 'Outer actions' })).toBeVisible()
  expect(subtrigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(rootChange.mock.calls).toEqual([[true]])
  expect(subChange.mock.calls).toEqual([[true]])
  expect(selected).not.toHaveBeenCalled()
})
