import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

/** Extra nodes outside the harness fixture set, removed after every test. */
const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

/** Rendered visible control; the harness appends one element to its container. */
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

/** Clipped native checkbox the component renders for a named non-input host. */
function mirror(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no form mirror')
  return el
}

/** Appends a labelled node to the body and tracks it for disposal. */
function addNode(html: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', html)
  const el = document.body.lastElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing added')
  extras.add(el)
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

/** Creates a body-level form with a stable id so a detached control can own it. */
function createForm(id: string): HTMLFormElement {
  const form = document.createElement('form')
  form.id = id
  document.body.appendChild(form)
  extras.add(form)
  return form
}

/** Submitted entry keys of a form. */
function keys(form: HTMLFormElement): string[] {
  return Array.from(new FormData(form).keys())
}

describe('checkbox native interactions', () => {
  test('Space flips checked while the mixed presentation stays sticky', async () => {
    for (const as of [undefined, 'div'] as const) {
      const change = vi.fn()
      const m = mount('checkbox', {
        ...(as ? { as } : {}),
        'aria-label': 'Agree',
        indeterminate: true,
        defaultChecked: false,
        onCheckedChange: change,
      })
      const el = as ? control(m.container) : input(m.container)
      await m.settle()

      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'mixed')
        expect(el).toHaveAttribute('data-state', 'indeterminate')
        expect(el).not.toHaveAttribute('data-checked')
      } else {
        expect(el).not.toBeChecked()
        expect((el as HTMLInputElement).indeterminate).toBe(true)
      }

      el.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      expect(change).toHaveBeenCalledTimes(1)
      expect(change).toHaveBeenLastCalledWith(true)
      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'mixed')
        expect(el).toHaveAttribute('data-state', 'indeterminate')
        expect(el).toHaveAttribute('data-checked', '')
      } else {
        expect(input(m.container)).toBeChecked()
        expect(input(m.container).indeterminate).toBe(true)
        expect(input(m.container).matches(':indeterminate')).toBe(true)
        expect(input(m.container)).toHaveAttribute('data-state', 'indeterminate')
      }

      await userEvent.keyboard(' ')
      await m.settle()
      expect(change).toHaveBeenCalledTimes(2)
      expect(change).toHaveBeenLastCalledWith(false)
      if (as) {
        expect(el).toHaveAttribute('aria-checked', 'mixed')
        expect(el).not.toHaveAttribute('data-checked')
      } else {
        expect(input(m.container)).not.toBeChecked()
        expect(input(m.container).indeterminate).toBe(true)
      }
      m.unmount()
    }
  })

  test('readonly blocks Space and clearing it at runtime re-enables activation', async () => {
    for (const as of [undefined, 'div'] as const) {
      const change = vi.fn()
      const m = mount('checkbox', {
        ...(as ? { as } : {}),
        'aria-label': 'Agree',
        defaultChecked: false,
        readonly: true,
        onCheckedChange: change,
      })
      const el = as ? control(m.container) : input(m.container)
      await m.settle()
      expect(el).toHaveAttribute('aria-readonly', 'true')

      el.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      expect(change).not.toHaveBeenCalled()
      if (as) expect(el).toHaveAttribute('aria-checked', 'false')
      else expect(input(m.container)).not.toBeChecked()

      m.setProps({ readonly: false })
      await m.settle()
      expect(el).not.toHaveAttribute('aria-readonly')

      el.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      expect(change).toHaveBeenCalledTimes(1)
      expect(change).toHaveBeenLastCalledWith(true)
      if (as) expect(el).toHaveAttribute('aria-checked', 'true')
      else expect(input(m.container)).toBeChecked()

      m.setProps({ readonly: true })
      await m.settle()
      el.focus()
      await userEvent.keyboard(' ')
      await m.settle()
      expect(change).toHaveBeenCalledTimes(1)
      if (as) expect(el).toHaveAttribute('aria-checked', 'true')
      else expect(input(m.container)).toBeChecked()
      m.unmount()
    }
  })

  test('an associated label toggles a native checkbox only after readonly clears, keeping mixed sticky', async () => {
    const change = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-label',
      indeterminate: true,
      defaultChecked: false,
      readonly: true,
      onCheckedChange: change,
    })
    const label = addNode('<label for="checkbox-label">Agree</label>')
    const box = input(m.container)
    await m.settle()
    expect(box.indeterminate).toBe(true)

    await userEvent.click(label)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(box.indeterminate).toBe(true)
    expect(box.matches(':indeterminate')).toBe(true)
    expect(change).not.toHaveBeenCalled()

    m.setProps({ readonly: false })
    await m.settle()

    await userEvent.click(label)
    await m.settle()
    expect(box).toBeChecked()
    expect(box.indeterminate).toBe(true)
    expect(box).toHaveAttribute('data-state', 'indeterminate')
    expect(change).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenLastCalledWith(true)
    m.unmount()
  })

  test('a reset cancelled by a later window listener keeps user state, while an uncancelled reset restores without a change callback', async () => {
    for (const as of [undefined, 'button'] as const) {
      const change = vi.fn()
      const m = mount('checkbox', {
        ...(as ? { as } : {}),
        'aria-label': 'Agree',
        name: 'agree',
        defaultChecked: true,
        onCheckedChange: change,
      })
      const form = formWith(m.container)
      const surface = as ? control(m.container) : input(m.container)
      const box = as ? mirror(m.container) : input(m.container)
      expect(keys(form)).toEqual(['agree'])

      await userEvent.click(surface)
      await m.settle()
      expect(change).toHaveBeenCalledTimes(1)
      expect(change).toHaveBeenLastCalledWith(false)
      expect(box).not.toBeChecked()
      expect(keys(form)).toEqual([])
      if (as) expect(surface).toHaveAttribute('aria-checked', 'false')

      const cancel = (event: Event) => event.preventDefault()
      window.addEventListener('reset', cancel)
      onTestFinished(() => window.removeEventListener('reset', cancel))
      form.reset()
      await m.settle()
      expect(box).not.toBeChecked()
      expect(change).toHaveBeenCalledTimes(1)
      if (as) expect(surface).toHaveAttribute('aria-checked', 'false')

      window.removeEventListener('reset', cancel)
      form.reset()
      await m.settle()
      expect(box).toBeChecked()
      expect(change).toHaveBeenCalledTimes(1)
      expect(keys(form)).toEqual(['agree'])
      if (as) expect(surface).toHaveAttribute('aria-checked', 'true')
      m.unmount()
      form.remove()
    }
  })

  test('a mirrored non-input checkbox is owned and reset by its external form rather than its enclosing form', async () => {
    const owner = createForm('checkbox-owner')
    const m = mount('checkbox', {
      as: 'button',
      'aria-label': 'Agree',
      name: 'agree',
      defaultChecked: true,
      form: 'checkbox-owner',
    })
    const enclosing = formWith(m.container)
    const surface = control(m.container)
    const box = mirror(m.container)
    await m.settle()

    expect(box).toHaveAttribute('aria-hidden', 'true')
    expect(box).toHaveAttribute('tabindex', '-1')
    expect(box.form).toBe(owner)
    expect(keys(owner)).toEqual(['agree'])
    expect(keys(enclosing)).toEqual([])

    await userEvent.click(surface)
    await m.settle()
    expect(surface).toHaveAttribute('aria-checked', 'false')
    expect(box).not.toBeChecked()
    expect(keys(owner)).toEqual([])

    enclosing.reset()
    await m.settle()
    expect(surface).toHaveAttribute('aria-checked', 'false')
    expect(box).not.toBeChecked()
    expect(keys(owner)).toEqual([])

    owner.reset()
    await m.settle()
    expect(surface).toHaveAttribute('aria-checked', 'true')
    expect(box).toBeChecked()
    expect(keys(owner)).toEqual(['agree'])
    m.unmount()
    enclosing.remove()
    owner.remove()
  })
})
