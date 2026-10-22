import { Popover } from '@xenon-ui/solid/popover'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

async function settle() {
  flush()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  flush()
}
function fixture() {
  const container = document.createElement('div')
  container.style.height = '4000px'
  document.body.append(container)
  const originalScroll = window.scrollY
  const originalOverflow = document.documentElement.style.overflowY
  const outsideClick = vi.fn()
  const change = vi.fn()
  const dispose = render(
    () => (
      <div style={{ position: 'absolute', top: '1400px', left: '80px' }}>
        <Popover onOpenChange={change}>
          <Popover.Trigger>Open scrolled details</Popover.Trigger>
          <Popover.Positioner side="bottom" sideOffset={8}>
            <Popover.Content
              aria-label="Scrolled details"
              style={{ padding: '16px', background: 'white' }}
            >
              <button hidden>Hidden first action</button>
              <button disabled>Disabled first action</button>
              <button>First scrolled action</button>
              <Popover.Close aria-label="Close scrolled details">Close</Popover.Close>
            </Popover.Content>
          </Popover.Positioner>
        </Popover>
        {/* Keep the target below the panel and inside narrow viewports so click
            automation does not scroll the page to reveal it. */}
        <button style={{ display: 'block', 'margin-top': '160px' }} onClick={outsideClick}>
          Background action
        </button>
      </div>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    window.scrollTo(0, originalScroll)
    flush()
  })
  flush()
  return { ...within(container), outsideClick, change, originalOverflow }
}

for (const opening of ['pointer', 'keyboard'] as const) {
  test(`popover.focus.19 ${opening} opening on a scrolled page focuses the first usable control without moving the page`, async () => {
    const h = fixture()
    window.scrollTo(0, 1100)
    await settle()
    expect(window.scrollY).toBeGreaterThan(1000)
    const trigger = h.getByRole('button', { name: 'Open scrolled details' })
    const before = window.scrollY
    if (opening === 'pointer') await userEvent.click(trigger)
    else {
      trigger.focus({ preventScroll: true })
      await userEvent.keyboard('{Enter}')
    }
    await settle()
    const first = h.getByRole('button', { name: 'First scrolled action' })
    await expect.poll(() => document.activeElement).toBe(first)
    expect(Math.abs(window.scrollY - before)).toBeLessThanOrEqual(1)
    const content = h.getByRole('dialog', { name: 'Scrolled details' })
    expect(content).not.toHaveAttribute('aria-modal', 'true')
    expect(document.documentElement.style.overflowY).toBe(h.originalOverflow)
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(trigger).toHaveFocus()
    expect(Math.abs(window.scrollY - before)).toBeLessThanOrEqual(1)
    expect(h.change.mock.calls).toEqual([[true], [false]])
  })
}

test('popover.focus.3 default nonmodal content permits real page scrolling and an interactive background click', async () => {
  const h = fixture()
  window.scrollTo(0, 1100)
  await settle()
  await userEvent.click(h.getByRole('button', { name: 'Open scrolled details' }))
  await settle()
  const content = h.getByRole('dialog', { name: 'Scrolled details' })
  window.scrollTo(0, 1200)
  await settle()
  expect(window.scrollY).toBe(1200)
  expect(content).toBeVisible()
  expect(document.documentElement.style.overflowY).toBe(h.originalOverflow)
  const background = h.getByRole('button', { name: 'Background action' })
  expect(background).not.toHaveAttribute('inert')
  expect(background).not.toHaveAttribute('aria-hidden', 'true')
  const rect = background.getBoundingClientRect()
  expect(rect.left).toBeGreaterThanOrEqual(0)
  expect(rect.right).toBeLessThanOrEqual(window.innerWidth)
  expect(rect.top).toBeGreaterThanOrEqual(0)
  expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight)
  expect(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)).toBe(
    background
  )
  await userEvent.click(background)
  await settle()
  expect(h.outsideClick).toHaveBeenCalledTimes(1)
  expect(background).toHaveFocus()
  expect(h.queryByRole('dialog')).toBeNull()
  expect(h.change.mock.calls).toEqual([[true], [false]])
  expect(window.scrollY).toBe(1200)
})
