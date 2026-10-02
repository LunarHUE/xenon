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

test('listbox.keyboard.3: Tab enters an unselected multiple listbox at its first enabled option silently', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" onValueChange={change}>
      <Listbox.Item value="disabled" disabled>
        Unavailable
      </Listbox.Item>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  m.getByRole('button', { name: 'Before' }).focus()
  await userEvent.tab()
  await settle()
  const apple = m.getByRole('option', { name: 'Apple' })
  expect(apple).toHaveFocus()
  expect(apple).toHaveAttribute('tabindex', '0')
  for (const option of m.getAllByRole('option'))
    expect(option).toHaveAttribute('aria-selected', 'false')
  expect(change).not.toHaveBeenCalled()
  await userEvent.tab()
  await settle()
  expect(m.getByRole('button', { name: 'After' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  await settle()
  expect(apple).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('listbox.keyboard.43: plain-letter multiple typeahead moves focus without changing selected membership', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultValue={['apple']}
      onValueChange={change}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="papaya" disabled>
        Papaya
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  const apple = m.getByRole('option', { name: 'Apple' })
  const pear = m.getByRole('option', { name: 'Pear' })
  const plum = m.getByRole('option', { name: 'Plum' })
  apple.focus()
  await userEvent.keyboard('p')
  await settle()
  expect(pear).toHaveFocus()
  await userEvent.keyboard('p')
  await settle()
  expect(plum).toHaveFocus()
  await userEvent.keyboard('p')
  await settle()
  expect(pear).toHaveFocus()
  expect(apple).toHaveAttribute('aria-selected', 'true')
  for (const option of [m.getByRole('option', { name: 'Papaya' }), pear, plum]) {
    expect(option).toHaveAttribute('aria-selected', 'false')
  }
  expect(change).not.toHaveBeenCalled()
})
