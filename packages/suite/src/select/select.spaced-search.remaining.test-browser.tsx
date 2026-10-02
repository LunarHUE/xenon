import { Select } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush, For } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'start', label: 'Start' },
  { value: 'foo', label: 'Foo' },
  { value: 'foo-bar', label: 'Foo Bar' },
  { value: 'foo-baz', label: 'Foo Baz' },
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

function Spaced(props: { onValueChange: (value: string | undefined) => void }) {
  return (
    <form>
      <Select items={items} name="choice" onValueChange={props.onValueChange}>
        <Select.Trigger aria-label="Choice">
          <Select.Value placeholder="Choose a phrase" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content style={{ background: 'white', padding: '12px' }}>
            <For each={items}>{(item) => <Select.Item value={item.value} />}</For>
          </Select.Content>
        </Select.Positioner>
      </Select>
    </form>
  )
}

test('select.keyboard.29: native Space extends an active prefix and a trailing Space never swallows the next native option click', async () => {
  const changed = vi.fn()
  const m = mount(() => <Spaced onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Start' }).id
  )
  await userEvent.keyboard('foo')
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Foo' }).id
  )
  await userEvent.keyboard(' ')
  await settle()
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Foo Bar' }).id
  )
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveTextContent('Choose a phrase')
  expect(changed).not.toHaveBeenCalled()
  await userEvent.keyboard('baz ')
  await settle()
  const baz = m.getByRole('option', { name: 'Foo Baz' })
  expect(trigger).toHaveAttribute('aria-activedescendant', baz.id)
  expect(changed).not.toHaveBeenCalled()
  await userEvent.click(baz)
  await settle()
  expect(m.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveTextContent('Foo Baz')
  expect(changed.mock.calls).toEqual([['foo-baz']])
  expect(new FormData(m.container.querySelector('form')!).get('choice')).toBe('foo-baz')
})

test('select.keyboard.30: native Space commits the pending phrase only after the active search buffer has expired', async () => {
  const changed = vi.fn()
  const m = mount(() => <Spaced onValueChange={changed} />)
  const trigger = m.getByRole('combobox')
  await userEvent.click(trigger)
  await settle()
  await userEvent.keyboard('foo ')
  await settle()
  expect(trigger).toHaveAttribute(
    'aria-activedescendant',
    m.getByRole('option', { name: 'Foo Bar' }).id
  )
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(changed).not.toHaveBeenCalled()
  await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  await userEvent.keyboard(' ')
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('listbox')).toBeNull()
  expect(trigger).toHaveTextContent('Foo Bar')
  expect(trigger).toHaveFocus()
  expect(changed.mock.calls).toEqual([['foo-bar']])
  expect(new FormData(m.container.querySelector('form')!).get('choice')).toBe('foo-bar')
})
