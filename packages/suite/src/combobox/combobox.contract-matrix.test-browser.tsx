import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
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
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
function Parts() {
  return (
    <>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Trigger aria-label="Show fruit" />
      <Combobox.Positioner>
        <Combobox.Content aria-label="Suggestions" />
        <Combobox.Empty>No matching fruit</Combobox.Empty>
      </Combobox.Positioner>
    </>
  )
}
async function query(input: HTMLInputElement, value: string) {
  input.value = value
  fireEvent.input(input)
  await settle()
}

test('combobox.notes.24: internally filtered Empty status keeps its host while queries hide and reveal it', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Combobox items={items} defaultOpen onValueChange={change}>
      <Parts />
    </Combobox>
  ))
  await settle()
  const input = view.getByRole('combobox') as HTMLInputElement
  const status = view.getByRole('status', { hidden: true })
  expect(status).toHaveAttribute('hidden')
  await query(input, 'zzzzz')
  expect(view.getByRole('status')).toBe(status)
  expect(status).toHaveTextContent('No matching fruit')
  expect(view.queryAllByRole('option')).toHaveLength(0)
  await query(input, 'p')
  expect(view.getByRole('status', { hidden: true })).toBe(status)
  expect(status).toHaveAttribute('hidden')
  expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Apple', 'Pear'])
  expect(change).not.toHaveBeenCalled()
})

test('combobox.focus.10: clearing a query restores the committed option without stealing input focus', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Combobox items={items} defaultValue="apple" defaultOpen onValueChange={change}>
      <Parts />
    </Combobox>
  ))
  await settle()
  const input = view.getByRole('combobox') as HTMLInputElement
  input.focus()
  await query(input, 'Pear')
  expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Pear'])
  await query(input, '')
  expect(input).toHaveFocus()
  expect(view.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  expect(view.getByRole('option', { name: 'Pear' })).toHaveAttribute('aria-selected', 'false')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.state.22: controlled value preserves edited query until an external committed value changes', async () => {
  const [value, setValue] = createSignal('apple')
  const change = vi.fn()
  const text = vi.fn()
  const view = mount(() => (
    <form>
      <Combobox
        items={items}
        value={value()}
        name="fruit"
        onValueChange={change}
        onInputValueChange={text}
      >
        <Parts />
      </Combobox>
    </form>
  ))
  const input = view.getByRole('combobox') as HTMLInputElement
  await query(input, 'draft')
  expect(input).toHaveValue('draft')
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('apple')
  setValue('pear')
  await settle()
  expect(input).toHaveValue('Pear')
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('pear')
  expect(change).not.toHaveBeenCalled()
  expect(text.mock.calls).toEqual([['draft']])
})

test('combobox.state.22: controlled query keeps owner text while an uncontrolled commit updates submission', async () => {
  const change = vi.fn()
  const text = vi.fn()
  const view = mount(() => (
    <form>
      <Combobox
        items={items}
        inputValue=""
        name="fruit"
        defaultOpen
        onValueChange={change}
        onInputValueChange={text}
      >
        <Parts />
      </Combobox>
    </form>
  ))
  await settle()
  await userEvent.click(view.getByRole('option', { name: 'Pear' }))
  await settle()
  expect(view.getByRole('combobox')).toHaveValue('')
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('pear')
  expect(change.mock.calls).toEqual([['pear']])
  expect(text.mock.calls).toEqual([['Pear']])
})

test('combobox.roles.31: separately named trigger is skipped by native Tab traversal', async () => {
  const view = mount(() => (
    <>
      <button type="button">Before</button>
      <Combobox items={items}>
        <Parts />
      </Combobox>
      <button type="button">After</button>
    </>
  ))
  const input = view.getByRole('combobox', { name: 'Fruit' })
  const trigger = view.getByRole('button', { name: 'Show fruit' })
  expect(trigger).toHaveAttribute('tabindex', '-1')
  view.getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  expect(input).toHaveFocus()
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'After' })).toHaveFocus()
  expect(input).toHaveAttribute('aria-expanded', 'false')
})
