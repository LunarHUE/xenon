import type { PartProps } from '../part'

/** Visual notification variant; loading notifications never expire automatically. */
export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading'
/** Announcement urgency, independently of the visual variant. */
export type ToastPriority = 'low' | 'high'
/** Resolve a lifetime; zero and Infinity mean persistent. */
export function toastDuration(value: number | undefined, fallback = 5000): number {
  return value === Infinity
    ? Infinity
    : value === undefined || !Number.isFinite(value)
      ? fallback
      : Math.max(0, value)
}
/** Resolve the number of notifications admitted at once. */
export function toastLimit(value: number | undefined, fallback = 3): number {
  return value === Infinity
    ? Infinity
    : value === undefined || !Number.isFinite(value)
      ? fallback
      : Math.max(0, Math.floor(value))
}
/** Return the newest admitted IDs. Older records wait until a slot becomes available. */
export function visibleToastIds<T extends { id: string; open?: boolean }>(
  records: readonly T[],
  limit: number
): ReadonlySet<string> {
  if (toastLimit(limit) === 0) return new Set()
  return new Set(
    records
      .filter((record) => record.open !== false)
      .slice(-toastLimit(limit))
      .map((record) => record.id)
  )
}
/** Pure notification semantics supplied by a framework adapter. */
export interface ToastOptions {
  /** Stable notification ID. */
  id: string
  /** Whether dismissal has started. Defaults to true. */
  open?: boolean
  /** Whether the notification is waiting for a visible slot. */
  limited?: boolean
  /** Visual variant. */
  type?: ToastType
  /** Announcement urgency. */
  priority?: ToastPriority
  /** Rendered title ID, omitted when there is no title. */
  titleId?: string
  /** Rendered description ID, omitted when there is no description. */
  descriptionId?: string
  /** Dismiss the notification. */
  onDismiss?: () => void
}
/** Semantic attributes and actions for notification parts. */
export interface ToastResult {
  /** Resolved lifecycle state. */
  state: {
    /** Logical visibility. */
    open: boolean
    /** Waiting for an available slot. */
    limited: boolean
  }
  /** Attributes and native listeners for each anatomy part. */
  parts: {
    /** Notification container, separate from the live announcer. */
    root: PartProps<'div'>
    /** Notification title. */
    title: PartProps<'div'>
    /** Notification description. */
    description: PartProps<'div'>
    /** Optional author action. */
    action: PartProps<'button'>
    /** Explicit dismissal control. */
    close: PartProps<'button'>
  }
}
/** Derive toast semantics without creating IDs, timers, framework state, or announcements. */
export function toast(options: ToastOptions): ToastResult {
  const open = options.open ?? true
  const limited = options.limited ?? false
  return {
    state: { open, limited },
    parts: {
      root: {
        attrs: {
          id: options.id,
          role: 'group',
          tabindex: 0,
          'aria-labelledby': options.titleId,
          'aria-describedby': options.descriptionId,
          'data-state': open ? 'open' : 'closed',
          'data-type': options.type ?? 'default',
          'data-priority': options.priority ?? 'low',
          'data-limited': limited ? '' : undefined,
          inert: !open || limited ? true : undefined,
          hidden: limited ? true : undefined,
        },
        on: {},
      },
      title: { attrs: { id: options.titleId }, on: {} },
      description: { attrs: { id: options.descriptionId }, on: {} },
      action: { attrs: { type: 'button' }, on: {} },
      close: {
        attrs: { type: 'button', 'aria-label': 'Dismiss notification' },
        on: { click: () => options.onDismiss?.() },
      },
    },
  }
}
