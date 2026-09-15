/**
 * Browser-native Toggle interaction: host-dependent press cancellation, the
 * disabled tab and pointer boundaries per host, and native form interaction.
 *
 * These cases need a real browser. The generic host synthesizes its own click,
 * so its keyboard paths are cancellable where a native button is not, and only a
 * browser models native tab order plus the disabled-control activation
 * short-circuit. Controlled pressed requests, reactive disabled/read-only
 * behavior and child lifecycle live in the state slice and are not repeated.
 *
 * Every fixture is local, disposable, and removed when the test finishes.
 */
import { within } from '@testing-library/dom'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

/** Installs a native tab stop at the start of the body so Tab order has a known origin. */
function tabOrigin(): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = 'Origin'
  document.body.prepend(button)
  onTestFinished(() => button.remove())
  return button
}

/** Appends a disposable form so a mounted fixture can sit inside a real form. */
function createForm(): HTMLFormElement {
  const form = document.createElement('form')
  document.body.append(form)
  onTestFinished(() => form.remove())
  return form
}

/** Appends a native submit control that never navigates away from the test page. */
function submitControl(form: HTMLFormElement, name: string): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'submit'
  button.name = name
  button.textContent = 'Save'
  form.append(button)
  return button
}

/** Records every document-level click, in the capture phase, ahead of delegation. */
function recordClicks(): MouseEvent[] {
  const clicks: MouseEvent[] = []
  function listener(event: MouseEvent) {
    clicks.push(event)
  }
  document.addEventListener('click', listener, true)
  onTestFinished(() => document.removeEventListener('click', listener, true))
  return clicks
}

describe('toggle native browser interaction', () => {
  test('a generic host cancels Enter activation when the author keydown prevents the default', async () => {
    const clicks = recordClicks()
    const change = vi.fn()
    const keydown = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const m = mount('toggle', {
      as: 'div',
      children: 'Mute',
      onKeyDown: keydown,
      onPressedChange: change,
    })
    const el = within(m.container).getByRole('button', { name: 'Mute' })

    el.focus()
    await userEvent.keyboard('{Enter}')
    await m.settle()

    expect(keydown).toHaveBeenCalledTimes(1)
    expect(clicks).toHaveLength(0)
    expect(change).not.toHaveBeenCalled()
    expect(el).toHaveAttribute('aria-pressed', 'false')
    expect(el).toHaveAttribute('data-state', 'off')
  })

  test('a generic host cancels Space activation when the author keyup prevents the default', async () => {
    const clicks = recordClicks()
    const change = vi.fn()
    const keyup = vi.fn((event: KeyboardEvent) => event.preventDefault())
    const m = mount('toggle', {
      as: 'div',
      children: 'Mute',
      onKeyUp: keyup,
      onPressedChange: change,
    })
    const el = within(m.container).getByRole('button', { name: 'Mute' })

    el.focus()
    await userEvent.keyboard(' ')
    await m.settle()

    expect(keyup).toHaveBeenCalledTimes(1)
    expect(clicks).toHaveLength(0)
    expect(change).not.toHaveBeenCalled()
    expect(el).toHaveAttribute('aria-pressed', 'false')
  })

  test('a generic host ignores a synthetic repeated Enter keydown and still activates on a fresh press', async () => {
    const change = vi.fn()
    const m = mount('toggle', { as: 'div', children: 'Mute', onPressedChange: change })
    const el = within(m.container).getByRole('button', { name: 'Mute' })
    el.focus()

    // Synthetic keydown standing in for browser key auto-repeat, without any OS IME involvement.
    const repeated = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat: true,
      bubbles: true,
      cancelable: true,
    })
    el.dispatchEvent(repeated)
    await m.settle()

    expect(repeated.defaultPrevented).toBe(true)
    expect(change).not.toHaveBeenCalled()
    expect(el).toHaveAttribute('aria-pressed', 'false')

    await userEvent.keyboard('{Enter}')
    await m.settle()

    expect(el).toHaveAttribute('aria-pressed', 'true')
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
  })

  test('a disabled native host leaves the tab ring and its own activation is inert', async () => {
    const origin = tabOrigin()
    const change = vi.fn()
    const author = vi.fn()
    const off = mount('toggle', {
      children: 'Crop',
      disabled: true,
      onClick: author,
      onPressedChange: change,
    })
    const on = mount('toggle', { children: 'Rotate' })
    const offEl = within(off.container).getByRole('button', { name: 'Crop' })
    const onEl = within(on.container).getByRole('button', { name: 'Rotate' })

    expect(offEl).toBeDisabled()
    expect(offEl.matches(':disabled')).toBe(true)
    expect(offEl).not.toHaveAttribute('tabindex')

    origin.focus()
    await userEvent.tab()
    expect(onEl).toHaveFocus()
    expect(offEl).not.toHaveFocus()

    const clicks = vi.fn()
    offEl.addEventListener('click', clicks)
    // The element's own activation method is a no-op on a disabled form control.
    offEl.click()
    await off.settle()
    expect(clicks).not.toHaveBeenCalled()
    expect(author).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect(offEl).toHaveAttribute('aria-pressed', 'false')
  })

  test('a disabled generic host leaves the tab ring while its delivered click is canceled', async () => {
    const origin = tabOrigin()
    const change = vi.fn()
    const author = vi.fn()
    const off = mount('toggle', {
      as: 'div',
      children: 'Crop',
      disabled: true,
      onClick: author,
      onPressedChange: change,
    })
    const on = mount('toggle', { as: 'div', children: 'Rotate' })
    const offEl = within(off.container).getByRole('button', { name: 'Crop' })
    const onEl = within(on.container).getByRole('button', { name: 'Rotate' })

    expect(offEl).toHaveAttribute('aria-disabled', 'true')
    expect(offEl).toHaveAttribute('data-disabled', '')
    expect(offEl.matches(':disabled')).toBe(false)
    expect(offEl).not.toHaveAttribute('tabindex')

    origin.focus()
    await userEvent.tab()
    expect(onEl).toHaveFocus()
    expect(offEl).not.toHaveFocus()

    const clicks = vi.fn()
    offEl.addEventListener('click', clicks)
    await userEvent.click(offEl, { force: true })
    await off.settle()

    // aria-disabled does not keep the browser from delivering the click; the component cancels it.
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(author).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect(offEl).toHaveAttribute('aria-pressed', 'false')
  })

  test('a native toggle button toggles inside a form without submitting it', async () => {
    const form = createForm()
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)
    const change = vi.fn()
    const m = mount('toggle', { children: 'Mute', name: 'mute', onPressedChange: change })
    form.append(m.container)
    const save = submitControl(form, 'save')
    const el = within(m.container).getByRole('button', { name: 'Mute' })

    // Control: the form really does submit through its own submit button.
    await userEvent.click(save)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    await userEvent.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-pressed', 'true')
    expect(submit).toHaveBeenCalledTimes(1)

    el.focus()
    await userEvent.keyboard('{Enter}')
    await m.settle()
    expect(el).toHaveAttribute('aria-pressed', 'false')
    expect(submit).toHaveBeenCalledTimes(1)
    expect(change.mock.calls).toEqual([[true], [false]])
  })

  test('a disabled fieldset disables a native toggle but leaves a generic host active', async () => {
    const form = createForm()
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    form.append(fieldset)
    const nativeChange = vi.fn()
    const nativeAuthor = vi.fn()
    const genericChange = vi.fn()
    const native = mount('toggle', {
      children: 'Crop',
      onClick: nativeAuthor,
      onPressedChange: nativeChange,
    })
    const generic = mount('toggle', {
      as: 'div',
      children: 'Rotate',
      onPressedChange: genericChange,
    })
    fieldset.append(native.container, generic.container)
    const off = within(native.container).getByRole('button', { name: 'Crop' })
    const on = within(generic.container).getByRole('button', { name: 'Rotate' })

    expect(off.matches(':disabled')).toBe(true)
    expect(on.matches(':disabled')).toBe(false)

    const clicks = vi.fn()
    off.addEventListener('click', clicks)
    off.click()
    await native.settle()
    expect(clicks).not.toHaveBeenCalled()
    expect(nativeAuthor).not.toHaveBeenCalled()
    expect(nativeChange).not.toHaveBeenCalled()
    expect(off).toHaveAttribute('aria-pressed', 'false')

    // The div host is not form-associated, so the disabled fieldset leaves it active.
    await userEvent.click(on)
    await generic.settle()
    expect(on).toHaveAttribute('aria-pressed', 'true')
    expect(genericChange).toHaveBeenCalledExactlyOnceWith(true)
  })

  test('an input-button host activates natively and never submits its form', async () => {
    const form = createForm()
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)
    const change = vi.fn()
    const m = mount('toggle', {
      as: 'input',
      value: 'Mute',
      'aria-label': 'Mute',
      name: 'mute',
      onPressedChange: change,
    })
    form.append(m.container)
    submitControl(form, 'save')
    const el = within(m.container).getByRole('button', { name: 'Mute' })

    expect(el).toBeInstanceOf(HTMLInputElement)
    expect(el).toHaveAttribute('type', 'button')
    expect(el).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-pressed', 'true')
    expect(el).toHaveAttribute('data-state', 'on')
    expect(submit).not.toHaveBeenCalled()

    el.focus()
    await userEvent.keyboard(' ')
    await m.settle()
    expect(el).toHaveAttribute('aria-pressed', 'false')
    expect(el).toHaveAttribute('data-state', 'off')
    expect(submit).not.toHaveBeenCalled()
    expect(change.mock.calls).toEqual([[true], [false]])
  })
})
