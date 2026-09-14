import { afterEach, expect, test, vi } from 'vitest'

import { createDialogController, type DialogController } from './dialog'

const controllers: DialogController[] = []
function setup(initial = {}) {
  const element = document.createElement('dialog')
  document.body.append(element)
  const showModal = vi.fn(() => element.setAttribute('open', ''))
  const show = vi.fn(() => element.setAttribute('open', ''))
  const close = vi.fn(() => {
    element.removeAttribute('open')
    setTimeout(() => element.dispatchEvent(new Event('close')), 0)
  })
  Object.assign(element, { showModal, show, close })
  const onOpenChange = vi.fn()
  const options = {
    open: true,
    active: true,
    initialFocus: false as const,
    onOpenChange,
    ...initial,
  }
  const controller = createDialogController(element, options)
  controllers.push(controller)
  return { element, controller, options, showModal, show, close, onOpenChange }
}
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose())
  document.body.replaceChildren()
  vi.useRealTimers()
})

test('retains modal presentation and locks until physical exit completes', () => {
  const { controller, element, options, showModal, close } = setup()
  expect(showModal).toHaveBeenCalledTimes(1)
  controller.update({ ...options, open: false })
  expect(element.open).toBe(true)
  expect(document.documentElement.style.overflowY).toBe('hidden')
  expect(close).not.toHaveBeenCalled()
  controller.update({ ...options, open: false, active: false })
  expect(element.open).toBe(false)
  expect(document.documentElement.style.overflowY).toBe('')
})

test('Escape requests controlled closure and ignores further dismissals during exit', () => {
  const { controller, options, element, onOpenChange } = setup()
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  )
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(element.open).toBe(true)
  controller.update({ ...options, open: false })
  element.dispatchEvent(new Event('cancel', { cancelable: true }))
  expect(onOpenChange).toHaveBeenCalledTimes(1)
})

test('native close requests closure and reopens when a controlled parent denies it', () => {
  vi.useFakeTimers()
  const { element, close, onOpenChange, showModal } = setup()
  close()
  vi.runAllTimers()
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  expect(element.open).toBe(true)
  expect(showModal).toHaveBeenCalledTimes(2)
})

test('queued internal close does not dismiss a reopened session', () => {
  vi.useFakeTimers()
  const { controller, options, element, onOpenChange } = setup()
  controller.update({ ...options, open: false, active: false })
  controller.update(options)
  vi.runAllTimers()
  expect(element.open).toBe(true)
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('only the top dialog routes native cancellation and respects author cancellation', () => {
  const lower = setup()
  const upper = setup()
  lower.element.dispatchEvent(new Event('cancel', { cancelable: true }))
  expect(lower.onOpenChange).not.toHaveBeenCalled()
  const canceled = new Event('cancel', { cancelable: true })
  canceled.preventDefault()
  upper.element.dispatchEvent(canceled)
  expect(upper.onOpenChange).not.toHaveBeenCalled()
  upper.element.dispatchEvent(new Event('cancel', { cancelable: true }))
  expect(upper.onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
})

test('nonmodal dialogs use show without modal locks', () => {
  const { show, showModal } = setup({ modal: false })
  expect(show).toHaveBeenCalledTimes(1)
  expect(showModal).not.toHaveBeenCalled()
  expect(document.documentElement.style.overflowY).toBe('')
})

test('promotes server rendered open attribute into a native modal session', () => {
  const element = document.createElement('dialog')
  element.open = true
  document.body.append(element)
  const showModal = vi.fn(() => {
    expect(element.open).toBe(false)
    element.open = true
  })
  Object.assign(element, {
    showModal,
    close: () => {
      element.open = false
    },
  })
  controllers.push(
    createDialogController(element, {
      open: true,
      active: true,
      initialFocus: false,
      onOpenChange: vi.fn(),
    })
  )
  expect(showModal).toHaveBeenCalledTimes(1)
})

test('changing modality replaces the native presentation and releases modal locks', () => {
  vi.useFakeTimers()
  const { controller, options, element, show, onOpenChange } = setup()
  controller.update({ ...options, modal: false })
  vi.runAllTimers()
  expect(show).toHaveBeenCalledTimes(1)
  expect(element.open).toBe(true)
  expect(document.documentElement.style.overflowY).toBe('')
  expect(onOpenChange).not.toHaveBeenCalled()
})

test('inner content defines outside gestures independently of the fullscreen native host', async () => {
  const { element, controller, options, onOpenChange } = setup({ active: false })
  const content = document.createElement('div')
  const inside = document.createElement('button')
  const background = document.createElement('div')
  content.append(inside)
  element.append(content, background)
  controller.update({ ...options, active: true, content })
  const gesture = async (target: Element) => {
    for (const type of ['pointerdown', 'pointerup'])
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          composed: true,
          pointerId: 1,
          isPrimary: true,
          button: 0,
        })
      )
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  await gesture(inside)
  expect(onOpenChange).not.toHaveBeenCalled()
  await gesture(background)
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
  onOpenChange.mockClear()
  await gesture(element)
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
})
