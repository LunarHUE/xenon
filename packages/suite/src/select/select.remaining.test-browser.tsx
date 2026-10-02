import { Select } from '@xenon-ui/solid/select'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const initialItems = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Unavailable', disabled: true },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
]

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  let disposed = false
  function unmount() {
    if (disposed) return
    disposed = true
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

function FruitSelect(props: {
  items?: typeof initialItems
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <form>
      <Select
        items={props.items ?? initialItems}
        name="fruit"
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
        onOpenChange={props.onOpenChange}
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={{ background: 'white', padding: '12px' }}>
            <For each={props.items ?? initialItems}>
              {(item) => <Select.Item value={item.value} />}
            </For>
          </Select.Content>
        </Select.Positioner>
      </Select>
      <button type="button" style={{ position: 'fixed', left: '400px', top: '40px' }}>
        Outside
      </button>
    </form>
  )
}

test('select.keyboard.8: each commit key transfers aria-selected to the chosen option after reopening', async () => {
  for (const key of ['{Enter}', ' ', '{Alt>}{ArrowUp}{/Alt}']) {
    const change = vi.fn()
    const m = mount(() => <FruitSelect defaultValue="apple" onValueChange={change} />)
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await settle()
    const popup = m.getByRole('listbox')
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      within(popup).getByRole('option', { name: 'Pear' }).id
    )
    await userEvent.keyboard(key)
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveTextContent('Pear')
    expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('pear')
    expect(change).toHaveBeenCalledExactlyOnceWith('pear')
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    const reopened = m.getByRole('listbox')
    expect(within(reopened).getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(within(reopened).getByRole('option', { name: 'Pear' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(within(reopened).getByRole('option', { name: 'Plum' })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    await userEvent.keyboard('{Escape}')
    await settle()
    m.unmount()
  }
})

test('select.keyboard.19: removing the active option leaves navigation on live enabled options', async () => {
  const [items, setItems] = createSignal(initialItems)
  const change = vi.fn()
  const m = mount(() => <FruitSelect items={items()} onValueChange={change} />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}{ArrowDown}')
  await settle()
  const popup = m.getByRole('listbox')
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    within(popup).getByRole('option', { name: 'Pear' }).id
  )
  setItems(initialItems.filter((item) => item.value !== 'pear'))
  await settle()
  expect(within(popup).queryByRole('option', { name: 'Pear' })).toBeNull()
  const activeId = trigger.getAttribute('aria-activedescendant')!
  expect(document.getElementById(activeId)).toBe(
    within(popup).getByRole('option', { name: 'Apple' })
  )
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    within(popup).getByRole('option', { name: 'Plum' }).id
  )
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    within(popup).getByRole('option', { name: 'Apple' }).id
  )
  expect(trigger).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
})

test('select.pointer.1: clicking the trigger again closes without committing its highlight', async () => {
  const open = vi.fn()
  const change = vi.fn()
  const m = mount(() => <FruitSelect onOpenChange={open} onValueChange={change} />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('listbox')).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(trigger)
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).not.toHaveAttribute('aria-activedescendant')
  expect(trigger).toHaveFocus()
  expect(open.mock.calls).toEqual([[true], [false]])
  expect(change).not.toHaveBeenCalled()
})

test('select.pointer.14: clicking the selected option closes without clearing or emitting a value change', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitSelect defaultValue="pear" onValueChange={change} />)
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  const selected = within(m.getByRole('listbox')).getByRole('option', { name: 'Pear' })
  expect(selected).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(selected)
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveTextContent('Pear')
  expect(trigger).toHaveFocus()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('pear')
  expect(change).not.toHaveBeenCalled()
})

test('select.pointer.17 and select.dismissal.12: outside clicks discard highlights for empty and committed values', async () => {
  for (const defaultValue of [undefined, 'apple']) {
    const change = vi.fn()
    const m = mount(() => <FruitSelect defaultValue={defaultValue} onValueChange={change} />)
    const trigger = m.getByRole('combobox', { name: 'Fruit' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await settle()
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      within(m.getByRole('listbox')).getByRole('option', { name: 'Pear' }).id
    )
    const outside = m.getByRole('button', { name: 'Outside' })
    await userEvent.click(outside)
    await settle()
    expect(m.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-activedescendant')
    expect(trigger).toHaveTextContent(defaultValue ? 'Apple' : 'Choose fruit')
    expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe(defaultValue ?? '')
    expect(outside).toHaveFocus()
    expect(change).not.toHaveBeenCalled()
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    expect(trigger).toHaveAttribute(
      'aria-activedescendant',
      within(m.getByRole('listbox')).getByRole('option', { name: 'Apple' }).id
    )
    await userEvent.keyboard('{Escape}')
    await settle()
    m.unmount()
  }
})
