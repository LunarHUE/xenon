import { CheckboxGroup } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(host)
}

async function settle() {
  flush()
  await new Promise((resolve) => setTimeout(resolve, 30))
  flush()
}

test('checkbox-group.focus.2: readonly items remain individually focusable', async () => {
  const query = mount(() => (
    <CheckboxGroup readonly aria-label="Choices">
      <CheckboxGroup.Item value="a" aria-label="A" />
      <CheckboxGroup.Item value="b" aria-label="B" />
      <CheckboxGroup.Item value="c" aria-label="C" />
    </CheckboxGroup>
  ))
  const inputs = query.getAllByRole('checkbox')

  for (const input of inputs) {
    input.focus()
    expect(input).toHaveFocus()
  }
})

test('checkbox-group.keyboard.3: readonly Space leaves selection and callbacks unchanged', async () => {
  const change = vi.fn()
  const checked = vi.fn()
  const query = mount(() => (
    <CheckboxGroup readonly defaultValue={['a']} onValueChange={change} aria-label="Choices">
      <CheckboxGroup.Item value="a" aria-label="A" onCheckedChange={checked} />
      <CheckboxGroup.Item value="b" aria-label="B" />
    </CheckboxGroup>
  ))
  const input = query.getByRole('checkbox', { name: 'A' })

  input.focus()
  await userEvent.keyboard('{Space}')
  await settle()
  expect(input).toBeChecked()
  expect(change).not.toHaveBeenCalled()
  expect(checked).not.toHaveBeenCalled()
})
