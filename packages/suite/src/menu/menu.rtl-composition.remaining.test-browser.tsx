import { Menu } from '@xenon-ui/solid/menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return within(container)
}
async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}

test('menu.rtl.2: Right on Document requests closing its deepest child submenu while Export remains open', async () => {
  const rootChange = vi.fn(),
    exportChange = vi.fn(),
    documentChange = vi.fn()
  const m = mount(() => (
    <Menu dir="rtl" onOpenChange={rootChange}>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="File actions">
          <Menu.Sub onOpenChange={exportChange}>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Sub onOpenChange={documentChange}>
                  <Menu.SubTrigger>Document</Menu.SubTrigger>
                  <Menu.Positioner>
                    <Menu.Content aria-label="Document formats">
                      <Menu.Item>PDF</Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Sub>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const root = m.getByRole('button', { name: 'File' })
  await userEvent.click(root)
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  await focused(exportTrigger)
  await userEvent.keyboard('{ArrowLeft}')
  const documentTrigger = m.getByRole('menuitem', { name: 'Document' })
  await focused(documentTrigger)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(m.getByRole('menuitem', { name: 'PDF' }))
  // Document opens the deepest child submenu; Export is its containing menu.
  documentTrigger.focus()
  await focused(documentTrigger)
  await userEvent.keyboard('{ArrowRight}')
  await focused(documentTrigger)
  await expect.poll(() => m.queryByRole('menu', { name: 'Document formats' })).toBeNull()
  expect(m.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(m.getByRole('menu', { name: 'File actions' })).toBeVisible()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(root).toHaveAttribute('aria-expanded', 'true')
  expect(documentTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(rootChange.mock.calls).toEqual([[true]])
  expect(exportChange.mock.calls).toEqual([[true]])
  expect(documentChange.mock.calls).toEqual([[true], [false]])
})

test('LTR Left on an open submenu trigger mirrors menu.rtl.2 and closes only its child submenu', async () => {
  const exportChange = vi.fn(),
    documentChange = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>File</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="File actions">
          <Menu.Sub onOpenChange={exportChange}>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Sub onOpenChange={documentChange}>
                  <Menu.SubTrigger>Document</Menu.SubTrigger>
                  <Menu.Positioner>
                    <Menu.Content aria-label="Document formats">
                      <Menu.Item>PDF</Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Sub>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'File' }))
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  await focused(exportTrigger)
  await userEvent.keyboard('{ArrowRight}')
  const documentTrigger = m.getByRole('menuitem', { name: 'Document' })
  await focused(documentTrigger)
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('menuitem', { name: 'PDF' }))
  documentTrigger.focus()
  await focused(documentTrigger)
  await userEvent.keyboard('{ArrowLeft}')
  await expect.poll(() => m.queryByRole('menu', { name: 'Document formats' })).toBeNull()
  expect(documentTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(documentChange.mock.calls).toEqual([[true], [false]])
  // With the child closed, the same key falls through to closing the containing submenu.
  await userEvent.keyboard('{ArrowLeft}')
  await focused(exportTrigger)
  await expect.poll(() => m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(exportChange.mock.calls).toEqual([[true], [false]])
})

for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End', 'b']) {
  test(`menu.rtl.5: composing ${key} preserves open-menu focus and selection`, async () => {
    const selected = vi.fn(),
      changed = vi.fn()
    const m = mount(() => (
      <Menu onOpenChange={changed}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item onSelect={selected}>Apple</Menu.Item>
            <Menu.Item onSelect={selected}>Banana</Menu.Item>
            <Menu.Item onSelect={selected}>Cherry</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    const trigger = m.getByRole('button', { name: 'Actions' })
    await userEvent.click(trigger)
    await focused(m.getByRole('menuitem', { name: 'Apple' }))
    await userEvent.keyboard('{ArrowDown}')
    const banana = m.getByRole('menuitem', { name: 'Banana' })
    await focused(banana)
    const event = new KeyboardEvent('keydown', {
      key,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    })
    banana.dispatchEvent(event)
    flush()
    expect(event.defaultPrevented).toBe(false)
    expect(banana).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(selected).not.toHaveBeenCalled()
    expect(changed.mock.calls).toEqual([[true]])
    await userEvent.keyboard('{ArrowDown}')
    await focused(m.getByRole('menuitem', { name: 'Cherry' }))
  })
}

for (const key of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
  test(`menu.rtl.5: composing ${JSON.stringify(key)} leaves the trigger closed`, () => {
    const changed = vi.fn()
    const m = mount(() => (
      <Menu onOpenChange={changed}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Apple</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    const trigger = m.getByRole('button', { name: 'Actions' })
    trigger.focus()
    const event = new KeyboardEvent('keydown', {
      key,
      isComposing: true,
      bubbles: true,
      cancelable: true,
    })
    trigger.dispatchEvent(event)
    flush()
    expect(event.defaultPrevented).toBe(false)
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('menu')).toBeNull()
    expect(changed).not.toHaveBeenCalled()
  })
}
