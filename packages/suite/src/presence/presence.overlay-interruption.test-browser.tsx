import { Popover } from '@xenon-ui/solid/popover'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

async function settle() {
  flush()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  flush()
}

for (const forceMount of [false, true]) {
  for (const completion of ['finish', 'cancel'] as const) {
    test(`reopened modal Popover survives stale ${completion} completion with forceMount=${forceMount}`, async () => {
      const [open, setOpen] = createSignal(false)
      const container = document.createElement('div')
      document.body.append(container)
      const dispose = render(
        () => (
          <>
            <Popover modal open={open()} onOpenChange={setOpen} forceMount={forceMount}>
              <Popover.Trigger>Open interrupted popup</Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content aria-label="Interrupted popup">
                  <button>First popup action</button>
                  <Popover.Close aria-label="Last popup action">Last popup action</Popover.Close>
                </Popover.Content>
              </Popover.Positioner>
            </Popover>
            <button>After interrupted popup</button>
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
      const view = within(container)
      const trigger = view.getByRole('button', { name: 'Open interrupted popup' })
      await userEvent.click(trigger)
      await settle()
      const content = view.getByRole('dialog', { name: 'Interrupted popup' })
      const first = view.getByRole('button', { name: 'First popup action' })
      await expect.poll(() => document.activeElement).toBe(first)
      const outgoing = content.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 100000 })
      onTestFinished(() => outgoing.cancel())
      setOpen(false)
      await settle()
      expect(content.isConnected).toBe(true)
      expect(content).toHaveAttribute('data-ending-style', '')
      expect(content).toHaveAttribute('inert')
      setOpen(true)
      await settle()
      expect(view.getByRole('dialog', { name: 'Interrupted popup' })).toBe(content)
      expect(content).not.toHaveAttribute('data-ending-style')
      expect(content).not.toHaveAttribute('inert')
      if (completion === 'finish') outgoing.finish()
      else outgoing.cancel()
      await settle()
      expect(content.isConnected).toBe(true)
      expect(content).toBeVisible()
      expect(content).toHaveAttribute('data-state', 'open')
      first.focus()
      await userEvent.tab({ shift: true })
      expect(view.getByRole('button', { name: 'Last popup action' })).toHaveFocus()
      await userEvent.tab()
      expect(first).toHaveFocus()
      await userEvent.keyboard('{Escape}')
      await settle()
      expect(view.queryByRole('dialog')).toBeNull()
      await expect.poll(() => document.activeElement).toBe(trigger)
      expect(content.isConnected).toBe(forceMount)
      await userEvent.tab()
      expect(view.getByRole('button', { name: 'After interrupted popup' })).toHaveFocus()
    })
  }
}
