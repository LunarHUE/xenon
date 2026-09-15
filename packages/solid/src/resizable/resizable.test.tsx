import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { Resizable } from './resizable'
const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}
test('adjacent keyboard changes retain DOM identity, commit once, and honor live labels', async () => {
  const change = vi.fn(),
    commit = vi.fn()
  const [id, setId] = createSignal('primary')
  const view = render(() => (
    <Resizable defaultSizes={[30, 40, 30]} onSizesChange={change} onSizesCommit={commit}>
      <Resizable.Panel index={0} id={id()} aria-label="Files" minSize={10}>
        Files
      </Resizable.Panel>
      <Resizable.Handle index={0} />
      <Resizable.Panel index={1} minSize={20}>
        Editor
      </Resizable.Panel>
      <Resizable.Handle index={1} aria-label="Editor" />
      <Resizable.Panel index={2}>Preview</Resizable.Panel>
    </Resizable>
  ))
  await settle()
  expect(change).not.toHaveBeenCalled()
  const handle = view.getByRole('separator', { name: 'Files' })
  fireEvent.keyDown(handle, { key: 'End' })
  await settle()
  expect(change).toHaveBeenLastCalledWith([50, 20, 30])
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  expect(commit).not.toHaveBeenCalled()
  fireEvent.keyUp(handle, { key: 'End' })
  fireEvent.blur(handle)
  expect(commit).toHaveBeenCalledExactlyOnceWith([50, 20, 30])
  setId('renamed')
  await settle()
  expect(handle).toHaveAttribute('aria-controls', 'renamed')
  expect(view.getByRole('separator', { name: 'Files' })).toBe(handle)
})
test('controlled owner wins and author cancellation vetoes keys', async () => {
  const change = vi.fn()
  const [cancel, setCancel] = createSignal(false)
  const view = render(() => (
    <Resizable sizes={[50, 50]} onSizesChange={change}>
      <Resizable.Panel index={0} aria-label="Files" />
      <Resizable.Handle
        index={0}
        onKeyDown={(event) => {
          if (cancel()) event.preventDefault()
        }}
      />
      <Resizable.Panel index={1} />
    </Resizable>
  ))
  await settle()
  const handle = view.getByRole('separator')
  fireEvent.keyDown(handle, { key: 'ArrowRight' })
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith([51, 49])
  expect(handle).toHaveAttribute('aria-valuenow', '50')
  setCancel(true)
  await settle()
  fireEvent.keyDown(handle, { key: 'ArrowRight' })
  expect(change).toHaveBeenCalledTimes(1)
})
test('Enter restores prior size and collapsed content is inert', async () => {
  const view = render(() => (
    <Resizable defaultSizes={[35, 65]}>
      <Resizable.Panel index={0} aria-label="Files" minSize={20} collapsible>
        Files
      </Resizable.Panel>
      <Resizable.Handle index={0} />
      <Resizable.Panel index={1} />
    </Resizable>
  ))
  await settle()
  const handle = view.getByRole('separator')
  fireEvent.keyDown(handle, { key: 'Enter' })
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '0')
  expect(view.getByText('Files')).toHaveAttribute('inert')
  fireEvent.keyDown(handle, { key: 'Enter' })
  await settle()
  expect(handle).toHaveAttribute('aria-valuenow', '35')
  expect(view.getByText('Files')).not.toHaveAttribute('inert')
})
test('dynamic panel registration updates constraints and cleans up', async () => {
  const [show, setShow] = createSignal(true)
  const view = render(() => (
    <Resizable>
      <Resizable.Panel index={0} aria-label="Files" />
      <Resizable.Handle index={0} />
      <Resizable.Panel index={1} />
      {show() && <Resizable.Panel index={2} minSize={20} />}
    </Resizable>
  ))
  await settle()
  expect(view.getByRole('separator')).toHaveAttribute('aria-valuenow', String(100 / 3))
  setShow(false)
  await settle()
  expect(view.getByRole('separator')).toHaveAttribute('aria-valuenow', '50')
})
