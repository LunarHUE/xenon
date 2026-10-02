import { NavigationMenu as Nav } from '@xenon-ui/solid/navigation-menu'
import { render } from '@solidjs/web'
import type { ComponentProps, JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, createSignal, flush, omit } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
  return { container, ...within(document.body) }
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
async function expanded(trigger: HTMLElement, value: boolean) {
  await expect
    .poll(() => {
      flush()
      return trigger.getAttribute('aria-expanded')
    })
    .toBe(String(value))
}
function Panels(props: { onValueChange?: (value: string | null) => void }) {
  return (
    <Nav openOnHover={false} onValueChange={props.onValueChange}>
      <Nav.List>
        <Nav.Item value="products">
          <Nav.Trigger>Products</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="docs">
          <Nav.Trigger>Docs</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Viewport>
          <Nav.Content value="products" data-testid="products-panel" style={{ padding: '16px' }}>
            <Nav.Link href="#one">One</Nav.Link>
            <Nav.Link href="#two">Two</Nav.Link>
            <Nav.Link href="#three">Three</Nav.Link>
          </Nav.Content>
          <Nav.Content value="docs" data-testid="docs-panel">
            <Nav.Link href="#guide">Guide</Nav.Link>
          </Nav.Content>
        </Nav.Viewport>
      </Nav.Positioner>
    </Nav>
  )
}

test('live item deletion leaves arrows using surviving native list stops navigation-menu.keyboard.8', async () => {
  const first = { value: 'a', label: 'Alpha' },
    second = { value: 'b', label: 'Beta' },
    third = { value: 'c', label: 'Gamma' }
  const [items, setItems] = createSignal([first, second, third])
  const changed = vi.fn()
  const m = mount(() => (
    <Nav onValueChange={changed}>
      <Nav.List>
        <For each={items()}>
          {(item) => (
            <Nav.Item value={item.value}>
              <Nav.Trigger>{item.label}</Nav.Trigger>
            </Nav.Item>
          )}
        </For>
      </Nav.List>
    </Nav>
  ))
  const alpha = m.getByRole('button', { name: 'Alpha' })
  alpha.focus()
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('button', { name: 'Beta' }))
  setItems([first, third])
  flush()
  expect(m.queryByRole('button', { name: 'Beta' })).toBeNull()
  alpha.focus()
  await userEvent.keyboard('{ArrowRight}')
  await focused(m.getByRole('button', { name: 'Gamma' }))
  await userEvent.keyboard('{ArrowLeft}')
  await focused(alpha)
  expect(changed).not.toHaveBeenCalled()
})

/** Author forwarding host with an explicit disabled prop and a focusable div. */
function FocusableTrigger(props: ComponentProps<'div'> & { disabled?: boolean }) {
  const rest = omit(props, 'disabled')
  return <div {...rest} role="button" tabindex="0" />
}

test('focused disabled custom trigger rejects native open keys and opens after enabling navigation-menu.keyboard.19', async () => {
  const [disabled, setDisabled] = createSignal(true)
  const changed = vi.fn()
  const m = mount(() => (
    <Nav openOnHover={false} onValueChange={changed}>
      <Nav.List>
        <Nav.Item value="products">
          <Nav.Trigger as={FocusableTrigger} disabled={disabled()}>
            Products
          </Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Content value="products">
          <Nav.Link href="#one">One</Nav.Link>
        </Nav.Content>
      </Nav.Positioner>
    </Nav>
  ))
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  // A custom host remains focusable when disabled, allowing real key events to
  // exercise the guard; a natively disabled button cannot receive focus.
  for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
    await userEvent.keyboard(key)
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(changed).not.toHaveBeenCalled()
  }
  setDisabled(false)
  flush()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  expect(changed.mock.calls).toEqual([['products']])
})

test('horizontal panel arrows walk children in each direction navigation-menu.keyboard.10', async () => {
  const m = mount(() => <Panels />)
  m.getByRole('button', { name: 'Products' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  const one = m.getByText('One'),
    two = m.getByText('Two')
  await focused(one)
  await userEvent.keyboard('{ArrowDown}')
  await focused(two)
  await userEvent.keyboard('{ArrowUp}')
  await focused(one)
  await userEvent.keyboard('{ArrowRight}')
  await focused(two)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(one)
})

test('Escape from every panel link restores the trigger and Enter reopens navigation-menu.keyboard.16', async () => {
  const m = mount(() => <Panels />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  for (const [index, name] of ['One', 'Two', 'Three'].entries()) {
    await userEvent.keyboard('{ArrowDown}')
    await focused(m.getByText('One'))
    for (let step = 0; step < index; step++) await userEvent.keyboard('{ArrowDown}')
    await focused(m.getByText(name))
    await userEvent.keyboard('{Escape}')
    await expanded(trigger, false)
    await focused(trigger)
    await userEvent.keyboard('{Enter}')
    await expanded(trigger, true)
    expect(trigger).toHaveFocus()
  }
})

test('pointer down inside the active panel cannot let a retained inactive panel dismiss it navigation-menu.state.9', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels onValueChange={changed} />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  docs.focus()
  await userEvent.keyboard('{Enter}')
  await expanded(docs, true)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(products)
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  const inactive = m.getByTestId('docs-panel'),
    active = m.getByTestId('products-panel')
  expect(inactive).toBeInTheDocument()
  expect(inactive).toHaveAttribute('hidden')
  await userEvent.click(active, { position: { x: 4, y: 4 } })
  expect(products).toHaveAttribute('aria-expanded', 'true')
  expect(docs).toHaveAttribute('aria-expanded', 'false')
  expect(m.getByTestId('docs-panel')).toBe(inactive)
  expect(changed.mock.calls).toEqual([['docs'], ['products']])
})

test('direct content stays inside its own item without creating a viewport navigation-menu.positioning.14', async () => {
  const m = mount(() => (
    <Nav openOnHover={false}>
      <Nav.List>
        <Nav.Item value="products" data-testid="item">
          <Nav.Trigger>Products</Nav.Trigger>
          <Nav.Positioner>
            <Nav.Content data-testid="panel">
              <Nav.Link href="#one">One</Nav.Link>
            </Nav.Content>
          </Nav.Positioner>
        </Nav.Item>
      </Nav.List>
    </Nav>
  ))
  m.getByRole('button', { name: 'Products' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  expect(m.getByTestId('panel').closest('li')).toBe(m.getByTestId('item'))
  expect(m.container.querySelector('[data-part="viewport"]')).toBeNull()
  // This covers the top-level direct-content arrangement. The research's
  // coordinated nested sub-viewport alternative is not asserted here.
})

test('root and list publish live orientation data without composite ARIA navigation-menu.roles.4', () => {
  const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
  const m = mount(() => (
    <Nav orientation={orientation()}>
      <Nav.List>
        <Nav.Item value="products">
          <Nav.Trigger>Products</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
    </Nav>
  ))
  const root = m.getByRole('navigation'),
    list = m.getByRole('list')
  for (const value of ['horizontal', 'vertical', 'horizontal'] as const) {
    setOrientation(value)
    flush()
    for (const element of [root, list]) {
      expect(element).toHaveAttribute('data-orientation', value)
      expect(element).not.toHaveAttribute('aria-orientation')
    }
  }
  // Coordinated nested root/list orientation is not asserted in this fixture.
})

test('closed and open navigation pass the configured axe scan navigation-menu.a11y.1', async () => {
  const m = mount(() => <Panels />)
  expect(m.getByRole('button', { name: 'Products' })).toHaveAttribute('aria-expanded', 'false')
  await expectNoViolations(m.container)
  m.getByRole('button', { name: 'Products' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  await expectNoViolations(m.container)
})
