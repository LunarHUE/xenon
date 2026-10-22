import { describe, expect, test, vi } from 'vitest'
import { composite } from './composite'

function event(key: string) {
  return {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
  }
}

describe('composite sparse navigation matrix', () => {
  for (const orientation of ['horizontal', 'vertical', 'both'] as const) {
    for (const direction of ['ltr', 'rtl'] as const) {
      for (const loop of [false, true]) {
        test(`${orientation} ${direction} loop=${loop} skips disabled ends and preserves controlled state`, () => {
          const items = ['disabled-first', 'first', 'disabled-middle', 'last', 'disabled-last']
          const disabled = (item: string) => item.startsWith('disabled')
          const onActiveChange = vi.fn()
          const keys = new Map<string, 'forward' | 'backward'>([
            ['ArrowRight', direction === 'rtl' ? 'backward' : 'forward'],
            ['ArrowLeft', direction === 'rtl' ? 'forward' : 'backward'],
            ['ArrowDown', 'forward'],
            ['ArrowUp', 'backward'],
          ])
          for (const active of ['first', 'last']) {
            const result = composite({
              items,
              active,
              disabled,
              orientation,
              direction,
              loop,
              onActiveChange,
            })
            expect(items.filter((item) => result.parts.item(item).attrs.tabindex === 0)).toEqual([
              active,
            ])
            for (const [key, movement] of keys) {
              onActiveChange.mockClear()
              const input = event(key)
              result.parts
                .item(active)
                .on.keydown?.(input as unknown as KeyboardEvent & { currentTarget: HTMLDivElement })
              const handled =
                orientation === 'both' ||
                (orientation === 'horizontal'
                  ? ['ArrowLeft', 'ArrowRight'].includes(key)
                  : ['ArrowUp', 'ArrowDown'].includes(key))
              expect(input.preventDefault).toHaveBeenCalledTimes(handled ? 1 : 0)
              const destination =
                movement === 'forward'
                  ? active === 'first'
                    ? 'last'
                    : loop
                      ? 'first'
                      : undefined
                  : active === 'last'
                    ? 'first'
                    : loop
                      ? 'last'
                      : undefined
              expect(onActiveChange.mock.calls).toEqual(
                handled && destination ? [[destination]] : []
              )
              // Requests do not mutate a controlled engine. Repeated input must
              // continue to resolve from the same active item until recreated.
              expect(result.state.active).toBe(active)
              expect(result.parts.item(active).attrs.tabindex).toBe(0)
            }
            for (const [key, destination] of [
              ['Home', 'first'],
              ['End', 'last'],
            ]) {
              onActiveChange.mockClear()
              const input = event(key!)
              result.parts
                .item(active)
                .on.keydown?.(input as unknown as KeyboardEvent & { currentTarget: HTMLDivElement })
              expect(input.preventDefault).toHaveBeenCalledOnce()
              expect(onActiveChange.mock.calls).toEqual(
                active === destination ? [] : [[destination]]
              )
            }
          }
        })
      }
    }
  }
})
