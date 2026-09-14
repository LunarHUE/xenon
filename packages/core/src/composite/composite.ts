import { collection } from '../collection/collection'
import type { PartProps } from '../part'

/** Arrow-key axes to handle. Both axes traverse the same linear item order. */
export type CompositeOrientation = 'horizontal' | 'vertical' | 'both'

/** Reading direction used to reverse horizontal arrow-key movement. */
export type CompositeDirection = 'ltr' | 'rtl'

/** Current item order and navigation settings for a roving tab stop. */
export interface CompositeOptions<T> {
  /** Ordered items, retained by reference. Use distinct values and recreate after changes. */
  items: readonly T[]
  /** Preferred tab stop. An absent, unknown, or disabled value falls back to the first enabled item, then the first item. */
  active?: T
  /** Excludes items from keyboard destinations. Evaluated during construction; focus reporting does not check it. */
  disabled?: (item: T) => boolean
  /**
   * Arrow-key axes to handle; Home and End work on every orientation.
   * @defaultValue 'horizontal'
   */
  orientation?: CompositeOrientation
  /**
   * Reading direction for horizontal arrows; vertical arrows are unaffected.
   * @defaultValue 'ltr'
   */
  direction?: CompositeDirection
  /**
   * Wrap arrow navigation at the enabled ends.
   * @defaultValue false
   */
  loop?: boolean
  /**
   * Synchronously requests a different active item on keyboard navigation or item focus.
   * Never called during construction. The caller updates active state and moves DOM
   * focus for keyboard requests; this callback does not change selection.
   */
  onActiveChange?: (item: T) => void
}

/** Resolved navigation values used by the returned item parts. */
export interface CompositeState<T> {
  /** Resolved tab stop, possibly disabled when every item is disabled; undefined for an empty list. */
  active: T | undefined
  /** Resolved arrow-key axes, also exposed as a data attribute on each item. */
  orientation: CompositeOrientation
  /** Resolved horizontal navigation direction. */
  direction: CompositeDirection
  /** Whether arrow navigation wraps at the enabled ends. */
  loop: boolean
}

/** Navigation snapshot and item parts; recreate when controlled options change. */
export interface CompositeResult<T> {
  /** Resolved values captured by the item listeners. */
  state: CompositeState<T>
  /** Attributes and handlers for each host participating in the composite. */
  parts: {
    /**
     * Supplies the tab index and navigation/focus handlers for an item from `items`.
     * Focus reports any item different from active, without checking membership or disabled state.
     */
    item(item: T): PartProps<'div'>
  }
}

/** A direction or enabled endpoint within the linear collection. */
type Move = 'forward' | 'backward' | 'first' | 'last'

/** Maps keys to collection movement without checking modifiers or canceling events. */
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

/**
 * Builds a roving tab stop without storing updates or moving DOM focus.
 *
 * @remarks
 * Unmodified navigation keys cancel their default even at a boundary or when no
 * item is enabled. Empty lists and keys with any modifier are left alone. Arrow
 * movement starts from the resolved active value, regardless of which item received
 * the event. Objects match by reference; duplicate values can produce multiple tab
 * stops. Recreate after item order, disabled state, or active state changes.
 */
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

  /** Resolves a destination from the captured active value and enabled collection positions. */
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
