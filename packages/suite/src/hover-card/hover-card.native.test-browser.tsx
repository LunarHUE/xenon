/**
 * Native-browser hover-card retention cases: nested previews, direct text
 * selection, wheel persistence, and focus-held content. Every fixture renders a
 * real HoverCard so assertions observe native hosting, layer dismissal ordering,
 * the closest focus owner, and real pointer geometry rather than internals.
 */
import { HoverCard } from '@xenon/solid/hover-card'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
})
/** Render into the body, register disposal, and expose scoped queries. */
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
/** Flushes Solid, waits past a card's configured delays, then flushes again. */
async function settle(time = 70) {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, time))
  flush()
}

/** One parent link preview whose content hosts a nested child link preview. */
function NestedFixture() {
  return (
    <HoverCard openDelay={0} closeDelay={400}>
      <HoverCard.Trigger href="#parent" style={{ display: 'inline-block', margin: '40px' }}>
        Parent
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner>
          <HoverCard.Content
            aria-label="Parent card"
            style={{ width: '260px', padding: '12px', background: 'white' }}
          >
            <p>Parent preview</p>
            <HoverCard openDelay={0} closeDelay={400}>
              <HoverCard.Trigger href="#child" style={{ display: 'inline-block' }}>
                Child
              </HoverCard.Trigger>
              <HoverCard.Portal>
                <HoverCard.Positioner>
                  <HoverCard.Content
                    aria-label="Child card"
                    style={{ width: '200px', padding: '12px', background: 'white' }}
                  >
                    <a href="#child-details">Child details</a>
                  </HoverCard.Content>
                </HoverCard.Positioner>
              </HoverCard.Portal>
            </HoverCard>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard>
  )
}

/** A far-away control so pointer travel and outside gestures end clear of the card. */
function OutsideControl() {
  return (
    <button type="button" style={{ position: 'fixed', top: '8px', left: '8px' }}>
      Outside
    </button>
  )
}

/** One preview with selectable text plus a wheel-scrollable inner region. */
function CardFixture(props: { closeDelay: number }) {
  return (
    <>
      <OutsideControl />
      <HoverCard openDelay={0} closeDelay={props.closeDelay}>
        <HoverCard.Trigger
          href="#profile"
          style={{ display: 'inline-block', margin: '220px 40px 40px' }}
        >
          Profile
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Positioner side="bottom" sideOffset={20}>
            <HoverCard.Content
              aria-label="Profile details"
              style={{ width: '220px', padding: '12px', background: 'white' }}
            >
              <div data-scroll style={{ height: '40px', overflow: 'auto' }}>
                <p style={{ margin: '0' }}>
                  <span data-start>Alpha</span> middle-marker-word <span data-end>Omega</span>
                </p>
                <p style={{ margin: '0' }}>Second scrollable line</p>
                <p style={{ margin: '0' }}>Third scrollable line</p>
                <p style={{ margin: '0' }}>Fourth scrollable line</p>
                <p style={{ margin: '0' }}>Fifth scrollable line</p>
                <p style={{ margin: '0' }}>Sixth scrollable line</p>
              </div>
              <button type="button">Inside card</button>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </HoverCard.Portal>
      </HoverCard>
    </>
  )
}

test('a nested preview opened from inside an open parent card keeps both previews hosted', async () => {
  const m = mount(() => <NestedFixture />)
  const parentTrigger = m.getByRole('link', { name: 'Parent' })
  await userEvent.hover(parentTrigger)
  await settle()
  const parent = m.getByRole('dialog', { name: 'Parent card' })
  expect(parent.parentElement!.matches(':popover-open')).toBe(true)
  await userEvent.hover(m.getByRole('link', { name: 'Child' }))
  await settle(600)
  const child = m.getByRole('dialog', { name: 'Child card' })
  expect(child).toBeVisible()
  expect(m.getByRole('dialog', { name: 'Parent card' })).toBe(parent)
  expect(parent.parentElement!.matches(':popover-open')).toBe(true)
  expect(parentTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('link', { name: 'Child' })).toHaveAttribute('aria-expanded', 'true')
})

test('Escape closes only the nested preview and a second Escape closes the parent card', async () => {
  const m = mount(() => <NestedFixture />)
  await userEvent.hover(m.getByRole('link', { name: 'Parent' }))
  await settle()
  await userEvent.hover(m.getByRole('link', { name: 'Child' }))
  await settle(600)
  const parent = m.getByRole('dialog', { name: 'Parent card' })
  expect(m.getByRole('dialog', { name: 'Child card' })).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog', { name: 'Child card' })).toBeNull()
  expect(m.getByRole('dialog', { name: 'Parent card' })).toBe(parent)
  expect(m.getByRole('link', { name: 'Parent' })).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
})

test('a native drag inside the card selects its text without dismissing the preview', async () => {
  const m = mount(() => <CardFixture closeDelay={40} />)
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  await userEvent.dragAndDrop(
    content.querySelector<HTMLElement>('[data-start]')!,
    content.querySelector<HTMLElement>('[data-end]')!
  )
  await settle()
  expect(window.getSelection()?.toString() ?? '').toContain('middle-marker-word')
  expect(m.getByRole('dialog', { name: 'Profile details' })).toBe(content)
})

test('a press that starts inside the card and releases outside does not dismiss it', async () => {
  // A long close delay keeps hover intent out of the window so only pointer dismissal can close.
  const m = mount(() => <CardFixture closeDelay={5000} />)
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  await userEvent.dragAndDrop(
    content.querySelector<HTMLElement>('[data-start]')!,
    m.getByRole('button', { name: 'Outside' })
  )
  await settle(160)
  expect(m.getByRole('dialog', { name: 'Profile details' })).toBe(content)
  expect(content).toBeVisible()
})

test('wheel scrolling inside the open card does not dismiss it and moving away still closes it', async () => {
  const m = mount(() => <CardFixture closeDelay={40} />)
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  const scroll = content.querySelector<HTMLElement>('[data-scroll]')!
  await userEvent.wheel(scroll, { delta: { y: 120 } })
  await settle(200)
  await expect.poll(() => scroll.scrollTop).toBeGreaterThan(0)
  expect(m.getByRole('dialog', { name: 'Profile details' })).toBe(content)
  await userEvent.hover(m.getByRole('button', { name: 'Outside' }))
  // Leaving can retain the pointer corridor for 300ms before closeDelay starts.
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
})

test('focus inside the card retains it while the pointer leaves, and losing focus closes it', async () => {
  const m = mount(() => <CardFixture closeDelay={40} />)
  const trigger = m.getByRole('link', { name: 'Profile' })
  trigger.focus()
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  const inside = m.getByRole('button', { name: 'Inside card' })
  await userEvent.click(inside)
  expect(inside).toHaveFocus()
  await userEvent.hover(m.getByRole('button', { name: 'Outside' }))
  await settle(200)
  expect(m.getByRole('dialog', { name: 'Profile details' })).toBe(content)
  expect(inside).toHaveFocus()
  m.getByRole('button', { name: 'Outside' }).focus()
  // Leaving can retain the pointer corridor for 300ms before closeDelay starts.
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
})
