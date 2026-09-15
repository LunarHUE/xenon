/**
 * Browser-native Switch interaction: real label association, trusted Tab/Space,
 * and native reset/form ownership. Complements the jsdom switch suites, whose
 * reset and label cases drive `form.reset()` and synthesized label events, with
 * trusted pointer input and the browser's own reset algorithm.
 *
 * Every fixture is disposable and lives in this file only. Owned by the native
 * interaction slice; controlled-state and reactive Field cases live elsewhere.
 */
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import type { SwitchProps } from '../harness'
import { mount } from '../harness/solid'

/** Forms and labels created outside the Solid harness, unwound after every test. */
const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

/** Rendered host of a mounted switch, never the hidden form mirror. */
function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

/** Hidden native checkbox that mirrors a named non-input switch for forms. */
function mirror(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden mirror')
  return el
}

/** Appends a tracked form to the body. */
function createForm(id?: string): HTMLFormElement {
  const form = document.createElement('form')
  if (id) form.id = id
  document.body.appendChild(form)
  extras.add(form)
  return form
}

/** Appends a tracked native reset control to a form. */
function resetControl(form: HTMLFormElement, text: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'reset'
  button.textContent = text
  form.appendChild(button)
  return button
}

/** Asserts the checked state of either a native input or an ARIA switch host. */
function checked(el: HTMLElement, value: boolean) {
  if (el instanceof HTMLInputElement) expect(el.checked).toBe(value)
  else expect(el).toHaveAttribute('aria-checked', String(value))
}

/** Moves a mounted switch inside a real label whose visible text is the click target. */
function wrapLabel(container: HTMLElement, text: string) {
  const label = document.createElement('label')
  const span = document.createElement('span')
  span.textContent = text
  label.appendChild(span)
  document.body.appendChild(label)
  label.appendChild(container)
  extras.add(label)
  return { label, span }
}

/** Host renderings exercised by the form and focus cases. */
const variants: SwitchProps[] = [
  {},
  { as: 'button', children: 'Lights' },
  { as: 'div', children: 'Lights' },
]

describe('switch native browser interaction', () => {
  test('a native reset control restores an uncontrolled switch and reports no change', async () => {
    for (const variant of variants) {
      const change = vi.fn()
      const m = mount('switch', {
        ...variant,
        'aria-label': 'Lights',
        name: 'lights',
        defaultChecked: true,
        onCheckedChange: change,
      })
      const el = host(m.container)
      const form = createForm()
      const reset = resetControl(form, 'Reset')
      form.appendChild(m.container)

      checked(el, true)
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(new FormData(form).get('lights')).toBe('on')
      if (!(el instanceof HTMLInputElement)) expect(mirror(m.container).checked).toBe(true)

      await userEvent.click(el)
      await m.settle()
      checked(el, false)
      expect(el).toHaveAttribute('data-state', 'unchecked')
      expect(new FormData(form).get('lights')).toBe(null)

      await userEvent.click(reset)
      await m.settle()
      checked(el, true)
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(new FormData(form).get('lights')).toBe('on')
      if (!(el instanceof HTMLInputElement)) expect(mirror(m.container).checked).toBe(true)

      // The restored switch is on again, so the next activation proposes off.
      await userEvent.click(el)
      await m.settle()
      checked(el, false)
      expect(change.mock.calls).toEqual([[false], [false]])

      m.unmount()
      extras.delete(form)
      form.remove()
    }
  })

  test('a reset canceled by a later window listener keeps the switch state', async () => {
    const change = vi.fn()
    const m = mount('switch', { 'aria-label': 'Lights', name: 'lights', onCheckedChange: change })
    const el = host(m.container)
    const form = createForm()
    const reset = resetControl(form, 'Reset')
    form.appendChild(m.container)

    await userEvent.click(el)
    await m.settle()
    checked(el, true)
    expect(new FormData(form).get('lights')).toBe('on')

    // Window is above document, so this cancels only after the adapter's own reset listener.
    const cancel = vi.fn((event: Event) => event.preventDefault())
    window.addEventListener('reset', cancel)
    onTestFinished(() => window.removeEventListener('reset', cancel))

    await userEvent.click(reset)
    await m.settle()
    expect(cancel).toHaveBeenCalledTimes(1)
    checked(el, true)
    expect(el).toHaveAttribute('data-state', 'checked')
    expect(new FormData(form).get('lights')).toBe('on')
    expect(change.mock.calls).toEqual([[true]])
  })

  test('a switch bound to an external form resets with that form, not its ancestor', async () => {
    for (const variant of variants.slice(0, 2)) {
      const change = vi.fn()
      const owner = createForm('switch-native-owner')
      const ownerReset = resetControl(owner, 'Reset owner')
      const m = mount('switch', {
        ...variant,
        'aria-label': 'Lights',
        name: 'lights',
        defaultChecked: true,
        form: 'switch-native-owner',
        onCheckedChange: change,
      })
      const enclosing = createForm()
      const enclosingReset = resetControl(enclosing, 'Reset enclosing')
      enclosing.appendChild(m.container)
      const el = host(m.container)

      await m.settle()
      expect(new FormData(owner).get('lights')).toBe('on')
      expect(new FormData(enclosing).get('lights')).toBe(null)
      expect(el).toHaveAttribute('data-state', 'checked')
      if (el instanceof HTMLInputElement) expect(el.form).toBe(owner)
      else expect(mirror(m.container).form).toBe(owner)

      await userEvent.click(el)
      await m.settle()
      checked(el, false)
      expect(new FormData(owner).get('lights')).toBe(null)

      await userEvent.click(enclosingReset)
      await m.settle()
      checked(el, false)
      expect(el).toHaveAttribute('data-state', 'unchecked')
      expect(new FormData(owner).get('lights')).toBe(null)

      await userEvent.click(ownerReset)
      await m.settle()
      checked(el, true)
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(new FormData(owner).get('lights')).toBe('on')
      expect(change.mock.calls).toEqual([[false]])

      m.unmount()
      extras.delete(owner)
      owner.remove()
      extras.delete(enclosing)
      enclosing.remove()
    }
  })

  test('a wrapping label toggles and focuses an interactive switch, focuses a readonly one without toggling, and ignores a disabled one', async () => {
    const modes: { props: SwitchProps; next: boolean; focused: boolean }[] = [
      { props: {}, next: true, focused: true },
      { props: { readonly: true }, next: false, focused: true },
      { props: { disabled: true }, next: false, focused: false },
    ]

    for (const mode of modes) {
      const change = vi.fn()
      const m = mount('switch', { ...mode.props, onCheckedChange: change })
      const el = host(m.container)
      const { label, span } = wrapLabel(m.container, 'Lights')

      expect(label.control).toBe(el)
      expect(el).toHaveAccessibleName('Lights')

      await userEvent.click(span, { force: true })
      await m.settle()
      checked(el, mode.next)
      if (mode.focused) expect(el).toHaveFocus()
      else expect(el).not.toHaveFocus()
      if (mode.next) expect(change.mock.calls).toEqual([[true]])
      else expect(change).not.toHaveBeenCalled()

      m.unmount()
      extras.delete(label)
      label.remove()
    }
  })

  test('Tab skips a disabled switch and Space leaves a readonly switch unchanged', async () => {
    const before = document.createElement('button')
    before.textContent = 'before'
    document.body.prepend(before)
    onTestFinished(() => before.remove())

    for (const variant of variants) {
      const change = vi.fn()
      const first = mount('switch', { ...variant, 'aria-label': 'first' })
      const second = mount('switch', {
        ...variant,
        'aria-label': 'second',
        disabled: true,
      })
      const third = mount('switch', {
        ...variant,
        'aria-label': 'third',
        readonly: true,
        onCheckedChange: change,
      })
      const after = document.createElement('button')
      after.textContent = 'after'
      document.body.append(after)
      onTestFinished(() => after.remove())
      const firstEl = host(first.container)
      const secondEl = host(second.container)
      const thirdEl = host(third.container)

      before.focus()
      expect(before).toHaveFocus()

      await userEvent.tab()
      expect(firstEl).toHaveFocus()

      await userEvent.tab()
      expect(secondEl).not.toHaveFocus()
      expect(thirdEl).toHaveFocus()

      await userEvent.keyboard(' ')
      await third.settle()
      expect(thirdEl).toHaveFocus()
      checked(thirdEl, false)
      expect(change).not.toHaveBeenCalled()

      await userEvent.tab()
      expect(after).toHaveFocus()
      expect(secondEl).not.toHaveFocus()

      first.unmount()
      second.unmount()
      third.unmount()
      after.remove()
    }
  })
})
