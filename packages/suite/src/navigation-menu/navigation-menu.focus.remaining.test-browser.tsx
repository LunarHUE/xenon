import { NavigationMenu as Nav } from '@xenon-ui/solid/navigation-menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
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
  return within(document.body)
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
function Panels(props: {
  hover?: boolean
  value?: string | null
  onValueChange?: (value: string | null) => void
}) {
  return (
    <>
      <button>Before</button>
      <Nav
        openOnHover={props.hover ?? false}
        openDelay={0}
        closeDelay={30}
        value={props.value}
        onValueChange={props.onValueChange}
      >
        <Nav.List style={{ display: 'flex', gap: '80px' }}>
          <Nav.Item value="products">
            <Nav.Trigger>Products</Nav.Trigger>
          </Nav.Item>
          <Nav.Item value="docs">
            <Nav.Trigger>Docs</Nav.Trigger>
          </Nav.Item>
        </Nav.List>
        <Nav.Portal>
          <Nav.Positioner>
            <Nav.Viewport>
              <Nav.Content value="products">
                <Nav.Link href="#one">One</Nav.Link>
                <Nav.Link href="#two">Two</Nav.Link>
              </Nav.Content>
              <Nav.Content value="docs">
                <Nav.Link href="#guide">Guide</Nav.Link>
                <Nav.Link href="#reference">Reference</Nav.Link>
                <input aria-label="Search docs" />
                <button>Search</button>
              </Nav.Content>
            </Nav.Viewport>
          </Nav.Positioner>
        </Nav.Portal>
      </Nav>
      <button style={{ position: 'fixed', left: '20px', top: '350px' }}>After</button>
    </>
  )
}

test('hover-leave closure preserves focus without restoring the trigger navigation-menu.focus.2', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels hover onValueChange={changed} />)
  const before = m.getByRole('button', { name: 'Before' })
  const trigger = m.getByRole('button', { name: 'Products' })
  before.focus()
  await userEvent.hover(trigger)
  await expanded(trigger, true)
  expect(before).toHaveFocus()
  await userEvent.hover(m.getByRole('button', { name: 'After' }))
  await expanded(trigger, false)
  expect(before).toHaveFocus()
  expect(changed.mock.calls).toEqual([['products'], [null]])
})

test('native outside click closes the popup and retains the clicked target focus navigation-menu.focus.3 navigation-menu.dismissal.1', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels onValueChange={changed} />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  const outside = m.getByRole('button', { name: 'After' })
  await userEvent.click(outside)
  await expanded(trigger, false)
  await focused(outside)
  expect(m.queryByRole('link', { name: 'One' })).toBeNull()
  expect(changed.mock.calls).toEqual([['products'], [null]])
})

test('Tab through arbitrary controls in the final-trigger panel exits the bar and closes navigation-menu.focus.5', async () => {
  const m = mount(() => <Panels />)
  const trigger = m.getByRole('button', { name: 'Docs' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('Guide'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByText('Reference'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByLabelText('Search docs'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'Search' }))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  await expanded(trigger, false)
})

test('backward Tab from the first trigger exits to the preceding stop and closes navigation-menu.focus.6', async () => {
  const m = mount(() => <Panels />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await expanded(trigger, true)
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  await focused(m.getByRole('button', { name: 'Before' }))
  await expanded(trigger, false)
})

test('forward Tab from the last trigger closes a different selected panel and keeps outside focus navigation-menu.focus.5', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels onValueChange={changed} />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  products.focus()
  await userEvent.keyboard('{Enter}')
  await expanded(products, true)
  await userEvent.keyboard('{ArrowRight}')
  await focused(docs)
  expect(products).toHaveAttribute('aria-expanded', 'true')
  expect(docs).toHaveAttribute('aria-expanded', 'false')
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  await expanded(products, false)
  expect(changed.mock.calls).toEqual([['products'], [null]])
})

test('hover-open panel accepts Tab then Escape restores its trigger and Enter reopens navigation-menu.focus.12', async () => {
  const m = mount(() => <Panels hover />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.hover(trigger)
  await expanded(trigger, true)
  await userEvent.keyboard('{Tab}')
  await focused(m.getByText('One'))
  await userEvent.keyboard('{Escape}')
  await expanded(trigger, false)
  await focused(trigger)
  await userEvent.keyboard('{Enter}')
  await expanded(trigger, true)
  await userEvent.keyboard('{Tab}')
  await focused(m.getByText('One'))
})

test('opening a second panel after keyboard closure gives Tab its own content order navigation-menu.focus.13', async () => {
  const m = mount(() => <Panels />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  products.focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByText('One'))
  await userEvent.keyboard('{Escape}')
  await expanded(products, false)
  await focused(products)
  await userEvent.keyboard('{ArrowRight}')
  await focused(docs)
  await userEvent.keyboard('{Enter}')
  await expanded(docs, true)
  await userEvent.keyboard('{Tab}')
  await focused(m.getByText('Guide'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByText('Reference'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByLabelText('Search docs'))
  expect(products).toHaveAttribute('aria-expanded', 'false')
  expect(docs).toHaveAttribute('aria-expanded', 'true')
})

test('controlled open selection reports hover and click switches while retaining its pinned panel navigation-menu.state.5', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels hover value="products" onValueChange={changed} />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  await expanded(products, true)
  await userEvent.hover(docs)
  await expect.poll(() => changed.mock.calls.length).toBe(1)
  expect(changed.mock.calls).toEqual([['docs']])
  expect(products).toHaveAttribute('aria-expanded', 'true')
  expect(docs).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(docs)
  expect(changed.mock.calls).toEqual([['docs'], ['docs']])
  expect(products).toHaveAttribute('aria-expanded', 'true')
  expect(docs).toHaveAttribute('aria-expanded', 'false')
})

test('trigger arrows after keyboard opening move focus without duplicate value changes navigation-menu.keyboard.18', async () => {
  const changed = vi.fn()
  const m = mount(() => <Panels onValueChange={changed} />)
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  products.focus()
  await userEvent.keyboard('{Enter}')
  await expanded(products, true)
  expect(changed.mock.calls).toEqual([['products']])
  await userEvent.keyboard('{ArrowRight}')
  await focused(docs)
  expect(changed.mock.calls).toEqual([['products']])
  await userEvent.keyboard('{Enter}')
  await expanded(docs, true)
  expect(changed.mock.calls).toEqual([['products'], ['docs']])
  await userEvent.keyboard('{ArrowLeft}')
  await focused(products)
  expect(changed.mock.calls).toEqual([['products'], ['docs']])
})
