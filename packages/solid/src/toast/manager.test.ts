import { afterEach, describe, expect, it, vi } from 'vitest'
import { createManager } from './manager'

afterEach(() => vi.useRealTimers())

describe('Toast manager', () => {
  it('queues every notification at limit zero and starts timing when a slot opens', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100, limit: 0 })
    const detach = manager.attach()
    manager.add({})
    vi.advanceTimersByTime(1000)
    expect(manager.toasts()[0]!.limited).toBe(true)
    expect(manager.toasts()[0]!.open).toBe(true)
    manager.configure({ duration: 100, limit: 1 })
    expect(manager.toasts()[0]!.limited).toBe(false)
    vi.advanceTimersByTime(100)
    expect(manager.toasts()[0]!.open).toBe(false)
    expect(manager.toasts()[0]!.limited).toBe(false)
    detach()
  })

  it('resolves queued implicit durations from the provider and preserves explicit zero', () => {
    vi.useFakeTimers()
    const manager = createManager()
    const implicit = manager.add({ id: 'implicit' })
    manager.add({ id: 'persistent', duration: 0 })
    manager.add({ id: 'explicit', duration: 200 })
    manager.configure({ duration: 100 })
    expect(manager.toasts().find((toast) => toast.id === implicit)!.duration).toBe(100)
    vi.advanceTimersByTime(1000)
    expect(manager.toasts().every((toast) => toast.open)).toBe(true)
    const detach = manager.attach()
    vi.advanceTimersByTime(100)
    expect(manager.toasts().find((toast) => toast.id === implicit)!.open).toBe(false)
    expect(manager.toasts().find((toast) => toast.id === 'persistent')!.duration).toBe(0)
    expect(manager.toasts().find((toast) => toast.id === 'explicit')!.open).toBe(true)
    vi.advanceTimersByTime(100)
    expect(manager.toasts().find((toast) => toast.id === 'explicit')!.open).toBe(false)
    expect(manager.toasts().find((toast) => toast.id === 'persistent')!.open).toBe(true)
    detach()
  })

  it('restarts duplicate add lifetimes but preserves collection order and plain update time', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100 })
    const detach = manager.attach()
    const id = manager.add({ title: 'First', duration: 200 })
    const record = manager.toasts()[0]!
    manager.add({ title: 'Second', duration: 0 })
    vi.advanceTimersByTime(150)
    manager.add({ id, title: 'Restarted' })
    expect(manager.toasts()[1]).toBe(record)
    vi.advanceTimersByTime(150)
    manager.update(id, { title: 'Edited' })
    vi.advanceTimersByTime(49)
    expect(record.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(record.open).toBe(false)
    detach()
  })

  it('reports timeout and explicit dismissal reasons exactly once', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100 })
    const detach = manager.attach()
    const automatic = vi.fn()
    const explicit = vi.fn()
    manager.add({ onDismiss: automatic })
    const id = manager.add({ onDismiss: explicit })
    manager.dismiss(id, 'swipe')
    manager.dismiss(id, 'close')
    vi.advanceTimersByTime(100)
    expect(explicit).toHaveBeenCalledExactlyOnceWith('swipe')
    expect(automatic).toHaveBeenCalledExactlyOnceWith('timeout')
    detach()
  })

  it('treats repeated pause reasons idempotently and keeps other reasons active', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100 })
    const detach = manager.attach()
    manager.add({})
    vi.advanceTimersByTime(20)
    manager.pause('hover')
    manager.pause('hover')
    manager.pause('focus')
    vi.advanceTimersByTime(1000)
    manager.resume('hover')
    manager.resume('hover')
    vi.advanceTimersByTime(1000)
    expect(manager.toasts()[0]!.open).toBe(true)
    manager.resume('focus')
    vi.advanceTimersByTime(79)
    expect(manager.toasts()[0]!.open).toBe(true)
    vi.advanceTimersByTime(1)
    expect(manager.toasts()[0]!.open).toBe(false)
    detach()
  })

  it('keeps a same-record resurrection performed by an onDismiss callback', () => {
    const manager = createManager()
    const onRemove = vi.fn()
    manager.add({
      id: 'one',
      onDismiss: () => manager.add({ id: 'one', title: 'Reopened' }),
      onRemove,
    })
    const record = manager.toasts()[0]!
    manager.remove('one')
    expect(manager.toasts()[0]).toBe(record)
    expect(record.open).toBe(true)
    expect(record.title).toBe('Reopened')
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('lets a newer nested update supersede its outer updater and permits clearing actions', () => {
    const manager = createManager()
    const id = manager.add({ title: 'Original', action: { label: 'Undo', onClick: () => {} } })
    manager.update(id, () => {
      manager.update(id, { title: 'Newest', action: null })
      return { title: 'Stale' }
    })
    expect(manager.toasts()[0]!.title).toBe('Newest')
    expect(manager.toasts()[0]!.action).toBeNull()
  })

  it('allows only the newest concurrent promise for one ID to settle', async () => {
    const manager = createManager()
    let firstResolve!: (value: string) => void
    let secondReject!: (value: Error) => void
    const first = new Promise<string>((resolve) => {
      firstResolve = resolve
    })
    const second = new Promise<string>((_, reject) => {
      secondReject = reject
    })
    const stages = {
      loading: { id: 'same', title: 'Loading' },
      success: 'Saved',
      error: (error: unknown) => ({ title: (error as Error).message }),
    }
    manager.promise(first, stages)
    const record = manager.toasts()[0]!
    manager.promise(second, stages)
    firstResolve('old')
    await Promise.resolve()
    expect(record.type).toBe('loading')
    secondReject(new Error('Latest failure'))
    await Promise.resolve()
    expect(manager.toasts()[0]).toBe(record)
    expect(record.type).toBe('error')
    expect(record.title).toBe('Latest failure')
  })

  it('does not apply promise results when the stage callback performs a newer update', async () => {
    const manager = createManager()
    const id = manager.promise(Promise.resolve('done'), {
      loading: 'Loading',
      success: () => {
        manager.update(id, { title: 'Manual' })
        return 'Stale'
      },
      error: 'Failed',
    })
    await Promise.resolve()
    expect(manager.toasts()[0]!.title).toBe('Manual')
  })

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

  it('frees the visible slot on dismissal and only times admitted open records', () => {
    vi.useFakeTimers()
    const manager = createManager({ duration: 100, limit: 1 })
    const detach = manager.attach()
    const first = manager.add({})
    const second = manager.add({})
    expect(manager.toasts()[1]!.limited).toBe(true)
    vi.advanceTimersByTime(100)
    expect(manager.toasts()[0]!.open).toBe(false)
    expect(manager.toasts()[1]!.open).toBe(true)
    expect(manager.toasts()[1]!.limited).toBe(false)
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
