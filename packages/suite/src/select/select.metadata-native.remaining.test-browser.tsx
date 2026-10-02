import { Select } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush, For } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Unavailable', disabled: true },
  { value: 'pear / ripe', label: 'Pear' },
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

function Fruit(props: {
  defaultValue?: string
  items?: typeof items
  onValueChange?: (value: string | undefined) => void
  onSubmit?: (event: SubmitEvent) => void
}) {
  return (
    <form onSubmit={(event) => props.onSubmit?.(event)}>
      <Select
        items={props.items ?? items}
        name="fruit"
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value data-testid="value" placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={{ background: 'white', padding: '12px' }}>
            <For each={props.items ?? items}>{(item) => <Select.Item value={item.value} />}</For>
          </Select.Content>
        </Select.Positioner>
      </Select>
      <button type="submit">Submit</button>
    </form>
  )
}

test('select.roles.1: the native value trigger explicitly advertises a listbox popup', () => {
  const m = mount(() => <Fruit />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  expect(trigger.tagName).toBe('BUTTON')
  expect(trigger).toHaveAttribute('role', 'combobox')
  expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('select.roles.3: clicking the default button trigger opens without submitting its native form', async () => {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const change = vi.fn()
  const m = mount(() => <Fruit onSubmit={submit} onValueChange={change} />)
  const trigger = m.getByRole('combobox')
  expect(trigger).toHaveAttribute('type', 'button')
  await userEvent.click(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('listbox')).toBeVisible()
  expect(submit).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('{Escape}')
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Submit' }))
  expect(submit).toHaveBeenCalledTimes(1)
})

test('select.roles.6: the shipped lazy-popup policy adds resolving controls only while open', async () => {
  const m = mount(() => <Fruit />)
  const trigger = m.getByRole('combobox')
  expect(trigger).not.toHaveAttribute('aria-controls')
  expect(m.queryByRole('listbox')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  expect(popup.id).not.toBe('')
  expect(trigger).toHaveAttribute('aria-controls', popup.id)
  expect(document.getElementById(popup.id)).toBe(popup)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(trigger).not.toHaveAttribute('aria-controls')
  expect(popup.isConnected).toBe(false)
})

test('select.roles.14: the implicitly vertical listbox omits aria-orientation', async () => {
  const m = mount(() => <Fruit />)
  await userEvent.click(m.getByRole('combobox'))
  await settle()
  expect(m.getByRole('listbox')).not.toHaveAttribute('aria-orientation')
})

test('select.roles.18: an authored aria-label needs no invented label reference outside Field', async () => {
  const m = mount(() => <Fruit />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  expect(trigger).toHaveAttribute('aria-label', 'Fruit')
  expect(trigger).not.toHaveAttribute('aria-labelledby')
  await userEvent.click(trigger)
  await settle()
  expect(trigger).not.toHaveAttribute('aria-labelledby')
  expect(m.getByRole('listbox')).toHaveAttribute('aria-labelledby', trigger.id)
})

test('select.roles.22: empty trigger and value expose placeholder markers which both clear on native commitment', async () => {
  const change = vi.fn()
  const m = mount(() => <Fruit onValueChange={change} />)
  const trigger = m.getByRole('combobox')
  const value = m.getByTestId('value')
  expect(trigger).toHaveAttribute('data-placeholder')
  expect(value).toHaveAttribute('data-placeholder')
  expect(value).toHaveTextContent('Choose fruit')
  await userEvent.click(trigger)
  await settle()
  await userEvent.click(m.getByRole('option', { name: 'Pear' }))
  await settle()
  expect(trigger).not.toHaveAttribute('data-placeholder')
  expect(value).not.toHaveAttribute('data-placeholder')
  expect(value).toHaveTextContent('Pear')
  expect(change.mock.calls).toEqual([['pear / ripe']])
})

test('select.roles.34: option identity and value stay stable while highlight, selection, and disabled markers stay distinct', async () => {
  const [collection, setCollection] = createSignal(items)
  const change = vi.fn()
  const m = mount(() => <Fruit items={collection()} defaultValue="apple" onValueChange={change} />)
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  const apple = m.getByRole('option', { name: 'Apple' })
  const pear = m.getByRole('option', { name: 'Pear' })
  const blocked = m.getByRole('option', { name: 'Unavailable' })
  const pearId = pear.id
  expect(pearId).not.toBe('')
  expect(pear).toHaveAttribute('data-value', 'pear / ripe')
  expect(apple).toHaveAttribute('data-state', 'checked')
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(apple).toHaveAttribute('data-highlighted')
  expect(pear).toHaveAttribute('data-state', 'unchecked')
  expect(pear).toHaveAttribute('aria-selected', 'false')
  expect(pear).not.toHaveAttribute('data-highlighted')
  expect(pear).not.toHaveAttribute('data-disabled')
  expect(pear).not.toHaveAttribute('aria-disabled')
  expect(blocked).toHaveAttribute('data-disabled')
  expect(blocked).toHaveAttribute('aria-disabled', 'true')
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(pear).toHaveAttribute('data-highlighted')
  expect(apple).not.toHaveAttribute('data-highlighted')
  expect(apple).toHaveAttribute('data-state', 'checked')
  expect(pear).toHaveAttribute('data-state', 'unchecked')
  setCollection([items[2]!, items[1]!, items[0]!])
  await settle()
  const reordered = m.getByRole('option', { name: 'Pear' })
  expect(reordered.id).toBe(pearId)
  expect(reordered).toHaveAttribute('data-value', 'pear / ripe')
  expect(trigger).toHaveAttribute('aria-activedescendant', pearId)
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('{Enter}')
  await settle()
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('option', { name: 'Pear' })).toHaveAttribute('data-state', 'checked')
  expect(m.getByRole('option', { name: 'Pear' })).toHaveAttribute('aria-selected', 'true')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('data-state', 'unchecked')
  expect(change.mock.calls).toEqual([['pear / ripe']])
})

test('select.forms.2: the shipped native select mirror contains the leading empty option and each metadata item', () => {
  const m = mount(() => <Fruit defaultValue="apple" />)
  const form = m.container.querySelector('form')!
  const mirror = form.querySelector('select')!
  expect(form.querySelectorAll('[name="fruit"]')).toHaveLength(1)
  expect(mirror).toHaveAttribute('name', 'fruit')
  expect(mirror).toHaveAttribute('aria-hidden', 'true')
  expect(mirror).toHaveAttribute('tabindex', '-1')
  expect(
    Array.from(mirror.options, (option) => ({
      value: option.value,
      label: option.textContent,
      disabled: option.disabled,
    }))
  ).toEqual([
    { value: '', label: '', disabled: false },
    { value: 'apple', label: 'Apple', disabled: false },
    { value: 'blocked', label: 'Unavailable', disabled: true },
    { value: 'pear / ripe', label: 'Pear', disabled: false },
  ])
  expect(mirror.options[0]).toHaveAttribute('hidden')
  expect(mirror.value).toBe('apple')
  expect(Array.from(new FormData(form).entries())).toEqual([['fruit', 'apple']])
})
