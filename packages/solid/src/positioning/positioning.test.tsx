import { cleanup, render } from '@solidjs/testing-library'
import type { PositioningOptions, PositioningState } from '@xenon/dom/positioning'
import { createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPositioner } from './positioning'
import type { Positioner } from './positioning'

const engine = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@xenon/dom/positioning', () => ({
  createPositioner: engine.create,
  initialPositioningState: (options: Partial<PositioningOptions> = {}) => ({
    positioned: false,
    side: options.side ?? 'bottom',
    align: options.align ?? 'center',
    placement: options.side ?? 'bottom',
    strategy: options.strategy ?? 'fixed',
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
  }),
}))
import { initialPositioningState } from '@xenon/dom/positioning'

function mockController(initial: PositioningOptions) {
  let options = initial
  let state = initialPositioningState(options)
  return {
    update: vi.fn((next: PositioningOptions) => {
      options = next
      if (!next.enabled) state = initialPositioningState(next)
    }),
    reposition: vi.fn(async () => {}),
    dispose: vi.fn(),
    getState: () => state,
    publish(next: Partial<PositioningState> = {}) {
      state = { ...state, positioned: true, x: 40, y: 80, ...next }
      options.onPositioned?.(state)
    },
    error(error: unknown) {
      options.onError?.(error)
    },
  }
}
let controllers: ReturnType<typeof mockController>[] = []
afterEach(cleanup)
beforeEach(() => {
  controllers = []
  engine.create
    .mockReset()
    .mockImplementation((_node: HTMLElement, options: PositioningOptions) => {
      const controller = mockController(options)
      controllers.push(controller)
      return controller
    })
})

describe('createPositioner', () => {
  test('waits for a floating ref and updates options without replacing the controller', async () => {
    const [floating, setFloating] = createSignal<HTMLElement>()
    const [offset, setOffset] = createSignal(0)
    const anchor = document.createElement('button')
    let api!: Positioner
    render(() => {
      api = createPositioner({
        anchor: () => anchor,
        floating,
        options: () => ({ sideOffset: offset() }),
      })
      return <span />
    })
    expect(engine.create).not.toHaveBeenCalled()
    expect(api.state().positioned).toBe(false)
    expect(api.positionerProps().style.visibility).toBe('hidden')
    await api.reposition()
    setFloating(document.createElement('div'))
    flush()
    expect(engine.create).toHaveBeenCalledTimes(1)
    expect(engine.create.mock.calls[0]![1].onError).toBeUndefined()
    setOffset(12)
    flush()
    expect(engine.create).toHaveBeenCalledTimes(1)
    expect(controllers[0]!.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ sideOffset: 12 })
    )
    await api.reposition()
    expect(controllers[0]!.reposition).toHaveBeenCalledTimes(1)
  })

  test('replaces removed nodes, resets state and ignores callbacks from disposed controllers', () => {
    const [floating, setFloating] = createSignal<HTMLElement | undefined>(
      document.createElement('div')
    )
    const callback = vi.fn()
    let api!: Positioner
    const view = render(() => {
      api = createPositioner({
        anchor: () => document.body,
        floating,
        options: () => ({ onPositioned: callback }),
      })
      return <span />
    })
    const first = controllers[0]!
    first.publish()
    flush()
    expect(api.state().x).toBe(40)
    setFloating(undefined)
    flush()
    expect(first.dispose).toHaveBeenCalledTimes(1)
    expect(api.state().x).toBeNull()
    first.publish({ x: 999 })
    expect(api.state().x).toBeNull()
    expect(callback).toHaveBeenCalledTimes(1)
    setFloating(document.createElement('div'))
    flush()
    expect(controllers).toHaveLength(2)
    view.unmount()
    expect(controllers[1]!.dispose).toHaveBeenCalledTimes(1)
    controllers[1]!.publish()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('keeps engine coordinates while publishing visibility, errors and disabled state', () => {
    const [floating, setFloating] = createSignal<HTMLElement>()
    const [enabled, setEnabled] = createSignal(true)
    const onError = vi.fn()
    let api!: Positioner
    const view = render(() => {
      api = createPositioner({
        anchor: () => document.body,
        floating,
        enabled,
        options: () => ({ hideWhenDetached: true, onError }),
      })
      return <div ref={setFloating} {...api.positionerProps()} />
    })
    const node = view.container.firstElementChild as HTMLElement
    expect(node.style.visibility).toBe('hidden')
    node.style.left = '40px'
    node.style.top = '80px'
    node.style.setProperty('--positioner-anchor-width', '120px')
    controllers[0]!.publish()
    flush()
    expect(node.style.visibility).toBe('visible')
    expect(node.style.left).toBe('40px')
    expect(node.style.top).toBe('80px')
    expect(node.style.getPropertyValue('--positioner-anchor-width')).toBe('120px')
    controllers[0]!.publish({ referenceHidden: true })
    flush()
    expect(node.style.visibility).toBe('hidden')
    const error = new Error('measurement failed')
    controllers[0]!.error(error)
    expect(onError).toHaveBeenCalledWith(error)
    setEnabled(false)
    flush()
    expect(api.state().positioned).toBe(false)
    expect(engine.create).toHaveBeenCalledTimes(1)
    expect(api.arrowProps()).toEqual({
      'data-part': 'arrow',
      'aria-hidden': 'true',
      role: 'presentation',
    })
  })
})
