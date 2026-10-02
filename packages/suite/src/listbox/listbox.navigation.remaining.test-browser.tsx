import { Listbox } from '@xenon-ui/solid/listbox'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <button type="button">Before</button>
        {children()}
        <button type="button">After</button>
      </>
    ),
    container
  )
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
  return { unmount, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('listbox.keyboard.1 and listbox.focus.10: native entry and root focus delegate to the first enabled or selected option without selection changes', async () => {
  for (const defaultValue of [undefined, 'pear']) {
    const change = vi.fn()
    const m = mount(() => (
      <Listbox aria-label="Fruit" defaultValue={defaultValue} onValueChange={change}>
        <Listbox.Item value="blocked" disabled>
          Unavailable
        </Listbox.Item>
        <Listbox.Item value="apple">Apple</Listbox.Item>
        <Listbox.Item value="pear">Pear</Listbox.Item>
      </Listbox>
    ))
    const destination = m.getByRole('option', { name: defaultValue ? 'Pear' : 'Apple' })
    m.getByRole('button', { name: 'Before' }).focus()
    await userEvent.tab()
    await settle()
    expect(destination).toHaveFocus()
    expect(destination).toHaveAttribute('tabindex', '0')
    for (const option of m.getAllByRole('option')) {
      expect(option).toHaveAttribute(
        'aria-selected',
        defaultValue && option === destination ? 'true' : 'false'
      )
    }
    m.getByRole('button', { name: 'After' }).focus()
    m.getByRole('listbox').focus()
    await settle()
    expect(destination).toHaveFocus()
    expect(destination).toHaveAttribute('tabindex', '0')
    expect(change).not.toHaveBeenCalled()
    m.unmount()
  }
})

test('listbox.keyboard.33: multiple virtual arrows and Home End move only the active descendant', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" virtualFocus onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="blocked" disabled>
        Unavailable
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  const root = m.getByRole('listbox')
  m.getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  await settle()
  expect(root).toHaveFocus()
  expect(root).toHaveAttribute('aria-activedescendant', m.getByRole('option', { name: 'Apple' }).id)
  for (const [key, label] of [
    ['{ArrowDown}', 'Pear'],
    ['{End}', 'Plum'],
    ['{Home}', 'Apple'],
    ['{ArrowUp}', 'Plum'],
  ] as const) {
    await userEvent.keyboard(key)
    await settle()
    expect(root).toHaveFocus()
    expect(root).toHaveAttribute('aria-activedescendant', m.getByRole('option', { name: label }).id)
    for (const option of m.getAllByRole('option')) {
      expect(option).toHaveAttribute('aria-selected', 'false')
      expect(option).toHaveAttribute('tabindex', '-1')
    }
    expect(change).not.toHaveBeenCalled()
  }
})

test('listbox.keyboard.50 and listbox.state.9: repeated multiple Enter toggles one highlighted option back to empty', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = m.getByRole('option', { name: 'Apple' })
  const pear = m.getByRole('option', { name: 'Pear' })
  apple.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(pear).toHaveAttribute('aria-selected', 'false')
  expect(change.mock.calls).toEqual([[['apple']]])
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(apple).toHaveFocus()
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(pear).toHaveAttribute('aria-selected', 'false')
  expect(change.mock.calls).toEqual([[['apple']], [[]]])
})
