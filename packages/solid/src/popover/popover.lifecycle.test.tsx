import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Popover } from './popover'

afterEach(cleanup)
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

test('controlled refusal retains the same native wrapper across repeated Escape requests', () => {
  const change = vi.fn()
  const { container } = render(() => (
    <Popover open onOpenChange={change}>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Details" />
      </Popover.Positioner>
    </Popover>
  ))
  const wrapper = container.querySelector('[popover]')!
  for (let index = 0; index < 2; index++) {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
    flush()
    expect(container.querySelector('[popover]')).toBe(wrapper)
    expect(wrapper).toHaveAttribute('data-state', 'open')
  }
  expect(change.mock.calls).toEqual([[false], [false]])
})

test('modal exit retains its lock and content, and reopening ignores an old animation completion', async () => {
  const [open, setOpen] = createSignal(true)
  const { container } = render(() => (
    <Popover open={open()} modal>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Details" />
      </Popover.Positioner>
    </Popover>
  ))
  const content = container.querySelector('[role="dialog"]') as HTMLElement
  const wrapper = content.parentElement!
  let finish!: () => void
  const finished = new Promise<void>((resolve) => {
    finish = resolve
  })
  Object.assign(content, { getAnimations: () => [{ playState: 'running', finished }] })
  setOpen(false)
  flush()
  expect(content).toHaveAttribute('inert')
  expect(document.documentElement.style.overflowY).toBe('hidden')
  await frame()
  flush()
  setOpen(true)
  flush()
  expect(content).not.toHaveAttribute('inert')
  finish()
  await Promise.resolve()
  await frame()
  flush()
  expect(container.querySelector('[popover]')).toBe(wrapper)
  expect(container.querySelector('[role="dialog"]')).toBe(content)
  expect(document.documentElement.style.overflowY).toBe('hidden')
  Object.assign(content, { getAnimations: () => [] })
  setOpen(false)
  flush()
  await frame()
  flush()
  expect(container.querySelector('[popover]')).toBeNull()
  expect(document.documentElement.style.overflowY).toBe('')
})

test('nested modal removal releases only the child lock', () => {
  const [child, setChild] = createSignal(true)
  const { container } = render(() => (
    <Popover defaultOpen modal>
      <Popover.Trigger>Parent</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Parent">
          <Popover open={child()} modal>
            <Popover.Trigger>Child</Popover.Trigger>
            <Popover.Positioner>
              <Popover.Content aria-label="Child" />
            </Popover.Positioner>
          </Popover>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(2)
  setChild(false)
  flush()
  expect(container.querySelectorAll('[role="dialog"]')).toHaveLength(1)
  expect(document.documentElement.style.overflowY).toBe('hidden')
})
