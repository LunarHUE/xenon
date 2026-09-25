import { Menu, Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
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

test('detached Menu triggers switch a portaled viewport and return focus to the latest opener', async () => {
  const handle = Menu.createHandle<{ name: string }>()
  const selected = vi.fn()
  const changed = vi.fn()
  const m = mount(() => (
    <>
      <Menu.Trigger
        handle={handle}
        id="shared-menu-alpha"
        payload={{ name: 'Alpha' }}
        style={{ position: 'fixed', left: '30px', top: '20px' }}
      >
        Alpha actions
      </Menu.Trigger>
      <Menu.Trigger
        handle={handle}
        id="shared-menu-beta"
        payload={{ name: 'Beta' }}
        style={{ position: 'fixed', left: '330px', top: '20px' }}
      >
        Beta actions
      </Menu.Trigger>
      <Menu handle={handle} onOpenChange={changed}>
        {(state) => (
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="start">
              <Menu.Content aria-label="Shared actions">
                <Menu.Viewport>
                  <For each={state.payload ? [state.payload] : []}>
                    {(record) => (
                      <Menu.Item onSelect={() => selected(record.name)}>
                        Edit {record.name}
                      </Menu.Item>
                    )}
                  </For>
                </Menu.Viewport>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Portal>
        )}
      </Menu>
    </>
  ))
  const body = within(document.body)
  const alpha = m.getByRole('button', { name: 'Alpha actions' })
  const beta = m.getByRole('button', { name: 'Beta actions' })
  await userEvent.click(alpha)
  await settle()
  const content = body.getByRole('menu', { name: 'Shared actions' })
  const firstLeft = content.getBoundingClientRect().left
  expect(m.container.contains(content)).toBe(false)
  expect(body.getByRole('menuitem', { name: 'Edit Alpha' })).toHaveFocus()
  await userEvent.click(beta)
  await settle()
  expect(body.getByRole('menu', { name: 'Shared actions' })).toBe(content)
  expect(content.getBoundingClientRect().left - firstLeft).toBeGreaterThan(200)
  expect(body.getByRole('menuitem', { name: 'Edit Beta' })).toHaveFocus()
  expect(alpha).toHaveAttribute('aria-expanded', 'false')
  expect(beta).toHaveAttribute('aria-expanded', 'true')
  expect(changed.mock.calls).toEqual([[true]])
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(selected).toHaveBeenCalledExactlyOnceWith('Beta')
  expect(body.queryByRole('menu', { name: 'Shared actions' })).toBeNull()
  expect(beta).toHaveFocus()
  expect(handle.isOpen).toBe(false)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(body.getByRole('menuitem', { name: 'Edit Beta' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(beta).toHaveFocus()
  expect(handle.isOpen).toBe(false)
})

test.each([false, true])(
  'Tab from a detached portaled Menu follows the latest trigger with shift=%s',
  async (shift) => {
    const handle = Menu.createHandle()
    const m = mount(() => (
      <>
        <button>Before detached menu</button>
        <Menu.Trigger handle={handle}>Detached actions</Menu.Trigger>
        <button>After detached menu</button>
        <Menu handle={handle}>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Content aria-label="Tab actions">
                <Menu.Viewport>
                  <Menu.Item>Inspect</Menu.Item>
                </Menu.Viewport>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu>
      </>
    ))
    await userEvent.click(m.getByRole('button', { name: 'Detached actions' }))
    await settle()
    await userEvent.keyboard(shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}')
    await settle()
    expect(within(document.body).queryByRole('menu', { name: 'Tab actions' })).toBeNull()
    expect(
      m.getByRole('button', { name: shift ? 'Before detached menu' : 'After detached menu' })
    ).toHaveFocus()
  }
)

test('an explicitly portaled submenu remains in its parent layer for Escape and selection', async () => {
  const portal = document.createElement('div')
  document.body.append(portal)
  cleanups.push(() => portal.remove())
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Portaled export</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Content aria-label="Parent actions">
            <Menu.Sub>
              <Menu.SubTrigger>Export formats</Menu.SubTrigger>
              <Menu.Portal container={portal}>
                <Menu.Positioner>
                  <Menu.Content aria-label="Child formats">
                    <Menu.Item onSelect={selected}>PDF document</Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Sub>
            <Menu.Item>Print document</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu>
  ))
  const body = within(document.body)
  const trigger = m.getByRole('button', { name: 'Portaled export' })
  await userEvent.click(trigger)
  await settle()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  const parent = body.getByRole('menu', { name: 'Parent actions' })
  const child = body.getByRole('menu', { name: 'Child formats' })
  expect(parent.contains(child)).toBe(false)
  expect(portal.contains(child)).toBe(true)
  expect(body.getByRole('menuitem', { name: 'PDF document' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(body.queryByRole('menu', { name: 'Child formats' })).toBeNull()
  expect(parent).toBeVisible()
  expect(body.getByRole('menuitem', { name: 'Export formats' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(selected).toHaveBeenCalledOnce()
  expect(body.queryByRole('menu', { name: 'Parent actions' })).toBeNull()
  expect(body.queryByRole('menu', { name: 'Child formats' })).toBeNull()
  expect(trigger).toHaveFocus()
})

test('Popover shared viewport follows the latest detached anchor and restores it on Escape', async () => {
  const handle = Popover.createHandle<string>()
  const changed = vi.fn()
  const m = mount(() => (
    <>
      <Popover.Trigger
        handle={handle}
        id="popover-alpha"
        payload="Alpha"
        style={{ position: 'fixed', left: '30px', top: '20px' }}
      >
        Alpha details
      </Popover.Trigger>
      <Popover.Trigger
        handle={handle}
        id="popover-beta"
        payload="Beta"
        style={{ position: 'fixed', left: '330px', top: '20px' }}
      >
        Beta details
      </Popover.Trigger>
      <Popover handle={handle} onOpenChange={changed}>
        {(state) => (
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start">
              <Popover.Content aria-label="Shared details">
                <Popover.Viewport>
                  <span>{state.payload}</span>
                  <button>Inspect record</button>
                </Popover.Viewport>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover>
    </>
  ))
  const body = within(document.body)
  const alpha = m.getByRole('button', { name: 'Alpha details' })
  const beta = m.getByRole('button', { name: 'Beta details' })
  await userEvent.click(alpha)
  await settle()
  const content = body.getByRole('dialog', { name: 'Shared details' })
  const firstLeft = content.getBoundingClientRect().left
  await userEvent.click(beta)
  await settle()
  expect(body.getByRole('dialog', { name: 'Shared details' })).toBe(content)
  expect(content).toHaveTextContent('Beta')
  expect(content.getBoundingClientRect().left - firstLeft).toBeGreaterThan(200)
  expect(alpha).toHaveAttribute('aria-expanded', 'false')
  expect(beta).toHaveAttribute('aria-expanded', 'true')
  expect(changed.mock.calls).toEqual([[true]])
  await userEvent.click(body.getByRole('button', { name: 'Inspect record' }))
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(handle.isOpen).toBe(false)
  expect(beta).toHaveFocus()
})
