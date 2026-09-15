import { Menu } from '@xenon/solid'
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
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 40))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

/** Local two-level Export submenu fixture with an optional reading direction and item spy. */
function NestedExportMenu(props: { dir?: 'ltr' | 'rtl'; onSelect?: (event: Event) => void }) {
  return (
    <Menu dir={props.dir}>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="File actions">
          <Menu.Sub>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Sub>
                  <Menu.SubTrigger>Document</Menu.SubTrigger>
                  <Menu.Positioner>
                    <Menu.Content aria-label="Document formats">
                      <Menu.Item onSelect={props.onSelect}>PDF</Menu.Item>
                      <Menu.Item>CSV</Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Sub>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  )
}

test('keyboard activation toggles checkbox items repeatedly and keeps one radio checked per group', async () => {
  const checked = vi.fn()
  const density = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>View options</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem onCheckedChange={checked}>
            Guides<Menu.ItemIndicator data-testid="guides-indicator">✓</Menu.ItemIndicator>
          </Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="compact" onValueChange={density}>
            <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
            <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'View options' })
  await userEvent.click(trigger)
  await settle()
  const guides = m.getByRole('menuitemcheckbox', { name: 'Guides' })
  expect(guides).toHaveFocus()
  expect(guides).toHaveAttribute('aria-checked', 'false')
  expect(m.queryByTestId('guides-indicator')).toBeNull()
  await userEvent.keyboard(' ')
  await settle()
  expect(guides).toHaveAttribute('aria-checked', 'true')
  expect(m.getByTestId('guides-indicator')).toBeVisible()
  await userEvent.keyboard(' ')
  await settle()
  expect(guides).toHaveAttribute('aria-checked', 'false')
  expect(m.queryByTestId('guides-indicator')).toBeNull()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(guides).toHaveAttribute('aria-checked', 'true')
  expect(checked.mock.calls).toEqual([[true], [false], [true]])
  await userEvent.keyboard('{ArrowDown}')
  const compact = m.getByRole('menuitemradio', { name: 'Compact' })
  expect(compact).toHaveFocus()
  expect(compact).toHaveAttribute('aria-checked', 'true')
  await userEvent.keyboard(' ')
  await settle()
  expect(density).not.toHaveBeenCalled()
  await userEvent.keyboard('{ArrowDown}')
  const comfortable = m.getByRole('menuitemradio', { name: 'Comfortable' })
  expect(comfortable).toHaveFocus()
  await userEvent.keyboard(' ')
  await settle()
  expect(comfortable).toHaveAttribute('aria-checked', 'true')
  expect(compact).toHaveAttribute('aria-checked', 'false')
  await userEvent.keyboard('{ArrowUp}')
  expect(compact).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(density.mock.calls).toEqual([['comfortable'], ['compact']])
  expect(compact).toHaveAttribute('aria-checked', 'true')
  expect(comfortable).toHaveAttribute('aria-checked', 'false')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('menu')).toBeVisible()
})

test('disabled checkbox and radio items keep their state through pointer and keyboard activation', async () => {
  const checked = vi.fn()
  const density = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>View options</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem disabled onCheckedChange={checked}>
            Guides
          </Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="compact" onValueChange={density}>
            <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
            <Menu.RadioItem value="comfortable" disabled>
              Comfortable
            </Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'View options' })
  await userEvent.click(trigger)
  await settle()
  const guides = m.getByRole('menuitemcheckbox', { name: 'Guides' })
  expect(guides).toHaveFocus()
  expect(guides).toHaveAttribute('aria-disabled', 'true')
  expect(guides).not.toHaveAttribute('disabled')
  await userEvent.click(guides, { force: true })
  await settle()
  expect(guides).toHaveAttribute('aria-checked', 'false')
  await userEvent.keyboard(' ')
  await settle()
  expect(guides).toHaveAttribute('aria-checked', 'false')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(checked).not.toHaveBeenCalled()
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('menuitemradio', { name: 'Compact' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  const comfortable = m.getByRole('menuitemradio', { name: 'Comfortable' })
  expect(comfortable).toHaveFocus()
  expect(comfortable).toHaveAttribute('aria-disabled', 'true')
  expect(comfortable).not.toHaveAttribute('disabled')
  await userEvent.keyboard(' ')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  await userEvent.click(comfortable, { force: true })
  await settle()
  expect(comfortable).toHaveAttribute('aria-checked', 'false')
  expect(m.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute('aria-checked', 'true')
  expect(density).not.toHaveBeenCalled()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('menu')).toBeVisible()
})

test('Escape closes one nested submenu level at a time and returns focus to each trigger', async () => {
  const m = mount(() => <NestedExportMenu />)
  const trigger = m.getByRole('button', { name: 'File' })
  await userEvent.click(trigger)
  await settle()
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  expect(exportTrigger).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  const documentTrigger = m.getByRole('menuitem', { name: 'Document' })
  expect(documentTrigger).toHaveFocus()
  expect(documentTrigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
  expect(m.getByRole('menu', { name: 'Document formats' })).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Document formats' })).toBeNull()
  expect(m.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(documentTrigger).toHaveFocus()
  expect(documentTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('menu', { name: 'File actions' })).toBeNull()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('RTL back arrows close one nested submenu level per press and selection restores the root trigger', async () => {
  const selected = vi.fn()
  const m = mount(() => <NestedExportMenu dir="rtl" onSelect={selected} />)
  const trigger = m.getByRole('button', { name: 'File' })
  await userEvent.click(trigger)
  await settle()
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  expect(exportTrigger).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  const documentTrigger = m.getByRole('menuitem', { name: 'Document' })
  expect(documentTrigger).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Document formats' })).toBeNull()
  expect(m.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(documentTrigger).toHaveFocus()
  expect(documentTrigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(selected).toHaveBeenCalledTimes(1)
  expect(m.queryByRole('menu', { name: 'Document formats' })).toBeNull()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(m.queryByRole('menu', { name: 'File actions' })).toBeNull()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('a canceled selection inside a submenu keeps every level open and the submenu usable', async () => {
  const cancel = vi.fn((event: Event) => event.preventDefault())
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="File actions">
          <Menu.Sub>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Item onSelect={cancel}>Keep open</Menu.Item>
                <Menu.Item onSelect={selected}>PDF</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
          <Menu.Item onSelect={selected}>Print</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'File' })
  await userEvent.click(trigger)
  await settle()
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  const keepOpen = m.getByRole('menuitem', { name: 'Keep open' })
  expect(keepOpen).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await settle()
  await userEvent.keyboard(' ')
  await settle()
  expect(cancel).toHaveBeenCalledTimes(2)
  expect(selected).not.toHaveBeenCalled()
  expect(m.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(m.getByRole('menu', { name: 'File actions' })).toBeVisible()
  expect(keepOpen).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(m.getByRole('menu', { name: 'File actions' })).toBeVisible()
  expect(exportTrigger).toHaveFocus()
})

test('a disabled submenu trigger does not open on hover, forward arrow, Enter, or pointer', async () => {
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="File actions">
          <Menu.Sub>
            <Menu.SubTrigger disabled>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Item onSelect={selected}>PDF</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
          <Menu.Item onSelect={selected}>Print</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'File' })
  await userEvent.click(trigger)
  await settle()
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-disabled', 'true')
  expect(exportTrigger).not.toHaveAttribute('disabled')
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.hover(exportTrigger)
  await new Promise<void>((resolve) => setTimeout(resolve, 220))
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  await userEvent.keyboard('{Enter}')
  await settle()
  await userEvent.click(exportTrigger, { force: true })
  await settle()
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(selected).not.toHaveBeenCalled()
  expect(m.getByRole('menu', { name: 'File actions' })).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})
