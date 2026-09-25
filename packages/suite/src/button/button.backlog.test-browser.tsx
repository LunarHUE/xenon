import { Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { For, createSignal } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function fixture(props: Record<string, unknown> = {}) {
  const m = mount('button', { children: 'Go', ...props })
  return { ...m, el: m.container.firstElementChild as HTMLButtonElement }
}
function formWith(container: HTMLElement) {
  const form = document.createElement('form')
  document.body.append(form)
  form.append(container)
  onTestFinished(() => form.remove())
  return form
}
function input(form: HTMLFormElement, type = 'text') {
  const el = document.createElement('input')
  el.type = type
  form.append(el)
  return el
}

describe('button browser backlog', () => {
  spec('button.forms.8', () => {
    const m = fixture({ type: 'submit' })
    formWith(m.container)
    expect(m.el.willValidate).toBe(true)
    const invalid = vi.fn((event: Event) => expect(event.cancelable).toBe(true))
    m.el.addEventListener('invalid', invalid)
    m.el.setCustomValidity('Pick one\r\nfirst')
    const native = document.createElement('button')
    native.type = 'submit'
    native.setCustomValidity('Pick one\r\nfirst')
    // The host owns validation-message line endings.
    expect(m.el.validationMessage).toBe(native.validationMessage)
    expect(m.el.validationMessage.replaceAll('\r\n', '\n')).toBe('Pick one\nfirst')
    expect(m.el.checkValidity()).toBe(false)
    expect(m.el.reportValidity()).toBe(false)
    expect(invalid).toHaveBeenCalledTimes(2)
    m.el.setCustomValidity('')
    expect(m.el.checkValidity()).toBe(true)
  })
  spec('button.forms.10', async () => {
    const m = fixture({ type: 'submit' })
    const form = formWith(m.container)
    input(form).required = true
    const submit = vi.fn((event: Event) => event.preventDefault())
    form.addEventListener('submit', submit)
    await userEvent.click(m.el)
    expect(submit).not.toHaveBeenCalled()
    m.setProps({ formnovalidate: true })
    await userEvent.click(m.el)
    expect(submit).toHaveBeenCalledTimes(1)
    m.setProps({ formnovalidate: false })
    form.noValidate = true
    await userEvent.click(m.el)
    expect(submit).toHaveBeenCalledTimes(2)
  })
  spec('button.forms.12', async () => {
    const m = fixture({ type: 'submit' })
    const form = formWith(m.container)
    const required = input(form)
    required.required = true
    expect(required.matches(':invalid')).toBe(true)
    expect(required.matches(':user-invalid')).toBe(false)
    await userEvent.click(m.el)
    expect(required.matches(':user-invalid')).toBe(true)
    await userEvent.type(required, 'Valid')
    expect(required.matches(':invalid')).toBe(false)
    expect(required.matches(':user-invalid')).toBe(false)
  })
  spec('button.forms.25', async () => {
    const m = fixture()
    const form = formWith(m.container)
    const first = input(form)
    const second = input(form)
    const submitters: (HTMLElement | null)[] = []
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      submitters.push(event.submitter)
    })
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(submitters).toEqual([])
    second.remove()
    await userEvent.keyboard('{Enter}')
    expect(submitters).toEqual([null])
  })
  test('text-like fields block implicit submission; checkboxes do not', async () => {
    const m = fixture()
    const form = formWith(m.container)
    const first = input(form)
    const blocker = input(form)
    const submit = vi.fn((event: Event) => event.preventDefault())
    form.addEventListener('submit', submit)
    for (const type of ['text', 'search', 'tel', 'url', 'email', 'password', 'number']) {
      blocker.type = type
      first.focus()
      await userEvent.keyboard('{Enter}')
      expect(submit, type).not.toHaveBeenCalled()
    }
    blocker.type = 'checkbox'
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledOnce()
  })
  spec('button.forms.35', async () => {
    const m = fixture({ type: 'submit' })
    const form = formWith(m.container)
    const submit = vi.fn((event: Event) => event.preventDefault())
    form.addEventListener('submit', submit)
    await userEvent.click(m.el)
    m.el.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledTimes(2)
    await Promise.resolve()
    m.setProps({ pending: true })
    await userEvent.click(m.el, { force: true })
    m.el.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledTimes(2)
    expect(m.el).toHaveAttribute('data-pending', '')
  })
  spec('button.forms.36', async () => {
    const m = fixture({ type: 'submit', pending: true })
    const form = formWith(m.container)
    const first = input(form)
    input(form)
    const submit = vi.fn((event: Event) => event.preventDefault())
    form.addEventListener('submit', submit)
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).not.toHaveBeenCalled()
    m.setProps({ pending: false })
    first.focus()
    await userEvent.keyboard('{Enter}')
    expect(submit).toHaveBeenCalledOnce()
  })
  spec('button.roles.9', async () => {
    const m = fixture({ as: 'div', 'aria-pressed': 'false' })
    expect(m.el.role).toBe('button')
    expect(m.el.ariaPressed).toBe('false')
    m.setProps({ 'aria-pressed': 'true' })
    await m.settle()
    expect(m.el.ariaPressed).toBe('true')
  })
  spec('button.pointer.2', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Actions',
      children: () => (
        <>
          <Toolbar.Button>First</Toolbar.Button>
          <Toolbar.Button>Second</Toolbar.Button>
        </>
      ),
    })
    const scope = within(m.container)
    const first = scope.getByRole('button', { name: 'First' })
    const second = scope.getByRole('button', { name: 'Second' })
    await userEvent.click(second)
    await m.settle()
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('tabindex', '0')
    expect(first).toHaveAttribute('tabindex', '-1')
    await userEvent.keyboard('{ArrowLeft}')
    await m.settle()
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('tabindex', '0')
  })
  spec('button.focus.30', async () => {
    const [items, setItems] = createSignal([{ id: 'first' }])
    const m = mount('toolbar', {
      'aria-label': 'Actions',
      children: () => (
        <For each={items()}>
          {() => (
            <Toolbar.Button disabled focusableWhenDisabled>
              Unavailable
            </Toolbar.Button>
          )}
        </For>
      ),
    })
    const old = within(m.container).getByRole('button')
    old.focus()
    expect(old).toHaveFocus()
    setItems([{ id: 'replacement' }])
    await m.settle()
    const replacement = within(m.container).getByRole('button')
    expect(replacement).not.toBe(old)
    replacement.focus()
    expect(replacement).toHaveFocus()
    expect(replacement).toHaveAttribute('aria-disabled', 'true')
  })

  spec('button.forms.20', async () => {
    const dialog = document.createElement('dialog')
    dialog.id = 'command-dialog'
    dialog.textContent = 'Dialog'
    document.body.append(dialog)
    onTestFinished(() => dialog.remove())
    const popover = document.createElement('div')
    popover.id = 'command-popover'
    popover.setAttribute('popover', 'manual')
    popover.textContent = 'Popover'
    document.body.append(popover)
    onTestFinished(() => popover.remove())
    const m = fixture({ commandfor: popover.id, command: 'show-popover' })
    await userEvent.click(m.el)
    expect(popover.matches(':popover-open')).toBe(true)
    m.setProps({ command: 'hide-popover' })
    await userEvent.click(m.el)
    expect(popover.matches(':popover-open')).toBe(false)
    m.setProps({ command: 'toggle-popover' })
    await userEvent.click(m.el)
    expect(popover.matches(':popover-open')).toBe(true)
    await userEvent.click(m.el)
    expect(popover.matches(':popover-open')).toBe(false)
    const commands: string[] = []
    popover.addEventListener('command', (event) =>
      commands.push((event as Event & { command: string }).command)
    )
    m.setProps({ command: '--custom' })
    await userEvent.click(m.el)
    expect(commands).toEqual(['--custom'])
    expect(popover.matches(':popover-open')).toBe(false)
    for (const command of [undefined, 'invalid-command']) {
      m.setProps({ command })
      await userEvent.click(m.el)
      expect(commands).toEqual(['--custom'])
    }
    m.setProps({ commandfor: dialog.id, command: 'show-modal' })
    await userEvent.click(m.el)
    expect(dialog.open).toBe(true)
    dialog.append(m.container)
    m.setProps({ command: 'request-close' })
    await userEvent.click(m.el)
    expect(dialog.open).toBe(false)
    document.body.append(m.container)
    m.setProps({ command: 'show-modal' })
    await userEvent.click(m.el)
    dialog.append(m.container)
    m.setProps({ command: 'close' })
    await userEvent.click(m.el)
    expect(dialog.open).toBe(false)
    document.body.append(m.container)
  })
  spec('button.forms.21', async () => {
    const popover = document.createElement('div')
    popover.id = 'canceled-command'
    popover.setAttribute('popover', 'manual')
    document.body.append(popover)
    onTestFinished(() => popover.remove())
    const m = fixture({ commandfor: popover.id, command: 'show-popover' })
    popover.addEventListener('command', (event) => event.preventDefault(), { once: true })
    await userEvent.click(m.el)
    expect(popover.matches(':popover-open')).toBe(false)
    popover.addEventListener('command', () => popover.remove(), { once: true })
    await userEvent.click(m.el)
    expect(popover.isConnected).toBe(false)
    expect(popover.matches(':popover-open')).toBe(false)
  })
  spec('button.forms.30', async () => {
    const clicked = vi.fn()
    const m = fixture({ id: 'labeled-button', onClick: clicked })
    const label = document.createElement('label')
    label.htmlFor = m.el.id
    label.textContent = 'Button label'
    m.container.append(label)
    await userEvent.hover(label)
    expect(label.matches(':hover')).toBe(true)
    expect(m.el.matches(':hover')).toBe(true)
    expect(clicked).not.toHaveBeenCalled()
    const held: boolean[] = []
    label.addEventListener('mousedown', () => {
      held.push(label.matches(':active'), m.el.matches(':active'), clicked.mock.calls.length === 0)
    })
    await userEvent.click(label)
    expect(held).toEqual([true, true, true])
    expect(clicked).toHaveBeenCalledOnce()
  })
  spec('button.focus.15', () => {
    const m = fixture()
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open', delegatesFocus: true })
    document.body.append(host)
    onTestFinished(() => host.remove())
    shadow.append(m.container)
    host.focus()
    expect(document.activeElement).toBe(host)
    expect(shadow.activeElement).toBe(m.el)
  })
  spec('button.focus.17', async () => {
    const m = fixture()
    const viewport = document.createElement('div')
    viewport.style.cssText =
      'height: 80px; width: 150px; overflow: auto; position: fixed; top: 0; left: 0'
    const spacer = document.createElement('div')
    spacer.style.height = '1000px'
    document.body.append(viewport)
    viewport.append(spacer, m.container)
    onTestFinished(() => viewport.remove())
    // Finish preceding focus/layout work before testing this focus request.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    m.el.focus({ preventScroll: true })
    expect(m.el).toHaveFocus()
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(viewport.scrollTop).toBe(0)
    m.el.blur()
    m.el.focus()
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
  })
})
