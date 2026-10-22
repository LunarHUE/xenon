import { Dialog, Menu, Popover, Select } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
const surface = { background: 'white', padding: '12px', 'min-width': '160px' }

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  let disposed = false
  const unmount = () => {
    if (disposed) return
    disposed = true
    dispose()
    host.remove()
  }
  cleanups.push(unmount)
  flush()
  return { query: within(document.body), unmount }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('portal.dismissal.5: recursive Dialog Menu Select Popover layers open depth first across portal modes', async () => {
  for (const usePortal of [false, true]) {
    for (const forceMount of [false, true]) {
      const mounted = mount(() => (
        <>
          <Dialog modal={false} forceMount={forceMount}>
            <Dialog.Trigger>Dialog level</Dialog.Trigger>
            <Dialog.Content
              aria-label="Dialog level"
              style={{ visibility: 'visible', 'pointer-events': 'auto' }}
            >
              <Menu forceMount={forceMount}>
                <Menu.Trigger>Menu level</Menu.Trigger>
                {usePortal ? (
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Content aria-label="Menu level" style={surface}>
                        <SelectLayer forceMount={forceMount} usePortal={usePortal} />
                      </Menu.Content>
                    </Menu.Positioner>
                  </Menu.Portal>
                ) : (
                  <Menu.Positioner>
                    <Menu.Content aria-label="Menu level" style={surface}>
                      <SelectLayer forceMount={forceMount} usePortal={usePortal} />
                    </Menu.Content>
                  </Menu.Positioner>
                )}
              </Menu>
              <button>Recursive inner outside</button>
            </Dialog.Content>
          </Dialog>
          {/* Kept clear of the nonmodal dialog, which otherwise covers its center (#61). */}
          <button style={{ position: 'fixed', left: '8px', top: '400px' }}>
            Recursive outside
          </button>
        </>
      ))

      const query = mounted.query
      const initialDialog = query.queryByRole('dialog', { name: 'Dialog level', hidden: true })
      if (forceMount && initialDialog) {
        expect(initialDialog).toHaveAttribute('data-state', 'closed')
        expect(initialDialog).not.toBeVisible()
      } else expect(initialDialog).toBeNull()
      expect(query.getByRole('button', { name: 'Dialog level' })).toBeVisible()
      await userEvent.click(query.getByRole('button', { name: 'Dialog level' }))
      await settle()
      const dialog = query.getByRole('dialog', { name: 'Dialog level', hidden: true })
      expect(dialog).toBeVisible()
      expect(dialog).toHaveAttribute('data-state', 'open')
      const initialMenu = query.queryByRole('menu', { name: 'Menu level', hidden: true })
      if (forceMount) {
        if (initialMenu) {
          expect(initialMenu).toHaveAttribute('data-state', 'closed')
          expect(initialMenu).toHaveAttribute('hidden')
          expect(initialMenu).not.toBeVisible()
        }
      } else {
        expect(initialMenu).toBeNull()
      }
      await userEvent.click(query.getByRole('button', { name: 'Menu level' }))
      await settle()
      const menu = query.getByRole('menu', { name: 'Menu level', hidden: true })
      expect(menu).toBeVisible()
      expect(menu).toHaveAttribute('data-state', 'open')
      expect(query.getByRole('combobox', { name: 'Select level' })).toBeVisible()
      const initialListbox = query.queryByRole('listbox', { hidden: true })
      if (forceMount) {
        expect(initialListbox).toHaveAttribute('data-state', 'closed')
        expect(initialListbox).toHaveAttribute('hidden')
        expect(initialListbox).not.toBeVisible()
      } else {
        expect(initialListbox).toBeNull()
      }
      await userEvent.click(query.getByRole('combobox', { name: 'Select level' }))
      await settle()
      const listbox = query.getByRole('listbox', { hidden: true })
      expect(listbox).toBeVisible()
      expect(listbox).toHaveAttribute('data-state', 'open')
      expect(query.getByRole('button', { name: 'Popover level' })).toBeVisible()
      const initialPopover = query.queryByRole('dialog', { name: 'Popover level', hidden: true })
      if (forceMount) {
        if (initialPopover) {
          expect(initialPopover).toHaveAttribute('data-state', 'closed')
          expect(initialPopover).toHaveAttribute('hidden')
          expect(initialPopover).not.toBeVisible()
        }
      } else {
        expect(initialPopover).toBeNull()
      }
      await userEvent.click(query.getByRole('button', { name: 'Popover level' }))
      await settle()
      const popover = query.getByRole('dialog', { name: 'Popover level', hidden: true })
      expect(popover).toBeVisible()
      expect(popover).toHaveAttribute('data-state', 'open')
      await userEvent.keyboard('{Escape}')
      await settle()
      const closedPopover = query.queryByRole('dialog', { name: 'Popover level', hidden: true })
      if (closedPopover) {
        expect(closedPopover).toHaveAttribute('data-state', 'closed')
        expect(closedPopover).not.toBeVisible()
      } else expect(closedPopover).toBeNull()
      expect(query.getByRole('listbox', { hidden: true })).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await settle()
      const closedListbox = query.queryByRole('listbox', { hidden: true })
      if (closedListbox) {
        expect(closedListbox).toHaveAttribute('data-state', 'closed')
        expect(closedListbox).not.toBeVisible()
      } else expect(closedListbox).toBeNull()
      expect(query.getByRole('menu', { name: 'Menu level', hidden: true })).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await settle()
      const closedMenu = query.queryByRole('menu', { name: 'Menu level', hidden: true })
      if (closedMenu) {
        expect(closedMenu).toHaveAttribute('data-state', 'closed')
        expect(closedMenu).not.toBeVisible()
      } else expect(closedMenu).toBeNull()
      expect(dialog).toBeVisible()
      expect(dialog).toHaveAttribute('data-state', 'open')
      expect(query.getByRole('button', { name: 'Dialog level' })).toBeVisible()
      expect(query.getByRole('button', { name: 'Recursive outside' })).toBeVisible()
      await userEvent.keyboard('{Escape}')
      await settle()
      const closedDialog = query.queryByRole('dialog', { name: 'Dialog level', hidden: true })
      if (closedDialog) {
        expect(closedDialog).toHaveAttribute('data-state', 'closed')
        expect(closedDialog).not.toBeVisible()
      } else expect(closedDialog).toBeNull()
      expect(query.getByRole('button', { name: 'Dialog level' })).toBeVisible()
      await userEvent.click(query.getByRole('button', { name: 'Dialog level' }))
      await settle()
      await userEvent.click(query.getByRole('button', { name: 'Menu level' }))
      await settle()
      await userEvent.click(query.getByRole('combobox', { name: 'Select level' }))
      await settle()
      await userEvent.click(query.getByRole('button', { name: 'Popover level' }))
      await settle()
      await userEvent.click(query.getByRole('button', { name: 'Recursive inner outside' }))
      await settle()
      const outsideClosedPopover = query.queryByRole('dialog', {
        name: 'Popover level',
        hidden: true,
      })
      if (outsideClosedPopover) expect(outsideClosedPopover).toHaveAttribute('data-state', 'closed')
      expect(query.getByRole('listbox', { hidden: true })).toBeVisible()
      expect(query.getByRole('menu', { name: 'Menu level', hidden: true })).toBeVisible()
      await userEvent.click(query.getByRole('button', { name: 'Recursive inner outside' }))
      await settle()
      const outsideClosedListbox = query.queryByRole('listbox', { hidden: true })
      if (outsideClosedListbox) {
        expect(outsideClosedListbox).toHaveAttribute('data-state', 'closed')
        expect(outsideClosedListbox).not.toBeVisible()
      } else expect(outsideClosedListbox).toBeNull()
      expect(query.getByRole('menu', { name: 'Menu level', hidden: true })).toBeVisible()
      await userEvent.click(query.getByRole('button', { name: 'Recursive inner outside' }))
      await settle()
      const outsideClosedMenu = query.queryByRole('menu', { name: 'Menu level', hidden: true })
      if (outsideClosedMenu) {
        expect(outsideClosedMenu).toHaveAttribute('data-state', 'closed')
        expect(outsideClosedMenu).not.toBeVisible()
      } else expect(outsideClosedMenu).toBeNull()
      const openDialogAfterOutside = query.getByRole('dialog', {
        name: 'Dialog level',
        hidden: true,
      })
      expect(openDialogAfterOutside).toBeVisible()
      expect(openDialogAfterOutside).toHaveAttribute('data-state', 'open')
      const outside = query.getByRole('button', { name: 'Recursive outside' })
      const target = outside.getBoundingClientRect()
      expect(
        document.elementFromPoint(target.x + target.width / 2, target.y + target.height / 2)
      ).toBe(outside)
      await userEvent.click(outside)
      await settle()
      const outsideClosedDialog = query.queryByRole('dialog', {
        name: 'Dialog level',
        hidden: true,
      })
      if (outsideClosedDialog) {
        expect(outsideClosedDialog).toHaveAttribute('data-state', 'closed')
        expect(outsideClosedDialog).not.toBeVisible()
      } else expect(outsideClosedDialog).toBeNull()
      expect(query.getByRole('button', { name: 'Dialog level' })).toBeVisible()
      expect(query.getByRole('button', { name: 'Recursive outside' })).toBeVisible()
      mounted.unmount()
    }
  }
})

function SelectLayer(props: { forceMount: boolean; usePortal: boolean }) {
  const content = () => (
    <Select.Content style={surface}>
      <Select.Viewport>
        <Select.Item value="apple" />
      </Select.Viewport>
      <Popover forceMount={props.forceMount}>
        <Popover.Trigger>Popover level</Popover.Trigger>
        {props.usePortal ? (
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Content aria-label="Popover level" style={surface}>
                Popover content
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Portal>
        ) : (
          <Popover.Positioner>
            <Popover.Content aria-label="Popover level" style={surface}>
              Popover content
            </Popover.Content>
          </Popover.Positioner>
        )}
      </Popover>
    </Select.Content>
  )
  return (
    <Select items={[{ value: 'apple', label: 'Apple' }]} forceMount={props.forceMount}>
      <Select.Trigger aria-label="Select level">
        <Select.Value placeholder="Select" />
      </Select.Trigger>
      {props.usePortal ? (
        <Select.Portal>
          <Select.Positioner>{content()}</Select.Positioner>
        </Select.Portal>
      ) : (
        <Select.Positioner>{content()}</Select.Positioner>
      )}
    </Select>
  )
}
