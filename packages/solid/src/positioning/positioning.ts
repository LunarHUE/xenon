import {
  createPositioner as createDOMPositioner,
  initialPositioningState,
} from '@xenon-ui/dom/positioning'
import type {
  Positioner as DOMPositioner,
  PositioningAnchor,
  PositioningOptions,
  PositioningState,
} from '@xenon-ui/dom/positioning'
import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'

/** Geometry and observer options; element refs and enabled state come from separate source accessors. */
export type PositionerOptions = Omit<PositioningOptions, 'anchor' | 'arrow' | 'enabled'>

/** Reactive inputs read inside the positioner's owned effect. */
export interface PositionerSource {
  /** Current DOM or virtual anchor. Null/undefined suspends the DOM controller's measurements. */
  anchor: () => PositioningAnchor | null | undefined
  /** Floating host to position; replacing or removing it disposes its previous controller. */
  floating: () => HTMLElement | null | undefined
  /** Optional square arrow layout box inside the floating host. */
  arrow?: () => HTMLElement | null | undefined
  /** Whether positioning is enabled, defaulting to true. False retains the controller but resets its state and owned DOM values. */
  enabled?: () => boolean
  /** Current replacement options, with omitted members using DOM defaults. Read reactively, including for unpositioned state. */
  options?: () => PositionerOptions
}

/** Reactive placement and rendering helpers, disposed with the Solid owner. */
export interface Positioner {
  /** Latest published snapshot; read in a reactive scope and treat the returned object as immutable. */
  state: () => Readonly<PositioningState>
  /** Request a measurement; resolves immediately without a controller. Current explicit measurement failures reject the promise. */
  reposition: () => Promise<void>
  /** Visibility and hit-testing props; the DOM controller owns coordinates and CSS variables. Hidden before positioning and while a detached reference is configured to hide. */
  positionerProps: () => {
    /** Structural hook for the measured floating host. */
    'data-part': 'positioner'
    /** Only visibility and pointer events; merge without replacing controller-owned coordinates. */
    style: {
      /** Hidden until measurement, or while hideWhenDetached suppresses the reference. */
      visibility: 'hidden' | 'visible'
      /** Prevent hit testing whenever this helper hides the positioner. */
      'pointer-events': 'none' | 'auto'
    }
  }
  /** Presentational arrow props; does not render artwork or attach the arrow ref. */
  arrowProps: () => {
    /** Structural hook for the arrow layout box. */
    'data-part': 'arrow'
    /** Excludes decorative arrow content from the accessibility tree. */
    'aria-hidden': 'true'
    /** Marks the arrow box as presentational. */
    role: 'presentation'
  }
}

/** Snapshots hold only primitives, and the controller copies on every read, so compare fields. */
function sameSnapshot(a: Readonly<PositioningState>, b: Readonly<PositioningState>): boolean {
  for (const key in a)
    if (a[key as keyof PositioningState] !== b[key as keyof PositioningState]) return false
  return true
}

/**
 * Bind the DOM positioner to reactive accessors inside a Solid owner.
 *
 * @remarks
 * No DOM controller is created until a floating host exists. Replacing that host
 * disposes the old controller; changing other inputs updates it in place. Removing
 * the host, a missing anchor, or disabling resets the state to an unpositioned
 * snapshot in the same flush as that input change. Removing the host does not
 * invoke the author's onPositioned callback; a disabled or anchorless controller
 * still reports its reset through it. Accepted controller publications update the
 * state before invoking the callback. Replaced/disposed controller callbacks
 * cannot publish into this owner. Equal snapshots do not notify readers.
 *
 * Owner cleanup disposes DOM subscriptions and restores controller-owned values.
 * The caller renders the floating/arrow elements, supplies their refs, and merges
 * the returned props. This helper supplies no portal, presence, or dismissal layer.
 */
export function createPositioner(source: PositionerSource): Positioner {
  /** Latest measured snapshot and the floating host it belongs to; unmeasured publications clear it. */
  const [measured, setMeasured] = createSignal<
    { floating: HTMLElement; state: Readonly<PositioningState> } | undefined
  >(undefined, { ownedWrite: true })
  /** Every unmeasured snapshot the controller publishes is the initial state for the current options. */
  const publish = (floating: HTMLElement, next: Readonly<PositioningState>) =>
    setMeasured(next.positioned ? { floating, state: next } : undefined)
  // Derive resets from the inputs so readers see them in the same flush as the input change.
  // Measurement is read last: while it can't apply, writes to it don't rerun this memo.
  const state = createMemo(
    () => {
      const floating = source.floating()
      if (floating && source.anchor() && (source.enabled?.() ?? true)) {
        const current = measured()
        if (current?.floating === floating) return current.state
      }
      return initialPositioningState(source.options?.())
    },
    { equals: sameSnapshot }
  )
  let controller: DOMPositioner | undefined
  let floating: HTMLElement | null | undefined
  let generation = 0

  createEffect(
    () => ({
      floating: source.floating(),
      options: {
        ...source.options?.(),
        anchor: source.anchor(),
        arrow: source.arrow?.(),
        enabled: source.enabled?.() ?? true,
      },
    }),
    (value) => {
      if (floating !== value.floating) {
        generation++
        controller?.dispose()
        controller = undefined
        floating = value.floating
      }
      if (!floating) {
        setMeasured(undefined)
        return
      }
      const host = floating
      const current = generation
      const options: PositioningOptions = {
        ...value.options,
        onPositioned: (next) => {
          if (current !== generation) return
          publish(host, next)
          value.options.onPositioned?.(next)
        },
        onError: value.options.onError
          ? (error) => {
              if (current === generation) value.options.onError?.(error)
            }
          : undefined,
      }
      if (controller) controller.update(options)
      else controller = createDOMPositioner(host, options)
      publish(host, controller.getState())
    }
  )

  onCleanup(() => {
    generation++
    controller?.dispose()
    controller = undefined
  })

  return {
    state,
    reposition: () => controller?.reposition() ?? Promise.resolve(),
    positionerProps: () => {
      const current = state()
      const hidden =
        !current.positioned || (!!source.options?.().hideWhenDetached && current.referenceHidden)
      return {
        'data-part': 'positioner',
        style: {
          visibility: hidden ? 'hidden' : 'visible',
          'pointer-events': hidden ? 'none' : (source.options?.().pointerEvents ?? 'auto'),
        },
      }
    },
    arrowProps: () => ({ 'data-part': 'arrow', 'aria-hidden': 'true', role: 'presentation' }),
  }
}
