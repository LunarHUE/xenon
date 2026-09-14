import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest'
import { Dialog } from './dialog'

afterEach(cleanup)

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.show = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

describe('Dialog', () => {
  test('opens native content, registers names and closes', () => {
    const { getByText, queryByRole, getByRole } = render(() => (
      <Dialog>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Title id="heading">Heading</Dialog.Title>
          <Dialog.Description id="description">Explanation</Dialog.Description>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    ))
    expect(queryByRole('dialog')).toBeNull()
    getByText('Open').click()
    flush()
    const content = getByRole('dialog')
    expect(content).toHaveAttribute('open')
    expect(content).toHaveAttribute('aria-labelledby', 'heading')
    expect(content).toHaveAttribute('aria-describedby', 'description')
    expect(getByText('Open')).toHaveAttribute('aria-controls', content.id)
    getByText('Close').click()
    flush()
    expect(queryByRole('dialog')).toBeNull()
  })
  test('controlled open requests and author cancellation', () => {
    const change = vi.fn()
    const { getByText, queryByRole } = render(() => (
      <Dialog open={false} onOpenChange={change}>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Trigger onClick={(e) => e.preventDefault()}>Cancel</Dialog.Trigger>
        <Dialog.Content aria-label="Editor" />
      </Dialog>
    ))
    getByText('Cancel').click()
    flush()
    expect(change).not.toHaveBeenCalled()
    getByText('Open').click()
    flush()
    expect(change).toHaveBeenCalledWith(true)
    expect(queryByRole('dialog')).toBeNull()
  })
  test('reactive title ids and removed descriptions update associations', () => {
    const [id, setId] = createSignal('first')
    const { getByRole } = render(() => (
      <Dialog defaultOpen>
        <Dialog.Content>
          <Dialog.Title id={id()}>Heading</Dialog.Title>
        </Dialog.Content>
      </Dialog>
    ))
    setId('second')
    flush()
    expect(getByRole('dialog')).toHaveAttribute('aria-labelledby', 'second')
    expect(getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })
  test('author aria-label overrides generated title', () => {
    const { getByRole } = render(() => (
      <Dialog defaultOpen>
        <Dialog.Content aria-label="Explicit">
          <Dialog.Title>Heading</Dialog.Title>
        </Dialog.Content>
      </Dialog>
    ))
    expect(getByRole('dialog')).not.toHaveAttribute('aria-labelledby')
  })

  test('disabled polymorphic triggers preserve Button activation gates', () => {
    const change = vi.fn()
    const { getByText } = render(() => (
      <Dialog onOpenChange={change}>
        <Dialog.Trigger as="div" disabled>
          Open
        </Dialog.Trigger>
      </Dialog>
    ))
    getByText('Open').click()
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(getByText('Open')).toHaveAttribute('aria-disabled', 'true')
  })
  test('conditional description removal removes its reference', () => {
    const [shown, setShown] = createSignal(true)
    const { getByRole } = render(() => (
      <Dialog defaultOpen>
        <Dialog.Content aria-label="Editor">
          <Show when={shown()}>
            <Dialog.Description>Help</Dialog.Description>
          </Show>
        </Dialog.Content>
      </Dialog>
    ))
    expect(getByRole('dialog')).toHaveAttribute('aria-describedby')
    setShown(false)
    flush()
    expect(getByRole('dialog')).not.toHaveAttribute('aria-describedby')
  })
  test('force mounted closed content is hidden and inert', () => {
    const { container, getByText } = render(() => (
      <Dialog forceMount>
        <Dialog.Trigger>Open</Dialog.Trigger>
        <Dialog.Content aria-label="Editor" />
      </Dialog>
    ))
    const content = container.querySelector('dialog')!
    expect(content).toHaveAttribute('hidden')
    expect(content).not.toHaveAttribute('open')
    getByText('Open').click()
    flush()
    expect(content).not.toHaveAttribute('hidden')
    expect(content).toHaveAttribute('open')
  })

  test('outside dismissal veto preserves the native pointer event', async () => {
    const outside = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
    const { getByRole } = render(() => (
      <Dialog defaultOpen modal={false} onPointerOutside={outside}>
        <Dialog.Content aria-label="Editor" />
      </Dialog>
    ))
    const down = new PointerEvent('pointerdown', {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      button: 0,
    })
    const up = new PointerEvent('pointerup', {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      button: 0,
    })
    document.body.dispatchEvent(down)
    document.body.dispatchEvent(up)
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(outside).toHaveBeenCalledOnce()
    expect(getByRole('dialog')).toHaveAttribute('open')
    expect(up.defaultPrevented).toBe(false)
    expect(down.defaultPrevented).toBe(false)
  })
})
