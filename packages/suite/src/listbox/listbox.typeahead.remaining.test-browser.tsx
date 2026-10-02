import { Listbox } from '@xenon-ui/solid/listbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
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
  return within(container)
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function expectUnselected(options: HTMLElement[]) {
  for (const option of options) expect(option).toHaveAttribute('aria-selected', 'false')
}

test('listbox.keyboard.13 and listbox.keyboard.19: rapid whole-prefix typeahead distinguishes nine mounted options', async () => {
  const labels = [
    'Apple',
    'Cherry',
    'Carrot',
    'Cabbage',
    'Date',
    'Elderberry',
    'Fig',
    'Grape',
    'Honeydew',
  ]
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Produce" onValueChange={change}>
      <For each={labels}>{(label) => <Listbox.Item value={label}>{label}</Listbox.Item>}</For>
    </Listbox>
  ))
  expect(m.getAllByRole('option')).toHaveLength(9)
  m.getByRole('option', { name: 'Apple' }).focus()
  await userEvent.keyboard('c')
  await settle()
  expect(m.getByRole('option', { name: 'Cherry' })).toHaveFocus()
  await userEvent.keyboard('a')
  await settle()
  expect(m.getByRole('option', { name: 'Carrot' })).toHaveFocus()
  expectUnselected(m.getAllByRole('option'))
  expect(change).not.toHaveBeenCalled()
})

test('listbox.keyboard.20: a continuous spaced typeahead query moves from Foo through Foo Bar to Foo Baz without selecting', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Names" onValueChange={change}>
      <Listbox.Item value="start">Start</Listbox.Item>
      <Listbox.Item value="foo">Foo</Listbox.Item>
      <Listbox.Item value="bar">Foo Bar</Listbox.Item>
      <Listbox.Item value="baz">Foo Baz</Listbox.Item>
    </Listbox>
  ))
  m.getByRole('option', { name: 'Start' }).focus()
  await userEvent.keyboard('foo')
  await settle()
  expect(m.getByRole('option', { name: 'Foo' })).toHaveFocus()
  await userEvent.keyboard(' ')
  await settle()
  expect(m.getByRole('option', { name: 'Foo Bar' })).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  await userEvent.keyboard('baz')
  await settle()
  expect(m.getByRole('option', { name: 'Foo Baz' })).toHaveFocus()
  expectUnselected(m.getAllByRole('option'))
  expect(change).not.toHaveBeenCalled()
})

test('listbox.keyboard.24: explicit textValue controls typeahead instead of rendered text', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Names" onValueChange={change}>
      <Listbox.Item value="start">Start</Listbox.Item>
      <Listbox.Item value="named" textValue="Zebra">
        Illustrated animal
      </Listbox.Item>
      <Listbox.Item value="visible">Zebra visible text</Listbox.Item>
    </Listbox>
  ))
  m.getByRole('option', { name: 'Start' }).focus()
  await userEvent.keyboard('z')
  await settle()
  expect(m.getByRole('option', { name: 'Illustrated animal' })).toHaveFocus()
  expect(m.getByRole('option', { name: 'Zebra visible text' })).not.toHaveFocus()
  expectUnselected(m.getAllByRole('option'))
  expect(change).not.toHaveBeenCalled()
})

test('listbox.keyboard.17: the same character after the 700ms idle timeout resumes beyond the current match', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  m.getByRole('option', { name: 'Apple' }).focus()
  await userEvent.keyboard('p')
  await settle()
  expect(m.getByRole('option', { name: 'Pear' })).toHaveFocus()
  // Leave a 300ms margin beyond the accepted 700ms idle deadline.
  await new Promise<void>((resolve) => setTimeout(resolve, 1000))
  await userEvent.keyboard('p')
  await settle()
  expect(m.getByRole('option', { name: 'Plum' })).toHaveFocus()
  expectUnselected(m.getAllByRole('option'))
  expect(change).not.toHaveBeenCalled()
})
