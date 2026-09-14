import { collection } from '../collection/collection'
import { composite } from '../composite/composite'
import { selection } from '../selection/selection'
import type { CompositeDirection } from '../composite/composite'
import type { PartProps } from '../part'

export type TabsOrientation = 'horizontal' | 'vertical'

export type TabsActivationMode = 'automatic' | 'manual'

export interface TabsIds<T> {
  tab(item: T): string
  panel(item: T): string
}

export interface TabsOptions<T> {
  items: readonly T[]
  ids: TabsIds<T>
  value?: T
  active?: T
  disabled?: (item: T) => boolean
  panelFocusable?: (item: T) => boolean
  orientation?: TabsOrientation
  direction?: CompositeDirection
  loop?: boolean
  activationMode?: TabsActivationMode
  onValueChange?: (value: T) => void
  onActiveChange?: (item: T | undefined) => void
}

export interface TabsState<T> {
  value: T | undefined
  active: T | undefined
  orientation: TabsOrientation
  direction: CompositeDirection
  activationMode: TabsActivationMode
  loop: boolean
}

export interface TabsResult<T> {
  state: TabsState<T>
  parts: {
    root: PartProps<'div'>
    list: PartProps<'div'>
    tab(item: T): PartProps<'div'>
    panel(item: T): PartProps<'div'>
  }
}

function claimed(event: MouseEvent): boolean {
  if (event.defaultPrevented) return true
  if (event.button !== 0) return true
  return event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
}

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
