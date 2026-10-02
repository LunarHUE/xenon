import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { Menu } from './index'

afterEach(cleanup)

test('Menu.Trigger preserves host type defaults and reactive author overrides', () => {
  const [type, setType] = createSignal<'submit' | 'reset' | undefined>('submit')
  const view = render(() => (
    <>
      <Menu>
        <Menu.Trigger>Default</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger type={type()}>Author</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger as="div">Generic</Menu.Trigger>
      </Menu>
    </>
  ))
  flush()
  const native = view.getByRole('button', { name: 'Default' })
  const author = view.getByRole('button', { name: 'Author' })
  const generic = view.getByRole('button', { name: 'Generic' })
  expect(native).toHaveAttribute('type', 'button')
  expect(author).toHaveAttribute('type', 'submit')
  expect(generic.tagName).toBe('DIV')
  expect(generic).not.toHaveAttribute('type')
  setType('reset')
  flush()
  expect(author).toHaveAttribute('type', 'reset')
  setType(undefined)
  flush()
  expect(author).not.toHaveAttribute('type')
  expect(author).toHaveProperty('type', 'submit')
  expect(native).toHaveAttribute('type', 'button')
  expect(generic).not.toHaveAttribute('type')
})
