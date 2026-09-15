import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Dialog } from './dialog'

afterEach(cleanup)

describe('Dialog transitions', () => {
  test('controlled open requests render after the parent accepts them', () => {
    const [open, setOpen] = createSignal(false)
    const change = vi.fn((next: boolean) => setOpen(next))
    const view = render(() => (
      <Dialog open={open()} onOpenChange={change}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Editor" />
      </Dialog>
    ))
    view.getByText('Open').click()
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(true)
    expect(view.getByRole('dialog')).toBeInTheDocument()
    view
      .getByRole('dialog')
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    flush()
    expect(change).toHaveBeenLastCalledWith(false)
    expect(view.queryByRole('dialog')).toBeNull()
  })

  test('a child that stops Escape propagation keeps the modal open', () => {
    const change = vi.fn()
    const view = render(() => (
      <Dialog defaultOpen onOpenChange={change}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Editor">
          <input onKeyDown={(event) => event.stopPropagation()} />
        </Dialog.Content>
      </Dialog>
    ))
    const input = view.container.querySelector('input')!
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    )
    flush()
    expect(view.getByRole('dialog')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
  })
})
