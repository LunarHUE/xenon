import { describe, expect, test } from 'vitest'

import { composite } from './composite'

function event(key: string) {
  const result = {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    preventDefault() {
      result.defaultPrevented = true
    },
  }
  return result as unknown as KeyboardEvent & {
    currentTarget: HTMLDivElement
    defaultPrevented: boolean
  }
}

describe('composite coverage', () => {
  test('composite.keyboard.3: both orientation claims both arrow axes', () => {
    const moved: string[] = []
    const engine = composite({
      items: ['a', 'b', 'c'],
      orientation: 'both',
      onActiveChange: (item) => moved.push(item),
    })
    const down = event('ArrowDown')
    engine.parts.item('a').on.keydown?.(down)
    const right = event('ArrowRight')
    engine.parts.item('a').on.keydown?.(right)

    expect(down.defaultPrevented).toBe(true)
    expect(right.defaultPrevented).toBe(true)
    expect(moved).toEqual(['b', 'b'])

    const reverse: string[] = []
    const reverseEngine = composite({
      items: ['a', 'b', 'c'],
      active: 'c',
      orientation: 'both',
      onActiveChange: (item) => reverse.push(item),
    })
    const up = event('ArrowUp')
    reverseEngine.parts.item('c').on.keydown?.(up)
    const left = event('ArrowLeft')
    reverseEngine.parts.item('c').on.keydown?.(left)
    expect(up.defaultPrevented).toBe(true)
    expect(left.defaultPrevented).toBe(true)
    expect(reverse).toEqual(['b', 'b'])
  })

  test('composite.notes.1: navigation preserves numeric and object identities', () => {
    const one = { id: 1 }
    const two = { id: 2 }
    const numericMoves: number[] = []
    const numbers = composite({
      items: [0, 1, 2],
      active: 0,
      onActiveChange: (item) => numericMoves.push(item),
    })
    const objectMoves: { id: number }[] = []
    const objects = composite({
      items: [one, two],
      active: one,
      onActiveChange: (item) => objectMoves.push(item),
    })

    expect(numbers.state.active).toBe(0)
    expect(numbers.parts.item(0).attrs.tabindex).toBe(0)
    const numericEvent = event('ArrowRight')
    numbers.parts.item(0).on.keydown?.(numericEvent)
    expect(numericMoves).toEqual([1])
    expect(objects.state.active).toBe(one)
    expect(objects.parts.item(one).attrs.tabindex).toBe(0)
    const objectEvent = event('ArrowRight')
    objects.parts.item(one).on.keydown?.(objectEvent)
    expect(objectMoves).toHaveLength(1)
    expect(objectMoves[0]).toBe(two)
  })

  test('composite.keyboard.8: prevention is visible before active-change callback', () => {
    let observed = false
    let changes = 0
    const engine = composite({
      items: ['a', 'b'],
      onActiveChange: () => {
        changes += 1
        observed = move.defaultPrevented
      },
    })
    const move = event('ArrowRight')
    engine.parts.item('a').on.keydown?.(move)
    expect(observed).toBe(true)

    const boundary = event('ArrowLeft')
    engine.parts.item('a').on.keydown?.(boundary)
    expect(boundary.defaultPrevented).toBe(true)
    expect(changes).toBe(1)
  })
})
