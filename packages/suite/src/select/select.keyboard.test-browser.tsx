/** Native keyboard, dismissal, and typeahead transitions for the single-value Select. */
import { Select } from '@xenon/solid'
import type { JSX } from '@solidjs/web'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Metadata order matters: a match starting with "a" must skip the disabled Apricot. */
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
/** Inputs for the form fixture used by the interaction tests. */
interface FixtureProps {
  /** Initial uncontrolled selection that native reset restores. */
  defaultValue?: string
  /** Receives committed value requests. */
  onValueChange?: (value: string | undefined) => void
}
/** One Select plus a submit and reset control inside a real form. */
function FruitForm(props: FixtureProps) {
  return (
    <form>
      <Select
        items={items}
        name="fruit"
        required
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

describe('select keyboard and pointer interaction in a browser', () => {
  test('select.keyboard.1: closed Enter, Space and Down open the popup at the first enabled option without committing', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
      await press(key)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveFocus()
      const popup = m.getByRole('listbox', { name: 'Fruit' })
      expect(popup).toBeVisible()
      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        within(popup).getByRole('option', { name: 'Apple' }).id
      )
      expect(trigger.textContent).toBe('Choose fruit')
      expect(new FormData(form).get('fruit')).toBe('')
      expect(form.checkValidity()).toBe(false)
      await press('{Escape}')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.8: Space commits the highlighted option and closes the popup', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    await press('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Pear' }).id
    )
    await press(' ')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Pear')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(form.checkValidity()).toBe(true)
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
  })

  test('select.keyboard.5: closed Home and End open at the first and last enabled option', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    for (const [key, label] of [
      ['{Home}', 'Apple'],
      ['{End}', 'Plum'],
    ] as const) {
      await press(key)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      const popup = m.getByRole('listbox', { name: 'Fruit' })
      expect(trigger.getAttribute('aria-activedescendant')).toBe(
        within(popup).getByRole('option', { name: label }).id
      )
      expect(new FormData(form).get('fruit')).toBe('')
      await press('{Escape}')
    }
    expect(form.checkValidity()).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.15: open arrow navigation clamps at both ends instead of wrapping', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    const active = () => trigger.getAttribute('aria-activedescendant')
    const option = (name: string) => within(popup).getByRole('option', { name }).id
    expect(active()).toBe(option('Apple'))
    await press('{ArrowUp}')
    expect(active()).toBe(option('Apple'))
    await press('{ArrowDown}{ArrowDown}')
    expect(active()).toBe(option('Plum'))
    await press('{ArrowDown}')
    expect(active()).toBe(option('Plum'))
    await press('{ArrowUp}{ArrowUp}')
    expect(active()).toBe(option('Apple'))
    await press('{ArrowUp}')
    expect(active()).toBe(option('Apple'))
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(form.checkValidity()).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.13: Escape cancels a pending highlight and leaves the required value empty', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    await press('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Pear' }).id
    )
    await press('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    expect(trigger).not.toHaveAttribute('aria-activedescendant')
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(form.checkValidity()).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.14: Escape keeps the committed selection and reopening highlights it', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm defaultValue="pear" onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Pear' }).id
    )
    await press('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Plum' }).id
    )
    await press('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Pear')
    expect(new FormData(form).get('fruit')).toBe('pear')
    expect(form.checkValidity()).toBe(true)
    await press('{ArrowDown}')
    const reopened = m.getByRole('listbox', { name: 'Fruit' })
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(reopened).getByRole('option', { name: 'Pear' }).id
    )
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.10: Tab dismisses without committing and focuses the next native control', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('{ArrowDown}')
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    await press('{ArrowDown}')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(
      within(popup).getByRole('option', { name: 'Pear' }).id
    )
    await press('{Tab}')
    expect(m.getByRole('button', { name: 'Save' })).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(m.queryByRole('listbox', { name: 'Fruit' })).toBeNull()
    expect(new FormData(form).get('fruit')).toBe('')
    expect(form.checkValidity()).toBe(false)
    expect(change).not.toHaveBeenCalled()
  })

  test('select.keyboard.24: repeated identical characters cycle through matches and wrap', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    for (const [value, label] of [
      ['pear', 'Pear'],
      ['plum', 'Plum'],
      ['pear', 'Pear'],
    ] as const) {
      await press('p')
      expect(trigger.textContent).toBe(label)
      expect(new FormData(form).get('fruit')).toBe(value)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
    expect(change.mock.calls).toEqual([['pear'], ['plum'], ['pear']])
  })

  test('select.keyboard.25: accumulated typeahead narrows matches and the buffer resets after an idle period', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('p')
    expect(trigger.textContent).toBe('Pear')
    await press('l')
    expect(trigger.textContent).toBe('Plum')
    expect(new FormData(form).get('fruit')).toBe('plum')
    // Outlast the adapter's 700 ms typeahead idle reset so the next key starts a new search.
    await new Promise<void>((resolve) => setTimeout(resolve, 800))
    await press('a')
    expect(trigger.textContent).toBe('Apple')
    expect(new FormData(form).get('fruit')).toBe('apple')
    expect(change.mock.calls).toEqual([['pear'], ['plum'], ['apple']])
  })

  test('select.keyboard.28: a disabled-only typeahead match commits nothing', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await press('u')
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(form.checkValidity()).toBe(false)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(change).not.toHaveBeenCalled()
  })

  test('select.pointer.16: a real pointer click on a disabled option neither highlights nor commits', async () => {
    const change = vi.fn()
    const m = mount(() => <FruitForm onValueChange={change} />)
    const form = m.container.querySelector('form')!
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    await userEvent.click(trigger)
    await settle()
    const popup = m.getByRole('listbox', { name: 'Fruit' })
    const apple = within(popup).getByRole('option', { name: 'Apple' }).id
    const disabled = within(popup).getByRole('option', { name: 'Unavailable' })
    expect(trigger.getAttribute('aria-activedescendant')).toBe(apple)
    await userEvent.hover(disabled)
    await settle()
    expect(trigger.getAttribute('aria-activedescendant')).toBe(apple)
    // Playwright treats aria-disabled as non-actionable, so bypass its actionability checks.
    await userEvent.click(disabled, { force: true })
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger.getAttribute('aria-activedescendant')).toBe(apple)
    expect(trigger).toHaveFocus()
    expect(trigger.textContent).toBe('Choose fruit')
    expect(new FormData(form).get('fruit')).toBe('')
    expect(change).not.toHaveBeenCalled()
  })
})
