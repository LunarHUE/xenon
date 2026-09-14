import { composite } from '../composite/composite'
import type { PartProps } from '../part'

/** Caller-owned menu visibility, navigation order, and typeahead buffer. */
export interface MenuOptions<T> {
  /** Ordered item identities, retained by reference. Supply distinct values and recompute after changes. */
  items: readonly T[]
  /** Preferred tab stop; undefined or unknown values fall back to the first item. */
  active?: T
  /**
   * Visibility intent for expanded state and open/closed hooks. Does not gate item handlers.
   * @defaultValue `false`
   */
  open?: boolean
  /**
   * Wrap vertical arrow navigation at the item-order boundaries, including disabled items.
   * @defaultValue `true`
   */
  loop?: boolean
  /** Accepted but not read by this engine; submenu direction belongs to the adapter. */
  dir?: 'ltr' | 'rtl'
  /** IDs to copy and reference; no IDs are generated or checked against rendered elements. */
  ids?: {
    /** Trigger ID, also used by content's `aria-labelledby`. */
    trigger?: string
    /** Content ID, referenced by trigger `aria-controls` only while open. */
    content?: string
  }
  /**
   * Marks item ARIA/data disabled state and excludes typeahead matches. Does not
   * remove arrow-key destinations or tab stops; the adapter blocks activation.
   */
  disabled?: (item: T) => boolean
  /**
   * Searchable item text, trimmed and locale-lowercased before prefix matching.
   * Without this getter no typeahead match is found; DOM text is not inspected.
   */
  textValue?: (item: T) => string
  /**
   * Current typeahead buffer, normally the last emitted search string. Undefined
   * starts empty. The caller stores it, resets it, and owns any idle timeout.
   */
  search?: string
  /**
   * Synchronously emits the existing buffer plus the locale-lowercased key before
   * searching. Repeated characters remain in this payload even when matching uses
   * only one character. Called even with no match; initialization is silent.
   */
  onSearchChange?: (search: string) => void
  /**
   * Synchronous focus request from navigation, focus reporting, or a typeahead
   * match. Typeahead may report the current item again. The caller moves DOM
   * focus and supplies the next active value; this engine stores no update.
   */
  onActiveChange?: (item: T) => void
  /**
   * Synchronous visibility/focus-edge request. Trigger clicks invert captured
   * open state and pass `first`, including on close. ArrowUp requests open/last;
   * ArrowDown, Enter, and Space request open/first even when already open.
   * Construction is silent; no item activation or dismissal invokes this callback.
   */
  onOpenChange?: (open: boolean, edge?: 'first' | 'last') => void
}
/**
 * Compute menu trigger/content semantics, vertical roving focus, and typeahead.
 *
 * @remarks
 * The adapter owns actual hosts, item activation and selection, disabled gating,
 * submenu keys, Escape/Tab/outside dismissal, presence, positioning, and DOM focus.
 * Recompute after state changes; keep options and item order unchanged while using
 * the result because handlers also read options through their closures.
 *
 * Typeahead handles single-character keys, consuming Space only with a nonempty
 * buffer. It skips disabled matches and wraps independently of `loop`. Repeated
 * identical characters search from the next item; other prefixes try the receiving
 * item first. Composition and Alt/Ctrl/Meta events are ignored; Shift permits
 * character searches but suppresses composite navigation. Trigger handled keys
 * prevent their defaults. The adapter must honor author cancellation before calling
 * trigger handlers, which do not inspect `defaultPrevented`.
 *
 * @returns Captured open/active/loop state and trigger, content, and item bundles.
 */
export function menu<T>(options: MenuOptions<T>) {
  const open = options.open ?? false
  const navigation = composite({
    items: options.items,
    active: options.active,
    orientation: 'vertical',
    loop: options.loop ?? true,
    onActiveChange: options.onActiveChange,
  })
  const flags = { 'data-state': open ? 'open' : 'closed' }
  /** Native-button attributes and visibility requests; disabled host behavior is external. */
  const trigger: PartProps<'button'> = {
    attrs: {
      ...flags,
      id: options.ids?.trigger,
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': open ? options.ids?.content : undefined,
    },
    on: {
      click() {
        options.onOpenChange?.(!open, 'first')
      },
      keydown(event) {
        if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
        if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return
        event.preventDefault()
        options.onOpenChange?.(true, event.key === 'ArrowUp' ? 'last' : 'first')
      },
    },
  }
  /** Menu semantics only; closing does not hide or unmount this bundle. */
  const content: PartProps<'div'> = {
    attrs: {
      ...flags,
      id: options.ids?.content,
      role: 'menu',
      tabindex: -1,
      'aria-labelledby': options.ids?.trigger,
    },
    on: {},
  }
  /**
   * Build menuitem ARIA/hooks and navigation handlers. No click or selection handler
   * is supplied. Focus reporting follows {@link composite}; typeahead starts from
   * this supplied value, rather than the snapshot's active item.
   */
  function item(value: T): PartProps<'div'> {
    const part = navigation.parts.item(value)
    return {
      attrs: {
        ...part.attrs,
        role: 'menuitem',
        'aria-disabled': options.disabled?.(value) ? 'true' : undefined,
        'data-disabled': options.disabled?.(value) ? '' : undefined,
        'data-highlighted': navigation.state.active === value ? '' : undefined,
      },
      on: {
        ...part.on,
        keydown(event) {
          if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
          part.on.keydown?.(event)
          if (
            event.defaultPrevented ||
            event.key.length !== 1 ||
            (event.key === ' ' && !options.search)
          )
            return
          const search = (options.search ?? '') + event.key.toLocaleLowerCase()
          options.onSearchChange?.(search)
          const repeated = [...search].every((letter) => letter === search[0])
          const query = repeated ? search[0]! : search
          const start = options.items.indexOf(value)
          for (let offset = repeated ? 1 : 0; offset <= options.items.length; offset++) {
            const candidate =
              options.items[(start + offset + options.items.length) % options.items.length]
            if (
              candidate !== undefined &&
              !options.disabled?.(candidate) &&
              options.textValue?.(candidate).trim().toLocaleLowerCase().startsWith(query)
            ) {
              options.onActiveChange?.(candidate)
              break
            }
          }
          event.preventDefault()
        },
      },
    }
  }
  return {
    /** Resolved input snapshot; event requests do not mutate these values. */
    state: {
      /** Visibility intent, defaulting to false. */
      open,
      /** Selected tab stop from the item order, independent of disabled markers. */
      active: navigation.state.active,
      /** Whether vertical arrow navigation wraps, defaulting to true. */
      loop: navigation.state.loop,
    },
    /** Bind these bundles to the corresponding rendered hosts. */
    parts: {
      /** Native button semantics and click/key visibility requests. */
      trigger,
      /** Menu role, trigger naming association, and tabindex -1, with no handlers. */
      content,
      /** Factory for menuitem semantics, focus reporting, and navigation/typeahead. */
      item,
    },
  }
}
