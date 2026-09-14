import { collection } from '../collection/collection'
import { composite } from '../composite/composite'
import { selection } from '../selection/selection'
import type { CompositeDirection } from '../composite/composite'
import type { PartProps } from '../part'

/** Axis used for arrow navigation and orientation attributes. */
export type TabsOrientation = 'horizontal' | 'vertical'

/** Whether navigation requests selection immediately or leaves it to activation. */
export type TabsActivationMode = 'automatic' | 'manual'

/** Adapter-owned IDs linking every tab and panel, including hidden panels. */
export interface TabsIds<T> {
  /** Stable tab ID used by the corresponding panel's aria-labelledby. */
  tab(item: T): string
  /** Stable panel ID used by the corresponding tab's aria-controls. */
  panel(item: T): string
}

/** Current items, selection, navigation state, and adapter callbacks. */
export interface TabsOptions<T> {
  /** Items in navigation order; objects match by identity. Rebuild after changes. */
  items: readonly T[]
  /** ID providers; core does not generate IDs or check for mounted elements. */
  ids: TabsIds<T>
  /** Selected item. Missing or unknown values fall back to the first enabled item, then the first item. */
  value?: T
  /** Preferred roving tab stop, defaulting to selection and normalized by composite navigation. */
  active?: T
  /** Excludes keyboard destinations and click selection; focus reporting does not check it. Native disabled attributes are adapter-owned. */
  disabled?: (item: T) => boolean
  /** Reports focusable panel content; defaults to false. Selected panels otherwise receive tabindex=0. */
  panelFocusable?: (item: T) => boolean
  /** Navigation axis, defaulting to horizontal. */
  orientation?: TabsOrientation
  /** Horizontal arrow direction, defaulting to ltr. */
  direction?: CompositeDirection
  /** Wrap arrow navigation at either end. Defaults to true. */
  loop?: boolean
  /** Automatic selection on navigation by default; manual mode selects on click. */
  activationMode?: TabsActivationMode
  /** Synchronously proposes a different selected item from an event; never called during construction. */
  onValueChange?: (value: T) => void
  /** Requests navigation/focus changes, or undefined when focus leaves the list. Does not move focus itself. */
  onActiveChange?: (item: T | undefined) => void
}

/** Resolved selection and navigation snapshot. */
export interface TabsState<T> {
  /** Resolved selection; an explicitly supplied disabled item is retained if it exists. */
  value: T | undefined
  /** Roving stop from composite navigation; may differ from the selection. */
  active: T | undefined
  /** Resolved navigation axis. */
  orientation: TabsOrientation
  /** Resolved horizontal reading direction. */
  direction: CompositeDirection
  /** Whether navigation also requests selection. */
  activationMode: TabsActivationMode
  /** Whether arrow navigation wraps. */
  loop: boolean
}

/** Current state and part factories; rebuild when options change. */
export interface TabsResult<T> {
  /** Values captured by the part listeners. */
  state: TabsState<T>
  /** Attributes and listeners to bind to the corresponding hosts. */
  parts: {
    /** Wrapper carrying the orientation styling hook. */
    root: PartProps<'div'>
    /** Tablist semantics and focus-leave reporting; horizontal ARIA orientation is omitted. */
    list: PartProps<'div'>
    /** Tab associations, roving navigation, and unmodified primary-click selection. */
    tab(item: T): PartProps<'div'>
    /** Panel associations and native hidden state; no unmounting is performed. */
    panel(item: T): PartProps<'div'>
  }
}

/** Whether a click is canceled, modified, or uses a non-primary button. */
function claimed(event: MouseEvent): boolean {
  if (event.defaultPrevented) return true
  if (event.button !== 0) return true
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
}

/**
 * Computes tab selection, roving navigation, and panel visibility from a snapshot.
 *
 * @remarks
 * The adapter applies parts, owns state updates and focus movement, and supplies
 * native button keyboard activation or equivalent handling. Core adds no Enter
 * or Space handler. In automatic mode, navigation reports the active item before
 * proposing selection. No initial callback fires. Hidden panels keep their bundles;
 * mounting and focusable-content detection belong to the adapter.
 */
export function tabs<T>(options: TabsOptions<T>): TabsResult<T> {
  const items = options.items
  const orientation = options.orientation ?? 'horizontal'
  const activationMode = options.activationMode ?? 'automatic'
  const loop = options.loop ?? true

  const entries = collection({ items, disabled: options.disabled })
  const value =
    options.value !== undefined && entries.indexOf(options.value) >= 0
      ? options.value
      : (entries.first() ?? items[0])

  const picked = selection<T>({ mode: 'single', value, allowEmpty: false })

  function change(item: T) {
    if (picked.isSelected(item)) return
    const next = picked.select(item)
    if (next !== undefined) options.onValueChange?.(next as T)
  }

  const nav = composite<T>({
    items,
    active: options.active ?? value,
    disabled: options.disabled,
    orientation,
    direction: options.direction,
    loop,
    onActiveChange(item) {
      options.onActiveChange?.(item)
      if (activationMode === 'automatic') change(item)
    },
  })

  const state: TabsState<T> = {
    value,
    active: nav.state.active,
    orientation,
    direction: nav.state.direction,
    activationMode,
    loop,
  }

  const parts = {
    root: {
      attrs: { 'data-orientation': orientation },
      on: {},
    } satisfies PartProps<'div'>,

    list: {
      attrs: {
        role: 'tablist',
        'aria-orientation': orientation === 'vertical' ? ('vertical' as const) : undefined,
        'data-orientation': orientation,
      },
      on: {
        focusout(event: FocusEvent & { currentTarget: HTMLDivElement }) {
          const next = event.relatedTarget as globalThis.Node | null
          if (next !== null && event.currentTarget.contains(next)) return
          options.onActiveChange?.(undefined)
        },
      },
    } satisfies PartProps<'div'>,

    tab(item: T): PartProps<'div'> {
      const roving = nav.parts.item(item)
      const selected = picked.isSelected(item)
      const disabled = options.disabled?.(item) ?? false
      return {
        attrs: {
          ...roving.attrs,
          id: options.ids.tab(item),
          role: 'tab',
          'aria-selected': selected ? 'true' : 'false',
          'aria-controls': options.ids.panel(item),
          'data-state': selected ? 'active' : 'inactive',
          'data-selected': selected ? '' : undefined,
          'data-disabled': disabled ? '' : undefined,
        },
        on: {
          ...roving.on,
          click(event) {
            if (disabled || claimed(event)) return
            change(item)
          },
        },
      }
    },

    panel(item: T): PartProps<'div'> {
      const selected = picked.isSelected(item)
      const focusable = options.panelFocusable?.(item) ?? false
      return {
        attrs: {
          id: options.ids.panel(item),
          role: 'tabpanel',
          'aria-labelledby': options.ids.tab(item),
          tabindex: selected && !focusable ? 0 : undefined,
          hidden: selected ? undefined : true,
          'data-state': selected ? 'active' : 'inactive',
          'data-selected': selected ? '' : undefined,
          'data-orientation': orientation,
        },
        on: {},
      }
    },
  }

  return { state, parts }
}
