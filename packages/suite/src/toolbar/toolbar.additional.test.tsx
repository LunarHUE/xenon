import { ToggleGroup, Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.state.10', () => {
  const changed = vi.fn()
  const m = mount('toolbar', {
    'aria-label': 'Formatting',
    children: () => (
      <>
        <ToggleGroup defaultValue="left" onValueChange={changed} aria-label="Align">
          <Toolbar.Button as={ToggleGroup.Item} value="left">
            Left
          </Toolbar.Button>
          <Toolbar.Button as={ToggleGroup.Item} value="right">
            Right
          </Toolbar.Button>
        </ToggleGroup>
        <ToggleGroup
          mode="multiple"
          defaultValue={['bold', 'italic']}
          onValueChange={changed}
          aria-label="Style"
        >
          <Toolbar.Button as={ToggleGroup.Item} value="bold">
            Bold
          </Toolbar.Button>
          <Toolbar.Button as={ToggleGroup.Item} value="italic">
            Italic
          </Toolbar.Button>
          <Toolbar.Button as={ToggleGroup.Item} value="underline">
            Underline
          </Toolbar.Button>
        </ToggleGroup>
      </>
    ),
  })
  const scope = within(m.container)
  for (const name of ['Left', 'Bold', 'Italic'])
    expect(scope.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
  for (const name of ['Right', 'Underline'])
    expect(scope.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
  expect(changed).not.toHaveBeenCalled()
})

spec('toolbar.state.12', async () => {
  const [value, setValue] = createSignal('left')
  const changed = vi.fn()
  const m = mount('toolbar', {
    'aria-label': 'Align',
    children: () => (
      <ToggleGroup value={value()} onValueChange={changed}>
        <Toolbar.Button as={ToggleGroup.Item} value="left">
          Left
        </Toolbar.Button>
        <Toolbar.Button as={ToggleGroup.Item} value="right">
          Right
        </Toolbar.Button>
      </ToggleGroup>
    ),
  })
  const scope = within(m.container)
  const left = scope.getByRole('button', { name: 'Left' })
  const right = scope.getByRole('button', { name: 'Right' })
  expect(left).toHaveAttribute('aria-pressed', 'true')
  setValue('right')
  await m.settle()
  expect(left).toHaveAttribute('aria-pressed', 'false')
  expect(left).toHaveAttribute('data-state', 'off')
  expect(right).toHaveAttribute('aria-pressed', 'true')
  expect(right).toHaveAttribute('data-state', 'on')
  expect(changed).not.toHaveBeenCalled()
})
