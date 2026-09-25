/**
 * Reactive checkbox state cases observable in both the jsdom and browser projects:
 * a controlled mixed-to-checked commit driven by activation, the binary hidden
 * form mirror under a mixed presentation, dynamic Field label registration, and
 * Field required/disabled composition onto a non-native host and its mirror.
 * Every interaction is a synthetic `fireEvent` dispatch, so these cases never
 * claim OS or native input timing.
 */
import { Checkbox, Field } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { Show, createSignal } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { mount } from '../harness/solid'

/** Body-level fixtures created by the tests, removed after every test. */
const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

/** Visible control the harness appends as the first child of its container. */
function control(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

/** Visible native checkbox host. */
function input(container: HTMLElement): HTMLInputElement {
  const el = control(container)
  if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
  return el
}

/** Clipped native checkbox rendered for a named non-input host. */
function mirror(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no form mirror')
  return el
}

/** Creates a body-level form and adopts the given harness containers. */
function formWith(...containers: HTMLElement[]): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  extras.add(form)
  for (const container of containers) form.appendChild(container)
  return form
}

describe('checkbox reactive state', () => {
  test('activating a controlled mixed checkbox commits the reported value and drops the mixed presentation', async () => {
    for (const as of [undefined, 'div'] as const) {
      const change = vi.fn()
      const m = mount('checkbox', {
        ...(as ? { as } : {}),
        'aria-label': 'Agree',
        checked: false,
        indeterminate: true,
      })
      m.setProps({
        onCheckedChange: (next: boolean) => {
          change(next)
          m.setProps({ checked: next, indeterminate: false })
        },
      })
      const el = as ? control(m.container) : input(m.container)
      await m.settle()

      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'mixed')
        expect(el).toHaveAttribute('data-state', 'indeterminate')
        expect(el).toHaveAttribute('data-indeterminate', '')
        expect(el).not.toHaveAttribute('data-checked')
      } else {
        expect((el as HTMLInputElement).indeterminate).toBe(true)
        expect(el).not.toBeChecked()
      }

      fireEvent.click(el)
      await m.settle()
      expect(change).toHaveBeenCalledTimes(1)
      expect(change).toHaveBeenLastCalledWith(true)
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(el).toHaveAttribute('data-checked', '')
      expect(el).not.toHaveAttribute('data-indeterminate')
      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'true')
      } else {
        expect(input(m.container)).toBeChecked()
        expect(input(m.container).indeterminate).toBe(false)
        expect(input(m.container).matches(':indeterminate')).toBe(false)
      }

      fireEvent.click(el)
      await m.settle()
      expect(change).toHaveBeenCalledTimes(2)
      expect(change).toHaveBeenLastCalledWith(false)
      expect(el).toHaveAttribute('data-state', 'unchecked')
      expect(el).not.toHaveAttribute('data-indeterminate')
      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'false')
      } else {
        expect(input(m.container)).not.toBeChecked()
      }
      m.unmount()
    }
  })

  test('a named non-native checkbox keeps its form mirror binary while the visible control reads mixed', async () => {
    const m = mount('checkbox', {
      as: 'div',
      'aria-label': 'Agree',
      name: 'agree',
      checked: false,
      indeterminate: true,
    })
    const form = formWith(m.container)
    const box = control(m.container)
    const backing = mirror(m.container)
    await m.settle()

    expect(box).toHaveAttribute('aria-checked', 'mixed')
    expect(box).toHaveAttribute('data-state', 'indeterminate')
    expect(backing.indeterminate).toBe(false)
    expect(backing.matches(':indeterminate')).toBe(false)
    expect(backing.checked).toBe(false)
    expect(Array.from(new FormData(form).keys())).toEqual([])

    m.setProps({ checked: true })
    await m.settle()
    expect(box).toHaveAttribute('aria-checked', 'mixed')
    expect(box).toHaveAttribute('data-state', 'indeterminate')
    expect(backing.indeterminate).toBe(false)
    expect(backing.checked).toBe(true)
    expect(new FormData(form).get('agree')).toBe('on')

    m.setProps({ checked: false })
    await m.settle()
    expect(backing.checked).toBe(false)
    expect(Array.from(new FormData(form).keys())).toEqual([])
    m.unmount()
  })

  test('a Field label registered after mount names a generic checkbox and removal drops the reference', async () => {
    const [show, setShow] = createSignal(false)
    const m = mount('field', {
      children: () => (
        <>
          <Show when={show()}>
            <Field.Label id="checkbox-dynamic-label">Dynamic label</Field.Label>
          </Show>
          <Checkbox as="div" />
        </>
      ),
    })
    await m.settle()
    const scope = within(m.container)
    const box = scope.getByRole('checkbox')
    expect(box).not.toHaveAttribute('aria-labelledby')

    setShow(true)
    await m.settle()
    const label = scope.getByText('Dynamic label')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveAttribute('for', box.id)
    expect(box).toHaveAttribute('aria-labelledby', 'checkbox-dynamic-label')
    expect(box).toHaveAccessibleName('Dynamic label')

    setShow(false)
    await m.settle()
    expect(scope.queryByText('Dynamic label')).toBeNull()
    expect(box).not.toHaveAttribute('aria-labelledby')
    m.unmount()
  })

  test("a Field's required flag reaches a non-native checkbox as aria-required and its form mirror natively", async () => {
    const m = mount('field', {
      name: 'account',
      required: true,
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Checkbox as="div" />
        </>
      ),
    })
    await m.settle()
    const box = within(m.container).getByRole('checkbox')
    const backing = mirror(m.container)

    expect(box).toHaveAttribute('aria-required', 'true')
    expect(box).toHaveAttribute('data-required', '')
    expect(box).not.toHaveAttribute('required')
    expect(backing.required).toBe(true)

    m.setProps({ required: false })
    await m.settle()
    expect(box).not.toHaveAttribute('aria-required')
    expect(box).not.toHaveAttribute('data-required')
    expect(backing.required).toBe(false)
    m.unmount()
  })

  test("a Field's disabled flag blocks a non-native checkbox until the flag clears", async () => {
    const change = vi.fn()
    const m = mount('field', {
      name: 'account',
      disabled: true,
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Checkbox as="div" name="agree" onCheckedChange={change} />
        </>
      ),
    })
    await m.settle()
    const box = within(m.container).getByRole('checkbox')
    const backing = mirror(m.container)

    expect(box).toHaveAttribute('aria-disabled', 'true')
    expect(box).toHaveAttribute('data-disabled', '')
    expect(box).not.toHaveAttribute('disabled')
    expect(box).not.toHaveAttribute('tabindex')
    expect(backing.disabled).toBe(true)

    fireEvent.click(box)
    await m.settle()
    expect(change).not.toHaveBeenCalled()
    expect(box).toHaveAttribute('aria-checked', 'false')

    m.setProps({ disabled: false })
    await m.settle()
    expect(box).not.toHaveAttribute('aria-disabled')
    expect(box).not.toHaveAttribute('data-disabled')
    expect(box).toHaveAttribute('tabindex', '0')
    expect(backing.disabled).toBe(false)

    fireEvent.click(box)
    await m.settle()
    expect(change).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenLastCalledWith(true)
    expect(box).toHaveAttribute('aria-checked', 'true')
    m.unmount()
  })
})
