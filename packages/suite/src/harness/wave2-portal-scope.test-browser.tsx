import { AlertDialog, Dialog, HoverCard, Menu, Popover, Tooltip } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import axe from 'axe-core'
import { flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'

const fixtures: Record<string, () => JSX.Element> = {
  dialog: () => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Editor</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content aria-label="Editor">
          <button data-wave2-unnamed />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  ),
  'alert-dialog': () => (
    <AlertDialog defaultOpen>
      <AlertDialog.Trigger>Confirm action</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Content aria-label="Confirmation">
          <AlertDialog.Description>Choose whether to proceed</AlertDialog.Description>
          <button data-wave2-unnamed />
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  ),
  popover: () => (
    <Popover defaultOpen>
      <Popover.Trigger>Settings</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content aria-label="Settings">
            <button data-wave2-unnamed />
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover>
  ),
  menu: () => (
    <Menu defaultOpen>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Copy</Menu.Item>
            <button data-wave2-unnamed />
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu>
  ),
  tooltip: () => (
    <Tooltip defaultOpen>
      <Tooltip.Trigger>Help</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>
            Help text
            <button data-wave2-unnamed />
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip>
  ),
  'hover-card': () => (
    <HoverCard defaultOpen>
      <HoverCard.Trigger href="#profile">Profile</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Profile">
            <button data-wave2-unnamed />
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard>
  ),
}

for (const [family, fixture] of Object.entries(fixtures)) {
  test(`${family} root scan excludes its portal while body scan reports and then clears the outside control failure`, async () => {
    const root = document.createElement('div')
    document.body.append(root)
    const dispose = render(fixture, root)
    onTestFinished(() => {
      dispose()
      root.remove()
      flush()
    })
    flush()
    const button = document.querySelector<HTMLButtonElement>('[data-wave2-unnamed]')!
    await expect.poll(() => button.checkVisibility()).toBe(true)
    expect(root.contains(button)).toBe(false)
    expect(button.isConnected).toBe(true)
    const options = { runOnly: ['button-name'] }
    expect((await axe.run(root, options)).violations).toEqual([])
    const widened = await axe.run(document.body, options)
    expect(widened.violations).toHaveLength(1)
    expect(widened.violations[0]).toMatchObject({ id: 'button-name', impact: 'critical' })
    expect(widened.violations[0]!.nodes).toHaveLength(1)
    expect(widened.violations[0]!.nodes[0]!.html).toContain('data-wave2-unnamed')
    button.setAttribute('aria-label', 'Portal action')
    expect((await axe.run(document.body, options)).violations).toEqual([])
  })
}
