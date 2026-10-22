import { ContextMenu } from '@xenon-ui/solid/context-menu'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}

test('context-menu.rtl.1: native Left opens a submenu and Right returns to its trigger with the root still open', async () => {
  const changed = vi.fn(),
    subChanged = vi.fn(),
    selected = vi.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <ContextMenu dir="rtl" onOpenChange={changed}>
        <ContextMenu.Trigger style={{ width: '300px', height: '160px' }}>
          Canvas
        </ContextMenu.Trigger>
        <ContextMenu.Positioner>
          <ContextMenu.Content aria-label="Canvas actions">
            <ContextMenu.Sub onOpenChange={subChanged}>
              <ContextMenu.SubTrigger>Export</ContextMenu.SubTrigger>
              <ContextMenu.Positioner>
                <ContextMenu.Content aria-label="Export formats">
                  <ContextMenu.Item onSelect={selected}>PDF</ContextMenu.Item>
                  <ContextMenu.Item onSelect={selected}>CSV</ContextMenu.Item>
                </ContextMenu.Content>
              </ContextMenu.Positioner>
            </ContextMenu.Sub>
            <ContextMenu.Item>Save</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const m = within(container)
  await userEvent.click(m.getByText('Canvas'), { button: 'right', position: { x: 40, y: 40 } })
  await focused(m.getByRole('menu', { name: 'Canvas actions' }))
  await userEvent.keyboard('{ArrowDown}')
  const trigger = m.getByRole('menuitem', { name: 'Export' })
  await focused(trigger)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(m.getByRole('menuitem', { name: 'PDF' }))
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
  await userEvent.keyboard('{ArrowRight}')
  await focused(trigger)
  await expect.poll(() => m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(m.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(changed.mock.calls).toEqual([[true]])
  expect(subChanged.mock.calls).toEqual([[true], [false]])
  expect(selected).not.toHaveBeenCalled()
  await userEvent.keyboard('{ArrowLeft}')
  await focused(m.getByRole('menuitem', { name: 'PDF' }))
  expect(subChanged.mock.calls).toEqual([[true], [false], [true]])
})
