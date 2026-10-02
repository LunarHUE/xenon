import { afterEach, expect, test, vi } from 'vitest'

import { createFloatingLayer } from './floating-layer'

type Options = Parameters<typeof createFloatingLayer>[1]
const cleanups: (() => void)[] = []

test('inactive trigger branches remain inside across active-trigger switches and are released', () => {
  const other = document.createElement('button')
  document.body.append(other)
  const { controller, options, trigger } = setup({ branches: [other] })
  const inside: boolean[] = []
  other.addEventListener('probe', (event) => inside.push(controller.layer!.contains(event)))
  other.dispatchEvent(new Event('probe', { bubbles: true }))
  controller.update({ ...options, trigger: other, branches: [trigger, other] })
  other.dispatchEvent(new Event('probe', { bubbles: true }))
  controller.update({ ...options, branches: [] })
  other.dispatchEvent(new Event('probe', { bubbles: true }))
  expect(inside).toEqual([true, true, false])
})
function setup(initial: Partial<Options> = {}) {
  const wrapper = document.createElement('div')
  const content = document.createElement('div')
  const trigger = document.createElement('button')
  wrapper.append(content)
  document.body.append(trigger, wrapper)
  let shown = false
  const nativeMatches = wrapper.matches.bind(wrapper)
  vi.spyOn(wrapper, 'matches').mockImplementation((selector) =>
    selector === ':popover-open' ? shown : nativeMatches(selector)
  )
  function toggle(newState: 'open' | 'closed') {
    const oldState = shown ? 'open' : 'closed'
    wrapper.dispatchEvent(Object.assign(new Event('beforetoggle'), { oldState, newState }))
    shown = newState === 'open'
    const event = Object.assign(new Event('toggle'), { oldState, newState })
    setTimeout(() => wrapper.dispatchEvent(event), 0)
  }
  const showPopover = vi.fn(() => toggle('open'))
  const hidePopover = vi.fn(() => toggle('closed'))
  Object.assign(wrapper, { showPopover, hidePopover })
  const onDismiss = vi.fn()
  const options: Options = {
    content,
    trigger,
    open: true,
    active: true,
    positioned: false,
    initialFocus: false,
    onDismiss,
    ...initial,
  }
  const controller = createFloatingLayer(wrapper, options)
  cleanups.push(() => controller.dispose())
  return { wrapper, content, trigger, controller, options, onDismiss, showPopover, hidePopover }
}
function escape() {
  document.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    })
  )
}

test('nonmodal Tab bridges a separately mounted content first stop and its trigger', () => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    { width: 10, height: 10 },
  ] as unknown as DOMRectList)
  const m = setup({ positioned: true, logicalTabOrder: true })
  document.body.prepend(m.wrapper)
  const first = document.createElement('button')
  const last = document.createElement('button')
  m.content.append(first, last)
  const key = (target: HTMLElement, shiftKey = false, prevented = false) => {
    target.focus()
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey,
      bubbles: true,
      cancelable: true,
    })
    if (prevented) event.preventDefault()
    target.dispatchEvent(event)
    return event
  }
  expect(key(first, true).defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(m.trigger)
  expect(key(m.trigger).defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(first)
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(key(last).defaultPrevented).toBe(false)
  expect(key(first).defaultPrevented).toBe(false)
  key(first, true, true)
  expect(document.activeElement).toBe(first)
  m.trigger.disabled = true
  expect(key(first, true).defaultPrevented).toBe(false)
  m.trigger.disabled = false
  m.controller.update({ ...m.options, logicalTabOrder: false })
  expect(key(first, true).defaultPrevented).toBe(false)
  m.controller.update({ ...m.options, open: false })
  expect(key(first, true).defaultPrevented).toBe(false)
  m.controller.update(m.options)
  const upper = setup()
  expect(key(first, true).defaultPrevented).toBe(false)
  upper.controller.dispose()
  expect(key(first, true).defaultPrevented).toBe(true)
  m.controller.update({ ...m.options, positioned: false })
  expect(key(first, true).defaultPrevented).toBe(false)
  m.controller.dispose()
  expect(key(first, true).defaultPrevented).toBe(false)
})
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

test('shows before positioning and stays shown until presence ends', () => {
  const m = setup()
  expect(m.wrapper.getAttribute('popover')).toBe('manual')
  expect(m.showPopover).toHaveBeenCalledTimes(1)
  expect(m.controller.isShown()).toBe(true)
  m.controller.update({ ...m.options, open: false })
  expect(m.hidePopover).not.toHaveBeenCalled()
  m.controller.update({ ...m.options, open: false, active: false })
  expect(m.hidePopover).toHaveBeenCalledTimes(1)
  expect(m.controller.isShown()).toBe(false)
})

test('an exiting top layer blocks Escape until its physical disposal', () => {
  const lower = setup()
  const upper = setup()
  escape()
  expect(upper.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
  expect(lower.onDismiss).not.toHaveBeenCalled()
  upper.controller.update({ ...upper.options, open: false })
  escape()
  expect(upper.onDismiss).toHaveBeenCalledTimes(1)
  expect(lower.onDismiss).not.toHaveBeenCalled()
  upper.controller.update({ ...upper.options, open: false, active: false })
  escape()
  expect(lower.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
})

test('Escape cancellation and replacement updates use the current policy', () => {
  const callback = vi.fn((event: KeyboardEvent) => event.preventDefault())
  const m = setup({ onEscapeKeyDown: callback })
  escape()
  expect(callback).toHaveBeenCalledTimes(1)
  expect(m.onDismiss).not.toHaveBeenCalled()
  const { onEscapeKeyDown: _, ...options } = m.options
  m.controller.update({ ...options, closeOnEscape: false })
  escape()
  expect(m.onDismiss).not.toHaveBeenCalled()
  m.controller.update(options)
  escape()
  expect(m.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
})

test('modal locks remain during exit and disposal is idempotent', () => {
  const m = setup({ modal: true })
  expect(document.documentElement.style.overflowY).toBe('hidden')
  m.controller.update({ ...m.options, open: false })
  expect(document.documentElement.style.overflowY).toBe('hidden')
  m.controller.dispose()
  m.controller.dispose()
  expect(document.documentElement.style.overflowY).toBe('')
  expect(m.hidePopover).toHaveBeenCalledTimes(1)
  escape()
  expect(m.onDismiss).not.toHaveBeenCalled()
})

test('native hiding requests closure and reopens when controlled state refuses it', async () => {
  vi.useFakeTimers()
  const m = setup()
  await vi.runAllTimersAsync()
  m.hidePopover()
  await vi.runAllTimersAsync()
  expect(m.onDismiss).toHaveBeenCalledExactlyOnceWith('native')
  expect(m.controller.isShown()).toBe(true)
  expect(m.showPopover).toHaveBeenCalledTimes(2)
})

test('a queued internal hide cannot dismiss a newer opening', () => {
  vi.useFakeTimers()
  const m = setup()
  m.controller.update({ ...m.options, open: false, active: false })
  m.controller.update(m.options)
  vi.runAllTimers()
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(m.controller.isShown()).toBe(true)
})
