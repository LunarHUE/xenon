/** Native form submission, validation, reset, and controlled-cancellation behavior for Select. */
import { Select } from '@xenon-ui/solid'
import type { JSX } from '@solidjs/web'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Metadata for the submitted values and labels the popup mirrors natively. */
const items = [
  { value: 'apricot', label: 'Apricot', disabled: true },
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Unavailable', disabled: true },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
]
/** Popup styling so pointer targets have real geometry in the top layer. */
const surface = { background: 'white', padding: '12px', 'min-width': '160px' }
/** Fixture disposers, unwound in reverse order after every test. */
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
/** Render into the body, register disposal, and expose scoped queries. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}
/** Flush Solid and carry the popup presence through its enter and exit frames. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
/** Deliver native keys to the focused element and settle the resulting render. */
async function press(keys: string) {
  await userEvent.keyboard(keys)
  await settle()
}
/** Inputs for the form fixture used by the native form tests. */
interface FixtureProps {
  /** Initial uncontrolled selection, and the target of a native reset. */
  defaultValue?: string
  /** Controlled selection, which makes the select ignore its internal state. */
  value?: string
  /** Submission name, which also labels the trigger. */
  name?: string
  /** Receives committed value requests. */
  onValueChange?: (value: string | undefined) => void
}
/** One Select plus a submit and reset control inside a real form. */
function FruitForm(props: FixtureProps) {
  return (
    <form>
      <Select
        items={items}
        name={props.name ?? 'fruit'}
        required
        value={props.value}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={surface}>
            <Select.Item value="apricot" />
            <Select.Item value="apple" />
            <Select.Item value="blocked" />
            <Select.Item value="pear" />
            <Select.Item value="plum" />
          </Select.Content>
        </Select.Positioner>
      </Select>
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  )
}
/** Uncontrolled and controlled selects sharing one native reset owner. */
function DualForm() {
  return (
    <form>
      <Select items={items} name="fruit" required defaultValue="pear">
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={surface}>
            <Select.Item value="apple" />
            <Select.Item value="pear" />
          </Select.Content>
        </Select.Positioner>
      </Select>
      <Select items={items} name="fixed" value="plum">
        <Select.Trigger aria-label="Fixed">
          <Select.Value placeholder="Choose fixed" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={surface}>
            <Select.Item value="apple" />
            <Select.Item value="plum" />
          </Select.Content>
        </Select.Positioner>
      </Select>
      <button type="reset">Reset</button>
    </form>
  )
}

describe('select native forms in a browser', () => {
  test('select.pointer.2: a real pointer click commits the option, closes the popup and keeps trigger focus', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    await userEvent.click(trigger)
    await settle()
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    await userEvent.click(within(popup).getByRole('option', { name: 'Pear' }))
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Pear')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(form.checkValidity()).toBe(true)
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
    await userEvent.click(trigger)
    await settle()
    const reopened = m.getByRole('listbox', { name: 'Fruit' })
    expect(within(reopened).getByRole('option', { name: 'Pear' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(within(reopened).getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
    await press('{Escape}')
  })

  test('select.forms.14: a native reset restores the uncontrolled default and keeps the controlled value', async () => {
    const m = mount(() => <DualForm />)
    const form = m.container.querySelector('form')!
    const fruit = m.getByRole('combobox', { name: 'Fruit' })
    const fixed = m.getByRole('combobox', { name: 'Fixed' })
    fruit.focus()
    await press('a')
    expect(fruit.textContent).toBe('Apple')
    expect(new FormData(form).get('fruit')).toBe('apple')
    fixed.focus()
    await press('a')
    expect(fixed.textContent).toBe('Plum')
    expect(new FormData(form).get('fixed')).toBe('plum')
    await userEvent.click(m.getByRole('button', { name: 'Reset' }))
    await settle()
    expect(fruit.textContent).toBe('Pear')
    expect(fixed.textContent).toBe('Plum')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(new FormData(form).get('fixed')).toBe('plum')
    expect(form.checkValidity()).toBe(true)
  })

  test('select.state.5: a controlled select reports attempts without drifting or clearing its value', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm value="plum" onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    expect(trigger.textContent).toBe('Plum')
    expect(new FormData(form).get('fruit')).toBe('plum')
    await userEvent.click(trigger)
    await settle()
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    await userEvent.click(within(popup).getByRole('option', { name: 'Apple' }))
    await settle()
    expect(change).toHaveBeenCalledExactlyOnceWith('apple')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Plum')
    expect(new FormData(form).get('fruit')).toBe('plum')
    await press('{ArrowDown}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await press('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.textContent).toBe('Plum')
    expect(change).toHaveBeenCalledTimes(1)
  })

  test('a consumer-canceled native reset keeps the committed selection', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm defaultValue="pear" onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('a')
    expect(new FormData(form).get('fruit')).toBe('apple')
    form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    await userEvent.click(m.getByRole('button', { name: 'Reset' }))
    await settle()
    expect(trigger.textContent).toBe('Apple')
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(form.checkValidity()).toBe(true)
    expect(change).toHaveBeenCalledExactlyOnceWith('apple')
  })
})
