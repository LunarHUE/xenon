import { Combobox } from '@xenon-ui/solid/combobox'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { spec } from '../spec'

/**
 * Browser-native boundaries for the editable combobox: synthetic composition
 * events, author cancellation of opening and option selection, and pointer
 * presses landing on a custom option's descendant markup.
 *
 * These cases run only in the browser project. The composition events below are
 * constructor-built synthetic ones, not a real OS input method: the engines this
 * suite runs on expose no portable API for driving native IME state. They verify
 * the component's synthetic composition-event handlers, nothing about IME.
 */

/**
 * Minimal collection. The default filter is a case-insensitive substring match,
 * so `app` matches only Apple and a first ArrowUp reaches Cherry.
 */
const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'cherry', label: 'Cherry' },
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

/** Dispatches the synthetic composition-start/end boundary event a real IME would emit. */
function compose(target: EventTarget, type: 'compositionstart' | 'compositionend') {
  target.dispatchEvent(new CompositionEvent(type, { bubbles: true }))
}

/** Writes the composed text and dispatches the synthetic `isComposing` input event that follows. */
function composeInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      isComposing: true,
      inputType: 'insertCompositionText',
      data: value,
    })
  )
}

/** Dispatches a synthetic composing keydown and reports whether its default action survived. */
function composingKeydown(input: HTMLInputElement, key: string) {
  return input.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, isComposing: true })
  )
}

describe('combobox native composition, cancellation, and custom item descendants', () => {
  test('synthetic composition keeps an unopened popup shut until compositionend', async () => {
    const view = mount(() => (
      <Combobox items={items}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await userEvent.click(input)

    // Composed text is already displayed, but composing must not open the popup.
    compose(input, 'compositionstart')
    composeInput(input, 'app')
    await settle()
    expect(input).toHaveValue('app')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryByRole('listbox')).toBeNull()

    // A composing arrow key is editing, never list navigation.
    expect(composingKeydown(input, 'ArrowDown')).toBe(true)
    await settle()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input.getAttribute('aria-activedescendant')).toBeNull()

    // Only compositionend opens the popup, filtered by the composed text.
    compose(input, 'compositionend')
    await settle()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Apple'])
  })

  test('synthetic composing keydowns leave an open popup without highlight or commit', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await userEvent.click(input)
    await userEvent.keyboard('app')
    await settle()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    const apple = view.getByRole('option', { name: 'Apple' })

    compose(input, 'compositionstart')

    // Enter and ArrowDown during composition reach the browser, not the engine.
    expect(composingKeydown(input, 'ArrowDown')).toBe(true)
    await settle()
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(composingKeydown(input, 'Enter')).toBe(true)
    await settle()
    expect(change).not.toHaveBeenCalled()
    expect(input).toHaveValue('app')
    expect(input).toHaveAttribute('aria-expanded', 'true')

    // Once composition ends the same arrow key navigates normally.
    compose(input, 'compositionend')
    await settle()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(input.getAttribute('aria-activedescendant')).toBe(apple.id)
  })

  test('an author-canceled ArrowDown leaves the popup closed while an uncanceled ArrowUp opens it', async () => {
    const opened = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onOpenChange={opened}>
        <Combobox.Input
          aria-label="Fruit"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') event.preventDefault()
          }}
        />
        <Combobox.Positioner>
          <Combobox.Content aria-label="Fruit" />
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await userEvent.click(input)

    // The author's cancellation survives, so the engine leaves that key alone.
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryByRole('listbox')).toBeNull()
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    expect(opened).not.toHaveBeenCalled()

    // An uncanceled key still drives the popup, so cancellation is per event.
    await userEvent.keyboard('{ArrowUp}')
    await settle()
    expect(input).toHaveFocus()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(opened).toHaveBeenCalledExactlyOnceWith(true)
    expect(input.getAttribute('aria-activedescendant')).toBe(
      view.getByRole('option', { name: 'Cherry' }).id
    )
  })

  test('an author-canceled option click keeps the query, the popup, and input focus', async () => {
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
    await userEvent.click(input)
    await userEvent.keyboard('app')
    await settle()
    const apple = view.getByRole('option', { name: 'Apple' })

    await userEvent.click(apple)
    await settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(change).not.toHaveBeenCalled()
    expect(input).toHaveValue('app')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(input).toHaveFocus()
    expect(apple).toHaveAttribute('aria-selected', 'false')
    expect(view.getByRole('option', { name: 'Apple' })).toBe(apple)
  })

  spec('combobox.focus.8', async () => {
    const change = vi.fn()
    const view = mount(() => (
      <Combobox items={items} onValueChange={change}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Positioner>
          <Combobox.Content aria-label="Fruit">
            <Combobox.Item value="apple">
              <span>Apple</span>
            </Combobox.Item>
            <Combobox.Item value="cherry">
              <span>Cherry</span>
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    const apple = view.getByRole('option', { name: 'Apple' })
    // The option is a focusable area, so an uncanceled press on its content would take focus.
    expect(apple).toHaveAttribute('tabindex', '-1')
    const label = within(apple).getByText('Apple')

    // Pressing the custom descendant's interior keeps DOM focus on the input and commits.
    await userEvent.click(label)
    await settle()
    expect(input).toHaveFocus()
    expect(change).toHaveBeenCalledExactlyOnceWith('apple')
    expect(input).toHaveValue('Apple')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})
