import { NavigationMenu as Nav } from '@xenon-ui/solid/navigation-menu'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function setup() {
  const changed = vi.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <button>Before navigation</button>
        <Nav openOnHover={false} onValueChange={changed}>
          <Nav.List>
            <Nav.Item value="products">
              <Nav.Trigger>Products</Nav.Trigger>
            </Nav.Item>
            <Nav.Item value="company">
              <Nav.Link href="#company">Company</Nav.Link>
            </Nav.Item>
            <Nav.Item value="docs">
              <Nav.Trigger>Docs</Nav.Trigger>
            </Nav.Item>
          </Nav.List>
          <Nav.Positioner>
            <Nav.Viewport>
              <Nav.Content value="products">
                <Nav.Link href="#first">First product</Nav.Link>
                <Nav.Link href="#last">Last product</Nav.Link>
              </Nav.Content>
              <Nav.Content value="docs">
                <Nav.Link href="#guide">Guide</Nav.Link>
                <input aria-label="Search docs" />
                <button>Search</button>
              </Nav.Content>
            </Nav.Viewport>
          </Nav.Positioner>
        </Nav>
        <button>After navigation</button>
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
  return { ...within(container), changed }
}
async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}
async function expanded(node: HTMLElement, open: boolean) {
  await expect
    .poll(() => {
      flush()
      return node.getAttribute('aria-expanded')
    })
    .toBe(String(open))
}

for (const key of ['{Enter}', ' ']) {
  test(`native ${JSON.stringify(key)} repeatedly toggles the trigger without duplicate requests`, async () => {
    const m = setup()
    const trigger = m.getByRole('button', { name: 'Products' })
    trigger.focus()
    for (const open of [true, false, true, false]) {
      await userEvent.keyboard(key)
      await expanded(trigger, open)
      await focused(trigger)
    }
    expect(m.changed.mock.calls).toEqual([['products'], [null], ['products'], [null]])
  })
}

test('native reverse arrows and Home/End include plain top-level links without opening a panel', async () => {
  const m = setup()
  const products = m.getByRole('button', { name: 'Products' })
  const docs = m.getByRole('button', { name: 'Docs' })
  const company = m.getByRole('link', { name: 'Company' })
  docs.focus()
  await userEvent.keyboard('{ArrowLeft}')
  await focused(company)
  await userEvent.keyboard('{ArrowLeft}')
  await focused(products)
  await userEvent.keyboard('{End}')
  await focused(docs)
  await userEvent.keyboard('{Home}')
  await focused(products)
  expect(m.changed).not.toHaveBeenCalled()
})

test('panel Home/End reach enabled child endpoints and vertical arrows clamp there', async () => {
  const m = setup()
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  const first = m.getByRole('link', { name: 'First product' })
  const last = m.getByRole('link', { name: 'Last product' })
  await focused(first)
  await userEvent.keyboard('{ArrowUp}')
  await focused(first)
  await userEvent.keyboard('{End}')
  await focused(last)
  await userEvent.keyboard('{ArrowDown}')
  await focused(last)
  await userEvent.keyboard('{Home}')
  await focused(first)
  expect(m.changed.mock.calls).toEqual([['products']])
})

test('final panel native Tab visits its input and button before exiting to the following stop', async () => {
  const m = setup()
  const trigger = m.getByRole('button', { name: 'Docs' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByRole('link', { name: 'Guide' }))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('textbox', { name: 'Search docs' }))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'Search' }))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After navigation' }))
  await expanded(trigger, false)
  expect(m.changed.mock.calls).toEqual([['docs'], [null]])
})

test('native outside click closes the panel and preserves focus on the clicked button', async () => {
  const m = setup()
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await focused(m.getByRole('link', { name: 'First product' }))
  const outside = m.getByRole('button', { name: 'After navigation' })
  await userEvent.click(outside)
  await focused(outside)
  await expanded(trigger, false)
  expect(m.changed.mock.calls).toEqual([['products'], [null]])
})
