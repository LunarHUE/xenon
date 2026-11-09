import { cleanup, render } from '@solidjs/testing-library'
import { For, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Combobox } from './index'
import type { ComboboxProps } from './index'

const rows = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Apricot', disabled: true },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
]
const scrolled = vi.fn()
beforeEach(() => {
  // jsdom has no layout; record which option asks to be scrolled into view.
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled(this.textContent)
  }
})
afterEach(() => {
  cleanup()
  scrolled.mockClear()
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView
})

function press(el: HTMLElement, key: string, extra = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })
  el.dispatchEvent(event)
  return event
}
function type(el: HTMLInputElement, value: string, composing = false) {
  el.value = value
  el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }))
  flush()
}

/**
 * A search-and-pick list held open with no Positioner or Content: the field is a
 * search box the owner filters by, and the arrow keys select.
 */
function Picker(props: Partial<ComboboxProps> & { onEnter?: (value: string | undefined) => void }) {
  const [query, setQuery] = createSignal('')
  const [value, setValue] = createSignal<string | undefined>('a')
  // The latest request, readable before Solid flushes the signal.
  let chosen: string | undefined = 'a'
  const shown = () => rows.filter((row) => row.label.toLowerCase().includes(query().toLowerCase()))
  return (
    <Combobox
      id="pick"
      open
      items={shown()}
      filter={false}
      activationMode="automatic"
      value={value()}
      inputValue={query()}
      {...props}
      onValueChange={(next) => {
        chosen = next
        setValue(next)
        props.onValueChange?.(next)
      }}
      onInputValueChange={(next, details) => {
        if (details.reason === 'input') setQuery(next)
        props.onInputValueChange?.(next, details)
      }}
    >
      <Combobox.Input
        aria-label="Search"
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !props.onEnter) return
          event.preventDefault()
          props.onEnter(chosen)
        }}
      />
      <Combobox.Viewport id="pick-listbox" role="listbox" aria-label="Fruit">
        <For each={shown()}>
          {(row) => <Combobox.Item value={row.value}>{row.label}</Combobox.Item>}
        </For>
      </Combobox.Viewport>
    </Combobox>
  )
}
const selected = (view: ReturnType<typeof render>) =>
  view
    .getAllByRole('option')
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map((option) => option.textContent)

describe('Combobox inline list with automatic activation', () => {
  test('arrow keys select the row they reach, skip disabled rows and scroll it into view', () => {
    const change = vi.fn(),
      active = vi.fn(),
      text = vi.fn()
    const view = render(() => (
      <Picker onValueChange={change} onActiveChange={active} onInputValueChange={text} />
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(selected(view)).toEqual(['Apple'])
    press(input, 'ArrowDown')
    flush()
    // From the selected Apple, past disabled Apricot, to Cherry.
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    expect(active).toHaveBeenCalledExactlyOnceWith('c', { reason: 'keyboard' })
    expect(selected(view)).toEqual(['Cherry'])
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      view.getByRole('option', { name: 'Cherry' }).id
    )
    expect(view.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-highlighted')
    expect(scrolled).toHaveBeenLastCalledWith('Cherry')
    press(input, 'ArrowUp')
    flush()
    expect(change).toHaveBeenLastCalledWith('a')
    expect(selected(view)).toEqual(['Apple'])
    expect(scrolled).toHaveBeenLastCalledWith('Apple')
    // The field is a search box: selecting never wrote it.
    expect(text).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })
  test('a fast ArrowDown then Enter acts on the row ArrowDown reached', () => {
    const enter = vi.fn()
    const view = render(() => <Picker onEnter={enter} />)
    const input = view.getByRole('combobox') as HTMLInputElement
    // No flush between the two keys: the request is synchronous with the keydown.
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(enter).toHaveBeenCalledExactlyOnceWith('c')
    flush()
    expect(selected(view)).toEqual(['Cherry'])
  })
  test('hover highlights and reports the pointer without selecting; a click selects', () => {
    const change = vi.fn(),
      active = vi.fn(),
      text = vi.fn()
    const view = render(() => (
      <Picker onValueChange={change} onActiveChange={active} onInputValueChange={text} />
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    const date = view.getByRole('option', { name: 'Date' })
    date.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }))
    flush()
    expect(active).toHaveBeenCalledExactlyOnceWith('d', { reason: 'pointer' })
    expect(date).toHaveAttribute('data-highlighted')
    expect(change).not.toHaveBeenCalled()
    expect(selected(view)).toEqual(['Apple'])
    // The keyboard carries on from the hovered row.
    press(input, 'ArrowUp')
    flush()
    expect(active).toHaveBeenLastCalledWith('c', { reason: 'keyboard' })
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    date.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    flush()
    expect(change).toHaveBeenLastCalledWith('d')
    expect(selected(view)).toEqual(['Date'])
    // The click asks to write the label and says so; the owner declined.
    expect(text).toHaveBeenCalledExactlyOnceWith('Date', { reason: 'selection' })
    expect(input.value).toBe('')
    expect(active).toHaveBeenLastCalledWith(undefined, { reason: 'reset' })
  })
  test('typing reports input, clears the highlight once and keeps a filtered-out selection', () => {
    const change = vi.fn(),
      active = vi.fn(),
      text = vi.fn()
    const view = render(() => (
      <Picker onValueChange={change} onActiveChange={active} onInputValueChange={text} />
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    press(input, 'ArrowDown')
    flush()
    change.mockClear()
    active.mockClear()
    type(input, 'da')
    expect(text).toHaveBeenLastCalledWith('da', { reason: 'input' })
    expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Date'])
    // Cherry is gone from the list and still the value.
    expect(change).not.toHaveBeenCalled()
    expect(selected(view)).toEqual([])
    type(input, '')
    expect(selected(view)).toEqual(['Cherry'])
    // With the selection out of the list, navigation starts at the first row.
    type(input, 'da')
    press(input, 'ArrowDown')
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith('d')
  })
  test('composition publishes once at the end and composing arrows select nothing', () => {
    const change = vi.fn(),
      text = vi.fn()
    const view = render(() => <Picker onValueChange={change} onInputValueChange={text} />)
    const input = view.getByRole('combobox') as HTMLInputElement
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    type(input, 'ch', true)
    press(input, 'ArrowDown', { isComposing: true })
    flush()
    expect(text).not.toHaveBeenCalled()
    expect(change).not.toHaveBeenCalled()
    expect(input.value).toBe('ch')
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ch' }))
    flush()
    expect(text).toHaveBeenCalledExactlyOnceWith('ch', { reason: 'input' })
    expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Cherry'])
    expect(selected(view)).toEqual([])
  })
  test('Escape and Tab report one reset each time the highlight clears', () => {
    const active = vi.fn()
    const view = render(() => <Picker onActiveChange={active} />)
    const input = view.getByRole('combobox') as HTMLInputElement
    for (const key of ['Escape', 'Tab', 'Home']) {
      press(input, 'ArrowDown')
      flush()
      active.mockClear()
      press(input, key)
      flush()
      expect(active).toHaveBeenCalledExactlyOnceWith(undefined, { reason: 'reset' })
      expect(input).not.toHaveAttribute('aria-activedescendant')
    }
  })
  test('an uncontrolled field keeps its text while the arrow keys select', () => {
    const view = render(() => (
      <Combobox items={rows} open filter={false} activationMode="automatic" defaultValue="a">
        <Combobox.Input aria-label="Search" />
        <Combobox.Viewport role="listbox">
          <For each={rows}>
            {(row) => <Combobox.Item value={row.value}>{row.label}</Combobox.Item>}
          </For>
        </Combobox.Viewport>
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('Apple')
    type(input, '')
    press(input, 'ArrowDown')
    flush()
    expect(selected(view)).toEqual(['Cherry'])
    expect(input.value).toBe('')
  })
})

describe('Combobox with default manual activation', () => {
  test('arrow keys in an inline list highlight, scroll and report without selecting', () => {
    const change = vi.fn(),
      active = vi.fn()
    const view = render(() => (
      <Picker activationMode={undefined} onValueChange={change} onActiveChange={active} />
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    press(input, 'ArrowDown')
    flush()
    // Manual navigation starts at the first row, not at the selection.
    expect(active).toHaveBeenCalledExactlyOnceWith('a', { reason: 'keyboard' })
    expect(scrolled).toHaveBeenLastCalledWith('Apple')
    press(input, 'ArrowDown')
    flush()
    expect(active).toHaveBeenLastCalledWith('c', { reason: 'keyboard' })
    expect(change).not.toHaveBeenCalled()
    expect(selected(view)).toEqual(['Apple'])
  })
})
