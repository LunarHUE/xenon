import { describe, expect, test, vi } from 'vitest'

import { waitForExit } from './wait-for-exit'

function fake(playState: AnimationPlayState = 'running') {
  let resolve!: () => void
  let reject!: (reason: unknown) => void
  const finished = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  finished.catch(() => {})
  return { playState, finished, resolve, reject }
}

function host(...animations: ReturnType<typeof fake>[]) {
  const el = document.createElement('div')
  el.getAnimations = () => animations as unknown as Animation[]
  return el
}

function frame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)))
}

function tick() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0))
}

describe('waitForExit', () => {
  test('an element without getAnimations is done synchronously', () => {
    const el = document.createElement('div')
    expect(el.getAnimations).toBeUndefined()
    const done = vi.fn()
    const cancel = waitForExit(el, done)
    expect(done).toHaveBeenCalledTimes(1)
    cancel()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('no running animation: done on the next frame, not before', async () => {
    const done = vi.fn()
    waitForExit(host(), done)
    expect(done).not.toHaveBeenCalled()
    await frame()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('a finished animation does not hold the exit open', async () => {
    const done = vi.fn()
    waitForExit(host(fake('finished')), done)
    await frame()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('waits for every unfinished animation', async () => {
    const first = fake()
    const second = fake()
    const done = vi.fn()
    waitForExit(host(first, second), done)
    await frame()
    expect(done).not.toHaveBeenCalled()
    first.resolve()
    await tick()
    expect(done).not.toHaveBeenCalled()
    second.resolve()
    await tick()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('a cancelled animation rejects and the exit still completes', async () => {
    const animation = fake()
    const done = vi.fn()
    waitForExit(host(animation), done)
    await frame()
    animation.reject(new Error('cancelled'))
    await tick()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('cancelling before the frame never calls done', async () => {
    const done = vi.fn()
    waitForExit(host(), done)()
    await frame()
    expect(done).not.toHaveBeenCalled()
  })

  test('cancelling mid-animation never calls done', async () => {
    const animation = fake()
    const done = vi.fn()
    const cancel = waitForExit(host(animation), done)
    await frame()
    cancel()
    animation.resolve()
    await tick()
    expect(done).not.toHaveBeenCalled()
  })

  test('a replacement animation extends the exit after the original is canceled', async () => {
    const original = fake()
    const replacement = fake()
    const el = host(original)
    const done = vi.fn()
    waitForExit(el, done)
    await frame()
    el.getAnimations = () => [replacement] as unknown as Animation[]
    original.reject(new Error('replaced'))
    await tick()
    expect(done).not.toHaveBeenCalled()
    replacement.resolve()
    await tick()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('a restarted animation with a new finished promise extends the exit', async () => {
    const first = fake()
    const restarted = fake()
    const animation = { playState: 'running', finished: first.finished }
    const el = document.createElement('div')
    el.getAnimations = () => [animation] as unknown as Animation[]
    const done = vi.fn()
    waitForExit(el, done)
    await frame()
    animation.finished = restarted.finished
    first.resolve()
    await tick()
    expect(done).not.toHaveBeenCalled()
    restarted.resolve()
    await tick()
    expect(done).toHaveBeenCalledTimes(1)
  })

  test('canceling during a replacement suppresses completion and further queries', async () => {
    const original = fake()
    const replacement = fake()
    const el = host(original)
    const query = vi.fn(el.getAnimations)
    el.getAnimations = query
    const done = vi.fn()
    const cancel = waitForExit(el, done)
    await frame()
    query.mockReturnValue([replacement] as unknown as Animation[])
    original.resolve()
    await tick()
    expect(query).toHaveBeenCalledTimes(2)
    cancel()
    cancel()
    replacement.resolve()
    await tick()
    expect(query).toHaveBeenCalledTimes(2)
    expect(done).not.toHaveBeenCalled()
  })
})
