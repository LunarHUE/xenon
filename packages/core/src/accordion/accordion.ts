import { collapsible } from '../collapsible/collapsible'
import type { CollapsibleIds } from '../collapsible/collapsible'
import { composite } from '../composite/composite'
import type { CompositeDirection } from '../composite/composite'
import type { PartProps } from '../part'
import type { PresenceStatus } from '../presence/presence'
import { selection } from '../selection/selection'
import type { SelectionValue } from '../selection/selection'

export type AccordionMode = 'single' | 'multiple'

export type AccordionOrientation = 'horizontal' | 'vertical'

export interface AccordionOptions<T> {
  items: readonly T[]
  value?: T | readonly T[]
  mode?: AccordionMode
  collapsible?: boolean
  active?: T
  disabled?: boolean
  itemDisabled?: (item: T) => boolean
  ids?: (item: T) => CollapsibleIds | undefined
  status?: (item: T) => PresenceStatus | undefined
  forceMount?: boolean
  region?: boolean
  orientation?: AccordionOrientation
  direction?: CompositeDirection
  loop?: boolean
  onValueChange?: (value: SelectionValue<T>) => void
  onActiveChange?: (item: T) => void
}

export interface AccordionState<T> {
  mode: AccordionMode
  values: readonly T[]
  active: T | undefined
  orientation: AccordionOrientation
  collapsible: boolean
  disabled: boolean
  isOpen(item: T): boolean
  isDisabled(item: T): boolean
  isPresent(item: T): boolean
}

export interface AccordionResult<T> {
  state: AccordionState<T>
  parts: {
    root: PartProps<'div'>
    item(item: T): PartProps<'div'>
    trigger(item: T): PartProps<'button'>
    panel(item: T): PartProps<'div'>
  }
}

export function accordion<T>(options: AccordionOptions<T>): AccordionResult<T> {
  const mode = options.mode ?? 'single'
  const orientation = options.orientation ?? 'vertical'
  const disabled = options.disabled ?? false
  const collapses = mode === 'multiple' ? true : (options.collapsible ?? false)
  const region = options.region ?? true

  const isDisabled = (item: T) => disabled || (options.itemDisabled?.(item) ?? false)

  const picks = selection<T>({ mode, value: options.value, allowEmpty: collapses })

  const nav = composite<T>({
    items: options.items,
    active: options.active,
    disabled: isDisabled,
    orientation,
    direction: options.direction,
    loop: options.loop ?? true,
    onActiveChange: options.onActiveChange,
  })

  const commit = (item: T) => {
    const moves = !picks.isSelected(item) || collapses || picks.values.length > 1
    if (!moves) return
    options.onValueChange?.(picks.toggle(item))
  }

  const itemOf = (item: T) =>
    collapsible({
      ids: options.ids?.(item),
      open: picks.isSelected(item),
      status: options.status?.(item),
      forceMount: options.forceMount,
      disabled: isDisabled(item),
      onOpenChange: () => commit(item),
    })

  const state: AccordionState<T> = {
    mode,
    values: picks.values,
    active: nav.state.active,
    orientation,
    collapsible: collapses,
    disabled,
    isOpen: picks.isSelected,
    isDisabled,
    isPresent: (item) => itemOf(item).state.present,
  }

  const root: PartProps<'div'> = {
    attrs: {
      'data-orientation': orientation,
      'data-disabled': disabled ? '' : undefined,
    },
    on: {},
  }

  const parts = {
    root,
    item(item: T): PartProps<'div'> {
      return {
        attrs: { ...itemOf(item).parts.root.attrs, 'data-orientation': orientation },
        on: {},
      }
    },
    trigger(item: T): PartProps<'button'> {
      const own = itemOf(item).parts.trigger
      const keys = nav.parts.item(item).on
      return {
        attrs: { ...own.attrs, 'data-orientation': orientation },
        on: {
          click: own.on.click,
          keydown: (event) => keys.keydown?.(event as never),
          focus: (event) => keys.focus?.(event as never),
        },
      }
    },
    panel(item: T): PartProps<'div'> {
      return {
        attrs: {
          ...itemOf(item).parts.content.attrs,
          ...(region ? { role: 'region', 'aria-labelledby': options.ids?.(item)?.trigger } : null),
          'data-orientation': orientation,
        },
        on: {},
      }
    },
  }

  return { state, parts }
}
