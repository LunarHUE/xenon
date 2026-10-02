import { Menu } from '@xenon-ui/solid/menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('native and generic menu triggers expose their menu popup type menu.roles.2', () => {
  const m = mount(() => (
    <>
      <Menu>
        <Menu.Trigger>Native actions</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger as="div">Generic actions</Menu.Trigger>
      </Menu>
    </>
  ))
  expect(m.getByRole('button', { name: 'Native actions' })).toHaveAttribute('aria-haspopup', 'menu')
  expect(m.getByRole('button', { name: 'Generic actions' })).toHaveAttribute(
    'aria-haspopup',
    'menu'
  )
})

test('group labels default to hidden roleless text and preserve a reactive author override menu.roles.20', () => {
  const [hidden, setHidden] = createSignal<'true' | 'false'>('false')
  const m = mount(() => (
    <Menu>
      <Menu.Group>
        <Menu.GroupLabel data-testid="default-label">Workspace</Menu.GroupLabel>
      </Menu.Group>
      <Menu.Group>
        <Menu.GroupLabel data-testid="author-label" aria-hidden={hidden()}>
          Tools
        </Menu.GroupLabel>
      </Menu.Group>
    </Menu>
  ))
  const defaultLabel = m.getByTestId('default-label')
  const authorLabel = m.getByTestId('author-label')
  expect(defaultLabel).not.toHaveAttribute('role')
  expect(defaultLabel).toHaveAttribute('aria-hidden', 'true')
  expect(m.getByRole('group', { name: 'Workspace' })).toHaveAttribute(
    'aria-labelledby',
    defaultLabel.id
  )
  expect(authorLabel).not.toHaveAttribute('role')
  expect(authorLabel).toHaveAttribute('aria-hidden', 'false')
  expect(m.getByRole('group', { name: 'Tools' })).toHaveAttribute('aria-labelledby', authorLabel.id)
  setHidden('true')
  flush()
  expect(authorLabel).toHaveAttribute('aria-hidden', 'true')
  expect(m.getByRole('group', { name: 'Tools' })).toHaveAttribute('aria-labelledby', authorLabel.id)
})

test('trigger defaults its native type without forcing generic hosts or replacing an author type menu.roles.33', () => {
  const [type, setType] = createSignal<'submit' | 'reset'>('submit')
  const m = mount(() => (
    <>
      <Menu>
        <Menu.Trigger>Default actions</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger type={type()}>Author actions</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger as="div">Generic actions</Menu.Trigger>
      </Menu>
    </>
  ))
  expect(m.getByRole('button', { name: 'Default actions' })).toHaveAttribute('type', 'button')
  const author = m.getByRole('button', { name: 'Author actions' })
  expect(author).toHaveAttribute('type', 'submit')
  expect(m.getByRole('button', { name: 'Generic actions' })).not.toHaveAttribute('type')
  setType('reset')
  flush()
  expect(author).toHaveAttribute('type', 'reset')
})

test('generic menu triggers receive a button role and native triggers omit a redundant role menu.roles.34', () => {
  const m = mount(() => (
    <>
      <Menu>
        <Menu.Trigger>Native actions</Menu.Trigger>
      </Menu>
      <Menu>
        <Menu.Trigger as="div">Generic actions</Menu.Trigger>
      </Menu>
    </>
  ))
  const native = m.getByRole('button', { name: 'Native actions' })
  const generic = m.getByRole('button', { name: 'Generic actions' })
  expect(native.tagName).toBe('BUTTON')
  expect(native).not.toHaveAttribute('role')
  expect(generic.tagName).toBe('DIV')
  expect(generic).toHaveAttribute('role', 'button')
})
