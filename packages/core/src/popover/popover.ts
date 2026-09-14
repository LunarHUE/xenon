import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

/** Caller-owned visibility, modal semantics, associations, and presence phase. */
export interface PopoverOptions {
  /** IDs to copy and reference; the core neither generates IDs nor checks rendered targets. */
  ids?: {
    /** Content ID and the trigger's `aria-controls` target while open. */
    content?: string
    /** Title ID and the content's `aria-labelledby` target. */
    title?: string
    /** Description ID and the content's `aria-describedby` target. */
    description?: string
  }
  /**
   * Visibility intent used by state hooks, expanded state, and presence.
   * @defaultValue `false`
   */
  open?: boolean
  /**
   * Add `aria-modal="true"` to content. Focus containment and outside inertness
   * must be implemented by the adapter; this option installs neither.
   * @defaultValue `false`
   */
  modal?: boolean
  /**
   * Caller-reported phase forwarded unchanged to {@link presence}, including
   * values that conflict with `open`.
   * @defaultValue `'entered'` when open, otherwise `'exited'`
   */
  status?: PresenceStatus
  /**
   * Keep content present while closed; it receives `hidden` except during exit.
   * @defaultValue `false`
   */
  forceMount?: boolean
  /**
   * Synchronous visibility request: trigger clicks invert the captured open
   * value, close clicks request false even when already closed. Construction
   * is silent. Store the requested state and recompute to update the result.
   */
  onOpenChange?: (open: boolean) => void
}
/** Visibility/presence snapshot and every part bundle, including unrendered parts. */
export interface PopoverResult {
  /** Resolved intent and caller-managed lifecycle state. */
  state: {
    /** Visibility intent, defaulting to false. */
    open: boolean
    /** Whether modal ARIA semantics are requested, defaulting to false. */
    modal: boolean
    /** True when open, exiting, or force-mounted; the adapter decides mounting. */
    present: boolean
    /** Explicit phase or the settled phase inferred from open. */
    status: PresenceStatus
  }
  /** Bind attributes and handlers to matching hosts; the core renders nothing. */
  parts: {
    /** Open/closed data hook with no role or listeners. */
    root: PartProps<'div'>
    /** Native button attributes, dialog popup semantics, and a toggle click handler. */
    trigger: PartProps<'button'>
    /** Dialog role, tabindex -1, associations, and presence hooks/inert/hidden attributes. */
    content: PartProps<'div'>
    /** Supplied title ID, with no handlers or extra role. */
    title: PartProps<'h2'>
    /** Supplied description ID, with no handlers or extra role. */
    description: PartProps<'p'>
    /** Native button attributes, default label `Close popover`, and a close click handler. */
    close: PartProps<'button'>
  }
}
/**
 * Compute dialog-style popover attributes and visibility requests.
 *
 * @remarks
 * The adapter owns native popover hosting, positioning, focus, dismissal, and
 * presence timing. Trigger and close are native button bundles with no keyboard
 * handlers. Their click handlers do not inspect `defaultPrevented`; an adapter
 * honoring author cancellation must skip the core handler when canceled.
 * Recompute after visibility, IDs, or lifecycle inputs change; handlers do not
 * mutate the returned state. Content/title/description bundles are always returned,
 * so the caller must render referenced targets and provide an accessible name.
 */
export function popover(options: PopoverOptions = {}): PopoverResult {
  const open = options.open ?? false
  const modal = options.modal ?? false
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  const flags = { 'data-state': open ? 'open' : 'closed' }
  return {
    state: { open, modal, present: life.state.present, status: life.state.status },
    parts: {
      root: { attrs: flags, on: {} },
      trigger: {
        attrs: {
          ...flags,
          type: 'button',
          'aria-haspopup': 'dialog',
          'aria-expanded': open ? 'true' : 'false',
          'aria-controls': open ? options.ids?.content : undefined,
        },
        on: { click: () => options.onOpenChange?.(!open) },
      },
      content: {
        attrs: {
          ...life.parts.root.attrs,
          id: options.ids?.content,
          role: 'dialog',
          tabindex: '-1',
          'aria-modal': modal ? 'true' : undefined,
          'aria-labelledby': options.ids?.title,
          'aria-describedby': options.ids?.description,
        },
        on: {},
      },
      title: { attrs: { id: options.ids?.title }, on: {} },
      description: { attrs: { id: options.ids?.description }, on: {} },
      close: {
        attrs: { ...flags, type: 'button', 'aria-label': 'Close popover' },
        on: { click: () => options.onOpenChange?.(false) },
      },
    },
  }
}
