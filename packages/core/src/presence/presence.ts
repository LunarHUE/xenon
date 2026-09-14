import type { PartProps } from '../part'

/**
 * Caller-reported phase: `entering` marks the starting style, `exiting` marks
 * the ending style and makes the root inert, and `entered`/`exited` have neither
 * style marker. The core does not advance these phases.
 */
export type PresenceStatus = 'entering' | 'entered' | 'exiting' | 'exited'

/** Independent visibility intent, lifecycle phase, and mounting policy. */
export interface PresenceOptions {
  /**
   * Requested visibility; determines `data-state` and always implies presence
   * when true, regardless of the supplied status.
   * @defaultValue `false`
   */
  open?: boolean
  /**
   * Phase used for style markers, exit presence, and inertness. An explicit
   * value is retained even when it conflicts with `open`.
   * @defaultValue `'entered'` when open, otherwise `'exited'`
   */
  status?: PresenceStatus
  /**
   * Keep the element present even when closed. A closed force-mounted root gets
   * `hidden` unless its status is `exiting`.
   * @defaultValue `false`
   */
  forceMount?: boolean
}

/** Resolved snapshot for the adapter's rendering decision. */
export interface PresenceState {
  /** Requested visibility, defaulting to false independently of status. */
  open: boolean
  /** True when open, exiting, or force-mounted; does not itself mount an element. */
  present: boolean
  /** Explicit caller phase, or the settled phase inferred from open. */
  status: PresenceStatus
}

/** Presence state and root attributes, returned even when not present. */
export interface PresenceResult {
  /** Snapshot to use when deciding whether to render the root. */
  state: PresenceState
  /** Attribute bundles to apply to rendered elements. */
  parts: {
    /**
     * Visibility and phase hooks, inert while exiting, and hidden when
     * force-mounted and closed outside exit. Supplies no role or handlers.
     */
    root: PartProps<'div'>
  }
}

/**
 * Compute presence and root attributes without scheduling lifecycle changes.
 *
 * @remarks
 * The adapter owns mounting, animation timing, and subsequent calls with new
 * state. `open` and `status` are not reconciled: open plus `exiting` produces an
 * open, present, inert root with an ending-style marker; closed plus `entering`
 * produces a starting-style marker but is absent unless force-mounted.
 * Without force mounting, `hidden` is always undefined, so the adapter must
 * honor `state.present` rather than expect the attributes to hide absent roots.
 *
 * @returns A fresh snapshot and root bundle; no DOM work or callbacks occur.
 */
export function presence(options: PresenceOptions = {}): PresenceResult {
  const open = options.open ?? false
  const forceMount = options.forceMount ?? false
  const status = options.status ?? (open ? 'entered' : 'exited')
  const present = open || status === 'exiting' || forceMount

  const state: PresenceState = { open, present, status }

  const root: PartProps<'div'> = {
    attrs: {
      'data-state': open ? 'open' : 'closed',
      'data-starting-style': status === 'entering' ? '' : undefined,
      'data-ending-style': status === 'exiting' ? '' : undefined,
      inert: status === 'exiting' ? true : undefined,
      hidden: forceMount && !open && status !== 'exiting' ? true : undefined,
    },
    on: {},
  }

  return { state, parts: { root } }
}
