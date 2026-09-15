import { afterEach, expect, test } from 'vitest'

import { createManager } from './manager'

const cleanups: (() => void)[] = []
afterEach(() =>
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
)

test('live limit changes demote older records and promote them in queue order', () => {
  const manager = createManager({ limit: 2, duration: 0 })
  const detach = manager.attach()
  cleanups.push(detach)
  const first = manager.add({ id: 'first' })
  const second = manager.add({ id: 'second' })
  const third = manager.add({ id: 'third' })

  expect(manager.toasts().map((toast) => toast.id)).toEqual([third, second, first])
  expect(manager.toasts().filter((toast) => !toast.limited)).toHaveLength(2)
  manager.configure({ limit: 1 })
  expect(manager.toasts().find((toast) => toast.id === third)!.limited).toBe(false)
  expect(manager.toasts().find((toast) => toast.id === second)!.limited).toBe(true)
  expect(manager.toasts().find((toast) => toast.id === first)!.limited).toBe(true)
  manager.configure({ limit: 3 })
  expect(manager.toasts().every((toast) => !toast.limited)).toBe(true)
  detach()
})

test('adding an existing limited ID refreshes it while preserving newer record order', () => {
  const manager = createManager({ limit: 1, duration: 0 })
  const detach = manager.attach()
  cleanups.push(detach)
  manager.add({ id: 'older', title: 'Older' })
  manager.add({ id: 'newer', title: 'Newer' })
  const older = manager.toasts().find((toast) => toast.id === 'older')!

  expect(older.limited).toBe(true)
  manager.add({ id: 'older', title: 'Refreshed' })
  expect(manager.toasts().map((toast) => toast.id)).toEqual(['newer', 'older'])
  expect(manager.toasts()[1]).toBe(older)
  expect(older.title).toBe('Refreshed')
  expect(older.limited).toBe(true)
  detach()
})
