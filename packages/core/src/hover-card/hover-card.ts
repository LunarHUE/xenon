import type { PartProps } from '../part'
import { presence } from '../presence/presence'
import type { PresenceStatus } from '../presence/presence'

/** Snapshot inputs for a nonmodal link preview. Timing and focus belong to the adapter. */
export interface HoverCardOptions {
  /** Logical visibility; defaults to false. */
  open?: boolean
  /** Whether this trigger owns the visible preview; defaults to true. */
  current?: boolean
  /** Explicit lifecycle phase; otherwise inferred from visibility. */
  status?: PresenceStatus
  /** Retain hidden content after exit; defaults to false. */
  forceMount?: boolean
  /** Author-owned trigger and content identifiers. */
  ids?: {
    /** ID copied onto the trigger. */
    trigger?: string
    /** Content ID referenced by the active, open trigger. */
    content?: string
  }
}
/** Nonmodal preview state and host attributes. No event mutates this snapshot. */
export interface HoverCardResult {
  /** Visibility and presence resolved from the supplied inputs. */
  state: {
    /** Logical visibility. */
    open: boolean
    /** Whether this trigger owns the preview. */
    current: boolean
    /** Whether content should remain mounted. */
    present: boolean
    /** Current enter/exit phase. */
    status: PresenceStatus
  }
  /** Attribute bundles; links retain native navigation without click handlers. */
  parts: {
    /** Optional root state hook. */
    root: PartProps<'div'>
    /** Native link host with active-only expansion and controls. */
    trigger: PartProps<'a'>
    /** Nonmodal dialog and lifecycle attributes; authors supply its accessible name. */
    content: PartProps<'div'>
  }
}
/** Compute a headless hover-card snapshot without timers, DOM access, or navigation interception. */
export function hoverCard(options: HoverCardOptions = {}): HoverCardResult {
  const open = options.open ?? false
  const current = options.current ?? true
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  return {
    state: { open, current, present: life.state.present, status: life.state.status },
    parts: {
      root: { attrs: { 'data-state': open ? 'open' : 'closed' }, on: {} },
      trigger: {
        attrs: {
          id: options.ids?.trigger,
          'data-state': open && current ? 'open' : 'closed',
          'data-current': open && current ? '' : undefined,
          'aria-haspopup': 'dialog',
          'aria-expanded': open && current ? 'true' : 'false',
          'aria-controls': open && current ? options.ids?.content : undefined,
        },
        on: {},
      },
      content: {
        attrs: {
          ...life.parts.root.attrs,
          id: options.ids?.content,
          role: 'dialog',
          tabindex: '-1',
        },
        on: {},
      },
    },
  }
}
