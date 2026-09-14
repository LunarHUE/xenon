import { collapsible } from '../collapsible/collapsible'
import type { CollapsibleIds } from '../collapsible/collapsible'
import { composite } from '../composite/composite'
import type { CompositeDirection } from '../composite/composite'
import type { PartProps } from '../part'
import type { PresenceStatus } from '../presence/presence'
import { selection } from '../selection/selection'
import type { SelectionValue } from '../selection/selection'

/** One open value or multiple independently open values. */
export type AccordionMode = 'single' | 'multiple'

/** Arrow-navigation axis, also exposed on all parts as data-orientation. */
export type AccordionOrientation = 'horizontal' | 'vertical'

/** Caller-owned open state, item order, and trigger navigation settings. */
export interface AccordionOptions<T> {
  /** Ordered navigation items. Use distinct values and rebuild after order changes. */
  items: readonly T[]
  /** Open values, normalized by {@link selection}; single mode uses only the first array entry. No item opens by default. */
  value?: T | readonly T[]
  /** Selection behavior, defaulting to 'single'. */
  mode?: AccordionMode
  /** Allow closing the selected single item. Defaults to false; multiple mode always permits closing all items. */
  collapsible?: boolean
  /** Preferred navigation item; missing, unknown, or disabled values fall back to the first enabled item, then the first item. */
  active?: T
  /** Disable every trigger and exclude all keyboard destinations. Defaults to false. */
  disabled?: boolean
  /** Disable individual triggers and exclude them from keyboard destinations. Root disabled state takes precedence. */
  itemDisabled?: (item: T) => boolean
  /** Caller-owned trigger/content IDs for each item. No IDs are generated. */
  ids?: (item: T) => CollapsibleIds | undefined
  /** Caller-reported presence phase per item; omitted phases are inferred from its open state. */
  status?: (item: T) => PresenceStatus | undefined
  /** Keep closed panels present, hidden outside their exit phase. Defaults to false. See {@link PresenceStatus}. */
  forceMount?: boolean
  /** Add region role and trigger-based aria-labelledby to panels. Defaults to true. */
  region?: boolean
  /** Navigation axis, defaulting to 'vertical'. */
  orientation?: AccordionOrientation
  /** Horizontal arrow direction, defaulting to 'ltr'; vertical movement is unchanged. */
  direction?: CompositeDirection
  /** Wrap arrow navigation at the enabled ends. Defaults to true. */
  loop?: boolean
  /**
   * Synchronously proposes the next open value on an enabled trigger click. Single
   * mode emits a scalar or undefined; multiple mode emits an array. Closing the
   * sole open item in non-collapsible single mode is silent. Never called during
   * construction; the caller must update value and rebuild.
   */
  onValueChange?: (value: SelectionValue<T>) => void
  /**
   * Synchronously requests a different navigation item on keyboard movement or
   * trigger focus. The caller updates active and moves focus for keyboard requests.
   * Focus reporting does not check disabled state; construction fires no callback.
   */
  onActiveChange?: (item: T) => void
}

/** Resolved values and per-item queries; operations do not update open state. */
export interface AccordionState<T> {
  /** Resolved single or multiple selection behavior. */
  mode: AccordionMode
  /** Normalized open values; a multiple-mode input array is retained by reference. */
  values: readonly T[]
  /** Resolved navigation item; may be disabled when every item is disabled. */
  active: T | undefined
  /** Resolved axis used for arrow navigation and styling hooks. */
  orientation: AccordionOrientation
  /** Whether the last open item may close; always true in multiple mode. */
  collapsible: boolean
  /** Root disabled state, independent of individual item disabling. */
  disabled: boolean
  /** Membership in the normalized selection, without checking item order or disabled state. */
  isOpen(item: T): boolean
  /** Root disabled state or the current item predicate result. */
  isDisabled(item: T): boolean
  /** Whether the panel is open, exiting, or force-mounted; evaluates the current item providers. */
  isPresent(item: T): boolean
}

/** Accordion snapshot and part factories for the items rendered by an adapter. */
export interface AccordionResult<T> {
  /** Resolved selection and navigation, with per-item state queries. */
  state: AccordionState<T>
  /** Bundles to apply to the corresponding rendered hosts. */
  parts: {
    /** Group styling hooks without an imposed role or interaction handlers. */
    root: PartProps<'div'>
    /** Open/disabled styling hooks for one item wrapper. */
    item(item: T): PartProps<'div'>
    /** Native button associations, click toggling, and composite keyboard/focus handlers. No roving tabindex is added. */
    trigger(item: T): PartProps<'button'>
    /** Presence attributes and optional region naming; the adapter owns mounting and animation timing. */
    panel(item: T): PartProps<'div'>
  }
}

/**
 * Builds accordion parts without storing changes, moving focus, or scheduling exits.
 *
 * @remarks
 * Triggers remain native tab stops. Arrow, Home, and End requests use composite
 * navigation; the adapter handles requested focus changes and supplies new active
 * state. Opening and navigation are independent. Part factories evaluate ID,
 * disabled, and status providers on demand; keep providers consistent within a
 * render and rebuild after option changes. The caller decides whether to render
 * each panel using isPresent. An initially empty single selection remains empty
 * even when collapsible is false.
 */
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

  /** Suppresses closing the sole required selection; other proposals use the captured selection. */
  const commit = (item: T) => {
    const moves = !picks.isSelected(item) || collapses || picks.values.length > 1
    if (!moves) return
    options.onValueChange?.(picks.toggle(item))
  }

  /** Recomputes one disclosure from the captured selection and current per-item providers. */
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
