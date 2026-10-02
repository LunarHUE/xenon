import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'apricot', label: 'Apricot' },
  { value: 'apricot-jam', label: 'Apricot jam' },
  { value: 'avocado', label: 'Avocado' },
  { value: 'pear', label: 'Pear' },
  { value: 'plum', label: 'Plum' },
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

function FruitCombobox(props: {
  loop?: boolean
  defaultValue?: string
  onValueChange?: (value: string | undefined) => void
  onFocus?: (event: FocusEvent) => void
}) {
  return (
    <form>
      <Combobox
        items={items}
        name="fruit"
        loop={props.loop}
        defaultValue={props.defaultValue}
        onValueChange={props.onValueChange}
      >
        <Combobox.Input aria-label="Fruit" onFocus={props.onFocus} />
        <Combobox.Positioner>
          <Combobox.Content
            aria-label="Fruit suggestions"
            style={{ background: 'white', padding: '12px' }}
          />
        </Combobox.Positioner>
      </Combobox>
      <button type="button" style={{ position: 'fixed', left: '400px', top: '40px' }}>
        Outside
      </button>
    </form>
  )
}

test('combobox.keyboard.8: loop false clamps native arrows at both enabled boundaries', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitCombobox loop={false} onValueChange={change} />)
  const input = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const popup = m.getByRole('listbox')
  const apple = within(popup).getByRole('option', { name: 'Apple' })
  const plum = within(popup).getByRole('option', { name: 'Plum' })
  expect(input).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    within(popup).getByRole('option', { name: 'Apricot' }).id
  )
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', plum.id)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', plum.id)
  await userEvent.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}')
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', apple.id)
  expect(input).toHaveFocus()
  expect(input).toHaveValue('')
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.keyboard.38: Backspace keeps list completion open and broadens filtered options', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitCombobox onValueChange={change} />)
  const input = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(input)
  await userEvent.keyboard('apr')
  await settle()
  expect(input).toHaveAttribute('aria-autocomplete', 'list')
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Apricot',
    'Apricot jam',
  ])
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(input).toHaveValue('ap')
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Apple',
    'Apricot',
    'Apricot jam',
  ])
  expect(input).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('combobox.keyboard.39: deleting from an Escape-closed query reopens the filtered popup', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitCombobox onValueChange={change} />)
  const input = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(input)
  await userEvent.keyboard('apr')
  await settle()
  expect(input).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(input).toHaveValue('apr')
  expect(input).toHaveFocus()
  await userEvent.keyboard('{Backspace}')
  await settle()
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(input).toHaveValue('ap')
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Apple',
    'Apricot',
    'Apricot jam',
  ])
  expect(input).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('combobox.pointer.15: outside release discards pending highlight and preserves typed query and committed value', async () => {
  const change = vi.fn()
  const m = mount(() => <FruitCombobox defaultValue="apple" onValueChange={change} />)
  const input = m.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
  await userEvent.click(input)
  input.select()
  await userEvent.keyboard('ap{ArrowDown}{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    within(m.getByRole('listbox')).getByRole('option', { name: 'Apricot' }).id
  )
  expect(input).toHaveValue('ap')
  const outside = m.getByRole('button', { name: 'Outside' })
  await userEvent.click(outside)
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(input).toHaveAttribute('aria-expanded', 'false')
  expect(input).not.toHaveAttribute('aria-activedescendant')
  expect(input).toHaveValue('ap')
  expect(outside).toHaveFocus()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('apple')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.focus.6: typing six characters and moving virtual highlight fires input focus once', async () => {
  const focus = vi.fn()
  const change = vi.fn()
  const m = mount(() => <FruitCombobox onFocus={focus} onValueChange={change} />)
  const input = m.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(input)
  await userEvent.keyboard('aprico')
  await settle()
  expect(input).toHaveValue('aprico')
  expect(input).toHaveFocus()
  expect(focus).toHaveBeenCalledTimes(1)
  expect(m.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Apricot',
    'Apricot jam',
  ])
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Apricot' }).id
  )
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Apricot jam' }).id
  )
  expect(input).toHaveFocus()
  expect(focus).toHaveBeenCalledTimes(1)
  expect(change).not.toHaveBeenCalled()
})
