/** Native pointer geometry, axis direction, restore and multi-group behavior for Resizable. */
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Resizable } from '@xenon/solid/resizable'
import type { ResizableProps } from '@xenon/solid/resizable'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Definite root size so panel flex weights resolve to real pixel geometry. */
const surface: JSX.CSSProperties = { width: '600px', height: '300px' }
/** Drop target parked left of the split so a native drag crosses the main axis. */
const dropTarget: JSX.CSSProperties = {
  position: 'fixed',
  left: '2px',
  top: '150px',
  width: '20px',
  height: '20px',
}

/** One 30/40/30 split with a collapsible primary panel plus an off-root drop target. */
function Split(props: ResizableProps) {
  return (
    <>
      <Resizable defaultSizes={[30, 40, 30]} {...props} style={surface}>
        <Resizable.Panel index={0} minSize={10} collapsible aria-label="Files">
          Files
        </Resizable.Panel>
        <Resizable.Handle
          index={0}
          style={{ width: '10px', height: '10px', 'align-self': 'stretch' }}
        />
        <Resizable.Panel index={1} minSize={20} aria-label="Editor">
          Editor
        </Resizable.Panel>
        <Resizable.Handle index={1} style={{ width: '10px', height: '10px' }} />
        <Resizable.Panel index={2}>Preview</Resizable.Panel>
      </Resizable>
      <div data-testid="target" style={dropTarget} />
    </>
  )
}

/** Two fully independent split roots whose primary handles are named by their panels. */
function Groups() {
  return (
    <>
      <Resizable defaultSizes={[30, 70]} style={{ width: '400px', height: '100px' }}>
        <Resizable.Panel index={0} aria-label="Alpha">
          Alpha
        </Resizable.Panel>
        <Resizable.Handle
          index={0}
          style={{ width: '8px', height: '8px', 'align-self': 'stretch' }}
        />
        <Resizable.Panel index={1}>Beta</Resizable.Panel>
      </Resizable>
      <Resizable defaultSizes={[40, 60]} style={{ width: '400px', height: '100px' }}>
        <Resizable.Panel index={0} aria-label="Gamma">
          Gamma
        </Resizable.Panel>
        <Resizable.Handle
          index={0}
          style={{ width: '8px', height: '8px', 'align-self': 'stretch' }}
        />
        <Resizable.Panel index={1}>Delta</Resizable.Panel>
      </Resizable>
    </>
  )
}

/** Render a fixture into the body and dispose it once, either now or with the test. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  let alive = true
  const remove = () => {
    if (!alive) return
    alive = false
    dispose()
    container.remove()
    flush()
  }
  onTestFinished(remove)
  flush()
  return { container, ...within(container), remove }
}

/** Flush Solid and let the browser carry pending layout and pointer work. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('native pointer drag reverses horizontal displacement in RTL', async () => {
  const ltrCommit = vi.fn()
  const ltr = mount(() => <Split onSizesCommit={ltrCommit} />)
  await settle()
  const ltrHandle = ltr.getByRole('separator', { name: 'Files' })
  await userEvent.dragAndDrop(ltrHandle, ltr.getByTestId('target'))
  await settle()
  expect(ltrHandle).toHaveAttribute('aria-valuenow', '10')
  expect(ltrHandle).not.toHaveAttribute('data-dragging')
  expect(ltrCommit).toHaveBeenCalledExactlyOnceWith([10, 60, 30])
  ltr.remove()

  const rtlCommit = vi.fn()
  const rtl = mount(() => <Split dir="rtl" onSizesCommit={rtlCommit} />)
  await settle()
  const rtlHandle = rtl.getByRole('separator', { name: 'Files' })
  await userEvent.dragAndDrop(rtlHandle, rtl.getByTestId('target'))
  await settle()
  expect(rtlHandle).toHaveAttribute('aria-valuenow', '50')
  expect(rtlHandle).not.toHaveAttribute('data-dragging')
  expect(rtlCommit).toHaveBeenCalledExactlyOnceWith([50, 20, 30])
})

test('native pointer drag in vertical orientation follows the vertical axis', async () => {
  const commit = vi.fn()
  const view = mount(() => <Split orientation="vertical" onSizesCommit={commit} />)
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  const target = view.getByTestId('target')
  const box = handle.getBoundingClientRect()
  target.style.left = `${Math.max(10, Math.min(box.left + box.width / 2 - 10, window.innerWidth - 30))}px`
  target.style.top = `${box.bottom + 120}px`
  await userEvent.dragAndDrop(handle, target)
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  expect(handle).not.toHaveAttribute('data-dragging')
  expect(commit).toHaveBeenCalledExactlyOnceWith([50, 20, 30])
})

test('native keys on the second handle transfer only its adjacent pair', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => <Split onSizesChange={change} onSizesCommit={commit} />)
  await settle()
  const first = view.getByRole('separator', { name: 'Files' })
  const second = view.getByRole('separator', { name: 'Editor' })
  second.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(second).toHaveAttribute('aria-valuenow', '41')
  expect(first).toHaveAttribute('aria-valuenow', '30')
  expect(change).toHaveBeenLastCalledWith([30, 41, 29])
  expect(commit).toHaveBeenCalledExactlyOnceWith([30, 41, 29])
})

test('independent groups keep separate sizes and generated panel associations', async () => {
  const view = mount(() => <Groups />)
  await settle()
  const alpha = view.getByRole('separator', { name: 'Alpha' })
  const gamma = view.getByRole('separator', { name: 'Gamma' })
  const alphaPanel = document.getElementById(alpha.getAttribute('aria-controls')!)
  const gammaPanel = document.getElementById(gamma.getAttribute('aria-controls')!)
  expect(alphaPanel).not.toBeNull()
  expect(gammaPanel).not.toBeNull()
  expect(alphaPanel).not.toBe(gammaPanel)
  expect(alphaPanel!).toHaveAttribute('aria-label', 'Alpha')
  expect(gammaPanel!).toHaveAttribute('aria-label', 'Gamma')

  alpha.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(alpha).toHaveAttribute('aria-valuenow', '31')
  expect(gamma).toHaveAttribute('aria-valuenow', '40')

  gamma.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(gamma).toHaveAttribute('aria-valuenow', '41')
  expect(alpha).toHaveAttribute('aria-valuenow', '31')
})

test('native Enter restores an initially collapsed panel toward equal allocation', async () => {
  const commit = vi.fn()
  const view = mount(() => (
    <Resizable defaultSizes={[0, 100]} onSizesCommit={commit} style={surface}>
      <Resizable.Panel index={0} minSize={10} collapsible aria-label="Files">
        Files
      </Resizable.Panel>
      <Resizable.Handle
        index={0}
        style={{ width: '10px', height: '10px', 'align-self': 'stretch' }}
      />
      <Resizable.Panel index={1} aria-label="Editor">
        Editor
      </Resizable.Panel>
    </Resizable>
  ))
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  const panel = view.getByText('Files')
  expect(handle).toHaveAttribute('aria-valuenow', '0')
  expect(panel).toHaveAttribute('inert')

  await userEvent.click(handle)
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  expect(panel).not.toHaveAttribute('inert')

  await userEvent.keyboard('{Enter}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '0')
  expect(panel).toHaveAttribute('inert')
  expect(commit.mock.calls).toEqual([[[50, 50]], [[0, 100]]])
})

test('native Enter keeps a collapsible panel expanded when its neighbor cannot absorb it', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <Resizable
      defaultSizes={[40, 60]}
      onSizesChange={change}
      onSizesCommit={commit}
      style={surface}
    >
      <Resizable.Panel index={0} collapsible aria-label="Files">
        Files
      </Resizable.Panel>
      <Resizable.Handle
        index={0}
        style={{ width: '10px', height: '10px', 'align-self': 'stretch' }}
      />
      <Resizable.Panel index={1} maxSize={60} aria-label="Editor">
        Editor
      </Resizable.Panel>
    </Resizable>
  ))
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  await userEvent.click(handle)
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '40')
  expect(view.getByText('Files')).not.toHaveAttribute('inert')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})

test('a native secondary-button press does not start a resize gesture', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => <Split onSizesChange={change} onSizesCommit={commit} />)
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  await userEvent.click(handle, { button: 'right' })
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '30')
  expect(handle).not.toHaveAttribute('data-dragging')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  expect(document.documentElement.style.userSelect).toBe('')
})
