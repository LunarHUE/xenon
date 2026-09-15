import { AlertDialog, Dialog, Popover, Select, Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('toolbar.keyboard.15 Select opens, highlights options, and closes with Escape', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Select',
    children: () => (
      <Select
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'pear', label: 'Pear' },
        ]}
      >
        <Select.Trigger as={Toolbar.Button} aria-label="Fruit">
          <Select.Value placeholder="Choose" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner>
            <Select.Content>
              <Select.Viewport>
                <Select.Item value="apple">Apple</Select.Item>
                <Select.Item value="pear">Pear</Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Positioner>
        </Select.Portal>
      </Select>
    ),
  })
  const trigger = within(m.container).getByRole('combobox', { name: 'Fruit' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  const apple = within(document.body).getByRole('option', { name: 'Apple' })
  expect(trigger).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.keyboard('{ArrowDown}')
  await m.settle()
  expect(within(document.body).getByRole('option', { name: 'Pear' })).toHaveAttribute(
    'data-highlighted',
    ''
  )
  await userEvent.keyboard('{Escape}')
  await m.settle()
  expect(trigger).toHaveFocus()
  expect(within(document.body).queryByRole('listbox')).toBeNull()
})

test('toolbar.keyboard.15 Dialog enters focus cycle and restores focus on Escape', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Dialog',
    children: () => (
      <Dialog>
        <Dialog.Trigger as={Toolbar.Button}>Open dialog</Dialog.Trigger>
        <Dialog.Content aria-label="Settings">
          <input aria-label="Name" />
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Open dialog' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  const input = within(document.body).getByRole('textbox', { name: 'Name' })
  expect(input).toHaveFocus()
  await userEvent.tab()
  expect(within(document.body).getByRole('button', { name: 'Close' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await m.settle()
  expect(trigger).toHaveFocus()
  expect(within(document.body).queryByRole('dialog')).toBeNull()
})

test('toolbar.keyboard.15 AlertDialog enters focus cycle and restores focus on Escape', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Alert',
    children: () => (
      <AlertDialog>
        <AlertDialog.Trigger as={Toolbar.Button}>Delete</AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete?</AlertDialog.Title>
          <input aria-label="Reason" />
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Delete' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  const cancel = within(document.body).getByRole('button', { name: 'Cancel' })
  expect(cancel).toHaveFocus()
  await userEvent.tab()
  expect(within(document.body).getByRole('textbox', { name: 'Reason' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await m.settle()
  expect(trigger).toHaveFocus()
  expect(within(document.body).queryByRole('alertdialog')).toBeNull()
})

test('toolbar.keyboard.15 Popover enters focus cycle and restores focus on Escape', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Popover',
    children: () => (
      <Popover>
        <Popover.Trigger as={Toolbar.Button}>Details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details">
            <input aria-label="Value" />
            <button>Apply</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Details' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  const input = within(document.body).getByRole('textbox', { name: 'Value' })
  expect(input).toHaveFocus()
  await userEvent.tab()
  expect(within(document.body).getByRole('button', { name: 'Apply' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await m.settle()
  expect(trigger).toHaveFocus()
  expect(within(document.body).queryByRole('dialog')).toBeNull()
})
