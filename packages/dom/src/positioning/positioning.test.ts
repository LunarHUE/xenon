import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ComputePositionReturn } from '../internal/vendor/floating-ui-dom'
import { createPositioner, initialPositioningState } from './positioning'
import type { Positioner, PositioningOptions } from './types'

const floating = vi.hoisted(() => ({
  compute: vi.fn(),
  observe: vi.fn(),
  dimensions: vi.fn(),
}))
vi.mock('../internal/vendor/floating-ui-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../internal/vendor/floating-ui-dom')>()
  return {
    ...actual,
    computePosition: floating.compute,
    autoUpdate: floating.observe,
    platform: { ...actual.platform, getDimensions: floating.dimensions },
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
function result(x = 20, y = 40): ComputePositionReturn {
  return { x, y, placement: 'bottom', strategy: 'absolute', middlewareData: {} }
}
async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve()
}

let anchor: HTMLElement
let popup: HTMLElement
let controllers: Positioner[]
let subscriptions: { update: () => void; stop: ReturnType<typeof vi.fn> }[]
function create(options: Partial<PositioningOptions> = {}) {
  const controller = createPositioner(popup, { anchor, ...options })
  controllers.push(controller)
  return controller
}
// Exercise the asynchronous size middleware's guarded write without relying on jsdom geometry.
function applySize(call: number) {
  const config = floating.compute.mock.calls[call]![2]
  const middleware = config.middleware.find((entry: { name: string }) => entry.name === 'size')
  middleware.options.apply({
    availableWidth: 300,
    availableHeight: 200,
    rects: { reference: { width: 123, height: 45 } },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  anchor = document.createElement('button')
  popup = document.createElement('div')
  document.body.append(anchor, popup)
  controllers = []
  subscriptions = []
  floating.compute.mockImplementation(() => Promise.resolve(result()))
  floating.dimensions.mockResolvedValue({ width: 10, height: 10 })
  floating.observe.mockImplementation((_anchor, _popup, update) => {
    const stop = vi.fn()
    subscriptions.push({ update, stop })
    return stop
  })
})
afterEach(() => {
  for (const controller of controllers) controller.dispose()
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

describe('positioning lifecycle', () => {
  it('creates a pure initial state without browser globals', () => {
    vi.stubGlobal('document', undefined)
    vi.stubGlobal('window', undefined)
    expect(initialPositioningState({ side: 'left', align: 'end', strategy: 'fixed' })).toEqual({
      positioned: false,
      side: 'left',
      align: 'end',
      placement: 'left-end',
      strategy: 'fixed',
      x: null,
      y: null,
      anchorWidth: null,
      anchorHeight: null,
      availableWidth: null,
      availableHeight: null,
      arrowX: null,
      arrowY: null,
      arrowCenterOffset: null,
      transformOrigin: null,
      referenceHidden: false,
    })
    expect(floating.compute).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('keeps initial content hidden until a position is available and returns state copies', async () => {
    const pending = deferred<ComputePositionReturn>()
    floating.compute.mockReturnValueOnce(pending.promise)
    const onPositioned = vi.fn()
    const controller = create({ onPositioned })
    expect(popup.style.visibility).toBe('hidden')
    expect(popup.style.pointerEvents).toBe('none')
    expect(popup.hasAttribute('data-positioned')).toBe(false)
    expect(controller.getState().positioned).toBe(false)
    pending.resolve(result())
    await flush()
    expect(popup.style.visibility).toBe('visible')
    expect(popup.hasAttribute('data-positioned')).toBe(true)
    expect(onPositioned).toHaveBeenCalledTimes(1)
    onPositioned.mock.calls[0]![0].x = 900
    const copy = controller.getState() as { x: number }
    copy.x = 800
    expect(controller.getState().x).toBe(20)
  })

  it('ignores older requests including their deferred size writes', async () => {
    const old = deferred<ComputePositionReturn>()
    const latest = deferred<ComputePositionReturn>()
    floating.compute.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    const onPositioned = vi.fn()
    const controller = create({ matchAnchorSize: 'width', onPositioned })
    const reposition = controller.reposition()
    applySize(1)
    latest.resolve(result(70, 80))
    await reposition
    popup.style.width = '150px'
    applySize(0)
    old.resolve(result(1, 2))
    await flush()
    expect(popup.style.width).toBe('150px')
    expect(popup.style.left).toBe('70px')
    expect(controller.getState().x).toBe(70)
    expect(onPositioned).toHaveBeenCalledTimes(1)
  })

  it('updates options without replacing observers and never calls stale callbacks', async () => {
    const old = deferred<ComputePositionReturn>()
    floating.compute.mockReturnValueOnce(old.promise)
    const oldCallback = vi.fn()
    const nextCallback = vi.fn()
    const controller = create({ onPositioned: oldCallback })
    controller.update({ anchor, sideOffset: 12, onPositioned: nextCallback })
    await flush()
    old.resolve(result(1, 2))
    await flush()
    expect(floating.observe).toHaveBeenCalledTimes(1)
    expect(subscriptions[0]!.stop).not.toHaveBeenCalled()
    expect(oldCallback).not.toHaveBeenCalled()
    expect(nextCallback).toHaveBeenCalledTimes(1)
    expect(popup.style.left).toBe('20px')
  })

  it('retains subscriptions when virtual anchors share a context and reads the latest anchor', async () => {
    const first = {
      contextElement: anchor,
      getBoundingClientRect: vi.fn(() => new DOMRect(10, 20, 0, 0)),
    }
    const next = {
      contextElement: anchor,
      getBoundingClientRect: vi.fn(() => new DOMRect(70, 80, 0, 0)),
    }
    const controller = create({ anchor: first })
    await flush()
    const trackingAnchor = floating.observe.mock.calls[0]![0]
    expect(trackingAnchor.getBoundingClientRect().x).toBe(10)
    controller.update({ anchor: next })
    await flush()
    expect(floating.observe).toHaveBeenCalledTimes(1)
    expect(subscriptions[0]!.stop).not.toHaveBeenCalled()
    expect(floating.compute.mock.calls[1]![0]).toBe(next)
    expect(trackingAnchor.getBoundingClientRect().x).toBe(70)
    subscriptions[0]!.update()
    await flush()
    expect(floating.compute.mock.calls[2]![0]).toBe(next)
  })

  it('restores authored direction before recomputing when an override is removed', async () => {
    popup.setAttribute('dir', 'rtl')
    const directions: (string | null)[] = []
    floating.compute.mockImplementation(() => {
      directions.push(popup.getAttribute('dir'))
      return Promise.resolve(result())
    })
    const controller = create({ dir: 'ltr' })
    await flush()
    controller.update({ anchor })
    expect(popup.getAttribute('dir')).toBe('rtl')
    await flush()
    expect(directions).toEqual(['ltr', 'rtl'])
    expect(floating.compute.mock.calls[1]![2].platform).toBeUndefined()
    controller.dispose()
    expect(popup.getAttribute('dir')).toBe('rtl')
  })

  it.each([false, true])(
    'respects elementResize=%s for anchor, popup, and arrow observation',
    async (elementResize) => {
      const observe = vi.fn()
      const disconnect = vi.fn()
      const ResizeObserverMock = vi.fn(
        class {
          observe = observe
          disconnect = disconnect
          unobserve = vi.fn()
        }
      )
      vi.stubGlobal('ResizeObserver', ResizeObserverMock)
      const arrow = document.createElement('span')
      popup.append(arrow)
      const controller = create({ arrow, autoUpdate: { elementResize } })
      await flush()
      if (elementResize) {
        expect(ResizeObserverMock).toHaveBeenCalledTimes(1)
        expect(observe.mock.calls.map(([element]) => element)).toEqual([anchor, popup, arrow])
      } else {
        expect(ResizeObserverMock).not.toHaveBeenCalled()
        expect(observe).not.toHaveBeenCalled()
      }
      controller.dispose()
      expect(disconnect).toHaveBeenCalledTimes(elementResize ? 1 : 0)
    }
  )

  it('replaces observers on anchor changes and ignores old anchor results', async () => {
    const old = deferred<ComputePositionReturn>()
    floating.compute.mockReturnValueOnce(old.promise)
    const controller = create()
    const nextAnchor = document.createElement('button')
    document.body.append(nextAnchor)
    controller.update({ anchor: nextAnchor })
    expect(subscriptions[0]!.stop).toHaveBeenCalledTimes(1)
    expect(floating.observe).toHaveBeenCalledTimes(2)
    expect(floating.compute.mock.calls[1]![0]).toBe(nextAnchor)
    await flush()
    old.resolve(result(1, 2))
    await flush()
    expect(controller.getState().x).toBe(20)
  })

  it.each(['disable', 'dispose'] as const)(
    'restores ownership and ignores pending work after %s',
    async (operation) => {
      const pending = deferred<ComputePositionReturn>()
      floating.compute.mockReturnValueOnce(pending.promise)
      popup.style.left = '9px'
      const onPositioned = vi.fn()
      const controller = create({ onPositioned, matchAnchorSize: 'width' })
      if (operation === 'disable') controller.update({ anchor, enabled: false, onPositioned })
      else controller.dispose()
      const calls = onPositioned.mock.calls.length
      applySize(0)
      pending.resolve(result())
      await flush()
      expect(popup.style.left).toBe('9px')
      expect(popup.style.width).toBe('')
      expect(popup.style.visibility).toBe('')
      expect(popup.hasAttribute('data-positioned')).toBe(false)
      expect(controller.getState().positioned).toBe(false)
      expect(onPositioned).toHaveBeenCalledTimes(calls)
      expect(subscriptions[0]!.stop).toHaveBeenCalledTimes(1)
      await controller.reposition()
      expect(floating.compute).toHaveBeenCalledTimes(1)
    }
  )

  it('restores all owned properties and attributes, including priorities, while preserving unrelated edits', async () => {
    const properties = {
      position: 'relative',
      left: '3px',
      top: '4px',
      visibility: 'collapse',
      'pointer-events': 'painted',
      width: '50px',
      height: '60px',
      '--positioner-anchor-width': '1px',
      '--positioner-anchor-height': '2px',
      '--positioner-available-width': '3px',
      '--positioner-available-height': '4px',
      '--positioner-transform-origin': 'old-origin',
    }
    for (const [name, value] of Object.entries(properties))
      popup.style.setProperty(name, value, 'important')
    const attributes = {
      'data-side': 'old',
      'data-align': 'old',
      'data-positioned': 'old',
      'data-reference-hidden': 'old',
      dir: 'rtl',
    }
    for (const [name, value] of Object.entries(attributes)) popup.setAttribute(name, value)
    const controller = create({ matchAnchorSize: 'width', dir: 'ltr' })
    applySize(0)
    await flush()
    controller.update({ anchor, matchAnchorSize: 'height', dir: 'ltr' })
    applySize(1)
    await flush()
    popup.style.color = 'red'
    popup.setAttribute('data-consumer', 'retained')
    controller.dispose()
    for (const [name, value] of Object.entries(properties)) {
      expect(popup.style.getPropertyValue(name), name).toBe(value)
      expect(popup.style.getPropertyPriority(name), name).toBe('important')
    }
    for (const [name, value] of Object.entries(attributes))
      expect(popup.getAttribute(name), name).toBe(value)
    expect(popup.style.color).toBe('red')
    expect(popup.getAttribute('data-consumer')).toBe('retained')
  })

  it('restores a replaced arrow and ignores its pending measurement', async () => {
    const oldArrow = document.createElement('span')
    const nextArrow = document.createElement('span')
    popup.append(oldArrow, nextArrow)
    oldArrow.style.setProperty('left', '7px', 'important')
    oldArrow.style.setProperty('visibility', 'collapse', 'important')
    oldArrow.setAttribute('role', 'img')
    oldArrow.setAttribute('aria-hidden', 'false')
    const originalStyle = oldArrow.getAttribute('style')
    const measurement = deferred<{ width: number; height: number }>()
    floating.dimensions.mockReturnValueOnce(measurement.promise)
    const controller = create({ arrow: oldArrow })
    controller.update({ anchor, arrow: nextArrow })
    await flush()
    measurement.resolve({ width: 100, height: 100 })
    await flush()
    expect(oldArrow.getAttribute('style')).toBe(originalStyle)
    expect(oldArrow.getAttribute('role')).toBe('img')
    expect(oldArrow.getAttribute('aria-hidden')).toBe('false')
    expect(oldArrow.hasAttribute('data-side')).toBe(false)
    expect(floating.compute).toHaveBeenCalledTimes(1)
    controller.dispose()
    expect(nextArrow.getAttribute('style')).toBeNull()
    expect(nextArrow.hasAttribute('role')).toBe(false)
    expect(nextArrow.hasAttribute('aria-hidden')).toBe(false)
  })

  it('restores every arrow style and attribute after a completed position', async () => {
    const arrow = document.createElement('span')
    popup.append(arrow)
    const properties = {
      position: 'relative',
      'pointer-events': 'auto',
      visibility: 'collapse',
      top: '1px',
      right: '2px',
      bottom: '3px',
      left: '4px',
    }
    const attributes = {
      role: 'img',
      'aria-hidden': 'false',
      'data-side': 'original',
      'data-uncentered': 'original',
    }
    for (const [name, value] of Object.entries(properties))
      arrow.style.setProperty(name, value, 'important')
    for (const [name, value] of Object.entries(attributes)) arrow.setAttribute(name, value)
    floating.compute.mockResolvedValue({
      ...result(),
      middlewareData: { arrow: { x: 8, centerOffset: 0 } },
    })
    const controller = create({ arrow })
    await flush()
    expect(arrow.getAttribute('data-side')).toBe('bottom')
    expect(arrow.style.top).toBe('-5px')
    arrow.style.color = 'blue'
    controller.dispose()
    for (const [name, value] of Object.entries(properties)) {
      expect(arrow.style.getPropertyValue(name), name).toBe(value)
      expect(arrow.style.getPropertyPriority(name), name).toBe('important')
    }
    for (const [name, value] of Object.entries(attributes))
      expect(arrow.getAttribute(name), name).toBe(value)
    expect(arrow.style.color).toBe('blue')
  })

  it('reports background failures and rejects explicit reposition failures', async () => {
    const failure = new Error('measurement failed')
    const onError = vi.fn()
    floating.compute.mockRejectedValue(failure)
    const controller = create({ onError })
    await flush()
    expect(onError).toHaveBeenCalledExactlyOnceWith(failure)
    await expect(controller.reposition()).rejects.toBe(failure)
    expect(onError).toHaveBeenCalledTimes(1)
    expect(controller.getState().positioned).toBe(false)
  })

  it('ignores callbacks retained by a removed anchor observer', async () => {
    const controller = create()
    await flush()
    const oldObserver = subscriptions[0]!.update
    const nextAnchor = document.createElement('button')
    document.body.append(nextAnchor)
    controller.update({ anchor: nextAnchor })
    await flush()
    const calls = floating.compute.mock.calls.length
    oldObserver()
    await flush()
    expect(floating.compute).toHaveBeenCalledTimes(calls)
  })

  it.each(['options', 'disable'] as const)(
    'does not report failures from requests invalidated by %s',
    async (operation) => {
      const pending = deferred<ComputePositionReturn>()
      floating.compute.mockReturnValueOnce(pending.promise)
      const oldError = vi.fn()
      const nextError = vi.fn()
      const controller = create({ onError: oldError })
      controller.update({
        anchor,
        enabled: operation !== 'disable',
        sideOffset: 12,
        onError: nextError,
      })
      await flush()
      pending.reject(new Error('obsolete measurement'))
      await flush()
      expect(oldError).not.toHaveBeenCalled()
      expect(nextError).not.toHaveBeenCalled()
    }
  )

  it('does not report a disposed request failure', async () => {
    const pending = deferred<ComputePositionReturn>()
    floating.compute.mockReturnValueOnce(pending.promise)
    const onError = vi.fn()
    const controller = create({ onError })
    controller.dispose()
    pending.reject(new Error('obsolete measurement'))
    await flush()
    expect(onError).not.toHaveBeenCalled()
  })
})
