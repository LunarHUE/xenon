import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

/** Caller-owned visibility, modality, presence phase, and rendered-part IDs. */
export interface DialogOptions {
  /** IDs copied to parts and ARIA associations; core does not generate or validate them. */
  ids?: {
    /** Dialog content ID referenced by the trigger's aria-controls. */
    content?: string
    /** Title ID referenced by the content's aria-labelledby. */
    title?: string
    /** Description ID referenced by the content's aria-describedby. */
    description?: string
  }
  /** Requested visibility, defaulting to false; does not call native dialog methods. */
  open?: boolean
  /** Expose aria-modal and modal state, defaulting to true; actual modal behavior is adapter-owned. */
  modal?: boolean
  /** Presence phase from the caller; defaults to entered when open and exited when closed. */
  status?: PresenceStatus
  /** Keep closed content present and hidden outside its exit phase. Defaults to false. */
  forceMount?: boolean
  /**
   * Synchronously reports true on trigger clicks and false on close clicks, even
   * when open already equals that value. Does not inspect event cancellation or
   * update state, and is never called during construction.
   */
  onOpenChange?: (open: boolean) => void
}
/** Visibility snapshot and six parts, returned even while content is absent. */
export interface DialogResult {
  /** Values for the adapter's visibility and lifecycle decisions. */
  state: {
    /** Requested visibility, defaulting to false. */
    open: boolean
    /** Requested modal behavior, defaulting to true. */
    modal: boolean
    /** Whether content is open, exiting, or force-mounted. */
    present: boolean
    /** Explicit or inferred phase; independent of requested visibility when supplied. */
    status: PresenceStatus
  }
  /** Bundles to bind to the rendered dialog hosts. */
  parts: {
    /** Wrapper carrying the open/closed data-state hook. */
    root: PartProps<'div'>
    /** Native button with popup associations; each click requests opening. */
    trigger: PartProps<'button'>
    /** Dialog role, naming, modality, and presence attributes; no native open attribute or listeners. */
    content: PartProps<'dialog'>
    /** Heading ID for the dialog name; referenced whenever its ID is supplied. */
    title: PartProps<'h2'>
    /** Paragraph ID for the dialog description; referenced whenever its ID is supplied. */
    description: PartProps<'p'>
    /** Native button with the open/closed hook; each click requests closing. */
    close: PartProps<'button'>
  }
}
/**
 * Builds dialog attributes and open/close requests without performing DOM work.
 *
 * @remarks
 * The adapter owns native show/showModal/close calls, focus handling, outside and
 * Escape dismissal, scroll locking, mounting, and animation completion. Rebuild
 * with new options after state changes. Presence attributes follow {@link presence};
 * no lifecycle phase is advanced here. Supplied text IDs are referenced without
 * checking whether their elements are rendered. Trigger and close handlers neither
 * prevent the click default nor stop propagation.
 */
export function dialog(options: DialogOptions = {}): DialogResult {
  const open = options.open ?? false
  const modal = options.modal ?? true
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
          'aria-controls': options.ids?.content,
        },
        on: { click: () => options.onOpenChange?.(true) },
      },
      content: {
        attrs: {
          ...life.parts.root.attrs,
          id: options.ids?.content,
          role: 'dialog',
          'aria-modal': modal ? 'true' : undefined,
          'aria-labelledby': options.ids?.title,
          'aria-describedby': options.ids?.description,
        },
        on: {},
      },
      title: { attrs: { id: options.ids?.title }, on: {} },
      description: { attrs: { id: options.ids?.description }, on: {} },
      close: {
        attrs: { ...flags, type: 'button' },
        on: { click: () => options.onOpenChange?.(false) },
      },
    },
  }
}
