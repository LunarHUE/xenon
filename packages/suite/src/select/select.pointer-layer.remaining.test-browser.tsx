import { Dialog, Select } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush, For } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Unavailable', disabled: true },
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

function Fruit(props: {
  disabled?: boolean
  readonly?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string | undefined) => void
  onDisabledClick?: (event: MouseEvent) => void
}) {
  return (
    <form>
      <Select
        items={items}
        name="fruit"
        disabled={props.disabled}
        readonly={props.readonly}
        onOpenChange={props.onOpenChange}
        onValueChange={props.onValueChange}
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value placeholder="Choose fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content
            aria-label="Fruit options"
            style={{ background: 'white', padding: '12px' }}
          >
            <For each={items}>
              {(item) => (
                <Select.Item
                  value={item.value}
                  onClick={(event) => {
                    if (item.disabled) props.onDisabledClick?.(event)
                  }}
                />
              )}
            </For>
          </Select.Content>
        </Select.Positioner>
      </Select>
    </form>
  )
}

function syntheticTouch(target: HTMLElement, type: 'pointerdown' | 'pointerup') {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      pointerId: 1,
      isPrimary: true,
      button: 0,
    })
  )
  flush()
}

function syntheticClick(target: HTMLElement) {
  target.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1, button: 0 })
  )
  flush()
}

test('select.pointer.4: a disabled trigger ignores native mouse activation and explicitly synthetic touch boundaries', async () => {
  const opened = vi.fn()
  const changed = vi.fn()
  const m = mount(() => <Fruit disabled onOpenChange={opened} onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  expect(trigger).toBeDisabled()
  await userEvent.click(trigger, { force: true })
  await settle()
  expect(trigger).not.toHaveFocus()
  syntheticTouch(trigger, 'pointerdown')
  syntheticTouch(trigger, 'pointerup')
  syntheticClick(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(opened).not.toHaveBeenCalled()
  expect(changed).not.toHaveBeenCalled()
})

test('select.pointer.6: native hover moves only the pending highlight and its marker between enabled options', async () => {
  const changed = vi.fn()
  const m = mount(() => <Fruit onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  const apple = m.getByRole('option', { name: 'Apple' })
  const pear = m.getByRole('option', { name: 'Pear' })
  await userEvent.hover(apple)
  await settle()
  expect(apple).toHaveAttribute('data-highlighted')
  expect(pear).not.toHaveAttribute('data-highlighted')
  expect(trigger).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.hover(pear)
  await settle()
  expect(pear).toHaveAttribute('data-highlighted')
  expect(apple).not.toHaveAttribute('data-highlighted')
  expect(trigger).toHaveAttribute('aria-activedescendant', pear.id)
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(pear).toHaveAttribute('aria-selected', 'false')
  expect(trigger).toHaveTextContent('Choose fruit')
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
  expect(changed).not.toHaveBeenCalled()
})

test('select.pointer.28: the shipped read-only policy allows trigger focus while native mouse click opens nothing', async () => {
  const opened = vi.fn()
  const changed = vi.fn()
  const m = mount(() => <Fruit readonly onOpenChange={opened} onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  expect(trigger).not.toBeDisabled()
  expect(trigger).toHaveAttribute('aria-readonly', 'true')
  await userEvent.click(trigger)
  await settle()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(opened).not.toHaveBeenCalled()
  expect(changed).not.toHaveBeenCalled()
})

test('select.pointer.29: the shipped author-first handler fires once for a disabled option while commitment remains blocked', async () => {
  const clicked = vi.fn()
  const opened = vi.fn()
  const changed = vi.fn()
  const m = mount(() => (
    <Fruit onDisabledClick={clicked} onOpenChange={opened} onValueChange={changed} />
  ))
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  const disabled = m.getByRole('option', { name: 'Unavailable' })
  expect(disabled).toHaveAttribute('aria-disabled', 'true')
  await userEvent.click(disabled, { force: true })
  await settle()
  expect(clicked).toHaveBeenCalledTimes(1)
  expect(clicked.mock.calls[0]?.[0].target).toBe(disabled)
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveTextContent('Choose fruit')
  expect(m.getByRole('option', { name: 'Unavailable' })).toBe(disabled)
  expect(opened.mock.calls).toEqual([[true]])
  expect(changed).not.toHaveBeenCalled()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
})

test('select.pointer.3: explicitly synthetic touch down and up do not open until the following click', async () => {
  const opened = vi.fn()
  const changed = vi.fn()
  const m = mount(() => <Fruit onOpenChange={opened} onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  syntheticTouch(trigger, 'pointerdown')
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(opened).not.toHaveBeenCalled()
  syntheticTouch(trigger, 'pointerup')
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(opened).not.toHaveBeenCalled()
  syntheticClick(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('listbox')).toBeVisible()
  expect(opened.mock.calls).toEqual([[true]])
  expect(changed).not.toHaveBeenCalled()
})

function nested(
  onDialogChange: (open: boolean) => void,
  onSelectChange: (open: boolean) => void,
  onValueChange: (value: string | undefined) => void
) {
  return mount(() => (
    <Dialog onOpenChange={onDialogChange}>
      <Dialog.Trigger>Open editor</Dialog.Trigger>
      <Dialog.Content style={{ width: '500px', 'max-width': 'calc(100vw - 48px)' }}>
        <Dialog.Title>Editor</Dialog.Title>
        <Dialog.Description>Choose a fruit before saving.</Dialog.Description>
        <div style={{ display: 'flex', gap: '160px', 'align-items': 'flex-start' }}>
          <Fruit onOpenChange={onSelectChange} onValueChange={onValueChange} />
          <button type="button">Editor action</button>
        </div>
        <Dialog.Close>Close editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
}

test('select.dismissal.2: native Escape closes only the nested Select and returns focus inside the still-open Dialog', async () => {
  const dialogChanged = vi.fn()
  const selectChanged = vi.fn()
  const valueChanged = vi.fn()
  const m = nested(dialogChanged, selectChanged, valueChanged)
  await userEvent.click(m.getByRole('button', { name: 'Open editor' }))
  await settle()
  const dialog = m.getByRole('dialog', { name: 'Editor' })
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('listbox')).toBeVisible()
  await userEvent.keyboard('{ArrowDown}{Escape}')
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(m.getByRole('dialog', { name: 'Editor' })).toBe(dialog)
  expect(dialog.matches(':modal')).toBe(true)
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveTextContent('Choose fruit')
  expect(dialogChanged.mock.calls).toEqual([[true]])
  expect(selectChanged.mock.calls).toEqual([[true], [false]])
  expect(valueChanged).not.toHaveBeenCalled()
})

test('select.dismissal.2: a native press inside the Dialog but outside its Select closes only the Select and preserves action focus', async () => {
  const dialogChanged = vi.fn()
  const selectChanged = vi.fn()
  const valueChanged = vi.fn()
  const m = nested(dialogChanged, selectChanged, valueChanged)
  await userEvent.click(m.getByRole('button', { name: 'Open editor' }))
  await settle()
  const dialog = m.getByRole('dialog', { name: 'Editor' })
  const trigger = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('listbox')).toBeVisible()
  const action = m.getByRole('button', { name: 'Editor action' })
  const rect = action.getBoundingClientRect()
  expect(rect.width).toBeGreaterThan(0)
  expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(
    action
  )
  await userEvent.click(action)
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(m.getByRole('dialog', { name: 'Editor' })).toBe(dialog)
  expect(dialog.matches(':modal')).toBe(true)
  expect(action).toHaveFocus()
  expect(dialogChanged.mock.calls).toEqual([[true]])
  expect(selectChanged.mock.calls).toEqual([[true], [false]])
  expect(valueChanged).not.toHaveBeenCalled()
})
