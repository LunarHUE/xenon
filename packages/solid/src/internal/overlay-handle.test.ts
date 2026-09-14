import { createMemo, createRoot, createSignal, flush, untrack } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { attachOverlayHandle, createOverlayHandle, getOverlayHandleContext } from './overlay-handle'

import type { OverlayHandleCommand } from './overlay-handle'

describe('createOverlayHandle', () => {
  test('ignores detached commands without replaying them on attachment', () => {
    const handle = createOverlayHandle<string>()
    handle.open('before')
    handle.openWithPayload('before')
    handle.close()
    expect(handle.isOpen).toBe(false)
    expect(getOverlayHandleContext(handle)).toBeUndefined()
    const dispatch = vi.fn()
    const release = attachOverlayHandle(handle, { context: {}, readOpen: () => true, dispatch })
    expect(dispatch).not.toHaveBeenCalled()
    expect(handle.isOpen).toBe(true)
    release()
    handle.open('after')
    handle.openWithPayload('after')
    handle.close()
    expect(dispatch).not.toHaveBeenCalled()
    expect(handle.isOpen).toBe(false)
    expect(getOverlayHandleContext(handle)).toBeUndefined()
  })

  test('forwards each command and distinguishes explicit undefined payloads', () => {
    const handle = createOverlayHandle<string | undefined>()
    const commands: OverlayHandleCommand<string | undefined>[] = []
    attachOverlayHandle(handle, {
      context: {},
      readOpen: () => false,
      dispatch: (command) => commands.push(command),
    })
    handle.open()
    handle.open('trigger-2')
    handle.openWithPayload('record-3')
    handle.openWithPayload(undefined)
    handle.close()
    expect(commands).toEqual([
      { type: 'open' },
      { type: 'open', triggerId: 'trigger-2' },
      { type: 'payload', payload: 'record-3' },
      { type: 'payload', payload: undefined },
      { type: 'close' },
    ])
    expect(handle.isOpen).toBe(false)
  })

  test('tracks a root mounted after consumers and follows root-controlled state', () => {
    const handle = createOverlayHandle<string, { name: string }>()
    createRoot((dispose) => {
      try {
        const context = createMemo(() => getOverlayHandleContext(handle))
        const isOpen = createMemo(() => handle.isOpen)
        expect(untrack(context)).toBeUndefined()
        expect(untrack(isOpen)).toBe(false)
        const [open, setOpen] = createSignal(false, { ownedWrite: true })
        const rootContext = { name: 'root' }
        const release = attachOverlayHandle(handle, {
          context: rootContext,
          readOpen: open,
          dispatch: vi.fn(),
        })
        flush()
        expect(untrack(context)).toBe(rootContext)
        handle.open()
        expect(untrack(isOpen)).toBe(false)
        setOpen(true)
        flush()
        expect(untrack(isOpen)).toBe(true)
        handle.close()
        expect(untrack(isOpen)).toBe(true)
        setOpen(false)
        flush()
        expect(untrack(isOpen)).toBe(false)
        release()
        flush()
        expect(untrack(context)).toBeUndefined()
        expect(untrack(isOpen)).toBe(false)
      } finally {
        dispose()
      }
    })
  })

  test('rejects simultaneous roots and preserves the original attachment', () => {
    const handle = createOverlayHandle()
    const original = { context: { id: 'original' }, readOpen: () => true, dispatch: vi.fn() }
    attachOverlayHandle(handle, original)
    expect(() =>
      attachOverlayHandle(handle, { context: {}, readOpen: () => false, dispatch: vi.fn() })
    ).toThrow('one mounted root')
    expect(getOverlayHandleContext(handle)).toBe(original.context)
    expect(handle.isOpen).toBe(true)
    handle.close()
    expect(original.dispatch).toHaveBeenCalledWith({ type: 'close' })
  })

  test('old cleanup cannot detach a new root, even when the same bridge is reused', () => {
    const handle = createOverlayHandle()
    const attachment = { context: {}, readOpen: () => true, dispatch: vi.fn() }
    const releaseFirst = attachOverlayHandle(handle, attachment)
    releaseFirst()
    releaseFirst()
    const releaseSecond = attachOverlayHandle(handle, attachment)
    releaseFirst()
    expect(getOverlayHandleContext(handle)).toBe(attachment.context)
    handle.open()
    expect(attachment.dispatch).toHaveBeenCalledOnce()
    releaseSecond()
    expect(getOverlayHandleContext(handle)).toBeUndefined()
  })
})
