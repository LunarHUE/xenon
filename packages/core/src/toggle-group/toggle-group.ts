import { composite } from '../composite/composite'
import type { CompositeDirection, CompositeOrientation } from '../composite/composite'
import { selection } from '../selection/selection'
import type { SelectionValue } from '../selection/selection'
import { toggle } from '../toggle/toggle'
import type { ToggleHost, ToggleResult } from '../toggle/toggle'
import type { PartProps } from '../part'

/** Select at most one value or maintain multiple pressed values. Both modes allow empty selection. */
export type ToggleGroupMode = 'single' | 'multiple'

/** Controlled selection and navigation inputs for a group of toggles. */
export interface ToggleGroupOptions<T> {
  /** Distinct item values in navigation order. Keep the array unchanged while using the result. */
  items: readonly T[]
  /**
   * Selection behavior and callback payload shape.
   * @defaultValue 'single'
   */
  mode?: ToggleGroupMode
  /** Current selection. Single mode uses the first array entry; multiple mode retains arrays by reference. */
  value?: T | readonly T[]
  /** Current tab stop, independent of selection. Missing or unknown values fall back to the first item. */
  active?: T
  /**
   * Blocks every item's activation while preserving navigation and the roving tab stop.
   * @defaultValue false
   */
  disabled?: boolean
  /** Checked when building an item part unless the group is disabled. Blocks activation without skipping navigation. */
  itemDisabled?: (item: T) => boolean
  /** Chooses host semantics when an item part is built. Defaults to 'button' for each item. */
  host?: (item: T) => ToggleHost
  /**
   * Arrow-key axes, also exposed through data-orientation.
   * @defaultValue 'horizontal'
   */
  orientation?: CompositeOrientation
  /**
   * Horizontal arrow direction. Vertical arrows are unaffected.
   * @defaultValue 'ltr'
   */
  direction?: CompositeDirection
  /**
   * Wrap arrow navigation at either end, including disabled items.
   * @defaultValue false
   */
  loop?: boolean
  /**
   * Synchronously reports the toggled selection on interactive item activation.
   * Single mode emits an item or undefined; multiple mode emits an array. Never
   * called during construction or navigation, and does not update the stored snapshot.
   */
  onValueChange?: (value: SelectionValue<T>) => void
  /** Reports a different active item on navigation or focus, including disabled items. The caller updates active state and moves focus for keyboard requests. */
  onActiveChange?: (item: T) => void
}

/** Resolved selection and navigation snapshot. Activation does not mutate this object. */
export interface ToggleGroupState<T> {
  /** Resolved selection mode. */
  mode: ToggleGroupMode
  /** Normalized pressed values, sharing an array supplied in multiple mode. */
  values: readonly T[]
  /** Current tab stop, independent of pressed or disabled state; undefined for an empty list. */
  active: T | undefined
  /** Resolved arrow-key axes. */
  orientation: CompositeOrientation
  /** Resolved horizontal navigation direction. */
  direction: CompositeDirection
  /** Whether arrow navigation wraps at the ends. */
  loop: boolean
  /** Whether activation is blocked for the entire group. */
  disabled: boolean
}

/** Group snapshot and parts to rebuild when selection or navigation inputs change. */
export interface ToggleGroupResult<T> {
  /** Resolved inputs used to generate item parts. */
  state: ToggleGroupState<T>
  /** Root semantics and per-item toggle/navigation behavior. */
  parts: {
    /** Group role and orientation/disabled data hooks; no root listeners or aria-orientation. */
    root: PartProps<'div'>
    /**
     * Builds a toggle for an item from `items`. Runtime semantics follow `host`,
     * although the return type always uses a button host. Navigation handlers run
     * before activation handlers and suppress them when the event default is prevented.
     */
    item(item: T): PartProps<'button'>
  }
}

/**
 * Combines independent pressed-value selection and roving focus requests.
 *
 * @remarks
 * No callbacks run during construction, and the group never moves DOM focus itself.
 * Recreate with callback payloads to apply changes. Disabled items remain keyboard
 * destinations and may own the tab stop. Item activation follows {@link toggle},
 * navigation follows {@link composite}, and value equality follows {@link selection}.
 */
export function toggleGroup<T>(options: ToggleGroupOptions<T>): ToggleGroupResult<T> {
  const mode = options.mode ?? 'single'
  const orientation = options.orientation ?? 'horizontal'
  const disabled = options.disabled ?? false

  const values = selection<T>({ mode, value: options.value })
  const roving = composite<T>({
    items: options.items,
    active: options.active,
    orientation,
    direction: options.direction,
    loop: options.loop,
    onActiveChange: options.onActiveChange,
  })

  const state: ToggleGroupState<T> = {
    mode,
    values: values.values,
    active: roving.state.active,
    orientation,
    direction: roving.state.direction,
    loop: roving.state.loop,
    disabled,
  }

  const root: PartProps<'div'> = {
    attrs: {
      role: 'group',
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
    },
    on: {},
  }

  /** Overlays the roving tab index and key claims on a fresh toggle part. */
  function item(entry: T): PartProps<'button'> {
    const control = toggle({
      host: options.host?.(entry) ?? 'button',
      pressed: values.isSelected(entry),
      disabled: disabled || (options.itemDisabled?.(entry) ?? false),
      focusableWhenDisabled: true,
      onPressedChange: () => options.onValueChange?.(values.toggle(entry)),
    }) as ToggleResult<PartProps<'button'>>

    const move = roving.parts.item(entry)
    const claim = move.on.keydown as ((event: KeyboardEvent) => void) | undefined
    const press = control.parts.root.on.keydown

    return {
      attrs: {
        ...control.parts.root.attrs,
        tabindex: move.attrs.tabindex,
        'data-orientation': orientation,
      },
      on: {
        ...control.parts.root.on,
        focus: move.on.focus as (() => void) | undefined,
        keydown(event) {
          claim?.(event)
          if (event.defaultPrevented) return
          press?.(event)
        },
      },
    }
  }

  return { state, parts: { root, item } }
}
