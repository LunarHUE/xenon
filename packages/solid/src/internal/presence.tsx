import { presence } from '@xenon-ui/core'
import type { PartProps, PresenceStatus } from '@xenon-ui/core'
import { waitForExit } from '@xenon-ui/dom'
import { createEffect, createMemo, createSignal } from 'solid-js'

/** Reactive visibility intent and optional mounting policy, read by owned memos. */
export interface PresenceSource {
  /** Desired open state; changes restart the lifecycle phase without this helper writing it. */
  open: () => boolean
  /** Keep closed content present and hidden after exit. Omission defaults to false. */
  forceMount?: () => boolean
}

/** Reactive lifecycle accessors and the element used for exit-animation observation. */
export interface Presence {
  /** True while open, exiting, or force-mounted; use this accessor to decide mounting. */
  present: () => boolean
  /** Initially settled; later open changes produce entering/exiting until their work finishes. */
  status: () => PresenceStatus
  /** Core presence attributes, including phase hooks, exit inertness, and force-mounted hiding. */
  part: () => PartProps<'div'>
  /**
   * Record the latest element before its exit effect runs. This is a nonreactive
   * assignment: replacing the ref does not restart an existing animation wait,
   * and there is no detach callback or automatic clearing of the stored element.
   */
  ref: (el: HTMLElement) => void
}

/**
 * Track presence phases inside a Solid owner without rendering or animating content.
 *
 * @remarks
 * The initial snapshot is entered when open and exited when closed; it has no
 * initial entry phase. A later opening is entering for one global animation frame,
 * then entered, regardless of entry-animation duration. Closing waits through
 * {@link waitForExit} on the stored element. That helper starts its animation query
 * on the next frame, but completes synchronously when getAnimations is unavailable.
 * With no stored element, closing finishes on the next frame instead.
 *
 * Effect cleanup cancels pending frame/wait callbacks when the phase changes or
 * the owner is disposed. Reopening mid-exit starts a new entering phase; the old
 * wait cannot settle it. This cancellation does not cancel CSS/WAAPI animations.
 * The caller owns rendering from present(), ref attachment, and styles that use
 * the returned attributes. Force-mount changes affect presence/hiding without
 * restarting the phase.
 *
 * @returns Accessors to read in reactive scopes and a ref recorder; no explicit dispose is needed.
 */
export function createPresence(source: PresenceSource): Presence {
  let el: HTMLElement | undefined
  let mounted = false

  const open = createMemo(() => source.open())

  /** Start settled only once; each observed open change resets completion for its new phase. */
  const [finished, setFinished] = createSignal(() => {
    open()
    const first = !mounted
    mounted = true
    return first
  })

  const status = createMemo<PresenceStatus>(() => {
    if (open()) return finished() ? 'entered' : 'entering'
    return finished() ? 'exited' : 'exiting'
  })

  const result = createMemo(() =>
    presence({ open: open(), status: status(), forceMount: source.forceMount?.() })
  )

  createEffect(
    () => (finished() ? undefined : open()),
    (phase) => {
      if (phase === undefined) return
      const done = () => setFinished(true)
      if (phase || !el) {
        const frame = requestAnimationFrame(done)
        return () => cancelAnimationFrame(frame)
      }
      return waitForExit(el, done)
    }
  )

  return {
    present: () => result().state.present,
    status,
    part: () => result().parts.root,
    ref: (node: HTMLElement) => {
      el = node
    },
  }
}

/**
 * Write disclosure-size CSS properties for the caller's current lifecycle phase.
 *
 * @param el - Element whose inline styles are mutated and whose scroll dimensions are read.
 * @param name - Property prefix used verbatim in --name-height and --name-width.
 * @param status - Entering/exiting writes current scrollHeight/scrollWidth in CSS
 * pixels; entered writes auto without measurement; exited removes both properties.
 * @remarks
 * Runs synchronously with no observers or ownership cleanup. Prior inline values
 * and priorities are not preserved. The caller schedules measurements and invokes
 * this again when phase or layout changes require different values.
 */
export function measure(el: HTMLElement, name: string, status: PresenceStatus): void {
  if (status === 'exited') {
    el.style.removeProperty(`--${name}-height`)
    el.style.removeProperty(`--${name}-width`)
    return
  }
  const settled = status === 'entered'
  el.style.setProperty(`--${name}-height`, settled ? 'auto' : `${el.scrollHeight}px`)
  el.style.setProperty(`--${name}-width`, settled ? 'auto' : `${el.scrollWidth}px`)
}
