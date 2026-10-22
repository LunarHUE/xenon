import { collection } from '../collection/collection'
import type { PartProps } from '../part'
import { commandScore } from './score'

/** One command in the palette. Values must be unique within a root. */
export interface CommandItem {
  /** Unique identity, also the text the default filter scores. */
  value: string
  /** Extra search terms scored together with the value. */
  keywords?: readonly string[]
  /** Skip during navigation and ignore activation. */
  disabled?: boolean
  /** Owning group value, if the item sits in a group. */
  group?: string
}

/** Snapshot inputs for a command palette. */
export interface CommandOptions {
  /** Every item in author order, including ones the query hides. */
  items: readonly CommandItem[]
  /** Adapter-owned base for the list, item and group IDs. */
  id: string
  /** Current search text. Defaults to empty. */
  query?: string
  /** Highlighted item. Falls back to the first enabled visible item. */
  activeValue?: string
  /**
   * Score items against the query and hide the ones scoring 0. Set false when the
   * consumer filters, for example on a server, and supplies only matching items.
   * @defaultValue true
   */
  shouldFilter?: boolean
  /** Score for an item, where 0 hides it. Defaults to {@link defaultCommandFilter}. */
  filter?: (item: CommandItem, query: string) => number
  /**
   * Order visible items by score, and groups by their best item, while a query is set.
   * @defaultValue true
   */
  sort?: boolean
  /**
   * Wrap Arrow Up and Arrow Down at the ends.
   * @defaultValue true
   */
  loop?: boolean
  /** Number of pages above the root page. Backspace on an empty query and Escape pop one. */
  depth?: number
  /** Requests a new highlight. */
  onActiveChange?: (value: string | undefined) => void
  /** Runs the command for an enabled item, from Enter or a click. */
  onSelect?: (value: string) => void
  /** Requests leaving the current page. */
  onPopPage?: () => void
}

/** Visible result of a {@link command} computation. */
export interface CommandResult {
  state: {
    /** Search text the result was computed for. */
    query: string
    /** Visible items, sorted by score when sorting applies. */
    items: readonly CommandItem[]
    /** Visible group values in display order. */
    groups: readonly string[]
    /** Enabled, visible highlighted item. */
    activeValue: string | undefined
    /** Number of visible items. */
    count: number
    /** Whether a query hides every item, or there are no items. */
    empty: boolean
  }
  parts: {
    /** Search input. It keeps DOM focus and points at the highlight. */
    input: PartProps<'input'>
    /** Listbox holding the items. */
    list: PartProps<'div'>
    /** Option attributes and pointer handlers for an item value. */
    item(value: string): PartProps<'div'>
    /** Group wrapper, hidden while none of its items is visible. */
    group(value: string): PartProps<'div'>
    /** Group heading that names its group. */
    groupHeading(value: string): PartProps<'div'>
    /** Status shown while nothing matches. */
    empty: PartProps<'div'>
    /** Divider, hidden while a query is set. */
    separator: PartProps<'div'>
  }
}

/** Score an item's value and keywords against a query with {@link commandScore}. */
export function defaultCommandFilter(item: CommandItem, query: string): number {
  const text = item.keywords?.length ? `${item.value} ${item.keywords.join(' ')}` : item.value
  return commandScore(text, query)
}

/**
 * Encode a value so any string makes a valid, collision-free ID suffix. Letters,
 * digits and hyphens pass through; every other UTF-16 unit, `_` included, becomes
 * `_` and four hex digits, so each output decodes back to one value.
 */
const encode = (value: string) =>
  value.replace(/[^A-Za-z0-9-]/g, (unit) => `_${unit.charCodeAt(0).toString(16).padStart(4, '0')}`)

/** Deterministic option ID under an adapter-owned base. */
export function getCommandItemId(base: string, value: string): string {
  return `${base}-item-${encode(value)}`
}
/** Deterministic group heading ID under an adapter-owned base. */
export function getCommandGroupHeadingId(base: string, value: string): string {
  return `${base}-group-${encode(value)}-heading`
}
/** Listbox ID under an adapter-owned base. */
export function getCommandListId(base: string): string {
  return `${base}-list`
}

/**
 * Computes filtering, ranking, highlight navigation and ARIA for a command palette.
 *
 * @remarks
 * DOM focus stays in the input. Arrow keys move the highlight over enabled visible
 * items, Home and End jump to the ends, and Ctrl or Meta with an arrow jumps to
 * the first item of the next or previous group. Enter runs the highlighted item.
 * Backspace on an empty query, and Escape, pop a page while one is open. Escape
 * is then canceled, so an enclosing Xenon dialog stays open. Composition and
 * author-canceled events are ignored. Recompute after every request.
 */
export function command(options: CommandOptions): CommandResult {
  const query = options.query ?? ''
  const filtering = options.shouldFilter !== false && query !== ''
  const filter = options.filter ?? defaultCommandFilter
  const scores = new Map<string, number>()
  if (filtering) for (const item of options.items) scores.set(item.value, filter(item, query))
  let items = filtering
    ? options.items.filter((item) => scores.get(item.value)! > 0)
    : options.items
  const groupOrder: string[] = []
  for (const item of items)
    if (item.group !== undefined && !groupOrder.includes(item.group)) groupOrder.push(item.group)
  if (filtering && options.sort !== false) {
    const best = new Map<string | undefined, number>()
    for (const item of items)
      best.set(item.group, Math.max(best.get(item.group) ?? 0, scores.get(item.value)!))
    const rank = (group: string | undefined) => (group === undefined ? Infinity : best.get(group)!)
    groupOrder.sort((a, b) => rank(b) - rank(a))
    // Ungrouped items lead, as in cmdk; Array.sort is stable for equal scores.
    items = [...items].sort(
      (a, b) =>
        (a.group === undefined ? -1 : groupOrder.indexOf(a.group)) -
          (b.group === undefined ? -1 : groupOrder.indexOf(b.group)) ||
        scores.get(b.value)! - scores.get(a.value)!
    )
  }
  const byValue = new Map(items.map((item) => [item.value, item]))
  const find = (value: string) => byValue.get(value)
  const order = collection({
    items: items.map((item) => item.value),
    disabled: (value) => !!find(value)!.disabled,
  })
  const activeValue =
    options.activeValue !== undefined && order.navigable.includes(options.activeValue)
      ? options.activeValue
      : order.first()
  const loop = options.loop ?? true
  const depth = options.depth ?? 0
  const highlight = (value: string | undefined) => {
    if (value !== undefined && value !== options.activeValue) options.onActiveChange?.(value)
  }
  const select = (value: string) => {
    const item = find(value)
    if (item && !item.disabled) options.onSelect?.(value)
  }
  /** First enabled item of the group after or before the highlight's group. */
  const groupJump = (forward: boolean) => {
    const current = activeValue === undefined ? undefined : find(activeValue)?.group
    const groups: (string | undefined)[] = []
    for (const value of order.navigable) {
      const group = find(value)!.group
      if (!groups.includes(group)) groups.push(group)
    }
    const index = groups.indexOf(current)
    const target = groups[forward ? index + 1 : index - 1]
    if (index === -1 || (forward ? index + 1 >= groups.length : index === 0)) return undefined
    return order.navigable.find((value) => find(value)!.group === target)
  }
  const listId = getCommandListId(options.id)
  return {
    state: {
      query,
      items,
      groups: groupOrder,
      activeValue,
      count: items.length,
      empty: items.length === 0,
    },
    parts: {
      input: {
        attrs: {
          role: 'combobox',
          value: query,
          autocomplete: 'off',
          spellcheck: 'false',
          'aria-autocomplete': 'list',
          'aria-expanded': 'true',
          'aria-controls': listId,
          'aria-activedescendant':
            activeValue === undefined ? undefined : getCommandItemId(options.id, activeValue),
        },
        on: {
          keydown(event) {
            if (event.defaultPrevented || event.isComposing || event.altKey) return
            const mod = event.ctrlKey || event.metaKey
            switch (event.key) {
              case 'ArrowDown':
              case 'ArrowUp': {
                event.preventDefault()
                const forward = event.key === 'ArrowDown'
                if (mod) highlight(groupJump(forward))
                else
                  highlight(
                    forward
                      ? order.next(activeValue, { loop })
                      : order.previous(activeValue, { loop })
                  )
                return
              }
              case 'Home':
              case 'End':
                if (mod || event.shiftKey) return
                event.preventDefault()
                highlight(event.key === 'Home' ? order.first() : order.last())
                return
              case 'Enter':
                if (activeValue === undefined) return
                event.preventDefault()
                select(activeValue)
                return
              case 'Backspace':
                if (depth > 0 && event.currentTarget.value === '' && !mod) {
                  event.preventDefault()
                  options.onPopPage?.()
                }
                return
              case 'Escape':
                if (depth > 0) {
                  event.preventDefault()
                  options.onPopPage?.()
                }
                return
            }
          },
        },
      },
      list: {
        attrs: {
          id: listId,
          role: 'listbox',
          tabindex: -1,
          'data-empty': items.length ? undefined : '',
        },
        on: {},
      },
      item(value) {
        const item = find(value) ?? options.items.find((candidate) => candidate.value === value)
        const shown = byValue.has(value)
        const disabled = !item || !!item.disabled
        const active = shown && activeValue === value
        return {
          attrs: {
            id: getCommandItemId(options.id, value),
            role: 'option',
            hidden: shown ? undefined : true,
            'aria-selected': active ? 'true' : 'false',
            'aria-disabled': disabled ? 'true' : undefined,
            'data-active': active ? '' : undefined,
            'data-disabled': disabled ? '' : undefined,
            'data-value': value,
          },
          on: {
            pointerdown(event) {
              // Keep DOM focus in the input.
              if (event.button === 0) event.preventDefault()
            },
            pointermove() {
              if (!disabled && shown) highlight(value)
            },
            click(event) {
              if (!event.defaultPrevented && shown) select(value)
            },
          },
        }
      },
      group(value) {
        const shown = groupOrder.includes(value)
        return {
          attrs: {
            role: 'group',
            hidden: shown ? undefined : true,
            'aria-labelledby': getCommandGroupHeadingId(options.id, value),
            'data-value': value,
          },
          on: {},
        }
      },
      groupHeading(value) {
        return { attrs: { id: getCommandGroupHeadingId(options.id, value) }, on: {} }
      },
      empty: {
        attrs: {
          hidden: items.length ? true : undefined,
          'data-empty': items.length ? undefined : '',
        },
        on: {},
      },
      separator: {
        attrs: { role: 'separator', hidden: query ? true : undefined },
        on: {},
      },
    },
  }
}
