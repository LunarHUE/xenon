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

test('viewport hosts native semantics while content keeps surface props and reactive naming', () => {
  const [label, setLabel] = createSignal('Editor')
  let surface: HTMLElement | undefined
  let host: HTMLDialogElement | undefined
  const view = render(() => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Open viewport</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Viewport
          ref={(el) => {
            host = el
          }}
        >
          <Dialog.Content
            id="viewport-dialog"
            aria-label={label()}
            class="surface"
            ref={(el) => {
              surface = el
            }}
          >
            <Dialog.Title>Generated title</Dialog.Title>
            <Dialog.Close>Close viewport</Dialog.Close>
          </Dialog.Content>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog>
  ))
  flush()
  expect(host?.localName).toBe('dialog')
  expect(host).toHaveAttribute('open')
  expect(host).toHaveAttribute('id', 'viewport-dialog')
  expect(host).toHaveAttribute('aria-label', 'Editor')
  expect(host).not.toHaveAttribute('aria-labelledby')
  expect(surface?.localName).toBe('div')
  expect(surface?.parentElement).toBe(host)
  expect(surface).toHaveClass('surface')
  expect(surface).not.toHaveAttribute('role')
  expect(surface).not.toHaveAttribute('id')
  expect(view.getByText('Open viewport')).toHaveAttribute('aria-controls', host!.id)
  setLabel('Renamed editor')
  flush()
  expect(host).toHaveAttribute('aria-label', 'Renamed editor')
  surface!.querySelector('button')!.click()
  flush()
  expect(host?.isConnected).toBe(false)
})

test('viewport background dismisses while inner surface pointer gestures stay inside', async () => {
  const change = vi.fn()
  const { getByRole, getByText } = render(() => (
    <Dialog open onOpenChange={change}>
      <Dialog.Viewport>
        <Dialog.Content aria-label="Viewport editor">
          <span>Surface</span>
        </Dialog.Content>
      </Dialog.Viewport>
    </Dialog>
  ))
  const gesture = async (target: Element) => {
    for (const type of ['pointerdown', 'pointerup'])
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          composed: true,
          pointerId: 1,
          isPrimary: true,
          button: 0,
        })
      )
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
  }
  await gesture(getByText('Surface'))
  expect(change).not.toHaveBeenCalled()
  await gesture(getByRole('dialog'))
  expect(change).toHaveBeenCalledExactlyOnceWith(false)
  expect(getByRole('dialog')).toHaveAttribute('open')
})

test('force mounted viewport stays hidden and opens its retained native host', () => {
  const view = render(() => (
    <Dialog forceMount>
      <Dialog.Trigger>Show viewport</Dialog.Trigger>
      <Dialog.Viewport style={{ display: 'grid' }}>
        <Dialog.Content aria-label="Retained" />
      </Dialog.Viewport>
    </Dialog>
  ))
  const host = view.container.querySelector('dialog')!
  expect(host).toHaveAttribute('hidden')
  expect(host).not.toHaveAttribute('open')
  expect(host.style.display).toBe('none')
  view.getByText('Show viewport').click()
  flush()
  expect(host).toHaveAttribute('open')
  expect(host).not.toHaveAttribute('hidden')
  expect(host.style.display).toBe('grid')
})

test('detached triggers connect after root mount and commands do not queue across detachments', () => {
  const handle = Dialog.createHandle<{ name: string }>()
  const [mounted, setMounted] = createSignal(false)
  const view = render(() => (
    <>
      <Dialog.Trigger handle={handle} payload={{ name: 'Trigger data' }}>
        Detached opener
      </Dialog.Trigger>
      <Show when={mounted()}>
        <Dialog handle={handle}>
          {(state) => (
            <Dialog.Viewport>
              <Dialog.Content aria-label="Shared editor">
                <span>{state.payload?.name}</span>
              </Dialog.Content>
            </Dialog.Viewport>
          )}
        </Dialog>
      </Show>
    </>
  ))
  handle.openWithPayload({ name: 'Ignored' })
  view.getByText('Detached opener').click()
  flush()
  expect(handle.isOpen).toBe(false)
  setMounted(true)
  flush()
  expect(view.queryByRole('dialog')).toBeNull()
  view.getByText('Detached opener').click()
  flush()
  expect(handle.isOpen).toBe(true)
  expect(view.getByRole('dialog')).toHaveTextContent('Trigger data')
  handle.openWithPayload({ name: 'Imperative data' })
  flush()
  expect(view.getByRole('dialog')).toHaveTextContent('Imperative data')
  setMounted(false)
  flush()
  expect(handle.isOpen).toBe(false)
  handle.open()
  setMounted(true)
  flush()
  expect(handle.isOpen).toBe(false)
  expect(view.queryByRole('dialog')).toBeNull()
  handle.open()
  flush()
  expect(view.getByRole('dialog')).toBeInTheDocument()
})

test('programmatic dialog handles open without a trigger and respect controlled state', () => {
  const handle = Dialog.createHandle<string>()
  const changes = vi.fn()
  const [open, setOpen] = createSignal(false)
  const view = render(() => (
    <Dialog handle={handle} open={open()} onOpenChange={changes}>
      {(state) => (
        <Dialog.Viewport>
          <Dialog.Content aria-label="Imperative editor">{state.payload}</Dialog.Content>
        </Dialog.Viewport>
      )}
    </Dialog>
  ))
  handle.openWithPayload('Requested payload')
  flush()
  expect(changes).toHaveBeenCalledExactlyOnceWith(true)
  expect(handle.isOpen).toBe(false)
  expect(view.queryByRole('dialog')).toBeNull()
  setOpen(true)
  flush()
  expect(handle.isOpen).toBe(true)
  expect(view.getByRole('dialog')).toHaveTextContent('Requested payload')
  handle.close()
  flush()
  expect(changes.mock.calls).toEqual([[true], [false]])
  expect(handle.isOpen).toBe(true)
})

test('shared triggers update the active trigger and payload without replacing the native host', () => {
  const handle = Dialog.createHandle<number>()
  const view = render(() => (
    <>
      <Dialog.Trigger id="first-editor" handle={handle} payload={1}>
        First editor
      </Dialog.Trigger>
      <Dialog.Trigger id="second-editor" handle={handle} payload={2}>
        Second editor
      </Dialog.Trigger>
      <Dialog handle={handle} modal={false}>
        {(state) => (
          <Dialog.Viewport>
            <Dialog.Content aria-label="Shared">
              {state.triggerId}:{state.payload}
            </Dialog.Content>
          </Dialog.Viewport>
        )}
      </Dialog>
    </>
  ))
  handle.open('first-editor')
  flush()
  const host = view.getByRole('dialog')
  expect(host).toHaveTextContent('first-editor:1')
  view.getByText('Second editor').click()
  flush()
  expect(view.getByRole('dialog')).toBe(host)
  expect(host).toHaveTextContent('second-editor:2')
  expect(view.getByText('First editor')).toHaveAttribute('aria-expanded', 'false')
  expect(view.getByText('Second editor')).toHaveAttribute('aria-expanded', 'true')
  handle.close()
  flush()
  expect(handle.isOpen).toBe(false)
})

test('composes nested root refs and removes authored undefined name IDs', () => {
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <Dialog defaultOpen ref={refs}>
      <Dialog.Content aria-label="Example">
        <Dialog.Title id={undefined}>Title</Dialog.Title>
        <Dialog.Description id={undefined}>Description</Dialog.Description>
      </Dialog.Content>
    </Dialog>
  ))
  expect(host).toHaveBeenCalledTimes(2)
  expect(view.getByText('Title')).not.toHaveAttribute('id')
  expect(view.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
})

test('removes name associations when title and description IDs become undefined', () => {
  const [id, setId] = createSignal<string | undefined>('named')
  const view = render(() => (
    <Dialog defaultOpen>
      <Dialog.Content>
        <Dialog.Title id={id()}>Title</Dialog.Title>
        <Dialog.Description id={id()}>Description</Dialog.Description>
      </Dialog.Content>
    </Dialog>
  ))
  expect(view.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'named')
  setId(undefined)
  flush()
  expect(view.getByText('Title')).not.toHaveAttribute('id')
  expect(view.getByRole('dialog')).not.toHaveAttribute('aria-labelledby')
  expect(view.getByRole('dialog')).not.toHaveAttribute('aria-describedby')
})
