import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Combobox } from './index'
import { Field } from '../field'
afterEach(cleanup)
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Apricot', disabled: true },
  { value: 'c', label: 'Cherry' },
]
function press(el: HTMLElement, key: string, extra = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra })
  el.dispatchEvent(event)
  flush()
  return event
}
function type(el: HTMLInputElement, value: string, composing = false) {
  el.value = value
  el.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }))
  flush()
}
function Parts() {
  return (
    <>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Trigger />
      <Combobox.Positioner>
        <Combobox.Content />
      </Combobox.Positioner>
    </>
  )
}
describe('Combobox', () => {
  test('controlled text rejects browser mutation and controlled selection survives native reset', async () => {
    const text = vi.fn()
    const view = render(() => (
      <form>
        <Combobox
          items={items}
          value="c"
          inputValue="Cherry"
          onInputValueChange={text}
          name="fruit"
        >
          <Parts />
        </Combobox>
      </form>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ap')
    expect(text).toHaveBeenCalledExactlyOnceWith('ap')
    expect(input.value).toBe('Cherry')
    const form = view.container.querySelector('form')!
    const mirror = form.querySelector('select')!
    mirror.value = 'a'
    mirror.dispatchEvent(new Event('change', { bubbles: true }))
    flush()
    expect(mirror.value).toBe('c')
    form.reset()
    await Promise.resolve()
    flush()
    expect(new FormData(form).get('fruit')).toBe('c')
    expect(input.value).toBe('Cherry')
  })

  test('async labels fill an untouched input but do not overwrite an active search', () => {
    const [options, setOptions] = createSignal<typeof items>([])
    const view = render(() => (
      <Combobox items={options()} value="a">
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('')
    setOptions(items)
    flush()
    expect(input.value).toBe('Apple')
    type(input, 'cher')
    setOptions(items.map((item) => (item.value === 'a' ? { ...item, label: 'Green apple' } : item)))
    flush()
    expect(input.value).toBe('cher')
  })

  test('a late canceled native reset preserves query and selected form value', async () => {
    const view = render(() => (
      <form>
        <Combobox items={items} defaultValue="a" name="fruit">
          <Parts />
        </Combobox>
      </form>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ch')
    press(input, 'ArrowDown')
    press(input, 'Enter')
    const form = view.container.querySelector('form')!
    const cancel = (event: Event) => event.preventDefault()
    window.addEventListener('reset', cancel, { once: true })
    form.reset()
    await Promise.resolve()
    flush()
    expect(input.value).toBe('Cherry')
    expect(new FormData(form).get('fruit')).toBe('c')
  })

  test('typing filters without committing; arrows and Enter retain input focus', async () => {
    const change = vi.fn()
    const view = render(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    input.focus()
    type(input, 'ap')
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect((await view.findAllByRole('option')).map((el) => el.textContent)).toEqual([
      'Apple',
      'Apricot',
    ])
    expect(change).not.toHaveBeenCalled()
    press(input, 'ArrowDown')
    expect(input).toHaveFocus()
    expect(document.getElementById(input.getAttribute('aria-activedescendant')!)).toHaveTextContent(
      'Apple'
    )
    press(input, 'Enter')
    expect(input.value).toBe('Apple')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(change).toHaveBeenCalledExactlyOnceWith('a')
  })
  test('composition never selects; completing composition opens suggestions', () => {
    const change = vi.fn()
    const view = render(() => (
      <Combobox items={items} onValueChange={change}>
        <Parts />
      </Combobox>
    ))
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'ap', true)
    press(input, 'ArrowDown', { isComposing: true })
    press(input, 'Enter', { isComposing: true })
    expect(input).toHaveAttribute('aria-expanded', 'false')
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }))
    flush()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(change).not.toHaveBeenCalled()
  })
  test('default query is preserved and controlled value updates synchronize its label', () => {
    const [value, setValue] = createSignal<string | undefined>()
    const view = render(() => (
      <Combobox items={items} value={value()} defaultInputValue="ap">
        <Parts />
      </Combobox>
    ))
    flush()
    const input = view.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('ap')
    setValue('c')
    flush()
    expect(input.value).toBe('Cherry')
  })
  test('native submission uses committed values, required ignores query, and reset is silent', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <Combobox items={items} name="fruit" required onValueChange={change}>
          <Parts />
        </Combobox>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const input = view.getByRole('combobox') as HTMLInputElement
    type(input, 'not selected')
    expect(form.checkValidity()).toBe(false)
    expect(input).toHaveFocus()
    type(input, 'ch')
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(new FormData(form).get('fruit')).toBe('c')
    type(input, '')
    expect(form.checkValidity()).toBe(true)
    form.reset()
    await Promise.resolve()
    flush()
    expect(input.value).toBe('')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('Field names and descriptions reach the input and group flags prevent opening', () => {
    const view = render(() => (
      <Field disabled required invalid>
        <Field.Label>Fruit</Field.Label>
        <Field.Description>Pick one</Field.Description>
        <Field.Error>Required</Field.Error>
        <Combobox items={items}>
          <Combobox.Input />
          <Combobox.Positioner>
            <Combobox.Content />
          </Combobox.Positioner>
        </Combobox>
      </Field>
    ))
    flush()
    const input = view.getByRole('combobox', { name: 'Fruit' })
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const descriptions = input
      .getAttribute('aria-describedby')!
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
    expect(descriptions).toEqual(['Pick one', 'Required'])
    press(input, 'ArrowDown')
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
  test('author cancellation suppresses opening and custom option IDs resolve active descendants', () => {
    const view = render(() => (
      <Combobox items={items}>
        <Combobox.Input
          aria-label="Fruit"
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp') event.preventDefault()
          }}
        />
        <Combobox.Positioner>
          <Combobox.Content id="custom-list">
            <Combobox.Item value="a" id="custom-apple">
              Apple
            </Combobox.Item>
          </Combobox.Content>
        </Combobox.Positioner>
      </Combobox>
    ))
    const input = view.getByRole('combobox')
    press(input, 'ArrowUp')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    press(input, 'ArrowDown')
    expect(input).toHaveAttribute('aria-controls', 'custom-list')
    expect(input).toHaveAttribute('aria-activedescendant', 'custom-apple')
    expect(press(input, 'Tab').defaultPrevented).toBe(false)
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })
})
