import { createRoot, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPresence, measure } from './presence'

const roots: (() => void)[] = []
const frames = new Map<number, FrameRequestCallback>()
let nextFrame = 0
beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback)
    return nextFrame
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
})
afterEach(() => {
  roots.splice(0).forEach((dispose) => dispose())
  frames.clear()
  vi.unstubAllGlobals()
})
function frame() {
  const pending = [...frames.values()]
  frames.clear()
  pending.forEach((callback) => callback(0))
  flush()
}
function mount(initial = false, forced = false, element?: HTMLElement) {
  return createRoot((dispose) => {
    roots.push(dispose)
    const [open, setOpen] = createSignal(initial)
    const [forceMount, setForceMount] = createSignal(forced)
    const life = createPresence({ open, forceMount })
    if (element) life.ref(element)
    return { life, setOpen, setForceMount, dispose }
  })
}
function animation() {
  let finish!: () => void
  const finished = new Promise<Animation>((resolve) => {
    finish = () => resolve(value)
  })
  const value = { playState: 'running', finished } as Animation
  const element = document.createElement('div')
  element.getAnimations = vi.fn(() => [value])
  return { element, finish }
}
async function promises() {
  await Promise.resolve()
  await Promise.resolve()
  flush()
}

describe('presence ownership and reactive mounting', () => {
  test('force mounting a settled closed owner changes hiding without entering', () => {
    const { life, setForceMount, setOpen } = mount()
    flush()
    setForceMount(true)
    flush()
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(true)
    expect(life.part().attrs.hidden).toBe(true)
    expect(frames.size).toBe(0)
    setOpen(true)
    flush()
    expect(life.status()).toBe('entering')
    expect(life.part().attrs.hidden).toBeUndefined()
    frame()
    expect(life.status()).toBe('entered')
    setForceMount(false)
    flush()
    expect(life.present()).toBe(true)
    expect(life.status()).toBe('entered')
  })

  test('a force-mounted exit waits for animation before hiding', async () => {
    const { element, finish } = animation()
    const { life, setOpen } = mount(true, true, element)
    setOpen(false)
    flush()
    expect(life.status()).toBe('exiting')
    expect(life.part().attrs.inert).toBe(true)
    expect(life.part().attrs.hidden).toBeUndefined()
    frame()
    finish()
    await promises()
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(true)
    expect(life.part().attrs.hidden).toBe(true)
    expect(life.part().attrs.inert).toBeUndefined()
  })

  test('changing forceMount during exit preserves its pending animation', async () => {
    const { element, finish } = animation()
    const { life, setOpen, setForceMount } = mount(true, false, element)
    setOpen(false)
    flush()
    frame()
    expect(element.getAnimations).toHaveBeenCalledOnce()
    setForceMount(true)
    flush()
    expect(life.status()).toBe('exiting')
    expect(life.part().attrs.hidden).toBeUndefined()
    expect(element.getAnimations).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
    setForceMount(false)
    flush()
    expect(life.present()).toBe(true)
    finish()
    await promises()
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(false)
  })

  test('an old exit promise cannot settle a newly reopened entry', async () => {
    const { element, finish } = animation()
    const { life, setOpen } = mount(true, false, element)
    setOpen(false)
    flush()
    frame()
    setOpen(true)
    flush()
    expect(life.status()).toBe('entering')
    finish()
    await promises()
    expect(life.status()).toBe('entering')
    expect(life.part().attrs.inert).toBeUndefined()
    frame()
    expect(life.status()).toBe('entered')
    expect(life.present()).toBe(true)
  })

  test('closing without a ref cancels an unfinished entry frame', () => {
    const { life, setOpen } = mount()
    setOpen(true)
    flush()
    expect(life.status()).toBe('entering')
    expect(frames.size).toBe(1)
    setOpen(false)
    flush()
    expect(life.status()).toBe('exiting')
    expect(frames.size).toBe(1)
    frame()
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(false)
    expect(frames.size).toBe(0)
  })

  test.each([false, true])('owner disposal cancels the pending %s phase frame', (initial) => {
    const { life, setOpen, dispose } = mount(initial)
    setOpen(!initial)
    flush()
    expect(life.status()).toBe(initial ? 'exiting' : 'entering')
    expect(frames.size).toBe(1)
    dispose()
    expect(frames.size).toBe(0)
  })

  test('owner disposal suppresses a pending animation completion', async () => {
    const { element, finish } = animation()
    const { setOpen, dispose } = mount(true, false, element)
    setOpen(false)
    flush()
    frame()
    expect(element.getAnimations).toHaveBeenCalledOnce()
    dispose()
    finish()
    await promises()
    expect(element.getAnimations).toHaveBeenCalledOnce()
    expect(frames.size).toBe(0)
  })
})

describe('disclosure measurements', () => {
  test('measures each moving phase, settles to auto, and removes exited dimensions', () => {
    const element = document.createElement('div')
    Object.defineProperties(element, {
      scrollHeight: { value: 120, configurable: true },
      scrollWidth: { value: 240, configurable: true },
    })
    element.style.setProperty('--other-height', '10px')
    measure(element, 'panel', 'entering')
    expect(element.style.getPropertyValue('--panel-height')).toBe('120px')
    expect(element.style.getPropertyValue('--panel-width')).toBe('240px')
    measure(element, 'panel', 'entered')
    expect(element.style.getPropertyValue('--panel-height')).toBe('auto')
    expect(element.style.getPropertyValue('--panel-width')).toBe('auto')
    Object.defineProperty(element, 'scrollHeight', { value: 180 })
    measure(element, 'panel', 'exiting')
    expect(element.style.getPropertyValue('--panel-height')).toBe('180px')
    measure(element, 'panel', 'exited')
    expect(element.style.getPropertyValue('--panel-height')).toBe('')
    expect(element.style.getPropertyValue('--panel-width')).toBe('')
    expect(element.style.getPropertyValue('--other-height')).toBe('10px')
  })
})
