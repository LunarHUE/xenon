import { createFloatingLayer } from '@tenon/dom/floating-layer'
import { createDialogController } from '@tenon/dom/dialog'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

type Options = Parameters<typeof createFloatingLayer>[1]
const cleanups: (() => void)[] = []
function setup(initial: Partial<Options> = {}, parent: HTMLElement = document.body) {
  const host = document.createElement('div')
  const wrapper = document.createElement('div')
  wrapper.style.cssText =
    'position:fixed;left:150px;top:100px;margin:0;padding:0;border:0;inset:auto;left:150px;top:100px;width:180px;height:100px;background:white;'
  const content = document.createElement('div')
  content.setAttribute('role', 'dialog')
  content.tabIndex = -1
  const first = document.createElement('button')
  first.textContent = 'First action'
  const last = document.createElement('button')
  last.textContent = 'Last action'
  content.append(first, last)
  wrapper.append(content)
  const trigger = document.createElement('button')
  trigger.textContent = 'Open layer'
  const outside = document.createElement('button')
  outside.textContent = 'Outside action'
  host.append(trigger, outside, wrapper)
  parent.append(host)
  trigger.focus()
  const onDismiss = vi.fn()
  const options: Options = {
    content,
    trigger,
    open: true,
    active: true,
    positioned: true,
    onDismiss,
    ...initial,
  }
  const controller = createFloatingLayer(wrapper, options)
  cleanups.push(() => {
    controller.dispose()
    host.remove()
  })
  return { host, wrapper, content, trigger, outside, first, last, controller, options, onDismiss }
}
async function settle() {
  await new Promise<void>((resolve) => setTimeout(resolve, 30))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}
afterEach(() =>
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
)

test('native manual popovers escape ancestor clipping and remain measurable before focus is ready', async () => {
  const m = setup({ positioned: false })
  m.host.style.cssText =
    'position:relative;overflow:hidden;width:20px;height:20px;transform:translateZ(0);'
  await settle()
  expect(m.wrapper.matches(':popover-open')).toBe(true)
  expect(m.wrapper.getAttribute('popover')).toBe('manual')
  expect(m.trigger).toHaveFocus()
  const bounds = m.wrapper.getBoundingClientRect()
  expect(bounds.width).toBe(180)
  expect(bounds.left).toBe(150)
  const hit = document.elementFromPoint(bounds.left + 100, bounds.top + 70)
  expect(hit === m.wrapper || (hit && m.wrapper.contains(hit))).toBe(true)
  m.controller.update({ ...m.options, positioned: true })
  await settle()
  expect(m.first).toHaveFocus()
})

test('initialFocus false leaves the opener focused and explicit closing restores owned focus', async () => {
  const m = setup({ initialFocus: false })
  await settle()
  expect(m.trigger).toHaveFocus()
  m.last.focus()
  m.controller.update({ ...m.options, open: false, active: false })
  await settle()
  expect(m.trigger).toHaveFocus()
})

test('an unavailable finalFocus falls back to the live trigger', async () => {
  const unavailable = document.createElement('button')
  const m = setup({ finalFocus: unavailable })
  await settle()
  m.controller.update({ ...m.options, open: false, active: false })
  expect(m.trigger).toHaveFocus()
})

test('repeated Escape closes the child before its parent and restores each opener', async () => {
  const parent = setup()
  await settle()
  const child = setup({ trigger: parent.last, parent: parent.controller.layer })
  child.controller.update({
    ...child.options,
    onDismiss: (reason) => {
      child.onDismiss(reason)
      child.controller.update({ ...child.options, open: false, active: false })
    },
  })
  await settle()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(child.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
  expect(parent.onDismiss).not.toHaveBeenCalled()
  expect(parent.last).toHaveFocus()
  expect(parent.wrapper.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{Escape}')
  expect(parent.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
})

test('outside pointer dismissal preserves the clicked target focus', async () => {
  const m = setup()
  m.controller.update({
    ...m.options,
    onDismiss: (reason) => {
      m.onDismiss(reason)
      m.controller.update({ ...m.options, open: false, active: false })
    },
  })
  await settle()
  await userEvent.click(m.outside)
  await settle()
  expect(m.onDismiss).toHaveBeenCalledExactlyOnceWith('pointer-outside')
  expect(m.outside).toHaveFocus()
  expect(m.wrapper.matches(':popover-open')).toBe(false)
})

test('outside focus cancellation keeps the layer open without stealing focus', async () => {
  const onFocusOutside = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
  const m = setup({ onFocusOutside })
  await settle()
  m.outside.focus()
  await settle()
  expect(onFocusOutside).toHaveBeenCalledTimes(1)
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(m.outside).toHaveFocus()
  expect(m.wrapper.matches(':popover-open')).toBe(true)
})

test('focus leaving the layer requests dismissal and closing preserves outside focus', async () => {
  const m = setup()
  m.controller.update({
    ...m.options,
    onDismiss: (reason) => {
      m.onDismiss(reason)
      m.controller.update({ ...m.options, open: false, active: false })
    },
  })
  await settle()
  m.outside.focus()
  await settle()
  expect(m.onDismiss).toHaveBeenCalledExactlyOnceWith('focus-outside')
  expect(m.outside).toHaveFocus()
})

test('trigger presses belong to the layer and outside pointer cancellation remains effective', async () => {
  const onPointerOutside = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
  const m = setup({ onPointerOutside })
  await settle()
  await userEvent.click(m.trigger)
  await settle()
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(onPointerOutside).not.toHaveBeenCalled()
  m.first.focus()
  await userEvent.click(m.outside)
  await settle()
  expect(onPointerOutside).toHaveBeenCalledTimes(1)
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(m.outside).toHaveFocus()
})

test('modal focus containment and scroll locks last until physical exit', async () => {
  const m = setup({ modal: true })
  await settle()
  expect(document.documentElement.style.overflowY).toBe('hidden')
  m.controller.update({ ...m.options, open: false })
  m.outside.focus()
  await settle()
  expect(m.content.contains(document.activeElement)).toBe(true)
  expect(document.documentElement.style.overflowY).toBe('hidden')
  expect(m.wrapper.matches(':popover-open')).toBe(true)
  m.controller.update({ ...m.options, open: false, active: false })
  await settle()
  expect(document.documentElement.style.overflowY).toBe('')
  expect(m.wrapper.matches(':popover-open')).toBe(false)
  expect(m.trigger).toHaveFocus()
})

test('native hide requests controlled closure and refused closure restores the popover', async () => {
  const m = setup()
  await settle()
  m.wrapper.hidePopover()
  await settle()
  expect(m.onDismiss).toHaveBeenCalledExactlyOnceWith('native')
  expect(m.wrapper.matches(':popover-open')).toBe(true)
})

test('accepted native hiding honors finalFocus after the browser restores its opener', async () => {
  const m = setup()
  m.controller.update({
    ...m.options,
    finalFocus: m.outside,
    onDismiss: () =>
      m.controller.update({ ...m.options, finalFocus: m.outside, open: false, active: false }),
  })
  await settle()
  m.wrapper.hidePopover()
  await settle()
  expect(m.wrapper.matches(':popover-open')).toBe(false)
  expect(m.outside).toHaveFocus()
})

test('rapid close and reopen ignores an obsolete native toggle notification', async () => {
  const m = setup()
  await settle()
  m.controller.update({ ...m.options, open: false, active: false })
  m.controller.update(m.options)
  await settle()
  expect(m.onDismiss).not.toHaveBeenCalled()
  expect(m.wrapper.matches(':popover-open')).toBe(true)
  expect(m.first).toHaveFocus()
})

test('a floating layer inside a native modal receives Escape before the dialog', async () => {
  const dialog = document.createElement('dialog')
  const button = document.createElement('button')
  button.textContent = 'Dialog action'
  dialog.append(button)
  document.body.append(dialog)
  const onOpenChange = vi.fn()
  const outer = createDialogController(dialog, {
    open: true,
    active: true,
    onOpenChange,
  })
  cleanups.push(() => {
    outer.dispose()
    dialog.remove()
  })
  const child = setup({}, dialog)
  child.controller.update({
    ...child.options,
    onDismiss: (reason) => {
      child.onDismiss(reason)
      child.controller.update({ ...child.options, open: false, active: false })
    },
  })
  await settle()
  expect(child.first).toHaveFocus()
  expect(child.wrapper.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(child.onDismiss).toHaveBeenCalledExactlyOnceWith('escape')
  expect(onOpenChange).not.toHaveBeenCalled()
  expect(dialog.matches(':modal')).toBe(true)
  expect(child.trigger).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false)
})
