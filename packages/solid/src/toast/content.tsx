import { toast } from '@tenon/core/toast'
import { createToastSwipe } from '@tenon/dom/toast'
import type { ToastSwipeDirection } from '@tenon/dom/toast'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
} from 'solid-js'
import { createPresence } from '../internal/presence'
import { serverAssociations } from '../field/server-associations'
import { spread } from '../spread'
import { ToastContentContext, useToastViewport } from './context'
import type { ToastContentContext as ContentContext, ToastLayout } from './context'
import type { ToastRecord, ToastDismissReason } from './manager'

/** Per-notification gesture and dismissal policy. */
interface Own<T> {
  /** Stable reactive record from Toast.useManager().toasts(). */
  toast: ToastRecord<T>
  /** Allowed dismissal directions, defaulting to right. Empty disables swiping. */
  swipeDirection?: readonly ToastSwipeDirection[]
  /** Minimum drag distance in CSS pixels, defaulting to 40. */
  swipeThreshold?: number
  /** Minimum release speed in pixels per millisecond, defaulting to 0.5; Infinity disables velocity dismissal. */
  swipeVelocityThreshold?: number
  /** Synchronous Escape hook; preventDefault cancels dismissal of this focused toast. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Receives the individual notification host. */
  ref?: (element: HTMLElement) => void
}
/** Individual toast root props. Title, Description, Action and Close inherit this record. */
export type ToastContentProps<T extends ValidComponent = 'div', Data = unknown> = Omit<
  ComponentProps<T>,
  keyof Own<Data> | 'as'
> &
  Own<Data> & {
    /** Rendered host, defaulting to div; custom components must forward attributes and ref. */
    as?: T
  }
/**
 * Renders one interactive group and retains its DOM through exit animations.
 * Limited records stay hidden and inert; announcements begin only after admission.
 * data-paused marks open records held by interaction, admission, or attachment policy.
 * The internal data-toast-content wrapper measures natural size independently of
 * the root's CSS height. The root publishes index, height, preceding offset and
 * first-toast height variables for consumer-owned stack styling.
 *
 * Swipe offsets survive dismissal so CSS exits start where the pointer released.
 * Reopening the same stable record cancels removal and resets its swipe state.
 * Escape only dismisses the toast containing focus and does not reach ancestor
 * dialogs after an accepted dismissal. Arrival never moves focus.
 */
export function ToastContent<T extends ValidComponent = 'div', Data = unknown>(
  props: ToastContentProps<T, Data>
): JSX.Element {
  const own = props as unknown as ToastContentProps<'div', Data>
  const viewport = useToastViewport('Content')
  const record = () => own.toast as ToastRecord<unknown>
  const base = createUniqueId()
  const [version, setVersion] = createSignal(0, { ownedWrite: true })
  const labels: Record<'title' | 'description', Array<() => string | undefined>> = {
    title: [],
    description: [],
  }
  const associations = isServer ? serverAssociations() : undefined
  let element!: HTMLElement
  let natural!: HTMLDivElement
  let swipe: ReturnType<typeof createToastSwipe> | undefined
  let resize: ResizeObserver | undefined
  let unregister: (() => void) | undefined
  let disposed = false
  let wasOpen = untrack(() => record().open)
  const presence = createPresence({ open: () => record().open })
  const label = (part: 'title' | 'description') => {
    version()
    return (
      labels[part]
        .map((read) => read())
        .filter(Boolean)
        .join(' ') || undefined
    )
  }
  const dismiss = (reason: ToastDismissReason = 'close') => {
    viewport.closing(record().id)
    viewport.manager.dismiss(record().id, reason)
  }
  const build = () =>
    toast({
      id: record().id,
      open: record().open,
      limited: record().limited,
      type: record().type,
      priority: record().priority,
      titleId: label('title'),
      descriptionId: label('description'),
      onDismiss: dismiss,
    })
  const memo = createMemo(build)
  const result = () => (isServer ? build() : memo())
  const context: ContentContext = {
    record,
    result,
    dismiss,
    id: (part) => `${base}-${part}`,
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
    register(part, read) {
      labels[part].push(read)
      if (!isServer) setVersion((value) => value + 1)
      return () => {
        labels[part] = labels[part].filter((other) => other !== read)
        if (!isServer) setVersion((value) => value + 1)
      }
    },
  }
  const measure = () => {
    if (!element?.isConnected || !natural || record().limited) return
    const style = element.ownerDocument.defaultView?.getComputedStyle(element)
    const pixels = (value?: string) => Number.parseFloat(value ?? '') || 0
    const height =
      natural.offsetHeight +
      pixels(style?.paddingTop) +
      pixels(style?.paddingBottom) +
      pixels(style?.borderTopWidth) +
      pixels(style?.borderBottomWidth)
    viewport.measure(record().id, height)
  }
  const swipeOptions = () => ({
    directions: own.swipeDirection,
    threshold: own.swipeThreshold,
    velocityThreshold: own.swipeVelocityThreshold,
    onDismiss: () => untrack(() => dismiss('swipe')),
    onSwipingChange: (active: boolean) => untrack(() => viewport.swiping(record().id, active)),
  })
  onSettled(() =>
    untrack(() => {
      if (disposed) return
      unregister = viewport.register(record().id, element)
      swipe = createToastSwipe(element, swipeOptions())
      const Observer = element.ownerDocument.defaultView?.ResizeObserver
      if (Observer) {
        resize = new Observer(() => untrack(measure))
        resize.observe(natural)
        resize.observe(element)
      }
      measure()
    })
  )
  createEffect(swipeOptions, (options) => swipe?.update(options))
  createEffect(
    () => ({ open: record().open, limited: record().limited, status: presence.status() }),
    (state) =>
      untrack(() => {
        if (!state.open && wasOpen) viewport.closing(record().id)
        if (state.open && !wasOpen) swipe?.reset()
        wasOpen = state.open
        if (!state.open && (state.status === 'exited' || state.limited)) {
          queueMicrotask(() => {
            if (!disposed && !record().open) viewport.manager.remove(record().id)
          })
        }
      })
  )
  createEffect(
    () => ({ open: record().open, limited: record().limited, revision: record().revision }),
    (state) => {
      if (!state.open || state.limited) return
      onSettled(() =>
        untrack(() => {
          if (disposed || !element) return
          measure()
          const readText = (part: 'title' | 'description') => {
            const ids = label(part)?.split(' ') ?? []
            const rendered = ids
              .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? '')
              .join(' ')
              .trim()
            const fallback = record()[part]
            return (
              rendered ||
              (typeof fallback === 'string' || typeof fallback === 'number' ? String(fallback) : '')
            )
          }
          viewport.announce(
            record(),
            [readText('title'), readText('description')].filter(Boolean).join(' ')
          )
        })
      )
    }
  )
  onCleanup(() => {
    disposed = true
    swipe?.dispose()
    resize?.disconnect()
    unregister?.()
  })
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.isComposing || !record().open || record().limited) return
    own.onEscapeKeyDown?.(event)
    if (event.defaultPrevented) return
    event.preventDefault()
    event.stopPropagation()
    dismiss('escape')
  }
  let previousLayout: ToastLayout = { index: 0, height: 0, offset: 0, frontHeight: 0 }
  const retainedLayout = createMemo(() => {
    if (record().open) previousLayout = viewport.layout(record().id)
    return previousLayout
  })
  let previousExpanded = false
  const retainedExpanded = createMemo(() => {
    if (record().open) previousExpanded = viewport.expanded()
    return previousExpanded
  })
  const style = () => {
    const layout = retainedLayout()
    const variables = {
      '--toast-index': layout.index,
      '--toast-height': `${layout.height}px`,
      '--toast-offset-y': `${layout.offset}px`,
      '--toast-front-height': `${layout.frontHeight}px`,
    }
    if (typeof own.style === 'string')
      return `${own.style};${Object.entries(variables)
        .map(([key, value]) => `${key}:${value}`)
        .join(';')}`
    return { ...own.style, ...variables } as JSX.CSSProperties
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'toast',
    'swipeDirection',
    'swipeThreshold',
    'swipeVelocityThreshold',
    'onEscapeKeyDown',
    'style'
  )
  const children = createMemo(() => (
    <ToastContentContext value={context}>{own.children}</ToastContentContext>
  ))
  const elementOutput = (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(host: HTMLElement) => {
        element = host
        presence.ref(host)
        own.ref?.(host)
      }}
      {...spread(
        {
          attrs: {
            ...presence.part().attrs,
            ...result().parts.root.attrs,
            'aria-labelledby': context.association(
              'aria-labelledby',
              () => result().parts.root.attrs['aria-labelledby']
            ),
            'aria-describedby': context.association(
              'aria-describedby',
              () => result().parts.root.attrs['aria-describedby']
            ),
          },
          on: { keydown },
        },
        rest
      )}
      data-toast-content-root=""
      data-index={retainedLayout().index}
      data-expanded={retainedExpanded() ? '' : undefined}
      data-paused={record().open && record().paused ? '' : undefined}
      style={style()}
    >
      <div
        data-toast-content=""
        ref={(host) => {
          natural = host
        }}
        style={{ display: 'flow-root' }}
      >
        {children()}
      </div>
    </Dynamic>
  )
  // eslint-disable-next-line solid/components-return-once -- Server associations finalize one synchronous render.
  return associations ? associations.finish(elementOutput) : elementOutput
}
