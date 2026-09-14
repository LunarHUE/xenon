import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createPositioner,
  type Positioner,
  type PositioningAlign,
  type PositioningOptions,
  type PositioningSide,
} from '@tenon/dom/positioning'

const nodes: HTMLElement[] = []
const positioners: Positioner[] = []

afterEach(() => {
  for (const positioner of positioners.splice(0)) positioner.dispose()
  for (const node of nodes.splice(0)) node.remove()
})

function box(style: string, parent: HTMLElement = document.body) {
  const element = document.createElement('div')
  element.style.cssText = `box-sizing:border-box; margin:0; padding:0; border:0; ${style}`
  parent.append(element)
  nodes.push(element)
  return element
}

function setup(options: Partial<PositioningOptions> = {}) {
  const anchor = box('position:fixed; left:250px; top:250px; width:100px; height:100px')
  const floating = box('width:120px; height:80px')
  const props: PositioningOptions = {
    anchor,
    strategy: 'fixed',
    flip: false,
    shift: false,
    autoUpdate: false,
    ...options,
  }
  const positioner = createPositioner(floating, props)
  positioners.push(positioner)
  return { anchor, floating, positioner, props }
}

async function ready(positioner: Positioner) {
  await expect.poll(() => positioner.getState().positioned).toBe(true)
}

function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)
}

const placements: [PositioningSide, PositioningAlign, number, number][] = [
  ['top', 'start', 250, 170],
  ['top', 'center', 240, 170],
  ['top', 'end', 230, 170],
  ['bottom', 'start', 250, 350],
  ['bottom', 'center', 240, 350],
  ['bottom', 'end', 230, 350],
  ['left', 'start', 130, 250],
  ['left', 'center', 130, 260],
  ['left', 'end', 130, 270],
  ['right', 'start', 350, 250],
  ['right', 'center', 350, 260],
  ['right', 'end', 350, 270],
]

describe('positioner browser geometry', () => {
  it.each(placements)('%s %s aligns physical boxes', async (side, align, x, y) => {
    const { positioner, floating } = setup({ side, align })
    await ready(positioner)
    const rect = floating.getBoundingClientRect()
    near(rect.left, x)
    near(rect.top, y)
    expect(floating.getAttribute('data-side')).toBe(side)
    expect(floating.getAttribute('data-align')).toBe(align)
    expect(floating.hasAttribute('data-positioned')).toBe(true)
  })

  it.each([
    ['ltr', 'start', 260],
    ['ltr', 'end', 220],
    ['rtl', 'start', 220],
    ['rtl', 'end', 260],
  ] as const)('insets logical %s %s offsets', async (dir, align, x) => {
    const { positioner, floating } = setup({
      side: 'bottom',
      align,
      dir,
      alignOffset: 10,
      sideOffset: 12,
    })
    await ready(positioner)
    near(floating.getBoundingClientRect().left, x)
    near(floating.getBoundingClientRect().top, 362)
  })

  it('keeps horizontal start alignment vertical in RTL', async () => {
    const { positioner, floating } = setup({
      side: 'right',
      align: 'start',
      dir: 'rtl',
      alignOffset: 10,
    })
    await ready(positioner)
    near(floating.getBoundingClientRect().top, 260)
  })

  it('flips inside a custom boundary and retains the side gap', async () => {
    const { positioner, anchor, floating, props } = setup()
    anchor.style.top = '320px'
    positioner.update({
      ...props,
      side: 'bottom',
      sideOffset: 10,
      flip: true,
      collisionBoundary: { x: 100, y: 100, width: 400, height: 350 },
      collisionPadding: 8,
    })
    await ready(positioner)
    await expect.poll(() => positioner.getState().side).toBe('top')
    near(floating.getBoundingClientRect().bottom, anchor.getBoundingClientRect().top - 10)
  })

  it('shifts against custom padding and publishes usable available sizes', async () => {
    const { positioner, floating, props } = setup()
    positioner.update({
      ...props,
      align: 'start',
      shift: true,
      tether: false,
      collisionBoundary: { x: 100, y: 100, width: 240, height: 400 },
      collisionPadding: 10,
    })
    await positioner.reposition()
    near(floating.getBoundingClientRect().right, 330)
    const state = positioner.getState()
    expect(state.availableWidth).toBeGreaterThanOrEqual(0)
    expect(state.availableHeight).toBeGreaterThanOrEqual(0)
    near(
      parseFloat(floating.style.getPropertyValue('--positioner-available-width')),
      state.availableWidth!
    )
    near(
      parseFloat(floating.style.getPropertyValue('--positioner-available-height')),
      state.availableHeight!
    )
    near(parseFloat(floating.style.getPropertyValue('--positioner-anchor-width')), 100)
    near(parseFloat(floating.style.getPropertyValue('--positioner-anchor-height')), 100)
  })

  it.each(['width', 'height'] as const)('matches anchor %s explicitly', async (dimension) => {
    const { positioner, floating } = setup({ matchAnchorSize: dimension })
    await ready(positioner)
    near(floating.getBoundingClientRect()[dimension], 100)
  })

  it.each(['absolute', 'fixed'] as const)(
    'converts scaled containing-block coordinates for %s',
    async (strategy) => {
      const parent = box(
        'position:fixed; left:50px; top:40px; width:300px; height:250px; transform:scale(1.5); transform-origin:0 0; border:4px solid transparent'
      )
      const anchor = box('position:absolute; left:40px; top:40px; width:80px; height:30px', parent)
      const floating = box('width:100px; height:40px', parent)
      const positioner = createPositioner(floating, {
        anchor,
        strategy,
        side: 'bottom',
        align: 'start',
        flip: false,
        shift: false,
        autoUpdate: false,
      })
      positioners.push(positioner)
      await ready(positioner)
      near(floating.getBoundingClientRect().left, anchor.getBoundingClientRect().left)
      near(floating.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom)
    }
  )

  it('uses viewport availability independently of a clipping portal host', async () => {
    const parent = box(
      'position:fixed; left:0; top:0; width:500px; height:120px; overflow:hidden; transform:translateZ(0)'
    )
    const anchor = box('position:absolute; left:50px; top:40px; width:80px; height:20px', parent)
    const floating = box('width:100px; height:40px', parent)
    const positioner = createPositioner(floating, {
      anchor,
      collisionBoundary: 'viewport',
      flip: false,
      autoUpdate: false,
    })
    positioners.push(positioner)
    await ready(positioner)
    expect(positioner.getState().availableHeight).toBeGreaterThan(120)
    near(floating.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom)
    expect(getComputedStyle(parent).overflow).toBe('hidden')
  })

  it('hides an anchor clipped by its scroller even with viewport collisions', async () => {
    const scroller = box(
      'position:fixed; left:10px; top:10px; width:200px; height:100px; overflow:auto'
    )
    const content = box('position:relative; height:500px', scroller)
    const anchor = box('position:absolute; top:10px; left:20px; width:30px; height:20px', content)
    const floating = box('width:100px; height:40px')
    const positioner = createPositioner(floating, {
      anchor,
      strategy: 'fixed',
      collisionBoundary: 'viewport',
      hideWhenDetached: true,
      autoUpdate: false,
    })
    positioners.push(positioner)
    await ready(positioner)
    expect(positioner.getState().referenceHidden).toBe(false)
    scroller.scrollTop = 100
    await positioner.reposition()
    expect(positioner.getState().referenceHidden).toBe(true)
    expect(floating.hasAttribute('data-reference-hidden')).toBe(true)
    expect(getComputedStyle(floating).visibility).toBe('hidden')
    scroller.scrollTop = 0
    await positioner.reposition()
    expect(positioner.getState().referenceHidden).toBe(false)
    expect(getComputedStyle(floating).visibility).not.toBe('hidden')
  })

  it('supports zero-size virtual anchors and replacement without a DOM event', async () => {
    const point = { getBoundingClientRect: () => new DOMRect(0, 0, 0, 0) }
    const { positioner, props } = setup({ anchor: point, align: 'start', hideWhenDetached: true })
    await ready(positioner)
    expect(positioner.getState().referenceHidden).toBe(false)
    expect(positioner.getState().x).toBe(0)
    positioner.update({
      ...props,
      anchor: { getBoundingClientRect: () => new DOMRect(200, 150, 0, 0) },
    })
    await expect.poll(() => positioner.getState().x).toBe(200)
    expect(positioner.getState().y).toBe(150)
    positioner.update({
      ...props,
      anchor: { getBoundingClientRect: () => new DOMRect(-10, -10, 0, 0) },
    })
    await expect.poll(() => positioner.getState().referenceHidden).toBe(true)
  })

  it('positions arrows without adding an implicit gap and clears removed arrow state', async () => {
    const { positioner, floating, anchor, props } = setup()
    const arrow = box('width:10px; height:10px', floating)
    positioner.update({ ...props, arrow, sideOffset: 6 })
    await positioner.reposition()
    near(floating.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom + 6)
    expect(positioner.getState().arrowX).not.toBeNull()
    expect(positioner.getState().arrowY).toBeNull()
    expect(floating.style.getPropertyValue('--positioner-transform-origin')).toBe(
      positioner.getState().transformOrigin
    )
    const state = positioner.getState()
    near(state.arrowX! + 5, 60)
    positioner.update({ ...props, arrow, side: 'right' })
    await positioner.reposition()
    expect(positioner.getState().arrowX).toBeNull()
    expect(positioner.getState().arrowY).not.toBeNull()
    positioner.update(props)
    await positioner.reposition()
    expect(positioner.getState().arrowX).toBeNull()
    expect(positioner.getState().arrowY).toBeNull()
    expect(arrow.style.left).toBe('')
    expect(arrow.style.top).toBe('')
  })

  it('updates on rapid ancestor scroll followed by target resize', async () => {
    const scroller = box(
      'position:fixed; left:20px; top:20px; width:200px; height:150px; overflow:auto'
    )
    const content = box('position:relative; height:600px', scroller)
    const anchor = box('position:absolute; left:20px; top:70px; width:40px; height:30px', content)
    const floating = box('width:80px; height:30px')
    const positioner = createPositioner(floating, {
      anchor,
      strategy: 'fixed',
      flip: false,
      shift: false,
    })
    positioners.push(positioner)
    await ready(positioner)
    const originalY = positioner.getState().y!
    scroller.scrollTop = 30
    await expect.poll(() => positioner.getState().y).toBe(originalY - 30)
    anchor.style.height = '50px'
    expect(anchor.getBoundingClientRect().height).toBe(50)
    // Headless WebKit needs a render frame after expect.poll before native resize delivery.
    // Keep the scroll and resize mutations adjacent; synchronize only after both.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await expect.poll(() => positioner.getState().y).toBe(originalY - 10)
  })

  it('updates when only the anchor border box changes', async () => {
    const { positioner, anchor } = setup({ autoUpdate: true })
    await ready(positioner)
    anchor.style.boxSizing = 'content-box'
    anchor.style.border = '5px solid transparent'
    await expect.poll(() => positioner.getState().anchorHeight).toBe(110)
    near(positioner.getState().y!, 360)
  })

  it('recomputes after content growth and stops observing when disabled', async () => {
    const onPositioned = vi.fn()
    const { positioner, anchor, floating, props } = setup({
      autoUpdate: true,
      side: 'top',
      onPositioned,
    })
    await ready(positioner)
    floating.style.height = '100px'
    await expect.poll(() => positioner.getState().y).toBe(150)
    positioner.update({ ...props, enabled: false })
    const calls = onPositioned.mock.calls.length
    anchor.style.top = '200px'
    window.dispatchEvent(new Event('resize'))
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(onPositioned).toHaveBeenCalledTimes(calls)
    expect(positioner.getState().positioned).toBe(false)
    positioner.update(props)
    await expect.poll(() => positioner.getState().positioned).toBe(true)
    near(positioner.getState().y!, 100)
    positioner.dispose()
    const disposedCalls = onPositioned.mock.calls.length
    anchor.style.height = '60px'
    window.dispatchEvent(new Event('resize'))
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(onPositioned).toHaveBeenCalledTimes(disposedCalls)
  })

  it.each(['absolute', 'fixed'] as const)(
    'positions a native top-layer popover with %s strategy',
    async (strategy) => {
      const parent = box(
        'position:fixed; left:70px; top:40px; width:250px; height:100px; overflow:hidden; transform:scale(1.5); transform-origin:0 0'
      )
      const anchor = box('position:absolute; left:30px; top:60px; width:70px; height:30px', parent)
      const floating = box(
        'width:110px; height:60px; margin:0; padding:0; border:0; inset:auto',
        parent
      )
      floating.setAttribute('popover', 'manual')
      floating.showPopover()
      const positioner = createPositioner(floating, {
        anchor,
        strategy,
        align: 'start',
        sideOffset: 6,
        collisionBoundary: 'viewport',
        flip: false,
        shift: false,
        autoUpdate: false,
      })
      positioners.push(positioner)
      await ready(positioner)
      expect(floating.matches(':popover-open')).toBe(true)
      const target = anchor.getBoundingClientRect()
      const result = floating.getBoundingClientRect()
      near(result.left, target.left)
      near(result.top, target.bottom + 6)
      near(result.width, 110)
      expect(result.bottom).toBeGreaterThan(parent.getBoundingClientRect().bottom)
      const hit = document.elementFromPoint(result.left + 10, result.bottom - 10)
      expect(hit).toBe(floating)
    }
  )

  it('remeasures CSS available-height constraints after anchor and boundary resizing', async () => {
    const boundary = box('position:fixed; left:100px; top:100px; width:300px; height:300px')
    const anchor = box('position:absolute; left:50px; top:50px; width:50px; height:30px', boundary)
    const floating = box(
      'width:120px; height:1000px; max-height:var(--positioner-available-height); overflow:auto'
    )
    box('height:1000px; width:100px', floating)
    const onPositioned = vi.fn()
    const errors: string[] = []
    const onError = (event: ErrorEvent) => {
      if (event.message.includes('ResizeObserver')) errors.push(event.message)
    }
    window.addEventListener('error', onError)
    try {
      const positioner = createPositioner(floating, {
        anchor,
        strategy: 'fixed',
        side: 'bottom',
        collisionBoundary: boundary,
        collisionPadding: 8,
        flip: false,
        onPositioned,
      })
      positioners.push(positioner)
      await ready(positioner)
      await expect.poll(() => floating.getBoundingClientRect().height).toBe(212)
      near(floating.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom)
      expect(positioner.getState().side).toBe('bottom')
      anchor.style.height = '50px'
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await expect.poll(() => floating.getBoundingClientRect().height).toBe(192)
      near(floating.getBoundingClientRect().top, anchor.getBoundingClientRect().bottom)
      boundary.style.height = '260px'
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await expect.poll(() => floating.getBoundingClientRect().height).toBe(152)
      const final = positioner.getState()
      near(final.availableHeight!, 152)
      near(floating.getBoundingClientRect().bottom, boundary.getBoundingClientRect().bottom - 8)
      const calls = onPositioned.mock.calls.length
      for (let frame = 0; frame < 4; frame++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }
      expect(positioner.getState()).toEqual(final)
      expect(onPositioned).toHaveBeenCalledTimes(calls)
      expect(errors).toEqual([])
    } finally {
      window.removeEventListener('error', onError)
    }
  })

  it('keeps observers disabled until explicit updates and stops after disposal', async () => {
    const onPositioned = vi.fn()
    const { positioner, anchor } = setup({ onPositioned })
    await ready(positioner)
    const y = positioner.getState().y
    anchor.style.top = '200px'
    window.dispatchEvent(new Event('resize'))
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    expect(positioner.getState().y).toBe(y)
    await positioner.reposition()
    expect(positioner.getState().y).toBe(300)
    positioner.dispose()
    const count = onPositioned.mock.calls.length
    window.dispatchEvent(new Event('resize'))
    await positioner.reposition()
    expect(onPositioned).toHaveBeenCalledTimes(count)
  })
})
