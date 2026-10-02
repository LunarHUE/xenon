// Native Tab order, focus recovery after DOM removal, and modal accessibility require a browser.
import { Dialog } from '@xenon-ui/solid/dialog'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
})

function editor() {
  return mount(() => (
    <>
      <button>Before editor</button>
      <Dialog>
        <Dialog.Trigger>Open editor</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Document editor</Dialog.Title>
          <Dialog.Description>Review the document before saving.</Dialog.Description>
          <button>First action</button>
          <button>Second action</button>
          <Dialog.Close>Save document</Dialog.Close>
        </Dialog.Content>
      </Dialog>
      <button>After editor</button>
    </>
  ))
}

test('dialog.keyboard.1: native Tab advances through every modal control and wraps to the first', async () => {
  const view = editor()
  await userEvent.click(view.getByRole('button', { name: 'Open editor' }))
  const first = view.getByRole('button', { name: 'First action' })
  await expect.poll(() => document.activeElement).toBe(first)
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'Second action' })).toHaveFocus()
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'Save document' })).toHaveFocus()
  await userEvent.tab()
  expect(first).toHaveFocus()
})

test('dialog.keyboard.2: native Shift+Tab wraps to the last modal control and visits each predecessor', async () => {
  const view = editor()
  await userEvent.click(view.getByRole('button', { name: 'Open editor' }))
  const first = view.getByRole('button', { name: 'First action' })
  await expect.poll(() => document.activeElement).toBe(first)
  await userEvent.tab({ shift: true })
  expect(view.getByRole('button', { name: 'Save document' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(view.getByRole('button', { name: 'Second action' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(first).toHaveFocus()
})

test('dialog.focus.23: removing the focused control recovers focus inside and preserves the native Tab cycle', async () => {
  const [shown, setShown] = createSignal(true)
  const view = mount(() => (
    <>
      <button>Outside editor</button>
      <Dialog>
        <Dialog.Trigger>Open editor</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title>Changing editor</Dialog.Title>
          <Show when={shown()}>
            <button>Temporary action</button>
          </Show>
          <button>Remaining action</button>
          <Dialog.Close>Save document</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open editor' }))
  const temporary = view.getByRole('button', { name: 'Temporary action' })
  await expect.poll(() => document.activeElement).toBe(temporary)
  setShown(false)
  flush()
  const content = view.getByRole('dialog', { name: 'Changing editor' })
  await expect.poll(() => content.contains(document.activeElement)).toBe(true)
  expect(temporary.isConnected).toBe(false)
  await userEvent.click(view.getByRole('button', { name: 'Remaining action' }))
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'Save document' })).toHaveFocus()
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'Remaining action' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(view.getByRole('button', { name: 'Save document' })).toHaveFocus()
})

test('dialog.roles.2: a public modal Dialog advertises aria-modal while native modality is active', async () => {
  const view = editor()
  await userEvent.click(view.getByRole('button', { name: 'Open editor' }))
  const content = view.getByRole('dialog', { name: 'Document editor' })
  await expect.poll(() => content.matches(':modal')).toBe(true)
  expect(content).toHaveAttribute('aria-modal', 'true')
})

test('dialog.a11y.5: closed, open, and reopened Dialog parts never emit positive tabindex', async () => {
  const view = editor()
  const checkTabIndexes = () => {
    for (const element of view.container.querySelectorAll<HTMLElement>('[tabindex]')) {
      expect(Number(element.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
  }
  checkTabIndexes()
  const trigger = view.getByRole('button', { name: 'Open editor' })
  await userEvent.click(trigger)
  expect(view.getByRole('dialog', { name: 'Document editor' })).toBeVisible()
  checkTabIndexes()
  await userEvent.click(view.getByRole('button', { name: 'Save document' }))
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  checkTabIndexes()
  await userEvent.click(trigger)
  expect(view.getByRole('dialog', { name: 'Document editor' })).toBeVisible()
  checkTabIndexes()
})

test('dialog.a11y.6: the public Dialog tree passes axe before opening, while modal, and after closing', async () => {
  const view = editor()
  await expectNoViolations(view.container)
  await userEvent.click(view.getByRole('button', { name: 'Open editor' }))
  expect(view.getByRole('dialog', { name: 'Document editor' })).toBeVisible()
  await expectNoViolations(view.container)
  await userEvent.click(view.getByRole('button', { name: 'Save document' }))
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  await expectNoViolations(view.container)
})
