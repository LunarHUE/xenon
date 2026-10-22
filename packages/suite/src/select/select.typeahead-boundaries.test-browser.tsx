import { Select } from '@xenon-ui/solid/select'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const items = [
  { value: 'blocked-pear', label: 'Pear unavailable', disabled: true },
  { value: 'pear', label: 'Pear' },
  { value: 'blocked-peach', label: 'Peach unavailable', disabled: true },
  { value: 'plum', label: 'Plum' },
  { value: 'apple', label: 'Apple' },
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
}
function Parts() {
  return (
    <>
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Choose" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Content>
          <For each={items}>{(item) => <Select.Item value={item.value} />}</For>
        </Select.Content>
      </Select.Positioner>
    </>
  )
}

test('select.keyboard.28: closed repeated-letter typeahead skips disabled matches before and between enabled options', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <Select items={items} name="fruit" onValueChange={change}>
        <Parts />
      </Select>
    </form>
  ))
  const trigger = view.getByRole('combobox')
  trigger.focus()
  for (const [value, label] of [
    ['pear', 'Pear'],
    ['plum', 'Plum'],
    ['pear', 'Pear'],
  ] as const) {
    await userEvent.keyboard('p')
    await settle()
    expect(trigger).toHaveTextContent(label)
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe(value)
  }
  expect(change.mock.calls).toEqual([['pear'], ['plum'], ['pear']])
})

test('select.keyboard.27: unmatched text after idle leaves commitment intact and another idle starts fresh matching', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <form>
      <Select items={items} defaultValue="pear" name="fruit" onValueChange={change}>
        <Parts />
      </Select>
    </form>
  ))
  const trigger = view.getByRole('combobox')
  trigger.focus()
  await userEvent.keyboard('p')
  await settle()
  expect(trigger).toHaveTextContent('Plum')
  await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  await userEvent.keyboard('z')
  await settle()
  expect(trigger).toHaveTextContent('Plum')
  expect(change.mock.calls).toEqual([['plum']])
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('plum')
  await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  await userEvent.keyboard('a')
  await settle()
  expect(trigger).toHaveTextContent('Apple')
  expect(new FormData(view.container.querySelector('form')!).get('fruit')).toBe('apple')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(change.mock.calls).toEqual([['plum'], ['apple']])
})
