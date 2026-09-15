import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

/** Caller-owned IDs; the core neither generates them nor checks uniqueness. */
export interface CollapsibleIds {
  /** Trigger element ID. Content does not automatically reference it as a label. */
  trigger?: string
  /** Content element ID, also used by trigger aria-controls even while closed. */
  content?: string
}

/** Controlled disclosure state and content-presence inputs. */
export interface CollapsibleOptions {
  /** Optional trigger/content associations. Missing IDs produce no corresponding attributes. */
  ids?: CollapsibleIds
  /**
   * Current expanded state; caller updates it after a change request.
   * @defaultValue false
   */
  open?: boolean
  /** Presence phase, retained independently of open. Defaults to entered when open and exited when closed. */
  status?: PresenceStatus
  /**
   * Keep closed content present, with hidden set unless exiting.
   * @defaultValue false
   */
  forceMount?: boolean
  /**
   * Disable the native trigger and block click requests without changing open state.
   * @defaultValue false
   */
  disabled?: boolean
  /** Synchronously proposes the opposite of open on an enabled click. Never called during construction; does not update the snapshot. */
  onOpenChange?: (open: boolean) => void
}

/** Resolved disclosure and presence snapshot. */
export interface CollapsibleState {
  /** Current expanded state, independent of the presence phase. */
  open: boolean
  /** Whether content is open, exiting, or force-mounted; the adapter decides whether to render it. */
  present: boolean
  /** Supplied phase or the settled phase inferred from open. */
  status: PresenceStatus
  /** Whether trigger activation is blocked. */
  disabled: boolean
}

/** Disclosure snapshot and host bundles to rebuild after option changes. */
export interface CollapsibleResult {
  /** Resolved values used by attributes and the trigger listener. */
  state: CollapsibleState
  /** Parts to bind to the rendered disclosure. */
  parts: {
    /** Open/disabled data hooks without a role or handlers. */
    root: PartProps<'div'>
    /** Native button with expanded/controls associations and click change requests. */
    trigger: PartProps<'button'>
    /** Presence attributes and content ID, without a role, accessible label, or handlers. */
    content: PartProps<'div'>
  }
}

/**
 * Builds a disclosure without binding DOM handlers or scheduling presence changes.
 *
 * @remarks
 * The adapter owns mounting and animation phases according to {@link presence}.
 * Without force mounting, absent content is not hidden by its attributes alone.
 * Disabled clicks cancel the default without stopping propagation. Clicks whose
 * default was already prevented do not request an open-state change.
 */
export function collapsible(options: CollapsibleOptions = {}): CollapsibleResult {
  const open = options.open ?? false
  const disabled = options.disabled ?? false
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  const flags = {
    'data-state': open ? 'open' : 'closed',
    'data-disabled': disabled ? '' : undefined,
  }

  const state: CollapsibleState = {
    open,
    present: life.state.present,
    status: life.state.status,
    disabled,
  }

  const trigger: PartProps<'button'> = {
    attrs: {
      ...flags,
      id: options.ids?.trigger,
      type: 'button',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': options.ids?.content,
      disabled: disabled || undefined,
    },
    on: {
      click(event) {
        if (disabled) {
          event.preventDefault()
          return
        }
        if (event.defaultPrevented) return
        options.onOpenChange?.(!open)
      },
    },
  }

  const content: PartProps<'div'> = {
    attrs: {
      ...life.parts.root.attrs,
      'data-disabled': flags['data-disabled'],
      id: options.ids?.content,
    },
    on: {},
  }

  return { state, parts: { root: { attrs: { ...flags }, on: {} }, trigger, content } }
}
