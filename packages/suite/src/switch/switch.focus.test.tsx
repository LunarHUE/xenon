import { fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

function labelFor(id: string, text: string): HTMLLabelElement {
  const label = document.createElement('label')
  label.htmlFor = id
  label.textContent = text
  document.body.appendChild(label)
  extras.add(label)
  return label
}

describe('switch focus management', () => {
  spec('switch.focus.1', async () => {
    const user = userEvent.setup()
    const native = mount('switch', { id: 'switch-focus-1', disabled: true })
    const input = host(native.container)
    const label = labelFor('switch-focus-1', 'Lights')

    input.focus()
    expect(input).not.toHaveFocus()

    await user.click(label)
    await native.settle()
    expect(input).not.toHaveFocus()
    expect(input).not.toHaveAttribute('data-focus')
    native.unmount()

    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, children: 'Lights', disabled: true })
      const el = host(m.container)
      el.focus()
      expect(el).not.toHaveFocus()
      expect(el).not.toHaveAttribute('data-focus')
      m.unmount()
    }
  })

  spec('switch.focus.2', async () => {
    const user = userEvent.setup()
    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, children: 'Lights', name: 'lights' })
      const el = host(m.container)
      const input = hidden(m.container)
      expect(input).toHaveAttribute('tabindex', '-1')
      expect(input).toHaveAttribute('aria-hidden', 'true')

      await user.tab()
      expect(el).toHaveFocus()

      await user.tab()
      expect(input).not.toHaveFocus()
      m.unmount()
    }
  })

  spec('switch.focus.3', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { id: 'switch-focus-3' })
    const el = host(m.container)
    const label = labelFor('switch-focus-3', 'Lights')
    const blur = vi.fn()
    el.addEventListener('blur', blur)
    await user.click(label)
    await m.settle()

    for (let i = 0; i < 2; i++) {
      fireEvent.click(label)
      await m.settle()
    }

    expect(blur).not.toHaveBeenCalled()
    expect(el).toHaveFocus()
    expect(el).toBeChecked()
  })

  spec.todo('switch.focus.4')

  spec.skip(
    'switch.focus.5',
    'no excludeFromTabOrder prop; an author passes tabindex through instead',
    () => {
      const m = mount('switch', { as: 'div', children: 'Lights', excludeFromTabOrder: true })
      expect(host(m.container)).toHaveAttribute('tabindex', '-1')
    }
  )

  spec.todo('switch.focus.6')
})
