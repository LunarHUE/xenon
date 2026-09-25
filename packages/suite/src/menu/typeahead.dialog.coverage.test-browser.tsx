import { Dialog, Menu } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
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

test('typeahead.keyboard.14 keeps dialog input typing out of the Menu composite after item activation', async () => {
  const selected = vi.fn()
  const [open, setOpen] = createSignal(false)
  const view = mount(() => (
    <>
      <Menu>
        <Menu.Trigger>Open actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item
              onSelect={() => {
                selected()
                setOpen(true)
              }}
            >
              Edit search
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <Dialog
        open={open()}
        onOpenChange={(next) => {
          setOpen(next)
        }}
      >
        <Dialog.Content aria-label="Edit search">
          <input aria-label="Search query" />
        </Dialog.Content>
      </Dialog>
    </>
  ))

  await userEvent.click(view.getByRole('button', { name: 'Open actions' }))
  await userEvent.click(view.getByRole('menuitem', { name: 'Edit search' }))
  await new Promise((resolve) => setTimeout(resolve, 40))
  flush()

  expect(selected).toHaveBeenCalledTimes(1)
  expect(view.queryByRole('menu')).toBeNull()
  const dialog = within(document.body).getByRole('dialog', { name: 'Edit search' })
  expect(dialog).toHaveAttribute('data-state', 'open')
  const input = within(document.body).getByRole('textbox', { name: 'Search query' })
  await userEvent.click(input)
  await userEvent.keyboard('find')
  expect(input).toHaveValue('find')
  expect(input).toHaveFocus()
  expect(selected).toHaveBeenCalledTimes(1)
  expect(view.queryByRole('menu')).toBeNull()
})
