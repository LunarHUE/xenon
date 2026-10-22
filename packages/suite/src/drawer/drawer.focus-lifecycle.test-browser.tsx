import { Drawer } from '@xenon-ui/solid/drawer'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
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
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  flush()
}

for (const side of ['top', 'right', 'bottom', 'left'] as const) {
  for (const close of ['escape', 'button'] as const) {
    test(`drawer.focus.2 ${side} drawer honors explicit initial and final focus through ${close} dismissal`, async () => {
      const [initial, setInitial] = createSignal<HTMLElement>()
      const [final, setFinal] = createSignal<HTMLElement>()
      const change = vi.fn()
      const view = mount(() => (
        <>
          <button>Before drawer</button>
          <Drawer
            side={side}
            forceMount
            initialFocus={initial()}
            finalFocus={final()}
            onOpenChange={change}
          >
            <Drawer.Trigger>Review drawer</Drawer.Trigger>
            <Drawer.Content>
              <Drawer.Title>Focused drawer</Drawer.Title>
              <Drawer.Description>Review these actions.</Drawer.Description>
              <button>Default first action</button>
              <button>Chosen initial action</button>
              <Drawer.Close>Finish review</Drawer.Close>
            </Drawer.Content>
          </Drawer>
          <button>Explicit final target</button>
          <button>After final target</button>
        </>
      ))
      // Resolve retained DOM before opening so the target is ready for the native focus session.
      const chosen = view.getByText('Chosen initial action')
      const finalTarget = view.getByRole('button', { name: 'Explicit final target' })
      setInitial(chosen)
      setFinal(finalTarget)
      flush()
      const trigger = view.getByRole('button', { name: 'Review drawer' })
      await userEvent.click(trigger)
      await expect.poll(() => document.activeElement).toBe(chosen)
      const content = view.getByRole('dialog', { name: 'Focused drawer' })
      expect(content).toHaveAttribute('data-side', side)
      expect(content.matches(':modal')).toBe(true)
      await userEvent.tab()
      expect(view.getByRole('button', { name: 'Finish review' })).toHaveFocus()
      await userEvent.tab()
      expect(view.getByRole('button', { name: 'Default first action' })).toHaveFocus()
      if (close === 'escape') await userEvent.keyboard('{Escape}')
      else await userEvent.click(view.getByRole('button', { name: 'Finish review' }))
      await settle()
      await expect.poll(() => document.activeElement).toBe(finalTarget)
      expect(view.queryByRole('dialog')).toBeNull()
      expect(content.isConnected).toBe(true)
      expect(content).not.toBeVisible()
      expect(change.mock.calls).toEqual([[true], [false]])
      await userEvent.tab()
      expect(view.getByRole('button', { name: 'After final target' })).toHaveFocus()
    })
  }
}

test('drawer.roles.1 associations track conditional title and description removal without dangling references', async () => {
  const [metadata, setMetadata] = createSignal(true)
  const [suffix, setSuffix] = createSignal('first')
  const view = mount(() => (
    <Drawer>
      <Drawer.Trigger>Open metadata drawer</Drawer.Trigger>
      <Drawer.Content aria-label="Metadata drawer">
        <Show when={metadata()}>
          <Drawer.Title id={`drawer-heading-${suffix()}`}>Drawer heading</Drawer.Title>
          <Drawer.Description id={`drawer-description-${suffix()}`}>
            Drawer explanation
          </Drawer.Description>
        </Show>
        <Drawer.Close>Close metadata drawer</Drawer.Close>
      </Drawer.Content>
    </Drawer>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open metadata drawer' }))
  const content = view.getByRole('dialog', { name: 'Metadata drawer' })
  expect(content).toHaveAccessibleDescription('Drawer explanation')
  expect(content.getAttribute('aria-describedby')).toBe('drawer-description-first')
  setSuffix('replacement')
  flush()
  expect(content.getAttribute('aria-describedby')).toBe('drawer-description-replacement')
  expect(document.getElementById('drawer-description-first')).toBeNull()
  expect(document.getElementById('drawer-description-replacement')).toBe(
    view.getByText('Drawer explanation')
  )
  setMetadata(false)
  flush()
  expect(content).not.toHaveAttribute('aria-describedby')
  expect(content).not.toHaveAttribute('aria-labelledby')
  expect(content).toHaveAccessibleName('Metadata drawer')
  setMetadata(true)
  flush()
  expect(content).toHaveAccessibleDescription('Drawer explanation')
  expect(document.getElementById(content.getAttribute('aria-describedby')!)).toBe(
    view.getByText('Drawer explanation')
  )
})
