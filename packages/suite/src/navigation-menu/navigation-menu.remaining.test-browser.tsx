import { NavigationMenu as Nav } from '@xenon-ui/solid/navigation-menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

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
async function focused(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(element)
}
async function visible(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return (
        element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
      )
    })
    .toBe(true)
}

test('navigation landmark has a default label and accepts a live author override navigation-menu.roles.5', () => {
  const [label, setLabel] = createSignal('Products')
  const m = mount(() => (
    <>
      <Nav>
        <Nav.List />
      </Nav>
      <Nav aria-label={label()}>
        <Nav.List />
      </Nav>
    </>
  ))
  expect(m.getByRole('navigation', { name: 'Main navigation' })).toHaveAttribute(
    'aria-label',
    'Main navigation'
  )
  const root = m.getByRole('navigation', { name: 'Products' })
  setLabel('Documentation')
  flush()
  expect(m.getByRole('navigation', { name: 'Documentation' })).toBe(root)
  expect(root).toHaveAttribute('aria-label', 'Documentation')
})

test('current-page marker is absent on ordinary links and clears when current changes navigation-menu.roles.6', () => {
  const [current, setCurrent] = createSignal(true)
  const m = mount(() => (
    <Nav>
      <Nav.List>
        <li>
          <Nav.Link href="#guide" current={current()}>
            Guide
          </Nav.Link>
        </li>
        <li>
          <Nav.Link href="#about">About</Nav.Link>
        </li>
      </Nav.List>
    </Nav>
  ))
  const guide = m.getByRole('link', { name: 'Guide' })
  expect(guide).toHaveAttribute('aria-current', 'page')
  expect(m.getByRole('link', { name: 'About' })).not.toHaveAttribute('aria-current')
  setCurrent(false)
  flush()
  expect(guide).not.toHaveAttribute('aria-current')
  setCurrent(true)
  flush()
  expect(guide).toHaveAttribute('aria-current', 'page')
})

test('disabled trigger style hook appears and disappears on the same host navigation-menu.roles.7', () => {
  const [disabled, setDisabled] = createSignal(false)
  const m = mount(() => (
    <Nav>
      <Nav.List>
        <Nav.Item value="products">
          <Nav.Trigger disabled={disabled()}>Products</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
    </Nav>
  ))
  const trigger = m.getByRole('button', { name: 'Products' })
  expect(trigger).not.toHaveAttribute('data-disabled')
  expect(trigger).toBeEnabled()
  setDisabled(true)
  flush()
  expect(trigger).toHaveAttribute('data-disabled')
  expect(trigger).toBeDisabled()
  setDisabled(false)
  flush()
  expect(trigger).not.toHaveAttribute('data-disabled')
  expect(trigger).toBeEnabled()
})

function Panels(props: { defaultValue?: string; onValueChange?: (value: string | null) => void }) {
  return (
    <Nav openOnHover={false} defaultValue={props.defaultValue} onValueChange={props.onValueChange}>
      <Nav.List>
        <Nav.Item value="products">
          <Nav.Trigger>Products</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="docs">
          <Nav.Trigger>Docs</Nav.Trigger>
        </Nav.Item>
        <li>
          <Nav.Link href="#about">About</Nav.Link>
        </li>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Viewport>
          <Nav.Content value="products">
            <Nav.Link href="#one">One</Nav.Link>
            <Nav.Link href="#two">Two</Nav.Link>
            <Nav.Link href="#three">Three</Nav.Link>
          </Nav.Content>
          <Nav.Content value="docs">
            <Nav.Link href="#guide">Guide</Nav.Link>
          </Nav.Content>
        </Nav.Viewport>
      </Nav.Positioner>
    </Nav>
  )
}

test('defaultValue opens its named panel on first render without emitting a request navigation-menu.state.1', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels defaultValue="docs" onValueChange={changed} />)
  expect(m.getByRole('button', { name: 'Docs' })).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('button', { name: 'Products' })).toHaveAttribute('aria-expanded', 'false')
  const guide = m.getByText('Guide')
  await visible(guide)
  expect(guide.closest('[data-navigation-panel]')).not.toHaveAttribute('hidden')
  expect(m.getByText('One').closest('[data-navigation-panel]')).toHaveAttribute('hidden')
  expect(changed).not.toHaveBeenCalled()
})

for (const key of ['{Enter}', ' ']) {
  test(`native ${key === ' ' ? 'Space' : 'Enter'} toggles the focused disclosure open and closed navigation-menu.keyboard.1`, async () => {
    const changed = vi.fn()
    const m = mount(() => <Panels onValueChange={changed} />)
    const trigger = m.getByRole('button', { name: 'Products' })
    trigger.focus()
    await userEvent.keyboard(key)
    await visible(m.getByText('One'))
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(key)
    await expect
      .poll(() => {
        flush()
        return trigger.getAttribute('aria-expanded')
      })
      .toBe('false')
    expect(trigger).toHaveFocus()
    expect(m.queryByRole('link', { name: 'One' })).toBeNull()
    expect(changed.mock.calls).toEqual([['products'], [null]])
  })
}

test('list arrows traverse links in both directions and Home/End use native endpoints navigation-menu.keyboard.5 navigation-menu.keyboard.6', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels onValueChange={changed} />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  const about = m.getByRole('link', { name: 'About' })
  products.focus()
  await userEvent.keyboard('{ArrowRight}')
  await focused(docs)
  await userEvent.keyboard('{ArrowRight}')
  await focused(about)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(docs)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(products)
  docs.focus()
  await userEvent.keyboard('{End}')
  await focused(about)
  await userEvent.keyboard('{Home}')
  await focused(products)
  expect(changed).not.toHaveBeenCalled()
  expect(products).toHaveAttribute('aria-expanded', 'false')
  expect(docs).toHaveAttribute('aria-expanded', 'false')
})

test('panel Home/End reach its endpoints and vertical arrows never wrap navigation-menu.keyboard.11 navigation-menu.keyboard.12', async () => {
  const m = mount(() => <Panels />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  const one = m.getByText('One')
  const two = m.getByText('Two')
  const three = m.getByText('Three')
  await focused(one)
  await userEvent.keyboard('{ArrowDown}')
  await focused(two)
  await userEvent.keyboard('{End}')
  await focused(three)
  await userEvent.keyboard('{ArrowDown}')
  expect(three).toHaveFocus()
  await userEvent.keyboard('{Home}')
  await focused(one)
  await userEvent.keyboard('{ArrowUp}')
  expect(one).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})
