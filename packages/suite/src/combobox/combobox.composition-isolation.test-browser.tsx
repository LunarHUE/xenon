import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
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
      <Combobox.Positioner>
        <Combobox.Content aria-label="Suggestions" />
      </Combobox.Positioner>
    </>
  )
}

test('combobox.rtl.1: an already open popup isolates composing drafts from filtering and committed form values until compositionend', async () => {
  const text = vi.fn()
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <Combobox
        items={items}
        dir="rtl"
        defaultOpen
        defaultValue="apple"
        onInputValueChange={text}
        onValueChange={change}
        name="fruit"
      >
        <Parts />
      </Combobox>
    </form>
  ))
  await settle()
  const input = view.getByRole('combobox') as HTMLInputElement
  input.focus()
  const before = view.getAllByRole('option')
  const form = view.container.querySelector('form')!
  input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  input.value = 'Pear'
  input.dispatchEvent(
    new InputEvent('input', {
      bubbles: true,
      inputType: 'insertCompositionText',
      data: 'Pear',
      isComposing: true,
    })
  )
  await settle()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('Pear')
  expect(view.getAllByRole('option')).toEqual(before)
  expect(new FormData(form).get('fruit')).toBe('apple')
  expect(text).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'Pear' }))
  await settle()
  expect(view.getAllByRole('option').map((option) => option.textContent)).toEqual(['Pear'])
  expect(text.mock.calls).toEqual([['Pear']])
  expect(change).not.toHaveBeenCalled()
  expect(new FormData(form).get('fruit')).toBe('apple')
})

test('combobox.state.21: rejected controlled query and commitment retain owner text, selection and form value through blur', async () => {
  const text = vi.fn()
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <Combobox
        items={items}
        inputValue=""
        value="apple"
        defaultOpen
        name="fruit"
        onInputValueChange={text}
        onValueChange={change}
      >
        <Parts />
      </Combobox>
      <button type="button">Outside</button>
    </form>
  ))
  await settle()
  const input = view.getByRole('combobox') as HTMLInputElement
  await userEvent.fill(input, 'draft')
  await settle()
  expect(input).toHaveValue('')
  expect(text.mock.calls).toEqual([['draft']])
  expect(view.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(view.getByRole('option', { name: 'Pear' }))
  await settle()
  expect(input).toHaveValue('')
  expect(change.mock.calls).toEqual([['pear']])
  expect(text.mock.calls).toEqual([['draft'], ['Pear']])
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('apple')
  await userEvent.click(view.getByRole('button', { name: 'Outside' }))
  await settle()
  expect(input).toHaveValue('')
  expect(change.mock.calls).toEqual([['pear']])
  expect(text.mock.calls).toEqual([['draft'], ['Pear']])
})
