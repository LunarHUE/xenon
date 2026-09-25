/**
 * Native pointer, hover-timing, and Tab-boundary contracts for NavigationMenu.
 *
 * These cases exercise the documented disclosure contract that the shared
 * `navigation-menu.test-browser.tsx` suite leaves open: hover is gated by
 * `openOnHover`, opening honors `openDelay`, leaving honors `closeDelay`,
 * crossing into content cancels a pending close, a hover switch from an
 * already-open menu is instant, and Tab/Shift+Tab boundaries across the
 * trigger and its portaled panel keep or close the panel correctly.
 *
 * Focus and pointer assertions require real browser geometry, so these run
 * only in the browser project (`*.test-browser.tsx`).
 */
import { NavigationMenu as Nav } from '@xenon-ui/solid/navigation-menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
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
  return { container, ...within(document.body) }
}
async function settle(time = 70) {
  flush()
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, time)
  await promise
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
})

/** One opening trigger with a single link, plus an unrelated native button to move the pointer onto. */
function HoverExample(props: { openOnHover?: boolean; openDelay?: number; closeDelay?: number }) {
  return (
    <>
      <Nav
        openOnHover={props.openOnHover}
        openDelay={props.openDelay}
        closeDelay={props.closeDelay}
      >
        <Nav.List style={{ display: 'flex', gap: '60px' }}>
          <Nav.Item value="a">
            <Nav.Trigger>A</Nav.Trigger>
          </Nav.Item>
        </Nav.List>
        <Nav.Portal>
          <Nav.Positioner>
            <Nav.Viewport>
              <Nav.Content value="a">
                <Nav.Link href="#a">A page</Nav.Link>
              </Nav.Content>
            </Nav.Viewport>
          </Nav.Positioner>
        </Nav.Portal>
      </Nav>
      <button style={{ position: 'fixed', top: '200px', left: '20px' }}>Outside</button>
    </>
  )
}

/** Two hoverable triggers whose instant-switch path is exercised from a keyboard-opened panel. */
function SwitchExample() {
  return (
    <Nav openDelay={4000} closeDelay={4000}>
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
  )
}

/** Triggers followed by a plain top-level link so the "next native stop" is an anchor, not a trigger. */
function LinkOrderExample() {
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

// navigation-menu.pointer.2: openOnHover=false disables only hover, leaving click opening intact.
test('hover never opens while openOnHover is disabled, but click still toggles the panel', async () => {
  const m = mount(() => <HoverExample openOnHover={false} openDelay={30} closeDelay={400} />)
  const trigger = m.getByRole('button', { name: 'A' })
  await userEvent.hover(trigger)
  await settle(150)
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(document.querySelector('[data-part="positioner"][data-state="open"]')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

// navigation-menu.pointer.1 / pointer.15: hover opens only once the configured openDelay elapses.
test('hover opens the panel only after the configured open delay', async () => {
  const m = mount(() => <HoverExample openDelay={600} />)
  const trigger = m.getByRole('button', { name: 'A' })
  await userEvent.hover(trigger)
  flush()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await settle(900)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

// navigation-menu.pointer.14 and the documented "entering content cancels it" contract.
test('crossing into the panel cancels the pending close, and leaving the panel closes after closeDelay', async () => {
  const m = mount(() => <HoverExample openDelay={0} closeDelay={400} />)
  const trigger = m.getByRole('button', { name: 'A' })
  await userEvent.hover(trigger)
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  // Moving from the trigger onto the panel starts closeDelay on the trigger, then
  // entering content cancels it: the panel must survive well past closeDelay.
  await userEvent.hover(m.getByRole('link', { name: 'A page' }))
  await settle(600)
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  // Leaving the panel starts closeDelay and never cancels it, so it closes later.
  await userEvent.hover(m.getByRole('button', { name: 'Outside' }))
  flush()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await settle(600)
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

// navigation-menu.pointer.10: an already open navigation switches instantly, bypassing openDelay.
test('hovering another trigger switches an already open panel immediately, ignoring openDelay', async () => {
  const m = mount(() => <SwitchExample />)
  const first = m.getByRole('button', { name: 'A' })
  const second = m.getByRole('button', { name: 'B' })
  first.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(first).toHaveAttribute('aria-expanded', 'true')
  await userEvent.hover(second)
  flush()
  expect(second).toHaveAttribute('aria-expanded', 'true')
  expect(first).toHaveAttribute('aria-expanded', 'false')
})

// navigation-menu.focus.5: Tab from a panel's final stop lands on the next native stop and closes.
test('Tab from the panel final stop moves to the following top-level link and closes the panel', async () => {
  const m = mount(() => <LinkOrderExample />)
  const docs = m.getByRole('button', { name: 'Docs' })
  docs.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(m.getByRole('link', { name: 'Guide' })).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  await settle()
  expect(m.getByRole('link', { name: 'About' })).toHaveFocus()
  expect(docs).toHaveAttribute('aria-expanded', 'false')
})

// navigation-menu.focus.14: Tab moving between trigger and content must not close the panel.
test('Tab and Shift+Tab round-trip between trigger and panel without closing it', async () => {
  const m = mount(() => <LinkOrderExample />)
  const trigger = m.getByRole('button', { name: 'Products' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const first = m.getByRole('link', { name: 'One' })
  expect(first).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Tab}')
  await settle()
  expect(first).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})
