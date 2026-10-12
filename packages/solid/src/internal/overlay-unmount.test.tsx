// Unmounting an open overlay must not write unowned signals from cleanup.
// For (mapArray) disposes removed rows inside its own computation, so any
// signal written by a part's cleanup or ref callback throws
// REACTIVE_WRITE_IN_OWNED_SCOPE there and halts the reactive system. Show
// and ternaries dispose outside an owner, which is why they hid the bug.
import { cleanup, render } from '@solidjs/testing-library'
import { For, Show, createSignal, flush } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { AlertDialog } from '../alert-dialog/alert-dialog'
import { Combobox } from '../combobox/combobox'
import { ContextMenu } from '../context-menu'
import { Dialog } from '../dialog/dialog'
import { Drawer } from '../drawer/drawer'
import { HoverCard } from '../hover-card/hover-card'
import { Menu } from '../menu'
import { Menubar } from '../menubar'
import { NavigationMenu } from '../navigation-menu/navigation-menu'
import { Popover } from '../popover/popover'
import { Select } from '../select'
import { Tooltip } from '../tooltip/tooltip'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.show = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})

/** Each surface renders open and reports whether its content is in the document. */
const surfaces: Record<string, { render(): JSX.Element; open?(): void; selector: string }> = {
  'Dialog with Viewport': {
    selector: 'dialog',
    render: () => (
      <Dialog open>
        <Dialog.Viewport>
          <Dialog.Content aria-label="Dialog">Body</Dialog.Content>
        </Dialog.Viewport>
      </Dialog>
    ),
  },
  'Dialog in a Portal': {
    selector: 'dialog',
    render: () => (
      <Dialog defaultOpen>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Viewport>
            <Dialog.Content aria-label="Dialog">Body</Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    ),
  },
  'standalone Dialog.Content': {
    selector: 'dialog',
    render: () => (
      <Dialog open>
        <Dialog.Content aria-label="Dialog">Body</Dialog.Content>
      </Dialog>
    ),
  },
  AlertDialog: {
    selector: 'dialog',
    render: () => (
      <AlertDialog open>
        <AlertDialog.Viewport>
          <AlertDialog.Content aria-label="Alert" aria-describedby="none">
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          </AlertDialog.Content>
        </AlertDialog.Viewport>
      </AlertDialog>
    ),
  },
  Drawer: {
    selector: 'dialog',
    render: () => (
      <Drawer open side="right">
        <Drawer.Portal>
          <Drawer.Viewport>
            <Drawer.Content aria-label="Drawer">
              <Drawer.Handle />
            </Drawer.Content>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer>
    ),
  },
  Popover: {
    selector: '[role="dialog"]',
    render: () => (
      <Popover open>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Content aria-label="Popover">
              <Popover.Arrow />
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover>
    ),
  },
  'modal Popover': {
    selector: '[role="dialog"]',
    render: () => (
      <Popover open modal>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Popover" />
        </Popover.Positioner>
      </Popover>
    ),
  },
  Menu: {
    selector: '[role="menu"]',
    render: () => (
      <Menu open>
        <Menu.Trigger>Open</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content aria-label="Actions">
            <Menu.Item>Copy</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ),
  },
  ContextMenu: {
    selector: '[role="menu"]',
    open: () =>
      document
        .querySelector('[data-region]')!
        .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true })),
    render: () => (
      <ContextMenu>
        <ContextMenu.Trigger data-region>Region</ContextMenu.Trigger>
        <ContextMenu.Positioner>
          <ContextMenu.Content aria-label="Actions">
            <ContextMenu.Item>Copy</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu>
    ),
  },
  Menubar: {
    selector: '[role="menu"]',
    render: () => (
      <Menubar defaultValue="file">
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>New</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
      </Menubar>
    ),
  },
  NavigationMenu: {
    selector: '#products',
    render: () => (
      <NavigationMenu defaultValue="products">
        <NavigationMenu.List>
          <NavigationMenu.Item value="products">
            <NavigationMenu.Trigger>Products</NavigationMenu.Trigger>
          </NavigationMenu.Item>
        </NavigationMenu.List>
        <NavigationMenu.Positioner>
          <NavigationMenu.Viewport>
            <NavigationMenu.Content value="products" id="products">
              <NavigationMenu.Link href="#one">One</NavigationMenu.Link>
            </NavigationMenu.Content>
          </NavigationMenu.Viewport>
        </NavigationMenu.Positioner>
      </NavigationMenu>
    ),
  },
  Tooltip: {
    selector: '[role="tooltip"]',
    render: () => (
      <Tooltip open>
        <Tooltip.Trigger>Save</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Saves the file</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    ),
  },
  HoverCard: {
    selector: '[role="dialog"]',
    render: () => (
      <HoverCard open>
        <HoverCard.Trigger href="#ada">Ada</HoverCard.Trigger>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Person" />
        </HoverCard.Positioner>
      </HoverCard>
    ),
  },
  Select: {
    selector: '[role="listbox"]',
    render: () => (
      <Select
        items={[
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ]}
        defaultValue="b"
        open
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content>
            <Select.Viewport>
              <Select.Item value="a" />
              <Select.Item value="b" />
            </Select.Viewport>
          </Select.Content>
        </Select.Positioner>
      </Select>
    ),
  },
  Combobox: {
    selector: '[role="listbox"]',
    render: () => (
      <Combobox items={[{ value: 'a', label: 'Apple' }]} defaultOpen>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Positioner>
          <Combobox.Content />
          <Combobox.Arrow />
        </Combobox.Positioner>
      </Combobox>
    ),
  },
}

/** Ways an app removes a subtree; For is the one that disposes inside an owner. */
const removals: Record<string, (flag: () => boolean, child: () => JSX.Element) => JSX.Element> = {
  For: (flag, child) => <For each={flag() ? [0] : []}>{() => child()}</For>,
  Show: (flag, child) => <Show when={flag()}>{child()}</Show>,
}

describe('unmounting an open overlay', () => {
  for (const [name, surface] of Object.entries(surfaces))
    for (const [removal, wrap] of Object.entries(removals))
      test(`${name} removed by ${removal}`, () => {
        const reported = vi.spyOn(console, 'error')
        const [flag, setFlag] = createSignal(true)
        const [count, setCount] = createSignal(0)
        render(() => (
          <>
            {wrap(flag, surface.render)}
            <output>{count()}</output>
          </>
        ))
        flush()
        surface.open?.()
        flush()
        expect(document.querySelector(surface.selector)).not.toBeNull()
        setFlag(false)
        flush()
        expect(document.querySelector(surface.selector)).toBeNull()
        // A halted graph stops processing updates.
        setCount(1)
        flush()
        expect(document.querySelector('output')).toHaveTextContent('1')
        expect(reported).not.toHaveBeenCalled()
      })
})
