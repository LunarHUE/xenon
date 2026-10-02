import { Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return within(container)
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

for (const host of ['button', 'div'] as const) {
  for (const key of ['{Enter}', ' '] as const) {
    test(`popover.keyboard.1: ${host} trigger toggles twice with ${key}`, async () => {
      const change = vi.fn()
      const view = mount(() => (
        <Popover initialFocus={false} onOpenChange={change}>
          <Popover.Trigger as={host}>Toggle details</Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content aria-label="Keyboard details">Details</Popover.Content>
          </Popover.Positioner>
        </Popover>
      ))
      const trigger = view.getByRole('button', { name: 'Toggle details' })
      trigger.focus()
      await userEvent.keyboard(key)
      await settle()
      expect(view.getByRole('dialog', { name: 'Keyboard details' })).toBeVisible()
      expect(trigger).toHaveFocus()
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(change.mock.calls).toEqual([[true]])
      await userEvent.keyboard(key)
      await settle()
      expect(view.queryByRole('dialog')).toBeNull()
      expect(trigger).toHaveFocus()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(change.mock.calls).toEqual([[true], [false]])
    })
  }
}

test('popover.pointer.3: focusable and plain content clicks do not invoke outside handlers or close', async () => {
  const change = vi.fn()
  const outside = vi.fn()
  const focusOutside = vi.fn()
  const view = mount(() => (
    <Popover onOpenChange={change} onPointerOutside={outside} onFocusOutside={focusOutside}>
      <Popover.Trigger>Open internal actions</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Internal actions">
          <button type="button">Internal button</button>
          <div>Plain internal text</div>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open internal actions' }))
  await settle()
  const content = view.getByRole('dialog', { name: 'Internal actions' })
  const button = view.getByRole('button', { name: 'Internal button' })
  await userEvent.click(button)
  await settle()
  expect(button).toHaveFocus()
  await userEvent.click(view.getByText('Plain internal text'))
  await settle()
  // Plain text is not focusable: assert the browser focus remains within the layer.
  expect(content.contains(document.activeElement)).toBe(true)
  expect(view.getByRole('dialog', { name: 'Internal actions' })).toBe(content)
  expect(content).toBeVisible()
  expect(outside).not.toHaveBeenCalled()
  expect(focusOutside).not.toHaveBeenCalled()
  expect(change.mock.calls).toEqual([[true]])
})

test('popover.focus.9: one effective modal tab stop contains both native Tab directions', async () => {
  const view = mount(() => (
    <>
      <button type="button">Background before</button>
      <Popover modal>
        <Popover.Trigger>Open single stop</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Single stop">
            <button type="button" hidden>
              Hidden stop
            </button>
            <button type="button" disabled>
              Disabled stop
            </button>
            <button type="button">Only stop</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button type="button">Background after</button>
    </>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open single stop' }))
  await settle()
  const only = view.getByRole('button', { name: 'Only stop' })
  expect(only).toHaveFocus()
  for (const shift of [false, true, false, true]) {
    await userEvent.tab({ shift })
    await settle()
    expect(only).toHaveFocus()
    expect(view.getByRole('dialog', { name: 'Single stop' })).toBeVisible()
  }
})

test('popover.focus.9: two modal stops wrap backward from first to last', async () => {
  const view = mount(() => (
    <Popover modal>
      <Popover.Trigger>Open backward cycle</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Backward cycle">
          <button type="button">Cycle first</button>
          <button type="button">Cycle last</button>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open backward cycle' }))
  await settle()
  expect(view.getByRole('button', { name: 'Cycle first' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  await settle()
  expect(view.getByRole('button', { name: 'Cycle last' })).toHaveFocus()
  await userEvent.tab()
  await settle()
  expect(view.getByRole('button', { name: 'Cycle first' })).toHaveFocus()
  expect(view.getByRole('dialog', { name: 'Backward cycle' })).toBeVisible()
})

test('popover.focus.11: portalled first control returns to trigger and reenters without closing', async () => {
  const change = vi.fn()
  // The explicit portal target is mounted before rendering, preserving actual separate DOM ancestry.
  const target = document.createElement('div')
  document.body.append(target)
  onTestFinished(() => target.remove())
  const view = mount(() => (
    <>
      <button type="button">Before portal</button>
      <Popover onOpenChange={change}>
        <Popover.Trigger>Open portal</Popover.Trigger>
        <Popover.Portal container={target}>
          <Popover.Positioner>
            <Popover.Content aria-label="Portalled details">
              <button type="button">Portalled first</button>
              <button type="button">Portalled second</button>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover>
      <button type="button">After portal</button>
    </>
  ))
  const popup = within(target)
  const trigger = view.getByRole('button', { name: 'Open portal' })
  await userEvent.click(trigger)
  await settle()
  const first = popup.getByRole('button', { name: 'Portalled first' })
  const content = popup.getByRole('dialog', { name: 'Portalled details' })
  expect(first).toHaveFocus()
  expect(view.queryByRole('dialog')).toBeNull()
  await userEvent.tab({ shift: true })
  await settle()
  expect(trigger).toHaveFocus()
  expect(content).toBeVisible()
  await userEvent.tab()
  await settle()
  expect(first).toHaveFocus()
  expect(popup.getByRole('dialog', { name: 'Portalled details' })).toBe(content)
  expect(change.mock.calls).toEqual([[true]])
})

test('popover.focus.1 (shipped default): initial focus skips hidden and disabled children', async () => {
  const view = mount(() => (
    <Popover>
      <Popover.Trigger>Open first usable</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="First usable">
          <input aria-label="Hidden input" hidden />
          <button type="button" style={{ display: 'none' }}>
            Invisible button
          </button>
          <button type="button" disabled>
            Disabled button
          </button>
          <button type="button">First usable button</button>
          <button type="button">Later button</button>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = view.getByRole('button', { name: 'Open first usable' })
  await userEvent.click(trigger)
  await settle()
  expect(view.getByRole('button', { name: 'First usable button' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(view.getByRole('button', { name: 'First usable button' })).toHaveFocus()
})
