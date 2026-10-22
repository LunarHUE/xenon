import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { waitForExit } from './wait-for-exit'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

function animation(playState: AnimationPlayState = 'running') {
  let resolve!: (value: Animation) => void
  const finished = new Promise<Animation>((done) => {
    resolve = done
  })
  const value = { playState, finished, cancel: vi.fn() } as unknown as Animation
  return { value, settle: () => resolve(value) }
}

test('the first query sees animations attached after registration but before the frame', async () => {
  const element = document.createElement('div')
  const current = animation()
  element.getAnimations = () => []
  const done = vi.fn()
  waitForExit(element, done)
  element.getAnimations = () => [current.value]
  await vi.advanceTimersByTimeAsync(20)
  expect(done).not.toHaveBeenCalled()
  current.settle()
  await vi.advanceTimersByTimeAsync(0)
  expect(done).toHaveBeenCalledTimes(1)
})

test('paused animations keep the exit pending until their promise settles', async () => {
  const element = document.createElement('div')
  const paused = animation('paused')
  element.getAnimations = () => [paused.value]
  const done = vi.fn()
  waitForExit(element, done)
  await vi.advanceTimersByTimeAsync(10000)
  expect(done).not.toHaveBeenCalled()
  paused.settle()
  await vi.advanceTimersByTimeAsync(0)
  expect(done).toHaveBeenCalledTimes(1)
})

test('canceling one wait does not cancel animations or a second wait on the same element', async () => {
  const element = document.createElement('div')
  const running = animation()
  element.getAnimations = () => [running.value]
  const first = vi.fn(),
    second = vi.fn()
  const cancel = waitForExit(element, first)
  waitForExit(element, second)
  await vi.advanceTimersByTimeAsync(20)
  cancel()
  cancel()
  running.settle()
  await vi.advanceTimersByTimeAsync(0)
  expect(first).not.toHaveBeenCalled()
  expect(second).toHaveBeenCalledTimes(1)
  expect(running.value.cancel).not.toHaveBeenCalled()
})

test('a completed wait never observes later animations or repeats its callback', async () => {
  const element = document.createElement('div')
  element.getAnimations = vi.fn(() => [] as Animation[])
  const done = vi.fn()
  const cancel = waitForExit(element, done)
  await vi.advanceTimersByTimeAsync(20)
  const later = animation()
  vi.mocked(element.getAnimations).mockReturnValue([later.value])
  later.settle()
  await vi.advanceTimersByTimeAsync(100)
  cancel()
  expect(done).toHaveBeenCalledTimes(1)
  expect(element.getAnimations).toHaveBeenCalledTimes(1)
})
