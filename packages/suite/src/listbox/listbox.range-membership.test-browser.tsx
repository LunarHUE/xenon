import { Listbox } from '@xenon-ui/solid/listbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
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
function selected(options: HTMLElement[], names: string[]) {
  for (const option of options)
    expect(option).toHaveAttribute('aria-selected', String(names.includes(option.textContent!)))
}

test('listbox.keyboard.35: range extension and shrink overwrite every option membership including previous outside selection', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultValue={['plum']}
      onValueChange={change}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="blocked" disabled>
        Blocked
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  const options = view.getAllByRole('option')
  selected(options, ['Plum'])
  view.getByRole('option', { name: 'Apple' }).focus()
  for (const [key, names] of [
    ['{Shift>}{ArrowDown}{/Shift}', ['Apple', 'Pear']],
    ['{Shift>}{ArrowDown}{/Shift}', ['Apple', 'Pear', 'Cherry']],
    ['{Shift>}{ArrowUp}{/Shift}', ['Apple', 'Pear']],
    ['{Shift>}{ArrowUp}{/Shift}', ['Apple']],
  ] as const) {
    await userEvent.keyboard(key)
    await settle()
    selected(options, [...names])
  }
  expect(change.mock.calls).toEqual([
    [['apple', 'pear']],
    [['apple', 'pear', 'cherry']],
    [['apple', 'pear']],
    [['apple']],
  ])
})

test('listbox.keyboard.36: plain click replaces the range anchor before the next keyboard extension', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultValue={['apple', 'pear']}
      onValueChange={change}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  const options = view.getAllByRole('option')
  await userEvent.click(view.getByRole('option', { name: 'Cherry' }))
  await settle()
  selected(options, ['Apple', 'Pear', 'Cherry'])
  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
  await settle()
  selected(options, ['Cherry', 'Plum'])
  expect(change.mock.calls).toEqual([[['apple', 'pear', 'cherry']], [['cherry', 'plum']]])
})

test('listbox.roles.21: disabling the active option repairs roving focus eligibility without selecting a replacement', async () => {
  const [disabled, setDisabled] = createSignal(false)
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <Listbox.Item value="apple" disabled={disabled()}>
        Apple
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const pear = view.getByRole('option', { name: 'Pear' })
  expect(apple).toHaveAttribute('tabindex', '0')
  expect(apple).not.toHaveAttribute('aria-disabled')
  expect(apple).not.toHaveAttribute('data-disabled')
  setDisabled(true)
  await settle()
  expect(view.getByRole('option', { name: 'Apple' })).toBe(apple)
  expect(apple).toHaveAttribute('tabindex', '-1')
  expect(apple).toHaveAttribute('aria-disabled', 'true')
  expect(apple).toHaveAttribute('data-disabled', '')
  expect(pear).toHaveAttribute('tabindex', '0')
  selected([apple, pear], [])
  setDisabled(false)
  await settle()
  expect(apple).not.toHaveAttribute('aria-disabled')
  expect(apple).not.toHaveAttribute('data-disabled')
  expect([apple, pear].filter((option) => option.tabIndex === 0)).toHaveLength(1)
  selected([apple, pear], [])
  expect(change).not.toHaveBeenCalled()
})
