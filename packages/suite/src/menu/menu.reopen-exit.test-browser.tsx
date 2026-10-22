import { Menu } from '@xenon-ui/solid/menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
/** Mount with a long exit animation so reopening lands while the old focus scope is retained. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const style = document.createElement('style')
  style.textContent = `
    @keyframes reopenExit { from { opacity: 1 } to { opacity: 0 } }
    [role=menu][data-state=closed] { animation: reopenExit 2s linear; }
  `
  container.append(style)
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

test('reopening a submenu during its exit animation focuses its first item menu.keyboard.32 menu.keyboard.34', async () => {
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="Outer actions">
          <Menu.Sub>
            <Menu.SubTrigger>Export</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content aria-label="Export formats">
                <Menu.Item>Beta</Menu.Item>
                <Menu.Item>Able</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
          <Menu.Item>Zebra</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  const subtrigger = m.getByRole('menuitem', { name: 'Export' })
  await focused(subtrigger)
  await userEvent.keyboard('{ArrowRight}')
  const beta = m.getByRole('menuitem', { name: 'Beta' })
  await focused(beta)
  const submenu = m.getByRole('menu', { name: 'Export formats' })
  await userEvent.keyboard('{ArrowLeft}')
  await focused(subtrigger)
  expect(submenu).toBeInTheDocument()
  expect(submenu).toHaveAttribute('data-state', 'closed')
  await userEvent.keyboard('{ArrowRight}')
  await focused(beta)
  expect(subtrigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('menu', { name: 'Export formats' })).toHaveAttribute('data-state', 'open')
})

test('reopening a root menu during its exit animation focuses its first item menu.focus.1', async () => {
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="Actions menu">
          <Menu.Item>Apple</Menu.Item>
          <Menu.Item>Banana</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'Actions' })
  await userEvent.click(trigger)
  const apple = m.getByRole('menuitem', { name: 'Apple' })
  await focused(apple)
  const popup = m.getByRole('menu', { name: 'Actions menu' })
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false')
  expect(popup).toBeInTheDocument()
  expect(popup).toHaveAttribute('data-state', 'closed')
  await userEvent.click(trigger)
  await focused(apple)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})
