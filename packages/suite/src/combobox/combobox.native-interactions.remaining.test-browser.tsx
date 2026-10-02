import { Combobox } from '@xenon-ui/solid/combobox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush, For } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

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

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'apricot', label: 'Apricot' },
  { value: 'avocado', label: 'Avocado' },
]

function Fruit(props: { onValueChange: (value: string | undefined) => void }) {
  return (
    <form>
      <Combobox items={fruit} name="fruit" onValueChange={props.onValueChange}>
        <Combobox.Input aria-label="Fruit" />
        <Combobox.Positioner>
          <Combobox.Content
            aria-label="Suggestions"
            style={{ background: 'white', padding: '12px' }}
          />
        </Combobox.Positioner>
      </Combobox>
    </form>
  )
}

test('combobox.pointer.8 combobox.pointer.9: leaving a hovered option preserves highlight and native arrows resume there', async () => {
  const change = vi.fn()
  const m = mount(() => <Fruit onValueChange={change} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('a')
  await settle()
  const apricot = m.getByRole('option', { name: 'Apricot' })
  await userEvent.hover(apricot)
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', apricot.id)
  await userEvent.hover(input)
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', apricot.id)
  expect(input).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Avocado' }).id
  )
  expect(input).toHaveFocus()
  expect(input).toHaveValue('a')
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.keyboard.71: Control ArrowDown preserves an already-open highlighted query', async () => {
  const change = vi.fn()
  const m = mount(() => <Fruit onValueChange={change} />)
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('a{ArrowDown}')
  await settle()
  const apple = m.getByRole('option', { name: 'Apple' })
  expect(input).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.keyboard('{Control>}{ArrowDown}{/Control}')
  await settle()
  expect(input).toHaveAttribute('aria-activedescendant', apple.id)
  expect(input).toHaveAttribute('aria-expanded', 'true')
  expect(input).toHaveValue('a')
  expect(input).toHaveFocus()
  expect(new FormData(m.container.querySelector('form')!).get('fruit')).toBe('')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.focus.5: native virtual navigation scrolls distant options into the actual popup viewport', async () => {
  const change = vi.fn()
  const items = Array.from({ length: 20 }, (_, index) => ({
    value: String(index),
    label: `Row ${index + 1}`,
  }))
  const m = mount(() => (
    <Combobox items={items} onValueChange={change}>
      <Combobox.Input aria-label="Rows" />
      <Combobox.Positioner>
        <Combobox.Content
          aria-label="Rows"
          style={{ height: '120px', overflow: 'auto', background: 'white' }}
        >
          <For each={items}>
            {(item) => (
              <Combobox.Item
                value={item.value}
                style={{ height: '32px', 'box-sizing': 'border-box', padding: '6px' }}
              >
                {item.label}
              </Combobox.Item>
            )}
          </For>
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
  const input = m.getByRole('combobox')
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const popup = m.getByRole('listbox')
  expect(popup.scrollHeight).toBeGreaterThan(popup.clientHeight)
  expect(popup.scrollTop).toBeLessThanOrEqual(1)
  for (let index = 1; index < 20; index++) await userEvent.keyboard('{ArrowDown}')
  await settle()
  const last = m.getByRole('option', { name: 'Row 20' })
  expect(input).toHaveAttribute('aria-activedescendant', last.id)
  expect(popup.scrollTop).toBeGreaterThan(0)
  const viewport = popup.getBoundingClientRect()
  const option = last.getBoundingClientRect()
  expect(option.top).toBeGreaterThanOrEqual(viewport.top - 1)
  expect(option.bottom).toBeLessThanOrEqual(viewport.bottom + 1)
  expect(input).toHaveFocus()
  expect(input).toHaveValue('')
  expect(change).not.toHaveBeenCalled()
})

test('combobox.forms.27: query input stays nameless and exactly one named control submits committed selection', async () => {
  const change = vi.fn()
  const m = mount(() => <Fruit onValueChange={change} />)
  const input = m.getByRole('combobox')
  const form = m.container.querySelector('form')!
  expect(input).not.toHaveAttribute('name')
  const named = form.querySelectorAll('[name="fruit"]')
  expect(named).toHaveLength(1)
  expect(named[0]?.tagName).toBe('SELECT')
  await userEvent.click(input)
  await userEvent.keyboard('ap')
  await settle()
  expect(Array.from(new FormData(form).entries())).toEqual([['fruit', '']])
  await userEvent.click(m.getByRole('option', { name: 'Apricot' }))
  await settle()
  expect(change.mock.calls).toEqual([['apricot']])
  expect(Array.from(new FormData(form).entries())).toEqual([['fruit', 'apricot']])
  await userEvent.keyboard('{Control>}a{/Control}av')
  await settle()
  expect(input).toHaveValue('av')
  expect(input).not.toHaveAttribute('name')
  expect(form.querySelectorAll('[name="fruit"]')).toHaveLength(1)
  expect(Array.from(new FormData(form).entries())).toEqual([['fruit', 'apricot']])
  expect(change.mock.calls).toEqual([['apricot']])
})
