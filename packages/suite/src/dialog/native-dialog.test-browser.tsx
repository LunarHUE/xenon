import { createDialogController, type DialogControllerOptions } from '@tenon/dom'
import type {} from '@vitest/browser-playwright'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function node<T extends keyof HTMLElementTagNameMap>(tag: T, text = '') {
  const element = document.createElement(tag)
  element.textContent = text
  document.body.append(element)
  onTestFinished(() => element.remove())
  return element
}

function dialog(overrides: Partial<DialogControllerOptions> = {}) {
  const element = node('dialog')
  element.style.cssText = 'width:240px;height:140px;padding:20px'
  const button = document.createElement('button')
  button.textContent = 'Dialog action'
  element.append(button)
  const onOpenChange = vi.fn()
  const options: DialogControllerOptions = {
    open: true,
    active: true,
    onOpenChange,
    ...overrides,
  }
  const controller = createDialogController(element, options)
  onTestFinished(() => controller.dispose())
  return { element, button, controller, options, onOpenChange }
}

async function settled() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

test('native modal Escape and backdrop clicks request controlled closure once', async () => {
  const current = dialog()
  expect(current.element.matches(':modal')).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(current.onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(current.element.open).toBe(true)
  await userEvent.click(current.element, { position: { x: -10, y: -10 }, force: true })
  await expect.poll(() => current.onOpenChange.mock.calls.length).toBe(2)
  expect(current.element.matches(':modal')).toBe(true)
  await userEvent.click(current.button)
  await settled()
  expect(current.onOpenChange).toHaveBeenCalledTimes(2)
})

test('active exit keeps native modality, focus containment and isolation until completion', async () => {
  const opener = node('button', 'Open dialog')
  opener.focus()
  const current = dialog()
  expect(current.button).toHaveFocus()
  current.controller.update({ ...current.options, open: false })
  expect(current.element.matches(':modal')).toBe(true)
  expect(opener.inert).toBe(true)
  expect(document.documentElement.style.overflowY).toBe('hidden')
  opener.focus()
  expect(current.button).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(current.onOpenChange).not.toHaveBeenCalled()
  current.controller.update({ ...current.options, open: false, active: false })
  expect(current.element.open).toBe(false)
  expect(opener.inert).toBe(false)
  expect(document.documentElement.style.overflowY).toBe('')
  expect(opener).toHaveFocus()
})

test('nested native dialogs isolate lower content and restore focus through both openers', () => {
  const opener = node('button', 'Outside opener')
  opener.focus()
  const lower = dialog()
  expect(lower.button).toHaveFocus()
  const upper = dialog()
  expect(upper.button).toHaveFocus()
  expect(lower.element.inert).toBe(true)
  lower.button.focus()
  expect(upper.button).toHaveFocus()
  upper.controller.update({ ...upper.options, open: false, active: false })
  expect(lower.element.inert).toBe(false)
  expect(lower.element.matches(':modal')).toBe(true)
  expect(lower.button).toHaveFocus()
  expect(opener.inert).toBe(true)
  lower.controller.update({ ...lower.options, open: false, active: false })
  expect(opener).toHaveFocus()
  expect(opener.inert).toBe(false)
})

test('disposing a lower native dialog does not steal focus from its surviving child', () => {
  const opener = node('button', 'Outside opener')
  opener.focus()
  const lower = dialog()
  const upper = dialog()
  lower.controller.dispose()
  expect(upper.button).toHaveFocus()
  expect(upper.element.matches(':modal')).toBe(true)
  upper.controller.dispose()
  expect(opener).toHaveFocus()
})

test('native method=dialog submission requests state change and reopens after controlled denial', async () => {
  const current = dialog()
  const form = document.createElement('form')
  form.method = 'dialog'
  const submit = document.createElement('button')
  submit.textContent = 'Confirm'
  submit.value = 'confirmed'
  form.append(submit)
  current.element.append(form)
  await userEvent.click(submit)
  await expect.poll(() => current.onOpenChange.mock.calls.length).toBe(1)
  expect(current.element.matches(':modal')).toBe(true)
  expect(current.element.returnValue).toBe('confirmed')
  current.controller.update({ ...current.options, open: false, active: false })
  await settled()
  expect(current.onOpenChange).toHaveBeenCalledTimes(1)
})

test('an SSR open attribute is promoted into the native top layer', () => {
  const element = node('dialog')
  element.open = true
  const button = document.createElement('button')
  button.textContent = 'Hydrated action'
  element.append(button)
  expect(element.matches(':modal')).toBe(false)
  const controller = createDialogController(element, {
    open: true,
    active: true,
    onOpenChange: vi.fn(),
  })
  onTestFinished(() => controller.dispose())
  expect(element.matches(':modal')).toBe(true)
  expect(button).toHaveFocus()
  expect(element.hasAttribute('tabindex')).toBe(false)
})

test.each([true, false])(
  'accepted external closure restores final focus with modal=%s',
  async (modal) => {
    const opener = node('button', 'Original opener')
    const finalFocus = node('button', 'Final focus destination')
    opener.focus()
    const current = dialog({ finalFocus, modal })
    current.controller.update({
      ...current.options,
      onOpenChange(open) {
        current.controller.update({ ...current.options, open, active: open })
      },
    })
    current.element.close()
    await settled()
    await expect.poll(() => document.activeElement).toBe(finalFocus)
  }
)

test('external nonmodal closure preserves deliberate outside focus', async () => {
  const opener = node('button', 'Original opener')
  const finalFocus = node('button', 'Final focus destination')
  opener.focus()
  const current = dialog({ modal: false, finalFocus })
  current.controller.update({
    ...current.options,
    onOpenChange(open) {
      current.controller.update({ ...current.options, open, active: open })
    },
  })
  opener.focus()
  current.element.close()
  await settled()
  expect(opener).toHaveFocus()
})
