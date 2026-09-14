import type { JSX } from '@solidjs/web'
import { createEffect, omit, onCleanup, onSettled, untrack } from 'solid-js'
import { createViewport } from '@tenon/dom/viewport'
import type { ViewportController } from '@tenon/dom/viewport'

/** Overlay state and a synchronous notification before trigger or payload writes. */
export interface FloatingViewportSource {
  /** Logical open state; closing immediately clears previous content. */
  open(): boolean
  /** Active anchor used to derive the activation direction. */
  trigger(): HTMLElement | undefined
  /** Popup content host receiving measured size custom properties. */
  content(): HTMLElement | undefined
  /** Subscribe before a change, returning an unsubscribe function. */
  beforeChange(listener: () => void): () => void
}

/** Native div props and the owning overlay's state. */
export interface FloatingViewportProps extends JSX.HTMLAttributes<HTMLDivElement> {
  /** Root-owned state and the pre-change snapshot notification. */
  source: FloatingViewportSource
}

/**
 * Wrap live content with data-current and retain an inert data-previous DOM clone
 * until both wrappers finish their animations. CSS owns all motion and sizing.
 *
 * @remarks
 * Set the viewport to position: relative to contain the outgoing absolute wrapper.
 * When animating width from --viewport-width, give [data-current] width: max-content
 * so its intrinsic measurement is independent of the viewport's animated width.
 * Consumer content can supply its own explicit width or wrapping constraint.
 *
 * @example
 * ```css
 * .viewport { position: relative; overflow: hidden;
 *   width: var(--viewport-width); height: var(--viewport-height);
 *   transition: width 200ms, height 200ms; }
 * .viewport > [data-current] { width: max-content; }
 * .viewport > [data-current], .viewport > [data-previous] {
 *   opacity: 1; transition: opacity 200ms; }
 * .viewport > [data-starting-style], .viewport > [data-ending-style] { opacity: 0; }
 * ```
 */
export function FloatingViewport(props: FloatingViewportProps): JSX.Element {
  const source = untrack(() => props.source)
  const rest = omit(props, 'source', 'children', 'ref')
  let viewport!: HTMLDivElement
  let current!: HTMLDivElement
  let controller: ViewportController | undefined
  let disposed = false
  let scheduled = false
  const schedule = () => {
    if (scheduled || disposed) return
    scheduled = true
    onSettled(() => {
      scheduled = false
      if (!disposed) untrack(() => controller?.sync())
    })
  }
  const unsubscribe = source.beforeChange(() => {
    untrack(() => controller?.capture())
    schedule()
  })
  onSettled(() => {
    if (disposed) return
    controller = createViewport({
      viewport,
      current,
      open: source.open,
      trigger: source.trigger,
      content: source.content,
    })
    controller.sync()
  })
  createEffect(
    () => [source.open(), source.trigger(), source.content()] as const,
    ([open]) => {
      if (!open) untrack(() => controller?.sync())
      schedule()
    }
  )
  onCleanup(() => {
    disposed = true
    unsubscribe()
    controller?.dispose()
  })
  return (
    <div
      {...rest}
      ref={(el) => {
        viewport = el
        if (typeof props.ref === 'function') props.ref(el)
      }}
    >
      <div
        data-current=""
        ref={(el) => {
          current = el
        }}
      >
        {props.children}
      </div>
    </div>
  )
}
