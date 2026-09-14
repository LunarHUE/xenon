import { Toggle, ToggleGroup, Toolbar } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { expect, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.keyboard.20', async () => {
  const changed = vi.fn()
  const [bold, setBold] = createSignal(false)
  const m = mount('toolbar', {
    'aria-label': 'Format',
    children: () => (
      <>
        <Toolbar.Button
          as={Toggle}
          pressed={bold()}
          onPressedChange={(next: boolean) => {
            setBold(next)
            changed(next)
          }}
        >
          Bold
        </Toolbar.Button>
        <Toolbar.Button>Other</Toolbar.Button>
        <output data-bold={bold() ? 'yes' : 'no'}>Document</output>
      </>
    ),
  })
  const toggle = within(m.container).getByRole('button', { name: 'Bold' })
  const output = within(m.container).getByText('Document')
  toggle.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  expect(toggle).toHaveAttribute('aria-pressed', 'true')
  expect(output).toHaveAttribute('data-bold', 'yes')
  await userEvent.keyboard(' ')
  await m.settle()
  expect(toggle).toHaveAttribute('aria-pressed', 'false')
  expect(output).toHaveAttribute('data-bold', 'no')
  expect(changed.mock.calls).toEqual([[true], [false]])
})

spec('toolbar.pointer.3', async () => {
  const author = vi.fn()
  const changed = vi.fn()
  const m = mount('toolbar', {
    'aria-label': 'Format',
    children: () => (
      <ToggleGroup onValueChange={changed}>
        <Toolbar.Button as={ToggleGroup.Item} value="bold" onClick={author}>
          Bold
        </Toolbar.Button>
        <Toolbar.Button as={ToggleGroup.Item} value="italic">
          Italic
        </Toolbar.Button>
      </ToggleGroup>
    ),
  })
  const bold = within(m.container).getByRole('button', { name: 'Bold' })
  await userEvent.click(bold)
  await m.settle()
  expect(author).toHaveBeenCalledOnce()
  expect(changed.mock.calls).toEqual([['bold']])
  expect(bold).toHaveAttribute('aria-pressed', 'true')
})

spec('toolbar.pointer.5', async () => {
  const [disabled, setDisabled] = createSignal(true)
  const m = mount('toolbar', {
    'aria-label': 'Actions',
    children: () => (
      <>
        <Toolbar.Button>Before</Toolbar.Button>
        <Toolbar.Button
          as="input"
          value="Action"
          disabled={disabled()}
          focusableWhenDisabled={false}
        />
      </>
    ),
  })
  const scope = within(m.container)
  const before = scope.getByRole('button', { name: 'Before' })
  const input = scope.getByRole('button', { name: 'Action' })
  expect(input.tagName).toBe('INPUT')
  before.focus()
  await userEvent.click(input, { force: true })
  await m.settle()
  expect(input).not.toHaveFocus()
  setDisabled(false)
  await m.settle()
  await userEvent.click(input)
  await m.settle()
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('tabindex', '0')
})
