import { Combobox } from '@xenon-ui/solid/combobox'
import type { ComboboxProps } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
]

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

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/**
 * A search-and-pick list held open with no Positioner or Content. The owner filters
 * the rows, treats the field as a search box, and confirms the selection on Enter.
 */
function Picker(
  props: Partial<ComboboxProps> & {
    rows?: typeof fruit
    onConfirm?: (value: string | undefined) => void
  }
) {
  const rows = () => props.rows ?? fruit
  const [query, setQuery] = createSignal('')
  const [value, setValue] = createSignal<string | undefined>('apple')
  let chosen: string | undefined = 'apple'
  const shown = () =>
    rows().filter((row) => row.label.toLowerCase().includes(query().toLowerCase()))
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
        aria-label="Search fruit"
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || !props.onConfirm) return
          event.preventDefault()
          props.onConfirm(chosen)
        }}
      />
      <Combobox.Viewport
        id="pick-listbox"
        role="listbox"
        aria-label="Fruit"
        style={{ height: '96px', overflow: 'auto' }}
      >
        <For each={shown()}>
          {(row) => (
            <Combobox.Item value={row.value} style={{ height: '32px' }}>
              {row.label}
            </Combobox.Item>
          )}
        </For>
      </Combobox.Viewport>
    </Combobox>
  )
}

const selected = (m: ReturnType<typeof mount>) =>
  m
    .getAllByRole('option')
    .filter((option) => option.getAttribute('aria-selected') === 'true')
    .map((option) => option.textContent)

test('combobox.keyboard.76: with automatic activation the arrow keys select the row they reach and skip disabled rows', async () => {
  const change = vi.fn()
  const text = vi.fn()
  const m = mount(() => <Picker onValueChange={change} onInputValueChange={text} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(change.mock.calls).toEqual([['cherry']])
  expect(selected(m)).toEqual(['Cherry'])
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Cherry' }).id
  )
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  await settle()
  // Date, then around the end to Apple; disabled Apricot is never selected.
  expect(change.mock.calls).toEqual([['cherry'], ['date'], ['apple']])
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(selected(m)).toEqual(['Date'])
  expect(input).toHaveFocus()
  expect(input).toHaveValue('')
  expect(text).not.toHaveBeenCalled()
  expect(input).toHaveAttribute('aria-expanded', 'true')
})

test('combobox.keyboard.76: manual activation, the default, only highlights on arrow keys', async () => {
  const change = vi.fn()
  const m = mount(() => <Picker activationMode={undefined} onValueChange={change} />)
  await userEvent.click(m.getByRole('combobox'))
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  await settle()
  expect(m.getByRole('option', { name: 'Cherry' })).toHaveAttribute('data-highlighted')
  expect(change).not.toHaveBeenCalled()
  expect(selected(m)).toEqual(['Apple'])
})

test('combobox.keyboard.77: automatic navigation starts from the selection, or from an edge when it is filtered out', async () => {
  const change = vi.fn()
  const m = mount(() => <Picker onValueChange={change} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  // Up from Apple wraps to Date: the start was the selected row, not the list's end.
  expect(change.mock.calls).toEqual([['date']])
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(change.mock.calls).toEqual([['date'], ['cherry']])
  await userEvent.fill(input, 'a')
  await settle()
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Apple',
    'Apricot',
    'Date',
  ])
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(change.mock.calls.at(-1)).toEqual(['apple'])
})

test('combobox.keyboard.78: a fast ArrowDown then Enter confirms the row ArrowDown reached', async () => {
  const confirm = vi.fn()
  const m = mount(() => <Picker onConfirm={confirm} />)
  await userEvent.click(m.getByRole('combobox'))
  await userEvent.keyboard('{ArrowDown}{Enter}')
  expect(confirm.mock.calls).toEqual([['cherry']])
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
  expect(confirm.mock.calls).toEqual([['cherry'], ['apple']])
  await settle()
  expect(selected(m)).toEqual(['Apple'])
})

test('combobox.keyboard.79: an inline list scrolls the highlighted option into view', async () => {
  const rows = Array.from({ length: 30 }, (_, index) => ({
    value: `row-${index}`,
    label: `Row ${index}`,
  }))
  const m = mount(() => <Picker rows={rows} value="row-0" />)
  const viewport = m.getByRole('listbox')
  const visible = (option: HTMLElement) => {
    const box = viewport.getBoundingClientRect()
    const rect = option.getBoundingClientRect()
    return rect.top >= box.top - 1 && rect.bottom <= box.bottom + 1
  }
  await userEvent.click(m.getByRole('combobox'))
  expect(viewport.scrollTop).toBe(0)
  for (let step = 0; step < 6; step++) await userEvent.keyboard('{ArrowDown}')
  await settle()
  const sixth = m.getByRole('option', { name: 'Row 6' })
  expect(sixth).toHaveAttribute('data-highlighted')
  expect(viewport.scrollTop).toBeGreaterThan(0)
  expect(visible(sixth)).toBe(true)
  // Up past the first row wraps to the last, far below the fold.
  for (let step = 0; step < 7; step++) await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(visible(m.getByRole('option', { name: 'Row 29' }))).toBe(true)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(viewport.scrollTop).toBe(0)
})

test('combobox.pointer.37: hover highlights without selecting under automatic activation; a click selects', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const text = vi.fn()
  const m = mount(() => (
    <Picker onValueChange={change} onActiveChange={active} onInputValueChange={text} />
  ))
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.hover(m.getByRole('option', { name: 'Date' }))
  await settle()
  expect(m.getByRole('option', { name: 'Date' })).toHaveAttribute('data-highlighted')
  expect(active).toHaveBeenLastCalledWith('date', { reason: 'pointer' })
  expect(change).not.toHaveBeenCalled()
  expect(selected(m)).toEqual(['Apple'])
  await userEvent.hover(m.getByRole('option', { name: 'Apricot' }))
  await settle()
  expect(active).toHaveBeenCalledTimes(1)
  await userEvent.click(m.getByRole('option', { name: 'Cherry' }))
  await settle()
  expect(change.mock.calls).toEqual([['cherry']])
  expect(selected(m)).toEqual(['Cherry'])
  // The click offered Cherry's label for the field; the owner kept the search text.
  expect(text.mock.calls).toEqual([['Cherry', { reason: 'selection' }]])
  expect(input).toHaveValue('')
  expect(input).toHaveFocus()
})

test('combobox.state.48: onActiveChange reports the highlight with keyboard, pointer and reset reasons', async () => {
  const active = vi.fn()
  const m = mount(() => <Picker onActiveChange={active} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.hover(m.getByRole('option', { name: 'Date' }))
  await userEvent.keyboard('{Home}')
  await settle()
  expect(active.mock.calls).toEqual([
    ['cherry', { reason: 'keyboard' }],
    ['date', { reason: 'pointer' }],
    [undefined, { reason: 'reset' }],
  ])
  active.mockClear()
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('x')
  await settle()
  expect(active.mock.calls).toEqual([
    ['date', { reason: 'keyboard' }],
    [undefined, { reason: 'reset' }],
  ])
})

test('combobox.state.49: onInputValueChange tells typed and composed text from a label written by a selection', async () => {
  const text = vi.fn()
  const change = vi.fn()
  const m = mount(() => <Picker onInputValueChange={text} onValueChange={change} />)
  const input = m.getByRole('combobox') as HTMLInputElement
  await userEvent.click(input)
  await userEvent.keyboard('d')
  await settle()
  expect(text.mock.calls).toEqual([['d', { reason: 'input' }]])
  // An IME draft publishes nothing until it is committed, and its arrows select nothing.
  text.mockClear()
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  input.value = 'da'
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertCompositionText',
      isComposing: true,
    })
  )
  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
      isComposing: true,
    })
  )
  await settle()
  expect(text).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(input).toHaveValue('da')
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'da' }))
  await settle()
  expect(text.mock.calls).toEqual([['da', { reason: 'input' }]])
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual(['Date'])
  text.mockClear()
  await userEvent.click(m.getByRole('option', { name: 'Date' }))
  await settle()
  expect(text.mock.calls).toEqual([['Date', { reason: 'selection' }]])
  expect(input).toHaveValue('da')
})

test('combobox.state.50: a selection filtered out of the list stays selected under automatic activation', async () => {
  const change = vi.fn()
  const m = mount(() => <Picker onValueChange={change} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(selected(m)).toEqual(['Cherry'])
  change.mockClear()
  await userEvent.keyboard('da')
  await settle()
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual(['Date'])
  expect(selected(m)).toEqual([])
  expect(change).not.toHaveBeenCalled()
  await userEvent.clear(input)
  await settle()
  expect(selected(m)).toEqual(['Cherry'])
  expect(change).not.toHaveBeenCalled()
})
