import { afterEach, describe, expect, it, vi } from 'vitest'
import { createManager } from './manager'

afterEach(() => vi.useRealTimers())

describe('Toast manager', () => {
  it('reopens an exiting ID in place, moves it first, and restarts its full lifetime', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100, limit: 1 })
    const detach = manager.attach()
    const onRemove = vi.fn()
    manager.add({ id: 'first', onRemove })
    const record = manager.toasts()[0]!
    vi.advanceTimersByTime(100)
    expect(record.open).toBe(false)
    manager.add({ id: 'second' })
    manager.add({ id: 'first', title: 'Reopened' })
    expect(manager.toasts()[0]).toBe(record)
    expect(record.open).toBe(true)
    expect(record.limited).toBe(false)
    expect(onRemove).not.toHaveBeenCalled()
    vi.advanceTimersByTime(99)
    expect(record.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(record.open).toBe(false)
    detach()
  })

  it('queues before attachment, pauses independent reasons and preserves elapsed time through updates', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 1000 })
    const id = manager.add({ title: 'First' })
    vi.advanceTimersByTime(2000)
    expect(manager.toasts()[0]!.open).toBe(true)
    const detach = manager.attach()
    const record = manager.toasts()[0]!
    vi.advanceTimersByTime(300)
    manager.pause('hover')
    manager.pause('focus')
    manager.update(id, { title: 'Changed' })
    expect(manager.toasts()[0]).toBe(record)
    expect(record.title).toBe('Changed')
    vi.advanceTimersByTime(2000)
    manager.resume('hover')
    vi.advanceTimersByTime(2000)
    expect(record.open).toBe(true)
    manager.resume('focus')
    vi.advanceTimersByTime(699)
    expect(record.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(record.open).toBe(false)
    detach()
  })

  it('keeps an exiting slot until removal and only times admitted records', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100, limit: 1 })
    const detach = manager.attach()
    const first = manager.add({})
    const second = manager.add({})
    expect(manager.toasts()[1]!.limited).toBe(true)
    vi.advanceTimersByTime(1000)
    expect(manager.toasts()[0]!.open).toBe(false)
    expect(manager.toasts()[1]!.open).toBe(true)
    manager.remove(second)
    expect(manager.toasts()[0]!.id).toBe(first)
    expect(manager.toasts()[0]!.limited).toBe(false)
    vi.advanceTimersByTime(99)
    expect(manager.toasts()[0]!.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(manager.toasts()[0]!.open).toBe(false)
    detach()
  })

  it('resets explicitly supplied duration and leaves loading persistent', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100 })
    const detach = manager.attach()
    const id = manager.loading('Loading')
    vi.advanceTimersByTime(1000)
    expect(manager.toasts()[0]!.open).toBe(true)
    manager.update(id, { type: 'success', duration: 200 })
    vi.advanceTimersByTime(150)
    manager.update(id, { duration: 200 })
    vi.advanceTimersByTime(199)
    expect(manager.toasts()[0]!.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(manager.toasts()[0]!.open).toBe(false)
    detach()
  })

  it('calls lifecycle callbacks once even when callbacks remove and dismiss again', () => {
    const manager = createManager()
    const onRemove = vi.fn(() => manager.remove('one'))
    const onDismiss = vi.fn(() => manager.remove('one'))
    manager.add({ id: 'one', onDismiss, onRemove })
    manager.dismiss('one')
    manager.dismiss('one')
    manager.remove('one')
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(manager.toasts()).toEqual([])
  })

  it('does not let a reentrant updater modify a replacement with the same ID', () => {
    const manager = createManager()
    manager.add({ id: 'one', title: 'Original' })
    manager.update('one', () => {
      manager.remove('one')
      manager.add({ id: 'one', title: 'Replacement' })
      return { title: 'Stale' }
    })
    expect(manager.toasts()[0]!.title).toBe('Replacement')
  })

  it('updates a promise record in place and starts the settled default lifetime', async () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100 })
    const detach = manager.attach()
    let resolve!: (value: string) => void
    const pending = new Promise<string>((done) => {
      resolve = done
    })
    const id = manager.promise(pending, {
      loading: 'Loading',
      success: (value) => ({ title: value }),
      error: 'Failed',
    })
    const record = manager.toasts()[0]!
    vi.advanceTimersByTime(1000)
    resolve('Saved')
    await Promise.resolve()
    expect(manager.toasts()[0]).toBe(record)
    expect(record.id).toBe(id)
    expect(record.title).toBe('Saved')
    expect(record.type).toBe('success')
    vi.advanceTimersByTime(100)
    expect(record.open).toBe(false)
    detach()
  })

  it('ignores stale promise settlements after dismissal, ID reuse, or explicit update', async () => {
    for (const operation of ['dismiss', 'reuse', 'update']) {
      const manager = createManager()
      let resolve!: (value: string) => void
      const pending = new Promise<string>((done) => {
        resolve = done
      })
      const id = manager.promise(pending, {
        loading: { id: 'one', title: 'Loading' },
        success: 'Stale',
        error: 'Failed',
      })
      if (operation === 'update') manager.update(id, { title: 'Manual' })
      else manager.dismiss(id)
      if (operation === 'reuse') {
        manager.remove(id)
        manager.add({ id, title: 'Replacement' })
      }
      resolve('settled')
      await Promise.resolve()
      expect(manager.toasts()[0]!.title).not.toBe('Stale')
      if (operation === 'dismiss') expect(manager.toasts()[0]!.open).toBe(false)
    }
  })

  it('isolates factories and preserves timers across provider detach and reattach', () => {
    vi.useFakeTimers()
    const first = createManager({ duration: 100 })
    const second = createManager()
    expect(first.add({})).not.toBe(second.add({}))
    const detach = first.attach()
    vi.advanceTimersByTime(40)
    detach()
    detach()
    vi.advanceTimersByTime(1000)
    const cleanup = first.attach()
    vi.advanceTimersByTime(59)
    expect(first.toasts()[0]!.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(first.toasts()[0]!.open).toBe(false)
    expect(second.toasts()[0]!.open).toBe(true)
    cleanup()
  })
})
