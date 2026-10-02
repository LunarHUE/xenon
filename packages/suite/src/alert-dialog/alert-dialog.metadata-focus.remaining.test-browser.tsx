import { AlertDialog } from '@xenon-ui/solid/alert-dialog'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
  return { container, ...within(container) }
}

function confirmation() {
  return mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Review deletion</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete document?</AlertDialog.Title>
        <AlertDialog.Description>The document cannot be recovered.</AlertDialog.Description>
        <p>Check the document name before continuing.</p>
        <AlertDialog.Action>Delete document</AlertDialog.Action>
        <AlertDialog.Cancel>Keep document</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
}

test('alert-dialog.roles.3 and alert-dialog.roles.4 generated associations resolve the visible title and alert message', async () => {
  const view = confirmation()
  await userEvent.click(view.getByRole('button', { name: 'Review deletion' }))
  const content = view.getByRole('alertdialog', { name: 'Delete document?' })
  const title = view.getByRole('heading', { name: 'Delete document?' })
  const message = view.getByText('The document cannot be recovered.')
  expect(content).toHaveAttribute('aria-labelledby', title.id)
  expect(content).toHaveAttribute('aria-describedby', message.id)
  expect(title.id).not.toBe('')
  expect(message.id).not.toBe('')
  expect(document.getElementById(title.id)).toBe(title)
  expect(document.getElementById(message.id)).toBe(message)
  expect(content).toHaveAccessibleDescription('The document cannot be recovered.')
})

test('alert-dialog.roles.3 an explicit aria-label names content without a visible title', async () => {
  const view = mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Review request</AlertDialog.Trigger>
      <AlertDialog.Content aria-label="Confirm permanent deletion">
        <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
        <AlertDialog.Cancel>Keep document</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Review request' }))
  const content = view.getByRole('alertdialog', { name: 'Confirm permanent deletion' })
  expect(content).toHaveAttribute('aria-label', 'Confirm permanent deletion')
  expect(content).not.toHaveAttribute('aria-labelledby')
  expect(view.queryByRole('heading')).toBeNull()
})

test('alert-dialog.roles.9 explicit description points only to the authored message without an unused generated ID', async () => {
  const view = mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Review request</AlertDialog.Trigger>
      <AlertDialog.Content aria-describedby="alert-author-message">
        <AlertDialog.Title>Confirm deletion</AlertDialog.Title>
        <p id="alert-author-message">Author-selected warning.</p>
        <p>Other content is not the alert description.</p>
        <AlertDialog.Cancel>Keep document</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  const trigger = view.getByRole('button', { name: 'Review request' })
  await userEvent.click(trigger)
  const content = view.getByRole('alertdialog', { name: 'Confirm deletion' })
  const message = view.getByText('Author-selected warning.')
  const title = view.getByRole('heading', { name: 'Confirm deletion' })
  expect(content).toHaveAttribute('aria-describedby', message.id)
  expect(content).toHaveAccessibleDescription('Author-selected warning.')
  expect(document.getElementById(message.id)).toBe(message)
  expect(
    [...view.container.querySelectorAll('[id]')].every((element) =>
      [trigger, content, title, message].includes(element as HTMLElement)
    )
  ).toBe(true)
})

test('alert-dialog.roles.8 trigger exposes dialog popup semantics and resolving controls while open', async () => {
  const view = confirmation()
  const trigger = view.getByRole('button', { name: 'Review deletion' })
  expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(trigger)
  const content = view.getByRole('alertdialog', { name: 'Delete document?' })
  expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-controls', content.id)
  expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBe(content)
  await userEvent.click(view.getByRole('button', { name: 'Keep document' }))
  await expect.poll(() => view.queryByRole('alertdialog')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('alert-dialog.roles.10 title defaults to heading level two and supports an author level override', async () => {
  const [level, setLevel] = createSignal<number>()
  const view = mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Review request</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title aria-level={level()}>Confirm deletion</AlertDialog.Title>
        <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
        <AlertDialog.Cancel>Keep document</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Review request' }))
  const title = view.getByRole('heading', { name: 'Confirm deletion', level: 2 })
  expect(title.localName).toBe('h2')
  setLevel(3)
  flush()
  expect(view.getByRole('heading', { name: 'Confirm deletion', level: 3 })).toBe(title)
  setLevel(undefined)
  flush()
  expect(view.getByRole('heading', { name: 'Confirm deletion', level: 2 })).toBe(title)
})

test('alert-dialog.keyboard.1 and alert-dialog.notes.2 native Tab wraps both directions and Escape dismisses', async () => {
  const view = confirmation()
  const trigger = view.getByRole('button', { name: 'Review deletion' })
  await userEvent.click(trigger)
  const cancel = view.getByRole('button', { name: 'Keep document' })
  const action = view.getByRole('button', { name: 'Delete document' })
  await expect.poll(() => document.activeElement).toBe(cancel)
  await userEvent.tab()
  expect(action).toHaveFocus()
  await userEvent.tab()
  expect(cancel).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(action).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(cancel).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => view.queryByRole('alertdialog')).toBeNull()
  await expect.poll(() => document.activeElement).toBe(trigger)
})

test('alert-dialog.pointer.3 clicking ordinary alert content keeps it open', async () => {
  const view = confirmation()
  await userEvent.click(view.getByRole('button', { name: 'Review deletion' }))
  const content = view.getByRole('alertdialog', { name: 'Delete document?' })
  await userEvent.click(view.getByText('Check the document name before continuing.'))
  expect(content).toHaveAttribute('open')
  expect(content.matches(':modal')).toBe(true)
  expect(view.getByRole('alertdialog', { name: 'Delete document?' })).toBe(content)
})

test('alert-dialog.focus.3 explicit finalFocus restores the action target instead of the opener', async () => {
  const [target, setTarget] = createSignal<HTMLElement>()
  const view = mount(() => (
    <>
      <button type="button" ref={setTarget}>
        Document action target
      </button>
      <AlertDialog finalFocus={target()}>
        <AlertDialog.Trigger>Review request</AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Confirm deletion</AlertDialog.Title>
          <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
          <AlertDialog.Action>Delete document</AlertDialog.Action>
          <AlertDialog.Cancel>Keep document</AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  ))
  const trigger = view.getByRole('button', { name: 'Review request' })
  const actionTarget = view.getByRole('button', { name: 'Document action target' })
  await userEvent.click(trigger)
  await userEvent.click(view.getByRole('button', { name: 'Delete document' }))
  await expect.poll(() => view.queryByRole('alertdialog')).toBeNull()
  await expect.poll(() => document.activeElement).toBe(actionTarget)
  expect(trigger).not.toHaveFocus()
})

test('alert-dialog.a11y.3 closed and open alert fixtures have no scoped axe violations', async () => {
  const view = confirmation()
  expect(view.queryByRole('alertdialog')).toBeNull()
  await expectNoViolations(view.container)
  await userEvent.click(view.getByRole('button', { name: 'Review deletion' }))
  const content = view.getByRole('alertdialog', { name: 'Delete document?' })
  await expect.poll(() => content.matches(':modal')).toBe(true)
  await expectNoViolations(view.container)
})
