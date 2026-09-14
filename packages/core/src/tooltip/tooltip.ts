import { presence } from '../presence'
import type { PresenceStatus } from '../presence'
import type { PartProps } from '../part'

/** Inheritable tooltip interaction defaults. Undefined properties inherit in adapters. */
export interface TooltipBehaviorOptions {
  /** Hover opening delay in milliseconds. Defaults to 600. */
  openDelay?: number
  /** Closing delay after hover and focus both leave. Defaults to 100 milliseconds. */
  closeDelay?: number
  /** Time after a group tooltip closes during which the next hover opens instantly. Defaults to 300 milliseconds. */
  skipDelay?: number
  /** Allows pointer travel into descriptive content. Defaults to true. */
  hoverable?: boolean
  /** Dismiss on trigger press and cancel a pending hover open. Defaults to true. */
  closeOnPress?: boolean
  /** Allow the top tooltip to consume Escape and close. Defaults to true. */
  closeOnEscape?: boolean
}
/** Fully resolved defaults, with negative delays clamped to zero and nonfinite delays replaced. */
export interface TooltipBehavior {
  /** Resolved hover delay. */
  openDelay: number
  /** Resolved closing delay. */
  closeDelay: number
  /** Resolved group warm window. */
  skipDelay: number
  /** Whether pointer content holds the tooltip open. */
  hoverable: boolean
  /** Whether pressing the trigger dismisses. */
  closeOnPress: boolean
  /** Whether Escape dismisses. */
  closeOnEscape: boolean
}
/** Resolve a local partial policy over inherited defaults, preserving explicit false and zero. */
export function resolveTooltipBehavior(
  local: TooltipBehaviorOptions = {},
  parent?: TooltipBehavior
): TooltipBehavior {
  const delay = (value: number | undefined, fallback: number) =>
    value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, value)
  return {
    openDelay: delay(local.openDelay, parent?.openDelay ?? 600),
    closeDelay: delay(local.closeDelay, parent?.closeDelay ?? 100),
    skipDelay: delay(local.skipDelay, parent?.skipDelay ?? 300),
    hoverable: local.hoverable ?? parent?.hoverable ?? true,
    closeOnPress: local.closeOnPress ?? parent?.closeOnPress ?? true,
    closeOnEscape: local.closeOnEscape ?? parent?.closeOnEscape ?? true,
  }
}
/** Decide the hover delay from explicit clock/state inputs; no timers or global group state exist in core. */
export function tooltipOpenDelay(options: {
  /** Resolved local delay policy. */ behavior: TooltipBehavior
  /** Current caller-supplied monotonic time. */ now: number
  /** Time the most recent group tooltip closed. */ closedAt?: number
  /** Whether the group currently has an open tooltip. */ active: boolean
}): number {
  return options.active ||
    (options.behavior.skipDelay > 0 &&
      options.closedAt !== undefined &&
      options.now >= options.closedAt &&
      options.now - options.closedAt < options.behavior.skipDelay)
    ? 0
    : options.behavior.openDelay
}
/** Pure tooltip state and ID inputs. */
export interface TooltipOptions {
  /** Stable content ID supplied by the framework adapter or author. */
  contentId: string
  /** Logical visibility. */
  open?: boolean
  /** Prevents tooltip display independently of the trigger's disabled semantics. */
  disabled?: boolean
  /** Presence lifecycle supplied by the adapter. */
  status?: PresenceStatus
  /** Retains inaccessible content while closed. */
  forceMount?: boolean
  /** Marks focus or warmed-group opening without replacing open/closed styling. */
  instant?: boolean
}
/** Tooltip snapshot and semantic parts. */
export interface TooltipResult {
  /** Logical and physical visibility. */
  state: {
    /** Effective logical visibility. */
    open: boolean
    /** Presence status; exits may remain physically mounted. */
    present: boolean
  }
  /** Attribute bundles; triggers retain their own native role and tab order. */
  parts: {
    /** Root styling flags. */
    root: PartProps<'div'>
    /** Active trigger description association, without aria-expanded or haspopup. */
    trigger: PartProps<'button'>
    /** Nonfocusable descriptive content. */
    content: PartProps<'div'>
    /** Decorative arrow. */
    arrow: PartProps<'div'>
  }
}
/** Builds tooltip semantics without owning state, focus, clocks, or browser listeners. */
export function tooltip(options: TooltipOptions): TooltipResult {
  const open = !!options.open && !options.disabled
  const life = presence({ open, status: options.status, forceMount: options.forceMount })
  const flags = {
    'data-state': open ? 'open' : 'closed',
    'data-disabled': options.disabled ? '' : undefined,
    'data-instant': open && options.instant ? '' : undefined,
  }
  return {
    state: { open, present: life.state.present },
    parts: {
      root: { attrs: flags, on: {} },
      trigger: {
        attrs: { ...flags, 'aria-describedby': open ? options.contentId : undefined },
        on: {},
      },
      content: {
        attrs: { ...life.parts.root.attrs, ...flags, id: options.contentId, role: 'tooltip' },
        on: {},
      },
      arrow: { attrs: { 'aria-hidden': 'true' }, on: {} },
    },
  }
}
