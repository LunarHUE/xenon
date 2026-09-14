import { composite } from '../composite/composite'
import type { CompositeDirection, CompositeOrientation } from '../composite/composite'
import { selection } from '../selection/selection'
import type { SelectionValue } from '../selection/selection'
import { toggle } from '../toggle/toggle'
import type { ToggleHost, ToggleResult } from '../toggle/toggle'
import type { PartProps } from '../part'

export type ToggleGroupMode = 'single' | 'multiple'

export interface ToggleGroupOptions<T> {
  items: readonly T[]
  mode?: ToggleGroupMode
  value?: T | readonly T[]
  active?: T
  disabled?: boolean
  itemDisabled?: (item: T) => boolean
  host?: (item: T) => ToggleHost
  orientation?: CompositeOrientation
  direction?: CompositeDirection
  loop?: boolean
  onValueChange?: (value: SelectionValue<T>) => void
  onActiveChange?: (item: T) => void
}

export interface ToggleGroupState<T> {
  mode: ToggleGroupMode
  values: readonly T[]
  active: T | undefined
  orientation: CompositeOrientation
  direction: CompositeDirection
  loop: boolean
  disabled: boolean
}

export interface ToggleGroupResult<T> {
  state: ToggleGroupState<T>
  parts: {
    root: PartProps<'div'>
    item(item: T): PartProps<'button'>
  }
}

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
