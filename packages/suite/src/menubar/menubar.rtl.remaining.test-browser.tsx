import { Menubar } from '@xenon-ui/solid/menubar'
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
function mount() {
  const changed = vi.fn()
  const container = document.createElement('div')
  container.style.margin = '100px'
  document.body.append(container)
  const dispose = render(
    () => (
      <Menubar dir="rtl" loop={false} aria-label="Editor" onValueChange={changed}>
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>Save</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
        <Menubar.Menu value="disabled">
          <Menubar.Trigger disabled>Disabled</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>Unavailable</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger>Edit</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>Copy</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
        <Menubar.Menu value="view">
          <Menubar.Trigger>View</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>Zoom</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
      </Menubar>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { ...within(container), changed }
}

test('menubar.rtl.1: loop=false clamps both RTL endpoints and skips disabled triggers', async () => {
  const m = mount()
  const file = m.getByRole('menuitem', { name: 'File' })
  const edit = m.getByRole('menuitem', { name: 'Edit' })
  const view = m.getByRole('menuitem', { name: 'View' })
  file.focus()
  await userEvent.keyboard('{ArrowRight}')
  await focused(file)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(edit)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(view)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(view)
  await userEvent.keyboard('{ArrowRight}')
  await focused(edit)
  await userEvent.keyboard('{ArrowRight}')
  await focused(file)
  expect(m.queryByRole('menu')).toBeNull()
  expect(m.changed).not.toHaveBeenCalled()
})

for (const [start, initialItem, key, destination, destinationItem, expected] of [
  ['File', 'Save', 'ArrowLeft', 'Edit', 'Copy', ['file', 'edit']],
  ['View', 'Zoom', 'ArrowRight', 'Edit', 'Copy', ['view', 'edit']],
] as const) {
  test(`menubar.rtl.1: ${key} switches an open ${start} menu and focuses ${destinationItem}`, async () => {
    const m = mount()
    const trigger = m.getByRole('menuitem', { name: start })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await focused(m.getByRole('menuitem', { name: initialItem }))
    await userEvent.keyboard(`{${key}}`)
    await focused(m.getByRole('menuitem', { name: destinationItem }))
    // Focus transfers before the outgoing menu finishes its presence exit.
    await expect.poll(() => m.queryByRole('menu', { name: start })).toBeNull()
    expect(m.getByRole('menu', { name: destination })).toBeVisible()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.getByRole('menuitem', { name: destination })).toHaveAttribute('aria-expanded', 'true')
    expect(m.changed).toHaveBeenLastCalledWith(expected.at(-1))
    const reverse = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
    await userEvent.keyboard(`{${reverse}}`)
    await focused(m.getByRole('menuitem', { name: initialItem }))
    expect(m.getByRole('menu', { name: start })).toBeVisible()
    await expect.poll(() => m.queryByRole('menu', { name: destination })).toBeNull()
  })
}

for (const [start, item, key] of [
  ['File', 'Save', 'ArrowRight'],
  ['View', 'Zoom', 'ArrowLeft'],
] as const) {
  test(`menubar.rtl.1: open ${start} preserves its menu and item focus at the ${key} boundary`, async () => {
    const m = mount()
    const trigger = m.getByRole('menuitem', { name: start })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    const action = m.getByRole('menuitem', { name: item })
    await focused(action)
    const menu = m.getByRole('menu', { name: start })
    const before = m.changed.mock.calls.slice()
    await userEvent.keyboard(`{${key}}`)
    await focused(action)
    expect(m.getByRole('menu', { name: start })).toBe(menu)
    expect(menu).toBeVisible()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(m.changed.mock.calls).toEqual(before)
  })
}
