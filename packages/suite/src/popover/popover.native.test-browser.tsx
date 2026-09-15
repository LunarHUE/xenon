import { Popover } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Mounts a disposable popover tree and exposes queries scoped to its container.
 * Non-portaled content stays inside this container, while `Popover.Portal`
 * descendants mount on the document body and are queried separately.
 */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    flush()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

/** Flushes Solid, waits a timer turn for native hosting and deferred dismissal, then flushes again. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 40))
  flush()
}

test('Popover outside-press veto keeps content open with the pressed outside focus, and the next press dismisses', async () => {
  const [veto, setVeto] = createSignal(true)
  const outsidePress = vi.fn()
  const m = mount(() => (
    <>
      <Popover
        onPointerOutside={(event) => {
          outsidePress()
          if (veto()) event.preventDefault()
        }}
      >
        <Popover.Trigger>Open press details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Press details">
            <button type="button">Inside press details</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button type="button" style={{ position: 'fixed', left: '400px', top: '300px' }}>
        Outside press
      </button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Open press details' })
  const outside = m.getByRole('button', { name: 'Outside press' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('dialog', { name: 'Press details' })).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')

  // A vetoed outside press fires its handler once, keeps the layer open, and leaves native focus alone.
  await userEvent.click(outside)
  await settle()
  expect(outsidePress).toHaveBeenCalledTimes(1)
  expect(m.getByRole('dialog', { name: 'Press details' })).toBeVisible()
  expect(outside).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')

  // The next press without a veto still dismisses the same open popover.
  setVeto(false)
  await userEvent.click(outside)
  await settle()
  expect(outsidePress).toHaveBeenCalledTimes(2)
  expect(m.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('Nonmodal Popover keeps native Tab order between its trigger and content and closes when Tab leaves', async () => {
  const m = mount(() => (
    <>
      <button type="button">Before panel</button>
      <Popover>
        <Popover.Trigger>Open tab panel</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Tab panel">
            <button type="button">First field</button>
            <button type="button">Second field</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button type="button">After panel</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Open tab panel' })
  const after = m.getByRole('button', { name: 'After panel' })
  await userEvent.click(trigger)
  await settle()
  const first = m.getByRole('button', { name: 'First field' })
  const second = m.getByRole('button', { name: 'Second field' })
  expect(first).toHaveFocus()

  // Shift+Tab on the first field reaches the opener, which counts as inside, so the panel stays open.
  await userEvent.tab({ shift: true })
  await settle()
  expect(trigger).toHaveFocus()
  expect(m.getByRole('dialog', { name: 'Tab panel' })).toBeVisible()

  // Tab from the opener re-enters the panel and continues through its content order.
  await userEvent.tab()
  await settle()
  expect(first).toHaveFocus()
  await userEvent.tab()
  await settle()
  expect(second).toHaveFocus()

  // Leaving the content by keyboard closes the panel without pulling focus back onto the opener.
  await userEvent.tab()
  await settle()
  expect(after).toHaveFocus()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})

test('popover.keyboard.3: nested modal popovers dismiss one layer per Escape and hold the outer scroll lock', async () => {
  const m = mount(() => (
    <Popover modal>
      <Popover.Trigger>Open outer modal</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Outer modal">
          <Popover modal>
            <Popover.Trigger>Open inner modal</Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content aria-label="Inner modal">
                <button type="button">Inner modal action</button>
              </Popover.Content>
            </Popover.Positioner>
          </Popover>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const outerTrigger = m.getByRole('button', { name: 'Open outer modal' })
  await userEvent.click(outerTrigger)
  await settle()
  const outer = m.getByRole('dialog', { name: 'Outer modal' })
  expect(outer).toHaveAttribute('aria-modal', 'true')
  expect(document.documentElement.style.overflowY).toBe('hidden')

  const innerTrigger = m.getByRole('button', { name: 'Open inner modal' })
  await userEvent.click(innerTrigger)
  await settle()
  expect(m.getByRole('dialog', { name: 'Inner modal' })).toHaveAttribute('aria-modal', 'true')
  expect(m.getByRole('button', { name: 'Inner modal action' })).toHaveFocus()
  expect(document.documentElement.style.overflowY).toBe('hidden')

  // The first Escape removes only the child layer: the parent stays modal, mounted, and locked.
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog', { name: 'Inner modal' })).toBeNull()
  expect(m.getByRole('dialog', { name: 'Outer modal' })).toBe(outer)
  expect(innerTrigger).toHaveFocus()
  expect(document.documentElement.style.overflowY).toBe('hidden')

  // The second Escape removes the parent, releases the shared lock, and restores its own trigger.
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(outerTrigger).toHaveFocus()
  expect(document.documentElement.style.overflowY).toBe('')
})

test('popover.focus.7: focus returns to the trigger that opened the popover, including after switching triggers', async () => {
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Open first</Popover.Trigger>
      <Popover.Trigger>Open second</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Shared trigger panel">
          <button type="button">Shared panel action</button>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const first = m.getByRole('button', { name: 'Open first' })
  const second = m.getByRole('button', { name: 'Open second' })

  // Opening from the second trigger returns there instead of to the first registered trigger.
  await userEvent.click(second)
  await settle()
  expect(m.getByRole('button', { name: 'Shared panel action' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(second).toHaveFocus()
  expect(first).not.toHaveFocus()

  // Switching the active trigger while open retargets restoration to the newly selected trigger.
  await userEvent.click(first)
  await settle()
  await userEvent.click(second)
  await settle()
  expect(m.getByRole('dialog', { name: 'Shared trigger panel' })).toBeVisible()
  m.getByRole('button', { name: 'Shared panel action' }).focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(second).toHaveFocus()
  expect(first).not.toHaveFocus()
})

test('A nested portaled popup dismisses from a press on its parent content while the parent popover stays open', async () => {
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Open parent</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Parent panel">
          <div data-testid="parent-body">Parent body</div>
          <Popover>
            <Popover.Trigger>Open nested</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner>
                <Popover.Content aria-label="Nested panel">
                  <div data-testid="nested-body">Nested body</div>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const page = within(document.body)
  await userEvent.click(m.getByRole('button', { name: 'Open parent' }))
  await settle()
  expect(m.getByRole('dialog', { name: 'Parent panel' })).toBeVisible()

  await userEvent.click(m.getByRole('button', { name: 'Open nested' }))
  await settle()
  const nested = page.getByRole('dialog', { name: 'Nested panel' })
  expect(m.container.contains(nested)).toBe(false)
  expect(m.getByRole('dialog', { name: 'Parent panel' })).toBeVisible()

  // A press on the parent content is outside the nested popup only, so the parent survives.
  await userEvent.click(m.getByTestId('parent-body'))
  await settle()
  expect(page.queryByRole('dialog', { name: 'Nested panel' })).toBeNull()
  expect(m.getByRole('dialog', { name: 'Parent panel' })).toBeVisible()

  // Presses inside the portaled popup stay inside both layers.
  await userEvent.click(m.getByRole('button', { name: 'Open nested' }))
  await settle()
  await userEvent.click(page.getByTestId('nested-body'))
  await settle()
  expect(page.getByRole('dialog', { name: 'Nested panel' })).toBeVisible()
  expect(m.getByRole('dialog', { name: 'Parent panel' })).toBeVisible()
})

test('Popover with Escape dismissal disabled keeps its content focus after Escape', async () => {
  const m = mount(() => (
    <Popover closeOnEscape={false}>
      <Popover.Trigger>Open persistent</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Persistent panel">
          <button type="button">Persistent action</button>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = m.getByRole('button', { name: 'Open persistent' })
  await userEvent.click(trigger)
  await settle()
  const action = m.getByRole('button', { name: 'Persistent action' })
  expect(action).toHaveFocus()

  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getByRole('dialog', { name: 'Persistent panel' })).toBeVisible()
  expect(action).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})
