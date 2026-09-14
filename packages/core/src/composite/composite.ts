import { collection } from '../collection/collection'
import type { PartProps } from '../part'

export type CompositeOrientation = 'horizontal' | 'vertical' | 'both'

export type CompositeDirection = 'ltr' | 'rtl'

export interface CompositeOptions<T> {
  items: readonly T[]
  active?: T
  disabled?: (item: T) => boolean
  orientation?: CompositeOrientation
  direction?: CompositeDirection
  loop?: boolean
  onActiveChange?: (item: T) => void
}

export interface CompositeState<T> {
  active: T | undefined
  orientation: CompositeOrientation
  direction: CompositeDirection
  loop: boolean
}

export interface CompositeResult<T> {
  state: CompositeState<T>
  parts: { item(item: T): PartProps<'div'> }
}

type Move = 'forward' | 'backward' | 'first' | 'last'

function moveFor(
  key: string,
  orientation: CompositeOrientation,
  direction: CompositeDirection
): Move | undefined {
  if (key === 'Home') return 'first'
  if (key === 'End') return 'last'
  if (orientation !== 'vertical' && (key === 'ArrowRight' || key === 'ArrowLeft')) {
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    return key === forward ? 'forward' : 'backward'
  }
  if (orientation !== 'horizontal' && (key === 'ArrowDown' || key === 'ArrowUp')) {
    return key === 'ArrowDown' ? 'forward' : 'backward'
  }
  return undefined
}

export function composite<T>(options: CompositeOptions<T>): CompositeResult<T> {
  const items = options.items
  const orientation = options.orientation ?? 'horizontal'
  const direction = options.direction ?? 'ltr'
  const loop = options.loop ?? false

  const entries = collection({ items, disabled: options.disabled })

  const proposed = options.active
  const active =
    proposed !== undefined && entries.indexOf(proposed) >= 0 && !options.disabled?.(proposed)
      ? proposed
      : (entries.first() ?? items[0])

  const state: CompositeState<T> = { active, orientation, direction, loop }

  function targetOf(move: Move): T | undefined {
    if (move === 'first') return entries.first()
    if (move === 'last') return entries.last()
    if (move === 'forward') return entries.next(active, { loop })
    return entries.previous(active, { loop })
  }

  const parts = {
    item(item: T): PartProps<'div'> {
      return {
        attrs: {
          tabindex: active !== undefined && item === active ? 0 : -1,
          'data-orientation': orientation,
        },
        on: {
          keydown(event) {
            if (items.length === 0) return
            if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return
            const move = moveFor(event.key, orientation, direction)
            if (move === undefined) return
            event.preventDefault()
            const target = targetOf(move)
            if (target !== undefined && target !== active) options.onActiveChange?.(target)
          },
          focus() {
            if (item !== active) options.onActiveChange?.(item)
          },
        },
      }
    },
  }

  return { state, parts }
}
