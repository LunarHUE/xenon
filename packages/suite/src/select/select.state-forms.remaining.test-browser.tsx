import { Select } from '@xenon-ui/solid/select'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
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
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Choose fruit" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Content style={{ background: 'white', padding: '12px' }}>
          <Select.Item value="apple" />
          <Select.Item value="pear" />
        </Select.Content>
      </Select.Positioner>
    </>
  )
}

test('select.state.1: controlled open mounts silently and Escape reports one rejected close request', async () => {
  const open = vi.fn()
  const m = mount(() => (
    <Select items={items} open onOpenChange={open}>
      <Parts />
    </Select>
  ))
  await settle()
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  const popup = m.getByRole('listbox')
  expect(popup).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(open).not.toHaveBeenCalled()
  trigger.focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(open).toHaveBeenCalledExactlyOnceWith(false)
  expect(m.getByRole('listbox')).toBe(popup)
  expect(popup).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveFocus()
})

test('select.state.2: default-open mounts silently and Escape closes with one callback', async () => {
  const open = vi.fn()
  const m = mount(() => (
    <Select items={items} defaultOpen onOpenChange={open}>
      <Parts />
    </Select>
  ))
  await settle()
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  expect(m.getByRole('listbox')).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(open).not.toHaveBeenCalled()
  trigger.focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).toHaveFocus()
  expect(open).toHaveBeenCalledExactlyOnceWith(false)
})

test('select.state.28: toggling the native name preserves the open popup and changes submitted entries', async () => {
  const [name, setName] = createSignal('fruit')
  const open = vi.fn()
  const change = vi.fn()
  const m = mount(() => (
    <form>
      <Select
        items={items}
        name={name()}
        defaultValue="pear"
        onOpenChange={open}
        onValueChange={change}
      >
        <Parts />
      </Select>
    </form>
  ))
  const form = m.container.querySelector('form')!
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  const popup = m.getByRole('listbox')
  const selected = within(popup).getByRole('option', { name: 'Pear' })
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  setName('')
  await settle()
  expect(new FormData(form).has('fruit')).toBe(false)
  expect([...new FormData(form).entries()]).toEqual([])
  expect(m.getByRole('listbox')).toBe(popup)
  expect(within(popup).getByRole('option', { name: 'Pear' })).toBe(selected)
  expect(selected).toHaveAttribute('aria-selected', 'true')
  setName('renamed-fruit')
  await settle()
  expect(new FormData(form).getAll('renamed-fruit')).toEqual(['pear'])
  expect(new FormData(form).has('fruit')).toBe(false)
  expect(m.getByRole('listbox')).toBe(popup)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(open).toHaveBeenCalledExactlyOnceWith(true)
})

test('select.forms.13: an external form owns submission and native reset restores the default silently', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <>
      <form id="select-external-owner">
        <button type="reset">Reset external fruit</button>
      </form>
      <Select
        items={items}
        form="select-external-owner"
        name="fruit"
        defaultValue="pear"
        onValueChange={change}
      >
        <Parts />
      </Select>
    </>
  ))
  const form = m.container.querySelector('form')!
  const native = m.container.querySelector('select')!
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  expect(form.contains(native)).toBe(false)
  expect(native.form).toBe(form)
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  trigger.focus()
  await userEvent.keyboard('a')
  await settle()
  expect(trigger).toHaveTextContent('Apple')
  expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
  expect(change).toHaveBeenCalledExactlyOnceWith('apple')
  await userEvent.click(m.getByRole('button', { name: 'Reset external fruit' }))
  await settle()
  expect(trigger).toHaveTextContent('Pear')
  expect(native.value).toBe('pear')
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  expect(change).toHaveBeenCalledTimes(1)
})

test('select.forms.17: an unknown native change is rejected and the committed value is repaired', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <form>
      <Select items={items} name="fruit" defaultValue="pear" onValueChange={change}>
        <Parts />
      </Select>
    </form>
  ))
  const form = m.container.querySelector('form')!
  const native = m.container.querySelector('select')!
  // Supply a native option so the browser retains an unknown value before the change handler runs.
  const unknown = new Option('Unknown browser value', 'unknown')
  native.add(unknown)
  native.value = 'unknown'
  expect(native.value).toBe('unknown')
  native.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
  expect(native.value).toBe('pear')
  expect(m.getByRole('combobox', { name: 'Fruit' })).toHaveTextContent('Pear')
  expect(new FormData(form).getAll('fruit')).toEqual(['pear'])
  expect(change).not.toHaveBeenCalled()
})
