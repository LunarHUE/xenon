import { Toolbar } from '@kit/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function formWith(container: HTMLElement): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  extras.add(form)
  form.appendChild(container)
  return form
}

function native(el: HTMLElement): HTMLButtonElement {
  if (!(el instanceof HTMLButtonElement)) throw new Error('not a native button')
  return el
}

describe('toolbar forms', () => {
  spec('toolbar.forms.1', async () => {
    const user = userEvent.setup()
    const blocked = vi.fn()
    const submits = vi.fn((event: Event) => event.preventDefault())

    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button name="cut">Cut</Toolbar.Button>
          <Toolbar.Button name="copy" disabled focusableWhenDisabled={false}>
            Copy
          </Toolbar.Button>
          <Toolbar.Button name="paste" disabled onClick={blocked}>
            Paste
          </Toolbar.Button>
        </>
      ),
    })
    const form = formWith(m.container)
    form.addEventListener('submit', submits)
    const scope = within(root(m.container))
    const cut = native(scope.getByRole('button', { name: 'Cut' }))
    const copy = native(scope.getByRole('button', { name: 'Copy' }))
    const paste = native(scope.getByRole('button', { name: 'Paste' }))

    expect(cut.form).toBe(form)
    expect(cut).toHaveAttribute('type', 'button')
    expect(copy).toHaveAttribute('type', 'button')
    expect(paste).toHaveAttribute('type', 'button')

    expect(Array.from(form.elements)).toContain(copy)
    expect(copy.disabled).toBe(true)
    expect(copy.willValidate).toBe(false)
    expect([...new FormData(form).keys()]).toEqual([])

    await user.click(cut)
    await m.settle()
    expect(submits).not.toHaveBeenCalled()

    expect(paste.disabled).toBe(false)
    expect(paste).toHaveAttribute('aria-disabled', 'true')
    await user.click(paste)
    await m.settle()
    expect(blocked).not.toHaveBeenCalled()
    expect(submits).not.toHaveBeenCalled()
  })
})
