import { Listbox } from '@xenon-ui/solid/listbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'

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

test('listbox.roles.6: only multiple-selection roots expose aria-multiselectable true', () => {
  const m = mount(() => (
    <>
      <Listbox aria-label="Single fruit">
        <Listbox.Item value="apple">Apple</Listbox.Item>
      </Listbox>
      <Listbox aria-label="Multiple fruit" selectionMode="multiple">
        <Listbox.Item value="apple">Apple</Listbox.Item>
      </Listbox>
    </>
  ))
  expect(m.getByRole('listbox', { name: 'Single fruit' })).not.toHaveAttribute(
    'aria-multiselectable'
  )
  expect(m.getByRole('listbox', { name: 'Multiple fruit' })).toHaveAttribute(
    'aria-multiselectable',
    'true'
  )
})

test('listbox.roles.27: option value identities survive label changes and reordering', async () => {
  const apple = { value: 'apple/code', label: 'Apple' }
  const pear = { value: 'pear code', label: 'Pear' }
  const [items, setItems] = createSignal([apple, pear])
  const [appleLabel, setAppleLabel] = createSignal('Apple')
  const m = mount(() => (
    <Listbox aria-label="Fruit">
      <For each={items()}>
        {(item) => (
          <Listbox.Item value={item.value}>
            {item === apple ? appleLabel() : item.label}
          </Listbox.Item>
        )}
      </For>
    </Listbox>
  ))
  const appleNode = m.getByRole('option', { name: 'Apple' })
  const pearNode = m.getByRole('option', { name: 'Pear' })
  expect(appleNode).toHaveAttribute('data-value', 'apple/code')
  expect(pearNode).toHaveAttribute('data-value', 'pear code')
  setAppleLabel('Renamed apple')
  setItems([pear, apple])
  flush()
  await Promise.resolve()
  flush()
  expect(m.getByRole('option', { name: 'Renamed apple' })).toBe(appleNode)
  expect(m.getAllByRole('option')).toEqual([pearNode, appleNode])
  expect(appleNode).toHaveAttribute('data-value', 'apple/code')
  expect(pearNode).toHaveAttribute('data-value', 'pear code')
})

test('listbox.roles.29: empty markers follow removal and repopulation of the registered collection', async () => {
  const [items, setItems] = createSignal<string[]>([])
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <For each={items()}>{(item) => <Listbox.Item value={item}>{item}</Listbox.Item>}</For>
    </Listbox>
  ))
  const root = m.getByRole('listbox')
  expect(root).toHaveAttribute('data-empty', '')
  expect(m.queryAllByRole('option')).toHaveLength(0)
  setItems(['Apple'])
  flush()
  await Promise.resolve()
  flush()
  expect(root).not.toHaveAttribute('data-empty')
  expect(m.getAllByRole('option')).toHaveLength(1)
  setItems([])
  flush()
  await Promise.resolve()
  flush()
  expect(root).toHaveAttribute('data-empty', '')
  expect(m.queryAllByRole('option')).toHaveLength(0)
  expect(change).not.toHaveBeenCalled()
})

test('listbox.roles.36: mounting an Item without its root throws', () => {
  const container = document.createElement('div')
  document.body.append(container)
  onTestFinished(() => container.remove())
  expect(() => render(() => <Listbox.Item value="apple">Apple</Listbox.Item>, container)).toThrow()
})
