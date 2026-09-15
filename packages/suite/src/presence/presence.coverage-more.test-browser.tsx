import { Collapsible, Popover } from '@xenon/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

import { mount as harnessMount } from '../harness/solid'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

test('presence.animation.10: real CSS transitions finish at the longest per-property end time', async () => {
  const style = document.createElement('style')
  style.textContent =
    '[data-suite-motion] { opacity: 1; transform: translateX(0); transition-property: opacity, transform; transition-duration: 100ms, 300ms; transition-delay: 300ms, 0ms; } [data-suite-motion][data-ending-style] { opacity: 0; transform: translateX(4px); }'
  document.head.append(style)
  cleanups.push(() => style.remove())
  const mounted = harnessMount('collapsible', {
    open: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content data-suite-motion="">Contents</Collapsible.Content>
      </>
    ),
  })
  const content = within(mounted.container).getByText('Contents')
  await mounted.settle()
  mounted.setProps({ open: false })
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  expect(content).toBeInTheDocument()
  expect(content).toHaveAttribute('data-ending-style', '')
  await new Promise((resolve) => setTimeout(resolve, 350))
  expect(content).toBeInTheDocument()
  await new Promise((resolve) => setTimeout(resolve, 100))
  await mounted.settle()
  expect(content).not.toBeInTheDocument()
})

test('presence.focus.1: closing multiple focused exiting items restores focus past them', async () => {
  const [outerOpen, setOuterOpen] = createSignal(true)
  const [innerOpen, setInnerOpen] = createSignal(true)
  const style = document.createElement('style')
  style.textContent =
    '[data-focus-exit][data-ending-style] { opacity: 0; transition: opacity 160ms linear; } [data-focus-exit="inner"][data-ending-style] { transition-duration: 80ms; }'
  document.head.append(style)
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <>
        <Popover open={outerOpen()}>
          <Popover.Trigger>Survivor</Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content aria-label="Outer" data-focus-exit="outer">
              <Popover open={innerOpen()}>
                <Popover.Trigger>Inner trigger</Popover.Trigger>
                <Popover.Positioner>
                  <Popover.Content aria-label="Inner" data-focus-exit="inner">
                    <button>Focused action</button>
                  </Popover.Content>
                </Popover.Positioner>
              </Popover>
            </Popover.Content>
          </Popover.Positioner>
        </Popover>
      </>
    ),
    host
  )
  cleanups.push(() => {
    dispose()
    host.remove()
    style.remove()
  })
  flush()
  await new Promise((resolve) => setTimeout(resolve, 50))
  flush()
  const query = within(host)
  const action = query.getByRole('button', { name: 'Focused action' })
  action.focus()
  expect(action).toHaveFocus()
  setInnerOpen(false)
  setOuterOpen(false)
  flush()
  const outer = query.getByRole('dialog', { name: 'Outer' })
  const inner = query.getByRole('dialog', { name: 'Inner' })
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  expect(outer).toHaveAttribute('data-ending-style', '')
  expect(inner).toHaveAttribute('data-ending-style', '')
  expect(outer).toHaveAttribute('inert')
  expect(inner).toHaveAttribute('inert')
  await new Promise((resolve) => setTimeout(resolve, 220))
  flush()
  expect(query.getByRole('button', { name: 'Survivor' })).toHaveFocus()
  expect(query.queryByRole('dialog', { name: 'Outer' })).toBeNull()
  expect(query.queryByRole('dialog', { name: 'Inner' })).toBeNull()
})
