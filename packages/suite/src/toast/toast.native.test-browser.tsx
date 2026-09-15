/**
 * Native browser coverage for Toast interaction lifetimes: hover and focus hold
 * the dismiss deadline through real pointer and focus events, the expanded region
 * box spans the published gap, the Alt+T return path closes at both Tab
 * boundaries, and Escape on the body leaves notifications alone.
 *
 * Every fixture uses real layout and real native input; no geometry, focus, or
 * observer is mocked, and no assertion depends on window focus automation.
 */
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Toast } from '@xenon/solid/toast'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
/** Mount one disposable owner into a fresh container and return a body-scoped query view. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(document.body)
}
/** Flush pending reactive work, let real timers advance, then flush again. */
async function settle(time = 60) {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, time))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

/** Flow-layout notification stack used by the lifetime, keyboard, and Escape cases. */
function Stack(props: { label: string }) {
  const toast = Toast.useManager()
  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label={props.label}
        gap={12}
        style={{
          position: 'fixed',
          inset: 'auto 20px 20px auto',
          width: '300px',
          margin: '0',
          padding: '12px',
          border: '0',
          background: 'white',
          overflow: 'visible',
        }}
      >
        <For each={toast.toasts()}>
          {(item) => (
            <Toast.Content
              toast={item}
              data-testid={`toast-${item.id}`}
              style={{ background: 'white', padding: '12px', border: '1px solid black' }}
            >
              <Toast.Title />
              <Toast.Description />
              <Toast.Close aria-label="Close">Close</Toast.Close>
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Portal>
  )
}

/**
 * Consumer stack CSS for the gap case. The region is bottom-anchored and derives
 * its expanded height from `--toast-viewport-height`, so the region box must span
 * the space between translated notifications for hover to survive the gap.
 */
const gapStyles = `
  .gap-region {
    position: fixed;
    inset: auto 20px 20px auto;
    width: 300px;
    height: var(--toast-front-height, 0px);
  }
  .gap-region[data-expanded] {
    height: var(--toast-viewport-height);
  }
  .gap-item {
    position: absolute;
    inset: auto 0 0;
    box-sizing: border-box;
    height: var(--toast-height, 0px);
    padding: 10px;
    border: 1px solid black;
    background: white;
    z-index: calc(10 - var(--toast-index));
  }
  .gap-item[data-expanded] {
    transform: translateY(calc(var(--toast-offset-y) * -1));
  }
`

/** Bottom-anchored stack whose gaps must stay inside the expanded region box. */
function GapStack() {
  const toast = Toast.useManager()
  return (
    <Toast.Portal>
      <Toast.Viewport aria-label="Gap notifications" class="gap-region" gap={80}>
        <For each={toast.toasts()}>
          {(item) => (
            <Toast.Content toast={item} class="gap-item" data-testid={`toast-${item.id}`}>
              <Toast.Title />
              <Toast.Description />
              <Toast.Close aria-label="Close">Close</Toast.Close>
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Portal>
  )
}

test('hovering a notification holds its dismiss deadline and releasing resumes the lifetime', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <button>Page target</button>
      <Stack label="Hover notifications" />
    </Toast.Provider>
  ))
  const pageTarget = m.getByRole('button', { name: 'Page target' })
  // Focusing the region's owner document first keeps the window-blur reason clear,
  // so the hold below is attributable to the pointer.
  pageTarget.focus()
  const id = toast.add({ title: 'Hover hold', duration: 1000 })
  await settle()
  const node = m.getByTestId(`toast-${id}`)
  await userEvent.hover(node)
  await settle()
  expect(node).toHaveAttribute('data-paused')
  // The pointer holds the notification well past its original 1000ms deadline.
  await settle(1400)
  expect(m.getByTestId(`toast-${id}`)).toBe(node)
  await userEvent.hover(pageTarget)
  await settle()
  expect(node).not.toHaveAttribute('data-paused')
  await settle(1500)
  expect(m.queryByTestId(`toast-${id}`)).toBeNull()
})

test('focus holds the dismiss deadline across moves inside the region and releases outside', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <button>Page target</button>
      <Stack label="Focus notifications" />
    </Toast.Provider>
  ))
  const pageTarget = m.getByRole('button', { name: 'Page target' })
  // Focusing the owner document first leaves only the focus reason holding the timer.
  pageTarget.focus()
  const id = toast.add({ title: 'Focus hold', duration: 1000 })
  await settle()
  const node = m.getByTestId(`toast-${id}`)
  const close = within(node).getByRole('button', { name: 'Close' })
  close.focus()
  await settle()
  expect(node).toHaveAttribute('data-paused')
  await settle(1400)
  expect(m.getByTestId(`toast-${id}`)).toBe(node)
  // Moving focus to another element inside the region must not release the hold.
  node.focus()
  await settle(1400)
  expect(m.getByTestId(`toast-${id}`)).toBe(node)
  pageTarget.focus()
  await settle(1500)
  expect(m.queryByTestId(`toast-${id}`)).toBeNull()
})

test('the expanded region box spans the gap so pointer traversal stays paused', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <style>{gapStyles}</style>
      <button>Page target</button>
      <GapStack />
    </Toast.Provider>
  ))
  const oldest = toast.add({ title: 'Oldest' })
  const middle = toast.add({ title: 'Middle' })
  const newest = toast.add({ title: 'Newest' })
  await settle(120)
  const region = m.getByRole('region', { name: 'Gap notifications' })
  const front = m.getByTestId(`toast-${newest}`)
  const middleNode = m.getByTestId(`toast-${middle}`)
  const oldestNode = m.getByTestId(`toast-${oldest}`)
  await userEvent.hover(front)
  await settle()
  expect(region).toHaveAttribute('data-expanded')
  expect(middleNode).toHaveAttribute('data-expanded')
  expect(oldestNode).toHaveAttribute('data-expanded')
  const regionRect = region.getBoundingClientRect()
  const middleRect = middleNode.getBoundingClientRect()
  const oldestRect = oldestNode.getBoundingClientRect()
  expect(oldestRect.bottom).toBeLessThan(middleRect.top)
  const gapX = regionRect.left + regionRect.width / 2
  const gapY = (oldestRect.bottom + middleRect.top) / 2
  // The published expanded height must cover the empty gap between notifications.
  expect(region.contains(document.elementFromPoint(gapX, gapY))).toBe(true)
  await userEvent.hover(region, {
    position: { x: gapX - regionRect.left, y: gapY - regionRect.top },
  })
  await settle()
  expect(region).toHaveAttribute('data-expanded')
  expect(middleNode).toHaveAttribute('data-paused')
  expect(oldestNode).toHaveAttribute('data-paused')
  await userEvent.hover(m.getByRole('button', { name: 'Page target' }))
  await settle()
  expect(region).not.toHaveAttribute('data-expanded')
})

test('the Alt+T return path closes at the first and last Tab boundaries', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <div tabindex={-1} data-testid="origin">
        Before
      </div>
      <Stack label="Keyboard notifications" />
    </Toast.Provider>
  ))
  toast.add({ title: 'Oldest' })
  toast.add({ title: 'Newest' })
  await settle()
  const origin = m.getByTestId('origin')
  const region = m.getByRole('region', { name: 'Keyboard notifications' })
  const newest = m.getByRole('group', { name: 'Newest' })
  const newestClose = within(newest).getByRole('button', { name: 'Close' })
  const oldest = m.getByRole('group', { name: 'Oldest' })
  const oldestClose = within(oldest).getByRole('button', { name: 'Close' })

  origin.focus()
  expect(origin).toHaveFocus()
  await userEvent.keyboard('{Alt>}t{/Alt}')
  expect(region).toHaveFocus()
  // Shift+Tab from the region element itself returns to the pre-hotkey element,
  // which is not reachable by ordinary Tab order.
  await userEvent.tab({ shift: true })
  expect(origin).toHaveFocus()

  // Forward traversal walks newest first and exits after the last control.
  await userEvent.keyboard('{Alt>}t{/Alt}')
  expect(region).toHaveFocus()
  await userEvent.tab()
  expect(newest).toHaveFocus()
  await userEvent.tab()
  expect(newestClose).toHaveFocus()
  await userEvent.tab()
  expect(oldest).toHaveFocus()
  await userEvent.tab()
  expect(oldestClose).toHaveFocus()
  await userEvent.tab()
  expect(origin).toHaveFocus()

  // Reverse traversal leaves from the first toast rather than the browser order.
  await userEvent.keyboard('{Alt>}t{/Alt}')
  expect(region).toHaveFocus()
  await userEvent.tab()
  await userEvent.tab()
  await userEvent.tab({ shift: true })
  expect(newest).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(origin).toHaveFocus()
})

test('Escape on the body does not dismiss notifications that do not contain focus', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <button>Page target</button>
      <Stack label="Escape notifications" />
    </Toast.Provider>
  ))
  toast.add({ title: 'First' })
  toast.add({ title: 'Second' })
  toast.add({ title: 'Third' })
  await settle()
  expect(m.getAllByRole('group')).toHaveLength(3)
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  expect(document.activeElement).toBe(document.body)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getAllByRole('group')).toHaveLength(3)
  expect(m.queryByRole('group', { name: 'Third' })).not.toBeNull()
})
