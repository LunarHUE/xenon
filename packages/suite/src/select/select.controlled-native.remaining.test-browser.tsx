import { Select } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush, For } from 'solid-js'
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
  const unmount = () => {
    dispose()
    container.remove()
    flush()
  }
  onTestFinished(unmount)
  flush()
  return { container, unmount, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function Fruit(props: {
  value?: string
  defaultValue?: string
  items?: typeof items
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  onValueChange?: (value: string | undefined) => void
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <form>
      <Select
        items={props.items ?? items}
        name="fruit"
        value={props.value}
        defaultValue={props.defaultValue}
        disabled={props.disabled}
        readonly={props.readonly}
        required={props.required}
        onValueChange={props.onValueChange}
        onOpenChange={props.onOpenChange}
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner data-testid="positioner">
          <Select.Content style={{ background: 'white', padding: '12px' }}>
            <For each={props.items ?? items}>{(item) => <Select.Item value={item.value} />}</For>
          </Select.Content>
        </Select.Positioner>
      </Select>
    </form>
  )
}

function nativeChange(mirror: HTMLSelectElement, value: string) {
  mirror.value = value
  expect(mirror.value).toBe(value)
  mirror.dispatchEvent(new Event('change', { bubbles: true }))
  flush()
}

test('select.state.6: external controlled values and replaced labels update before first opening and while open without echo', async () => {
  const [value, setValue] = createSignal('apple')
  const [collection, setCollection] = createSignal(items)
  const change = vi.fn()
  const m = mount(() => <Fruit value={value()} items={collection()} onValueChange={change} />)
  const trigger = m.getByRole('combobox')
  expect(trigger).toHaveTextContent('Apple')
  expect(m.queryByRole('listbox')).toBeNull()
  setValue('pear')
  await settle()
  expect(trigger).toHaveTextContent('Pear')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(m.container.querySelector('select')!.value).toBe('pear')
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  expect(m.getByRole('option', { name: 'Pear' })).toHaveAttribute('aria-selected', 'true')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false')
  setValue('apple')
  await settle()
  expect(m.getByRole('listbox')).toBe(popup)
  expect(trigger).toHaveTextContent('Apple')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  expect(m.getByRole('option', { name: 'Pear' })).toHaveAttribute('aria-selected', 'false')
  setCollection([{ value: 'apple', label: 'Green apple' }, items[1]!])
  await settle()
  expect(trigger).toHaveTextContent('Green apple')
  expect(m.getByRole('option', { name: 'Green apple' })).toHaveAttribute('aria-selected', 'true')
  expect(change).not.toHaveBeenCalled()
})

test('select.state.23: external changes resolve labels without mounting and a fresh popup restores selected registration', async () => {
  const [value, setValue] = createSignal('apple')
  const change = vi.fn()
  const m = mount(() => <Fruit value={value()} onValueChange={change} />)
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  const first = m.getByRole('listbox')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(first.isConnected).toBe(false)
  setValue('pear')
  await settle()
  expect(trigger).toHaveTextContent('Pear')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(m.queryByTestId('positioner')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('listbox')).not.toBe(first)
  const pear = m.getByRole('option', { name: 'Pear' })
  expect(pear).toHaveAttribute('aria-selected', 'true')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false')
  expect(trigger).toHaveAttribute('aria-activedescendant', pear.id)
  expect(change).not.toHaveBeenCalled()
})

test('select.forms.15: a successful native change updates label and submission exactly once and selects the matching option on reopening', async () => {
  const change = vi.fn()
  const opened = vi.fn()
  const m = mount(() => <Fruit defaultValue="apple" onValueChange={change} onOpenChange={opened} />)
  const trigger = m.getByRole('combobox')
  const mirror = m.container.querySelector('select')!
  expect(trigger).toHaveTextContent('Apple')
  expect(change).not.toHaveBeenCalled()
  nativeChange(mirror, 'pear')
  await settle()
  expect(trigger).toHaveTextContent('Pear')
  expect(mirror.value).toBe('pear')
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('pear')
  expect(change.mock.calls).toEqual([['pear']])
  expect(opened).not.toHaveBeenCalled()
  expect(m.queryByRole('listbox')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('option', { name: 'Pear' })).toHaveAttribute('aria-selected', 'true')
  expect(m.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'false')
  expect(change.mock.calls).toEqual([['pear']])
})

for (const defaultValue of [undefined, 'apple']) {
  test(`select.forms.19: disabled and read-only native changes preserve ${defaultValue ? 'an existing selection' : 'the empty selection'} without callbacks`, async () => {
    for (const mode of ['disabled', 'readonly'] as const) {
      const change = vi.fn()
      const opened = vi.fn()
      const m = mount(() => (
        <Fruit
          defaultValue={defaultValue}
          disabled={mode === 'disabled'}
          readonly={mode === 'readonly'}
          onValueChange={change}
          onOpenChange={opened}
        />
      ))
      const trigger = m.getByRole('combobox')
      const mirror = m.container.querySelector('select')!
      expect(mirror.value).toBe(defaultValue ?? '')
      nativeChange(mirror, 'pear')
      await settle()
      expect(mirror.value).toBe(defaultValue ?? '')
      expect(trigger).toHaveTextContent(defaultValue ? 'Apple' : 'Choose fruit')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(m.queryByRole('listbox')).toBeNull()
      expect(change).not.toHaveBeenCalled()
      expect(opened).not.toHaveBeenCalled()
      const data = new FormData(m.container.querySelector('form')!)
      if (mode === 'disabled') expect(data.has('fruit')).toBe(false)
      else expect(data.get('fruit')).toBe(defaultValue ?? '')
      m.unmount()
    }
  })
}

test('select.forms.11: single-selection required mirror validity follows a real commitment and native reset', async () => {
  const change = vi.fn()
  const m = mount(() => <Fruit required onValueChange={change} />)
  const form = m.container.querySelector('form')!
  const mirror = form.querySelector('select')!
  expect(mirror.required).toBe(true)
  expect(mirror.validity.valid).toBe(false)
  expect(mirror.validity.valueMissing).toBe(true)
  await userEvent.click(m.getByRole('combobox'))
  await settle()
  await userEvent.click(m.getByRole('option', { name: 'Pear' }))
  await settle()
  expect(mirror.required).toBe(true)
  expect(mirror.validity.valid).toBe(true)
  expect(mirror.validity.valueMissing).toBe(false)
  expect(change.mock.calls).toEqual([['pear']])
  form.reset()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  await settle()
  expect(mirror.value).toBe('')
  expect(mirror.required).toBe(true)
  expect(mirror.validity.valid).toBe(false)
  expect(mirror.validity.valueMissing).toBe(true)
  expect(m.getByRole('combobox')).toHaveTextContent('Choose fruit')
  expect(change.mock.calls).toEqual([['pear']])
})
