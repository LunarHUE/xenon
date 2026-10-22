import { AlertDialog } from '@xenon-ui/solid/alert-dialog'
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
  return { container, ...within(container) }
}

for (const target of ['action', 'cancel'] as const) {
  test(`alert-dialog.focus.7 explicit ${target} initialFocus overrides the last registered Cancel`, async () => {
    const [initial, setInitial] = createSignal<HTMLElement>()
    const view = mount(() => (
      <AlertDialog forceMount initialFocus={initial()}>
        <AlertDialog.Trigger>Review changes</AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Apply changes?</AlertDialog.Title>
          <AlertDialog.Description>Choose whether to apply the changes.</AlertDialog.Description>
          <AlertDialog.Action
            ref={(el: HTMLElement) => {
              if (target === 'action') setInitial(el)
            }}
          >
            Apply changes
          </AlertDialog.Action>
          <AlertDialog.Cancel
            ref={(el: HTMLElement) => {
              if (target === 'cancel') setInitial(el)
            }}
          >
            Keep editing
          </AlertDialog.Cancel>
          <AlertDialog.Cancel>Last registered cancel</AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog>
    ))
    expect(initial(), 'ref must populate initialFocus before opening').toBe(
      view.getByText(target === 'action' ? 'Apply changes' : 'Keep editing')
    )
    await userEvent.click(view.getByRole('button', { name: 'Review changes' }))
    const chosen = view.getByRole('button', {
      name: target === 'action' ? 'Apply changes' : 'Keep editing',
    })
    await expect.poll(() => document.activeElement).toBe(chosen)
    expect(view.getByRole('button', { name: 'Last registered cancel' })).not.toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await expect.poll(() => view.queryByRole('alertdialog')).toBeNull()
    await expect
      .poll(() => document.activeElement)
      .toBe(view.getByRole('button', { name: 'Review changes' }))
  })
}

for (const close of ['escape', 'cancel', 'action'] as const) {
  test(`alert-dialog.focus.6 force-mounted ${close} dismissal retains inaccessible content and restores native Tab order`, async () => {
    const view = mount(() => (
      <>
        <AlertDialog forceMount>
          <AlertDialog.Trigger>Review retained alert</AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Retained confirmation</AlertDialog.Title>
            <AlertDialog.Description>Confirm your choice.</AlertDialog.Description>
            <AlertDialog.Cancel>Keep retained document</AlertDialog.Cancel>
            <AlertDialog.Action>Delete retained document</AlertDialog.Action>
          </AlertDialog.Content>
        </AlertDialog>
        <button>After retained alert</button>
      </>
    ))
    const trigger = view.getByRole('button', { name: 'Review retained alert' })
    const retained = view.container.querySelector('[role="alertdialog"]')!
    expect(view.queryByRole('alertdialog')).toBeNull()
    await userEvent.click(trigger)
    const content = view.getByRole('alertdialog', { name: 'Retained confirmation' })
    expect(content).toBe(retained)
    await expect
      .poll(() => document.activeElement)
      .toBe(view.getByRole('button', { name: 'Keep retained document' }))
    if (close === 'escape') await userEvent.keyboard('{Escape}')
    else
      await userEvent.click(
        view.getByRole('button', {
          name: close === 'cancel' ? 'Keep retained document' : 'Delete retained document',
        })
      )
    await expect.poll(() => view.queryByRole('alertdialog')).toBeNull()
    expect(content.isConnected).toBe(true)
    expect(content).not.toBeVisible()
    await expect.poll(() => document.activeElement).toBe(trigger)
    await userEvent.tab()
    expect(view.getByRole('button', { name: 'After retained alert' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(trigger).toHaveFocus()
    await userEvent.click(trigger)
    expect(view.getByRole('alertdialog', { name: 'Retained confirmation' })).toBe(content)
    await expect
      .poll(() => document.activeElement)
      .toBe(view.getByRole('button', { name: 'Keep retained document' }))
  })
}

test('alert-dialog.state.2 controlled refusal keeps native modality and the focus cycle after an Escape request', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <AlertDialog open onOpenChange={change}>
      <AlertDialog.Trigger>Controlled opener</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Pending decision</AlertDialog.Title>
        <AlertDialog.Description>A decision is required.</AlertDialog.Description>
        <AlertDialog.Cancel>Reject request</AlertDialog.Cancel>
        <AlertDialog.Action>Accept request</AlertDialog.Action>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  const content = view.getByRole('alertdialog', { name: 'Pending decision' })
  const cancel = view.getByRole('button', { name: 'Reject request' })
  await expect.poll(() => document.activeElement).toBe(cancel)
  await userEvent.keyboard('{Escape}')
  expect(change.mock.calls).toEqual([[false]])
  expect(content.matches(':modal')).toBe(true)
  expect(content).toHaveAttribute('data-state', 'open')
  expect(view.getByText('Controlled opener')).toHaveAttribute('aria-expanded', 'true')
  await userEvent.tab({ shift: true })
  expect(view.getByRole('button', { name: 'Accept request' })).toHaveFocus()
  await userEvent.tab()
  expect(cancel).toHaveFocus()
})
