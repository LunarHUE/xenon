import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Placement } from '@floating-ui/dom'
import { createPositioner } from './positioning'
import type { Positioner } from './types'

const floating = vi.hoisted(() => ({ compute: vi.fn(), observe: vi.fn(), dimensions: vi.fn() }))
vi.mock('@floating-ui/dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@floating-ui/dom')>()
  return {
    ...actual,
    computePosition: floating.compute,
    autoUpdate: floating.observe,
    platform: { ...actual.platform, getDimensions: floating.dimensions },
  }
})
let controller: Positioner | undefined
beforeEach(() => {
  vi.clearAllMocks()
  floating.observe.mockReturnValue(() => {})
  floating.dimensions.mockResolvedValue({ width: 10, height: 5 })
})
afterEach(() => {
  controller?.dispose()
  controller = undefined
  document.body.replaceChildren()
})
async function origin(placement: Placement, dir: 'ltr' | 'rtl', arrowOffset?: number) {
  const anchor = document.createElement('button')
  const popup = document.createElement('div')
  const arrow = document.createElement('span')
  popup.append(arrow)
  document.body.append(anchor, popup)
  floating.compute.mockResolvedValue({
    x: 120,
    y: 80,
    placement,
    strategy: 'absolute',
    middlewareData:
      arrowOffset === undefined
        ? {}
        : {
            arrow: { x: 20, y: 15, centerOffset: arrowOffset },
          },
  })
  const [side, align = 'center'] = placement.split('-')
  controller = createPositioner(popup, {
    anchor,
    dir,
    side: side as 'top' | 'bottom' | 'left' | 'right',
    align: align as 'start' | 'end' | 'center',
    sideOffset: 8,
    ...(arrowOffset === undefined ? {} : { arrow }),
  })
  for (let i = 0; i < 12; i++) await Promise.resolve()
  return popup.style.getPropertyValue('--positioner-transform-origin')
}

describe('positioning independent transform origins', () => {
  for (const dir of ['ltr', 'rtl'] as const) {
    for (const [placement, ltr, rtl] of [
      ['top-start', '0% calc(100% + 8px)', '100% calc(100% + 8px)'],
      ['top-end', '100% calc(100% + 8px)', '0% calc(100% + 8px)'],
      ['bottom-start', '0% -8px', '100% -8px'],
      ['bottom-end', '100% -8px', '0% -8px'],
      ['top', '50% calc(100% + 8px)', '50% calc(100% + 8px)'],
      ['bottom', '50% -8px', '50% -8px'],
      ['left-start', 'calc(100% + 8px) 0%', 'calc(100% + 8px) 0%'],
      ['left-end', 'calc(100% + 8px) 100%', 'calc(100% + 8px) 100%'],
      ['right-start', '-8px 0%', '-8px 0%'],
      ['right-end', '-8px 100%', '-8px 100%'],
      ['left', 'calc(100% + 8px) 50%', 'calc(100% + 8px) 50%'],
      ['right', '-8px 50%', '-8px 50%'],
    ] as const) {
      it(`${placement} in ${dir} uses its logical alignment and side gap`, async () => {
        expect(await origin(placement, dir)).toBe(dir === 'ltr' ? ltr : rtl)
      })
    }
    for (const [side, expected] of [
      ['top', '25px calc(100% + 8px)'],
      ['bottom', '25px -8px'],
      ['left', 'calc(100% + 8px) 17.5px'],
      ['right', '-8px 17.5px'],
    ] as const) {
      for (const align of ['', '-start', '-end'] as const) {
        it(`${side}${align} in ${dir} originates at the centered arrow`, async () => {
          expect(await origin(`${side}${align}` as Placement, dir, 0)).toBe(expected)
        })
      }
    }
    it(`an uncentered arrow falls back to logical alignment in ${dir}`, async () => {
      expect(await origin('bottom-start', dir, 4)).toBe(dir === 'rtl' ? '100% -8px' : '0% -8px')
    })
  }
})
