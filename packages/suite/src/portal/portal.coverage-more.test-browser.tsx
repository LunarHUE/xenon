import { Popover, Tooltip } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  let disposed = false
  const unmount = () => {
    if (disposed) return
    disposed = true
    dispose()
    host.remove()
  }
  cleanups.push(unmount)
  flush()
  return { host, query: within(document.body), unmount }
}

test('portal.dismissal.1: clicking portalled popover content remains inside the layer', async () => {
  const destination = document.createElement('div')
  document.body.append(destination)
  cleanups.push(() => destination.remove())
  const mounted = mount(() => (
    <Popover>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Portal container={destination}>
        <Popover.Positioner>
          <Popover.Content aria-label="Details">Portalled details</Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover>
  ))
  await userEvent.click(mounted.query.getByRole('button', { name: 'Open' }))
  const content = mounted.query.getByRole('dialog', { name: 'Details' })
  await userEvent.click(content)
  expect(content).toBeInTheDocument()
  expect(destination.contains(content)).toBe(true)
  expect(content).toHaveAttribute('data-state', 'open')
  expect(mounted.query.getByRole('button', { name: 'Open' })).toHaveAttribute(
    'aria-expanded',
    'true'
  )
})

test('portal.dismissal.6: nested layers in separate portal containers stay open together', async () => {
  const outerDestination = document.createElement('div')
  const innerDestination = document.createElement('div')
  document.body.append(outerDestination, innerDestination)
  cleanups.push(() => {
    outerDestination.remove()
    innerDestination.remove()
  })
  const mounted = mount(() => (
    <Popover>
      <Popover.Trigger>Outer</Popover.Trigger>
      <Popover.Portal container={outerDestination}>
        <Popover.Positioner>
          <Popover.Content aria-label="Outer details">
            <Popover>
              <Popover.Trigger>Inner</Popover.Trigger>
              <Popover.Portal container={innerDestination}>
                <Popover.Positioner>
                  <Popover.Content aria-label="Inner details">Inner content</Popover.Content>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover>
  ))
  await userEvent.click(mounted.query.getByRole('button', { name: 'Outer' }))
  await userEvent.click(mounted.query.getByRole('button', { name: 'Inner' }))
  const outer = mounted.query.getByRole('dialog', { name: 'Outer details' })
  const inner = mounted.query.getByRole('dialog', { name: 'Inner details' })
  await userEvent.click(inner)
  expect(outer).toBeInTheDocument()
  expect(inner).toBeInTheDocument()
  expect(outerDestination.contains(outer)).toBe(true)
  expect(innerDestination.contains(inner)).toBe(true)
  expect(inner).toHaveAttribute('data-state', 'open')
  expect(mounted.query.getByRole('button', { name: 'Outer' })).toHaveAttribute(
    'aria-expanded',
    'true'
  )
  expect(mounted.query.getByRole('button', { name: 'Inner' })).toHaveAttribute(
    'aria-expanded',
    'true'
  )
})

test('portal.dismissal.4: clicking tooltip content keeps its containing popover open', async () => {
  for (const siblingPortal of [false, true]) {
    const destination = document.createElement('div')
    document.body.append(destination)
    cleanups.push(() => destination.remove())
    const popoverChanged = vi.fn()
    const tooltipChanged = vi.fn()
    const mounted = mount(() => (
      <Popover defaultOpen onOpenChange={popoverChanged}>
        <Popover.Trigger>Outer</Popover.Trigger>
        <Popover.Portal container={destination}>
          <Popover.Positioner>
            <Popover.Content aria-label="Outer details">
              <Tooltip defaultOpen onOpenChange={tooltipChanged}>
                <Tooltip.Trigger>Help</Tooltip.Trigger>
                {siblingPortal ? (
                  <Tooltip.Portal>
                    <Tooltip.Positioner>
                      <Tooltip.Content style={{ 'pointer-events': 'auto', visibility: 'visible' }}>
                        Tooltip details
                      </Tooltip.Content>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                ) : (
                  <Tooltip.Positioner>
                    <Tooltip.Content style={{ 'pointer-events': 'auto', visibility: 'visible' }}>
                      Tooltip details
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                )}
              </Tooltip>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover>
    ))
    const tooltip = mounted.query.getAllByRole('tooltip', { hidden: true }).at(-1)!
    await userEvent.click(tooltip)
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveAttribute('data-state', 'open')
    expect(destination.contains(tooltip)).toBe(!siblingPortal)
    expect(mounted.query.getAllByRole('dialog', { hidden: true }).at(-1)).toHaveAttribute(
      'data-state',
      'open'
    )
    expect(popoverChanged).not.toHaveBeenCalled()
    expect(tooltipChanged).not.toHaveBeenCalled()
    mounted.unmount()
  }
})
