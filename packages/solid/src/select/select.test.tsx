import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Select } from './index'
import { Field } from '../field'
afterEach(cleanup)
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
]
function press(el: HTMLElement, key: string) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}
function Parts() {
  return (
    <>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Content>
          <Select.Item value="a" />
          <Select.Item value="b" />
          <Select.Item value="c" />
        </Select.Content>
      </Select.Positioner>
    </>
  )
}
describe('Select', () => {
  test('closed metadata display and typeahead work before mounting popup', () => {
    const change = vi.fn()
    const view = render(() => (
      <Select items={items} onValueChange={change}>
        <Parts />
      </Select>
    ))
    const trigger = view.getByRole('combobox')
    expect(trigger.textContent).toBe('Pick')
    expect(change).not.toHaveBeenCalled()
    press(trigger, 'c')
    expect(trigger.textContent).toBe('Cherry')
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
  test('navigation retains trigger focus and Escape cancels the pending value', () => {
    const change = vi.fn()
    const view = render(() => (
      <Select items={items} defaultValue="a" onValueChange={change}>
        <Parts />
      </Select>
    ))
    const trigger = view.getByRole('combobox')
    trigger.focus()
    press(trigger, 'ArrowDown')
    press(trigger, 'ArrowDown')
    expect(trigger).toHaveFocus()
    expect(trigger.getAttribute('aria-activedescendant')).toContain('option-c')
    press(trigger, 'Escape')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.textContent).toBe('Apple')
    expect(change).not.toHaveBeenCalled()
    press(trigger, 'ArrowDown')
    press(trigger, 'ArrowDown')
    press(trigger, 'Enter')
    expect(trigger.textContent).toBe('Cherry')
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
  })
  test('Tab closes without preventing default and author handlers can cancel opening', () => {
    const view = render(() => (
      <Select items={items}>
        <Select.Trigger
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
        >
          Fruit
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content>
            <Select.Item value="a" />
          </Select.Content>
        </Select.Positioner>
      </Select>
    ))
    const trigger = view.getByRole('combobox')
    press(trigger, 'Enter')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    press(trigger, 'ArrowDown')
    expect(press(trigger, 'Tab').defaultPrevented).toBe(false)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
  test('native form value, reset, required focus forwarding, and Field descriptions', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <Field required name="fruit">
          <Field.Label>Fruit</Field.Label>
          <Select items={items} onValueChange={change}>
            <Parts />
          </Select>
          <Field.Description>Choose fruit</Field.Description>
        </Field>
      </form>
    ))
    const trigger = view.getByRole('combobox')
    const form = view.container.querySelector('form')!
    expect(trigger).toHaveAttribute('aria-required', 'true')
    expect(trigger).toHaveAttribute('aria-describedby', view.getByText('Choose fruit').id)
    expect(form.checkValidity()).toBe(false)
    expect(trigger).toHaveFocus()
    press(trigger, 'c')
    expect(new FormData(form).get('fruit')).toBe('c')
    form.reset()
    await Promise.resolve()
    flush()
    expect(trigger.textContent).toBe('Pick')
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('controlled requests wait for props and readonly ignores interaction', () => {
    const change = vi.fn()
    let setValue!: (value: string) => void
    const view = render(() => {
      const [value, set] = createSignal('a')
      setValue = set
      return (
        <Select items={items} value={value()} onValueChange={change}>
          <Parts />
        </Select>
      )
    })
    const trigger = view.getByRole('combobox')
    press(trigger, 'c')
    expect(change).toHaveBeenCalledWith('c')
    expect(trigger.textContent).toBe('Apple')
    setValue('c')
    flush()
    expect(trigger.textContent).toBe('Cherry')
  })
  test('custom popup and option IDs resolve while open, and pointer selection respects disabled metadata', () => {
    const change = vi.fn()
    const view = render(() => (
      <Select items={items} onValueChange={change}>
        <Select.Trigger>Fruit</Select.Trigger>
        <Select.Positioner>
          <Select.Content id="fruits">
            <Select.Item id="apple-option" value="a">
              Apple option
            </Select.Item>
            <Select.Item value="b">Banana option</Select.Item>
            <Select.Item value="c">Cherry option</Select.Item>
          </Select.Content>
        </Select.Positioner>
      </Select>
    ))
    const trigger = view.getByRole('combobox')
    press(trigger, 'ArrowDown')
    expect(trigger).toHaveAttribute('aria-controls', 'fruits')
    expect(trigger).toHaveAttribute('aria-activedescendant', 'apple-option')
    view.getByText('Banana option').click()
    flush()
    expect(change).not.toHaveBeenCalled()
    view.getByText('Cherry option').click()
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith('c')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
  test('readonly and disabled controls cannot open or typeahead, and disabled forms omit their value', () => {
    const view = render(() => (
      <form>
        <Select items={items} readonly name="readonly" defaultValue="a">
          <Select.Trigger>Readonly fruit</Select.Trigger>
        </Select>
        <Select items={items} disabled name="disabled" defaultValue="a">
          <Select.Trigger>Disabled fruit</Select.Trigger>
        </Select>
      </form>
    ))
    const controls = view.getAllByRole('combobox')
    for (const control of controls) {
      press(control, 'ArrowDown')
      press(control, 'c')
      expect(control).toHaveAttribute('aria-expanded', 'false')
    }
    const data = new FormData(view.container.querySelector('form')!)
    expect(data.get('readonly')).toBe('a')
    expect(data.has('disabled')).toBe(false)
  })
  test('native controlled autofill and reset restore the committed value', async () => {
    const change = vi.fn()
    const view = render(() => (
      <form>
        <Select items={items} value="a" name="fruit" onValueChange={change}>
          <Parts />
        </Select>
      </form>
    ))
    const form = view.container.querySelector('form')!
    const native = form.querySelector('select')!
    native.value = 'c'
    native.dispatchEvent(new Event('change', { bubbles: true }))
    flush()
    expect(change).toHaveBeenCalledWith('c')
    expect(native.value).toBe('a')
    form.reset()
    await Promise.resolve()
    flush()
    expect(native.value).toBe('a')
  })
})
