import { NavigationMenu as Nav } from '@tenon/solid/navigation-menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
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
async function settle() {
  flush()
  await new Promise((resolve) => setTimeout(resolve, 70))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
})
function Example() {
  return (
    <>
      <Nav openOnHover={false}>
        <Nav.List style={{ display: 'flex', gap: '60px' }}>
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
        <Nav.Portal>
          <Nav.Positioner>
            <Nav.Viewport>
              <Nav.Content value="products">
                <Nav.Link href="#one">One</Nav.Link>
                <Nav.Link href="#two">Two</Nav.Link>
              </Nav.Content>
              <Nav.Content value="docs">
                <Nav.Link href="#guide">Guide</Nav.Link>
              </Nav.Content>
            </Nav.Viewport>
          </Nav.Positioner>
        </Nav.Portal>
      </Nav>
      <button>After</button>
    </>
  )
}
test('native top-layer panel preserves logical Tab order and Escape returns focus', async () => {
  const m = mount(() => <Example />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(trigger).toHaveFocus()
  const link = m.getByRole('link', { name: 'One' })
  expect(link.closest('[popover]')!.matches(':popover-open')).toBe(true)
  expect(document.querySelector('[role=menu],[role=menubar],[role=dialog]')).toBeNull()
  await userEvent.keyboard('{Tab}')
  expect(link).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(link).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('link', { name: 'Two' })).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  await settle()
  expect(m.getByRole('button', { name: 'Docs' })).toHaveFocus()
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
test('list arrows include native links; outside focus dismisses without returning; axe passes', async () => {
  const m = mount(() => <Example />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowRight}')
  expect(m.getByRole('button', { name: 'Docs' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  expect(m.getByRole('link', { name: 'About' })).toHaveFocus()
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  await expectNoViolations(m.container)
  m.getByRole('button', { name: 'After' }).focus()
  await settle()
  expect(m.getByRole('button', { name: 'After' })).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('RTL list arrows and vertical opening keys preserve native button focus', async () => {
  const m = mount(() => (
    <Nav dir="rtl" orientation="vertical" openOnHover={false}>
      <Nav.List style={{ display: 'flex', gap: '60px' }}>
        <Nav.Item value="a">
          <Nav.Trigger>A</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="b">
          <Nav.Trigger>B</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Content value="b">
          <Nav.Link href="#b">B page</Nav.Link>
        </Nav.Content>
      </Nav.Positioner>
    </Nav>
  ))
  m.getByRole('button', { name: 'A' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('button', { name: 'B' })).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(m.getByRole('link', { name: 'B page' })).toHaveFocus()
})

test('hover opens after delay, crosses into content, switches the shared anchor and closes on selection', async () => {
  const m = mount(() => (
    <Nav openDelay={60} closeDelay={100}>
      <Nav.List style={{ display: 'flex', gap: '60px' }}>
        <Nav.Item value="a">
          <Nav.Trigger>A</Nav.Trigger>
        </Nav.Item>
        <Nav.Item value="b">
          <Nav.Trigger>B</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Portal>
        <Nav.Positioner>
          <Nav.Viewport>
            <Nav.Content value="a">
              <Nav.Link href="#a">A page</Nav.Link>
            </Nav.Content>
            <Nav.Content value="b">
              <Nav.Link href="#b">B page</Nav.Link>
            </Nav.Content>
          </Nav.Viewport>
        </Nav.Positioner>
      </Nav.Portal>
    </Nav>
  ))
  await userEvent.hover(m.getByRole('button', { name: 'A' }))
  await settle()
  expect(m.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true')
  await userEvent.hover(m.getByRole('link', { name: 'A page' }))
  await settle()
  expect(m.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true')
  await userEvent.hover(m.getByRole('button', { name: 'B' }))
  await settle()
  expect(m.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'false')
  expect(m.getByRole('button', { name: 'B' })).toHaveAttribute('aria-expanded', 'true')
  const panel = m.getByRole('link', { name: 'B page' }).closest('[data-navigation-panel]')!
  expect(panel).toHaveAttribute(
    'id',
    m.getByRole('button', { name: 'B' }).getAttribute('aria-controls')
  )
  await userEvent.click(m.getByRole('link', { name: 'B page' }))
  await settle()
  expect(m.getByRole('button', { name: 'B' })).toHaveAttribute('aria-expanded', 'false')
})

test('author Escape and link selection cancellation keep navigation open', async () => {
  const m = mount(() => (
    <Nav openOnHover={false} onEscapeKeyDown={(event) => event.preventDefault()}>
      <Nav.List>
        <Nav.Item value="a">
          <Nav.Trigger>A</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Content value="a">
          <Nav.Link href="#veto" onSelect={(event: MouseEvent) => event.preventDefault()}>
            Veto
          </Nav.Link>
        </Nav.Content>
      </Nav.Positioner>
    </Nav>
  ))
  m.getByRole('button', { name: 'A' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(m.getByRole('link', { name: 'Veto' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(m.getByRole('link', { name: 'Veto' }))
  await settle()
  expect(m.getByRole('button', { name: 'A' })).toHaveAttribute('aria-expanded', 'true')
})

test('panel navigation preserves native text editing keys', async () => {
  const m = mount(() => (
    <Nav openOnHover={false}>
      <Nav.List>
        <Nav.Item value="a">
          <Nav.Trigger>Edit</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Content value="a">
          <input aria-label="Search studies" value="notes" />
          <textarea aria-label="Draft">field notes</textarea>
          <div contentEditable="true" tabindex="0" aria-label="Editable text">
            A note
          </div>
          <Nav.Link href="#next">Next</Nav.Link>
        </Nav.Content>
      </Nav.Positioner>
    </Nav>
  ))
  m.getByRole('button', { name: 'Edit' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const input = m.getByRole('textbox', { name: 'Search studies' }) as HTMLInputElement
  input.setSelectionRange(3, 3)
  await userEvent.keyboard('{ArrowLeft}')
  expect(input.selectionStart).toBe(2)
  expect(input).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(input.selectionStart).toBe(0)
  expect(input).toHaveFocus()
  const textarea = m.getByRole('textbox', { name: 'Draft' }) as HTMLTextAreaElement
  textarea.focus()
  textarea.setSelectionRange(2, 2)
  await userEvent.keyboard('{ArrowRight}')
  expect(textarea.selectionStart).toBe(3)
  expect(textarea).toHaveFocus()
  const editable = m.getByLabelText('Editable text')
  editable.focus()
  await userEvent.keyboard('{End}')
  expect(editable).toHaveFocus()
})
