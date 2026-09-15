import { Popover } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
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
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 40))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('Popover associates author IDs, opens with Enter, focuses content and closes to its trigger', async () => {
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Open settings</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content id="settings-content">
          <Popover.Title id="settings-title">Settings</Popover.Title>
          <Popover.Description id="settings-description">
            Choose your preferences.
          </Popover.Description>
          <input aria-label="Display name" />
          <Popover.Close aria-label="Save settings">Save</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = m.getByRole('button', { name: 'Open settings' })
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  const content = m.getByRole('dialog', { name: 'Settings' })
  expect(trigger).toHaveAttribute('aria-controls', 'settings-content')
  expect(content).toHaveAttribute('aria-describedby', 'settings-description')
  expect(content.parentElement!.matches(':popover-open')).toBe(true)
  expect(m.getByRole('textbox')).toHaveFocus()
  await expectNoViolations(m.container)
  await userEvent.click(m.getByRole('button', { name: 'Save settings' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveFocus()
})

test('Popover trigger toggles once and outside pressing preserves the clicked focus', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <>
      <Popover onOpenChange={changes}>
        <Popover.Trigger>Toggle details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details">
            <button>Inside</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button style={{ position: 'fixed', left: '400px', top: '40px' }}>Outside</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Toggle details' })
  await userEvent.click(trigger)
  await settle()
  await userEvent.click(trigger)
  await settle()
  expect(changes.mock.calls).toEqual([[true], [false]])
  expect(m.queryByRole('dialog')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Outside' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(m.getByRole('button', { name: 'Outside' })).toHaveFocus()
  expect(changes.mock.calls).toEqual([[true], [false], [true], [false]])
})

test('Popover positions against a custom anchor and follows anchor movement', async () => {
  const [left, setLeft] = createSignal(200)
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Show anchored details</Popover.Trigger>
      <Popover.Anchor
        data-testid="anchor"
        style={{
          position: 'fixed',
          left: `${left()}px`,
          top: '200px',
          width: '120px',
          height: '30px',
        }}
      />
      <Popover.Positioner side="bottom" align="start" sideOffset={9} flip={false} shift={false}>
        <Popover.Content aria-label="Anchored details" style={{ width: '160px', height: '60px' }}>
          Details
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(m.getByRole('button'))
  await settle()
  const content = m.getByRole('dialog')
  const anchor = m.getByTestId('anchor')
  const check = () => {
    const anchorRect = anchor.getBoundingClientRect()
    const rect = content.getBoundingClientRect()
    expect(Math.abs(rect.left - anchorRect.left)).toBeLessThan(1)
    expect(Math.abs(rect.top - anchorRect.bottom - 9)).toBeLessThan(1)
  }
  check()
  setLeft(280)
  window.dispatchEvent(new Event('resize'))
  await settle()
  check()
})

test('modal Popover contains Tab focus and releases locks after Escape', async () => {
  const m = mount(() => (
    <>
      <Popover modal>
        <Popover.Trigger>Open modal settings</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Modal settings">
            <button>First</button>
            <button>Last</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button>Outside modal</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Open modal settings' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  expect(document.documentElement.style.overflowY).toBe('hidden')
  await expectNoViolations(m.container)
  m.getByRole('button', { name: 'Last' }).focus()
  await userEvent.keyboard('{Tab}')
  expect(m.getByRole('button', { name: 'First' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(document.documentElement.style.overflowY).toBe('')
  expect(trigger).toHaveFocus()
})

test('nested Popovers dismiss one layer per Escape and restore their own trigger', async () => {
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Open outer</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Outer">
          <Popover>
            <Popover.Trigger>Open inner</Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content aria-label="Inner">
                <button>Inner action</button>
              </Popover.Content>
            </Popover.Positioner>
          </Popover>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Open outer' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Open inner' }))
  await settle()
  expect(m.getByRole('button', { name: 'Inner action' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog', { name: 'Inner' })).toBeNull()
  expect(m.getByRole('dialog', { name: 'Outer' })).toBeVisible()
  expect(m.getByRole('button', { name: 'Open inner' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(m.getByRole('button', { name: 'Open outer' })).toHaveFocus()
})

test('controlled Popover requests closure and author cancellation blocks Escape and outside focus', async () => {
  const [open, setOpen] = createSignal(false)
  const [prevent, setPrevent] = createSignal(true)
  const changed = vi.fn()
  const m = mount(() => (
    <>
      <Popover
        open={open()}
        onOpenChange={changed}
        onEscapeKeyDown={(event) => {
          if (prevent()) event.preventDefault()
        }}
        onFocusOutside={(event) => {
          if (prevent()) event.preventDefault()
        }}
      >
        <Popover.Trigger>Controlled details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Controlled">
            <button>Inside controlled</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button>Focus elsewhere</button>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Controlled details' }))
  await settle()
  expect(changed.mock.calls).toEqual([[true]])
  expect(m.queryByRole('dialog')).toBeNull()
  setOpen(true)
  await settle()
  await userEvent.keyboard('{Escape}')
  m.getByRole('button', { name: 'Focus elsewhere' }).focus()
  await settle()
  expect(changed.mock.calls).toEqual([[true]])
  expect(m.getByRole('button', { name: 'Focus elsewhere' })).toHaveFocus()
  setPrevent(false)
  m.getByRole('button', { name: 'Inside controlled' }).focus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(changed.mock.calls).toEqual([[true], [false]])
  expect(m.getByRole('dialog')).toBeVisible()
  setOpen(false)
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
})
