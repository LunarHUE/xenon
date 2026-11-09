import { Combobox } from '@xenon-ui/solid/combobox'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'

import { spec } from '../spec'

/**
 * Nonempty string values with display labels. `blocked` stays disabled so the
 * navigation and pointer cases prove it is skipped or inert. The default filter
 * matches labels, so every query below is chosen against these labels.
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

/** Waits for popup mounting and positioning before querying accessible options. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/** Replaces the input text and dispatches the native input event a keystroke produces. */
async function type(input: HTMLInputElement, value: string) {
  input.value = value
  fireEvent.input(input)
  await settle()
}

/** Dispatches a synthetic keydown without emulating the browser's default action. */
async function press(el: HTMLElement, key: string) {
  fireEvent.keyDown(el, { key })
  await settle()
}

describe('combobox filtering, commitment, and cancellation', () => {
  test('a disabled-only match stays unhighlighted and cannot commit with Enter', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await type(input, 'blocked')
    await press(input, 'ArrowDown')
    expect(view.getByRole('option', { name: 'Blocked' })).toHaveAttribute('aria-disabled', 'true')
    expect(input).not.toHaveAttribute('aria-activedescendant')
    await press(input, 'Enter')
    expect(change).not.toHaveBeenCalled()
    expect(input.value).toBe('blocked')
  })

  test('Escape closes an edited query without changing the committed value', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form>
        <Combobox items={items} name="fruit" defaultValue="apple" onValueChange={change}>
          <Parts />
        </Combobox>
      </form>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await type(input, 'plum')
    expect(input.value).toBe('plum')
    await press(input, 'ArrowDown')
    await press(input, 'Escape')
    expect(input.value).toBe('plum')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('apple')
    expect(change).not.toHaveBeenCalled()
  })

  spec('combobox.state.19', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit" required onValueChange={change}>
          <Parts />
        </Combobox>
        <button type="submit">Submit</button>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await press(input, 'ArrowDown')
    await press(input, 'Enter')
    expect(input.value).toBe('Apple')
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(change).toHaveBeenCalledExactlyOnceWith('apple')

    // Typing moves only the search draft; the committed selection stays submitted.
    await type(input, 'um')
    expect(input.value).toBe('um')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Plum'])
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(form.checkValidity()).toBe(true)
    expect(change).toHaveBeenCalledTimes(1)
  })

  spec('combobox.state.5', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    // An uppercase query matches a lowercase label and a substring, not a prefix.
    await type(input, 'ERR')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Cherry'])
    await type(input, 'um')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Plum'])
  })

  spec('combobox.keyboard.33', async () => {
    const view = mount(() => (
      <Combobox items={items} filter={false}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    expect(input).toHaveAttribute('aria-autocomplete', 'none')
    await type(input, 'zzz')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Apple',
      'Blocked',
      'Cherry',
      'Plum',
    ])
    expect(
      view.getAllByRole('option').some((option) => option.getAttribute('aria-selected') === 'true')
    ).toBe(false)
    expect(input.getAttribute('aria-activedescendant')).toBeNull()

    // Only an explicit arrow press highlights an option.
    await press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(
      view.getByRole('option', { name: 'Apple' }).id
    )
  })

  spec('combobox.keyboard.47', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(
      view.getByRole('option', { name: 'Apple' }).id
    )

    // The filtered-out highlight is cleared rather than moved to the first match.
    await type(input, 'cher')
    expect(input).not.toHaveAttribute('aria-activedescendant')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Cherry'])
    expect(change).not.toHaveBeenCalled()
  })

  spec('combobox.keyboard.18', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await type(input, 'nothing matches this')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(view.queryAllByRole('option')).toEqual([])

    // Enter with no highlighted option closes the popup and keeps the typed text.
    await press(input, 'Enter')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input.value).toBe('nothing matches this')
    expect(change).not.toHaveBeenCalled()
  })

  spec('combobox.keyboard.19', async () => {
    const change = vi.fn()
    const text = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox
          items={items}
          name="fruit"
          defaultValue="apple"
          onValueChange={change}
          onInputValueChange={text}
        >
          <Parts />
        </Combobox>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    expect(input.value).toBe('Apple')

    // Re-accepting the current selection restores its full text without reselecting.
    await type(input, 'App')
    await press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(
      view.getByRole('option', { name: 'Apple' }).id
    )
    await press(input, 'Enter')
    expect(view.queryByRole('listbox')).toBeNull()
    expect(input.value).toBe('Apple')
    expect(text).toHaveBeenLastCalledWith('Apple', { reason: 'selection' })
    expect(change).not.toHaveBeenCalled()
    expect(new FormData(form).get('fruit')).toBe('apple')
  })

  spec('combobox.pointer.6', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await press(input, 'ArrowDown')
    const cherry = view.getByRole('option', { name: 'Cherry' })
    fireEvent.pointerMove(cherry)
    flush()

    // Hovering moves virtual focus and never rewrites the input value.
    expect(input.getAttribute('aria-activedescendant')).toBe(cherry.id)
    expect(input.value).toBe('')
  })

  spec('combobox.pointer.24', async () => {
    const change = vi.fn()
    const clicks = vi.fn((event: MouseEvent) => event.preventDefault())
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Positioner>
          <Combobox.Content aria-label="Fruit">
            <Combobox.Item value="apple" onClick={clicks}>
              Apple
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement

    await press(input, 'ArrowDown')
    fireEvent.click(view.getByRole('option', { name: 'Apple' }))
    flush()

    // An author handler that cancels the click keeps the library from committing.
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(change).not.toHaveBeenCalled()
    expect(input.value).toBe('')
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  spec('combobox.pointer.3', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Trigger aria-label="Show fruit" />
        <Combobox.Positioner>
          <Combobox.Content aria-label="Fruit" />
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    const trigger = view.getByRole('button', { name: 'Show fruit' })

    fireEvent.click(trigger)
    flush()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(trigger)
    flush()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  /**
   * Kept unnamed by ID because every matching bullet is either a decision-needed
   * divergence (`combobox.pointer.23`, `combobox.pointer.36`) or requires
   * attributes this adapter does not emit (`combobox.roles.3`, `combobox.forms.6`).
   */
  test('read-only combobox keeps native readonly and never opens or commits', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <form onSubmit={(event) => event.preventDefault()}>
        <Combobox items={items} name="fruit" readonly onValueChange={change}>
          <Combobox.Input aria-label="Fruit" />
          <Combobox.Trigger aria-label="Show fruit" />
          <Combobox.Positioner>
            <Combobox.Content aria-label="Fruit" />
          </Combobox.Positioner>
        </Combobox>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    const trigger = view.getByRole('button', { name: 'Show fruit' })

    expect(input.readOnly).toBe(true)

    // Neither typing nor arrow navigation can open or edit a read-only control.
    await type(input, 'pl')
    expect(input.value).toBe('')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    await press(input, 'ArrowDown')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    flush()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(change).not.toHaveBeenCalled()
    expect(new FormData(form).get('fruit')).toBe('')
  })
})
