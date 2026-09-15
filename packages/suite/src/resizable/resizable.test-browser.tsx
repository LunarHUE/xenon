import { render } from '@solidjs/web'
import { Resizable } from '@tenon/solid/resizable'
import type { ResizableProps } from '@tenon/solid/resizable'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'
function mount(props: ResizableProps = {}, veto = false) {
  const container = document.createElement('div')
  document.body.append(container)
  const [show, setShow] = createSignal(true)
  const dispose = render(
    () => (
      <>
        <button>Before</button>
        {show() && (
          <Resizable
            defaultSizes={[30, 40, 30]}
            {...props}
            style={{ width: '600px', height: '300px' }}
          >
            <Resizable.Panel index={0} id="files" minSize={10} collapsible aria-label="Files">
              Files
            </Resizable.Panel>
            <Resizable.Handle
              index={0}
              data-testid="handle"
              onPointerDown={(event) => {
                if (veto) event.preventDefault()
              }}
              onKeyDown={(event) => {
                if (veto) event.preventDefault()
              }}
              style={{ width: '10px', height: '10px', 'align-self': 'stretch' }}
            />
            <Resizable.Panel index={1} minSize={20} aria-label="Editor">
              Editor
            </Resizable.Panel>
            <Resizable.Handle index={1} style={{ width: '10px', height: '10px' }} />
            <Resizable.Panel index={2}>Preview</Resizable.Panel>
          </Resizable>
        )}
        <div
          data-testid="target"
          style={{ position: 'fixed', left: '400px', top: '150px', width: '20px', height: '20px' }}
        />
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
  return {
    container,
    ...within(container),
    remove: () => {
      setShow(false)
      flush()
    },
  }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
test('native Tab, axis keys, bounds, collapse and axe', async () => {
  const commit = vi.fn()
  const view = mount({ onSizesCommit: commit })
  await settle()
  await userEvent.click(view.getByRole('button'))
  await userEvent.tab()
  const handle = view.getByRole('separator', { name: 'Files' })
  expect(handle).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '31')
  expect(commit).toHaveBeenCalledExactlyOnceWith([31, 39, 30])
  await userEvent.keyboard('{End}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '0')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  await expectNoViolations(view.container)
})
test('native mouse drag clamps adjacent pair, preserves third panel, and commits once', async () => {
  const change = vi.fn(),
    commit = vi.fn()
  const view = mount({ onSizesChange: change, onSizesCommit: commit })
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  await userEvent.dragAndDrop(handle, view.getByTestId('target'))
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  expect(change).toHaveBeenLastCalledWith([50, 20, 30])
  expect(commit).toHaveBeenCalledExactlyOnceWith([50, 20, 30])
  expect(document.documentElement.style.userSelect).toBe('')
  expect(handle).toHaveFocus()
})
test('vertical and RTL keyboards match physical direction', async () => {
  const view = mount({ dir: 'rtl' })
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  await userEvent.click(handle)
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '29')
  view.remove()
  const vertical = mount({ orientation: 'vertical' })
  await settle()
  const upper = vertical.getByRole('separator', { name: 'Files' })
  await userEvent.click(upper)
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(upper).toHaveAttribute('aria-valuenow', '31')
  expect(upper).not.toHaveAttribute('aria-orientation')
})
test('touch ownership, pointer cancel and unmount release document listeners and selection', async () => {
  const commit = vi.fn()
  const view = mount({ onSizesCommit: commit })
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  const pointer = (type: string, pointerId = 1) =>
    new PointerEvent(type, {
      pointerId,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: type === 'pointerdown' ? 100 : 150,
      bubbles: true,
      cancelable: true,
    })
  handle.dispatchEvent(pointer('pointerdown'))
  document.dispatchEvent(pointer('pointermove', 2))
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '30')
  document.dispatchEvent(pointer('pointermove'))
  await settle()
  expect(Number(handle.getAttribute('aria-valuenow'))).toBeGreaterThan(30)
  document.dispatchEvent(pointer('pointercancel'))
  expect(commit).not.toHaveBeenCalled()
  expect(document.documentElement.style.userSelect).toBe('')
  handle.dispatchEvent(pointer('pointerdown'))
  expect(document.documentElement.style.userSelect).toBe('none')
  view.remove()
  expect(document.documentElement.style.userSelect).toBe('')
  document.dispatchEvent(pointer('pointerup'))
  expect(commit).not.toHaveBeenCalled()
})

test('author prevention vetoes native pointer and keyboard requests', async () => {
  const change = vi.fn()
  const view = mount({ onSizesChange: change }, true)
  await settle()
  const handle = view.getByRole('separator', { name: 'Files' })
  await userEvent.dragAndDrop(handle, view.getByTestId('target'))
  handle.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(change).not.toHaveBeenCalled()
  expect(handle).toHaveAttribute('aria-valuenow', '30')
  expect(document.documentElement.style.userSelect).toBe('')
})
