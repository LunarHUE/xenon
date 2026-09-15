import { Combobox } from '@xenon/solid/combobox'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { describe, expect, onTestFinished, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { spec } from '../spec'

/**
 * Nonempty string values with display labels. `blocked` stays disabled so the
 * native navigation cases prove the key skip is real, not a filter artifact.
 */
const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'plum', label: 'Plum' },
]

/** Renders a disposable combobox fixture into its own container. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

/** Input and popup parts shared by the fixtures below. */
function Parts() {
  return (
    <>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Positioner>
        <Combobox.Content aria-label="Fruit" />
      </Combobox.Positioner>
    </>
  )
}

/** Flushes Solid, waits one animation frame, then flushes the popup's settled work. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

describe('combobox native keyboard, pointer, and commitment', () => {
  spec('combobox.keyboard.17', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit" onValueChange={change}>
          <Parts />
        </Combobox>
        <button type="submit">Submit</button>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('cher')
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await settle()

    // Enter accepts the highlighted option, and the caret lands after its label.
    expect(input).toHaveFocus()
    expect(input).toHaveValue('Cherry')
    expect(input.selectionStart).toBe('Cherry'.length)
    expect(input.selectionEnd).toBe('Cherry'.length)
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(new FormData(form).get('fruit')).toBe('cherry')
    expect(change).toHaveBeenCalledExactlyOnceWith('cherry')
  })

  spec('combobox.keyboard.54', async () => {
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit">
          <Parts />
        </Combobox>
        <button type="submit">Submit</button>
      </form>
    ))
    const form = view.container.querySelector('form')!
    form.addEventListener('submit', submit)
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('cher')
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(submit).not.toHaveBeenCalled()
    expect(new FormData(form).get('fruit')).toBe('cherry')

    // With the popup closed, Enter falls through to native form submission.
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(submit).toHaveBeenCalledTimes(1)
  })

  spec('combobox.keyboard.5', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    await settle()

    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    const popup = view.getByRole('listbox', { name: 'Fruit' })
    expect(input.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Plum' }).id
    )
  })

  spec('combobox.keyboard.2', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('plum')
    await settle()
    expect(input).toHaveValue('plum')

    // The editing keys reach the input: the caret moves and no highlight appears.
    await userEvent.keyboard('{Home}')
    expect(input.selectionStart).toBe(0)
    await userEvent.keyboard('{ArrowRight}')
    expect(input.selectionStart).toBe(1)
    await userEvent.keyboard('{End}')
    expect(input.selectionStart).toBe('plum'.length)
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
  })

  spec('combobox.keyboard.14', async () => {
    const view = mount(() => (
      <Combobox items={items} defaultValue="plum">
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    expect(input).toHaveValue('Plum')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    // Closed, Home and End move the caret instead of a highlight.
    await userEvent.click(input)
    await userEvent.keyboard('{Home}')
    expect(input.selectionStart).toBe(0)
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    await userEvent.keyboard('{End}')
    expect(input.selectionStart).toBe('Plum'.length)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  spec('combobox.keyboard.43', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(input.getAttribute('aria-activedescendant')).toBe(
      view.getByRole('option', { name: 'Apple' }).id
    )

    // A printable character is inserted and clears the highlight.
    await userEvent.keyboard('r')
    await settle()
    expect(input).toHaveValue('r')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  spec('combobox.keyboard.45', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit" onValueChange={change}>
          <Parts />
        </Combobox>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    await userEvent.keyboard(' ')
    await settle()

    // Space is text in an editable combobox, never a commit.
    expect(input).toHaveValue(' ')
    expect(change).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(new FormData(form).get('fruit')).toBe('')
  })

  spec('combobox.keyboard.31', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit" onValueChange={change}>
          <Parts />
        </Combobox>
        <button type="submit">Submit</button>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    const submit = view.getByRole('button', { name: 'Submit' })

    await userEvent.click(input)
    await userEvent.keyboard('app')
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(new FormData(form).get('fruit')).toBe('apple')

    // Tab with a different option highlighted closes without committing it.
    await userEvent.fill(input, 'um')
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(input.getAttribute('aria-activedescendant')).not.toBeNull()
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(submit).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(change).toHaveBeenCalledTimes(1)

    // Tab from the now-closed combobox commits nothing either.
    input.focus()
    await userEvent.keyboard('{Tab}')
    await settle()
    expect(change).toHaveBeenCalledTimes(1)
    expect(new FormData(form).get('fruit')).toBe('apple')
  })
})
