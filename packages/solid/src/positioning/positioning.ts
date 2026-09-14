import {
  createPositioner as createDOMPositioner,
  initialPositioningState,
} from '@tenon/dom/positioning'
import type {
  Positioner as DOMPositioner,
  PositioningAnchor,
  PositioningOptions,
  PositioningState,
} from '@tenon/dom/positioning'
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'

export type PositionerOptions = Omit<PositioningOptions, 'anchor' | 'arrow' | 'enabled'>

export interface PositionerSource {
  anchor: () => PositioningAnchor | null | undefined
  floating: () => HTMLElement | null | undefined
  arrow?: () => HTMLElement | null | undefined
  enabled?: () => boolean
  options?: () => PositionerOptions
}

export interface Positioner {
  state: () => Readonly<PositioningState>
  reposition: () => Promise<void>
  /** Initial visibility only; the DOM controller owns coordinates and CSS variables. */
  positionerProps: () => {
    'data-part': 'positioner'
    style: { visibility: 'hidden' | 'visible'; 'pointer-events': 'none' | 'auto' }
  }
  arrowProps: () => { 'data-part': 'arrow'; 'aria-hidden': 'true'; role: 'presentation' }
}

/** Bind positioning to reactive element accessors. Call inside a Solid owner. */
export function createPositioner(source: PositionerSource): Positioner {
  const [state, setState] = createSignal<Readonly<PositioningState>>(
    untrack(() => initialPositioningState(source.options?.())),
    { ownedWrite: true }
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
        setState(initialPositioningState(value.options))
        return
      }
      const current = generation
      const options: PositioningOptions = {
        ...value.options,
        onPositioned: (next) => {
          if (current !== generation) return
          setState(next)
          value.options.onPositioned?.(next)
        },
        onError: value.options.onError
          ? (error) => {
              if (current === generation) value.options.onError?.(error)
            }
          : undefined,
      }
      if (controller) controller.update(options)
      else controller = createDOMPositioner(floating, options)
      setState(controller.getState())
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
          'pointer-events': hidden ? 'none' : 'auto',
        },
      }
    },
    arrowProps: () => ({ 'data-part': 'arrow', 'aria-hidden': 'true', role: 'presentation' }),
  }
}
