import { createRoot, createSignal, flush } from 'solid-js'
import { afterEach, describe, expect, test } from 'vitest'

import { createPresence } from './presence'

function frame() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

const roots: (() => void)[] = []

function harness(initial: boolean) {
  return createRoot((dispose) => {
    roots.push(dispose)
    const [open, setOpen] = createSignal(initial)
    const life = createPresence({ open })
    const el = document.createElement('div')
    life.ref(el)
    return { life, el, setOpen }
  })
}

type Animatable = { getAnimations?: () => Animation[] }

function stall(): () => void {
  const pending = { finished: new Promise<Animation>(() => {}), playState: 'running' }
  ;(Element.prototype as Animatable).getAnimations = () => [pending as unknown as Animation]
  return () => delete (Element.prototype as Animatable).getAnimations
}

afterEach(() => {
  for (const dispose of roots.splice(0)) dispose()
  delete (Element.prototype as Animatable).getAnimations
})

describe('createPresence', () => {
  test('mounting open is entered with no enter phase', () => {
    const { life } = harness(true)
    expect(life.status()).toBe('entered')
    expect(life.present()).toBe(true)
    expect(life.part().attrs).toMatchObject({ 'data-state': 'open' })
  })

  test('mounting closed is exited and absent', () => {
    const { life } = harness(false)
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(false)
  })

  test('opening enters for a frame, then settles', async () => {
    const { life, setOpen } = harness(false)
    setOpen(true)
    flush()
    expect(life.status()).toBe('entering')
    expect(life.part().attrs['data-starting-style']).toBe('')
    await frame()
    flush()
    expect(life.status()).toBe('entered')
    expect(life.part().attrs).not.toHaveProperty('data-starting-style', '')
  })

  test('closing stays present until the exit resolves', () => {
    const stop = stall()
    const { life, setOpen } = harness(true)
    setOpen(false)
    flush()
    expect(life.status()).toBe('exiting')
    expect(life.present()).toBe(true)
    expect(life.part().attrs).toMatchObject({ 'data-state': 'closed', 'data-ending-style': '' })
    stop()
  })

  test('a reopen mid-exit cancels the wait and enters again', async () => {
    const stop = stall()
    const { life, setOpen } = harness(true)
    setOpen(false)
    flush()
    expect(life.status()).toBe('exiting')
    setOpen(true)
    flush()
    expect(life.status()).toBe('entering')
    expect(life.present()).toBe(true)
    stop()
    await frame()
    flush()
    expect(life.status()).toBe('entered')
  })

  test('without the animations api the exit finishes at once', () => {
    const { life, setOpen } = harness(true)
    setOpen(false)
    flush()
    expect(life.status()).toBe('exited')
    expect(life.present()).toBe(false)
  })
})
