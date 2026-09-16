import {
  createScrollbarInteraction,
  observeScrollArea,
  readScrollArea,
  scrollbarGeometry,
} from '@xenon/dom/scroll-area'
import type { ScrollAreaAxis, ScrollAreaMetrics, ScrollbarGeometry } from '@xenon/dom/scroll-area'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js'
import { spread } from '../spread'

/** Visibility policy for supplied custom scrollbars; native scrolling remains available. */
export type ScrollAreaType = 'auto' | 'always' | 'hover' | 'scroll'
/** Native polymorphic part attributes. */
export type ScrollAreaPartProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  /** Host element, defaulting to div. Custom hosts must forward attributes and refs. */
  as?: T
  /** Receives the rendered element. */
  ref?: (element: HTMLElement) => void
}
/** Root interaction and custom-scrollbar visibility options. */
export type ScrollAreaProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T> & {
  /** Auto shows overflowing bars; always also shows nonoverflowing bars. Defaults to auto. */
  type?: ScrollAreaType
  /** Delay after the last scroll before scroll-mode bars hide. Defaults to 600ms. */
  scrollHideDelay?: number
}
/** One registered custom track and its cross-axis dimensions. */
interface BarEntry {
  /** Track axis. */
  axis: ScrollAreaAxis
  /** Border-box dimensions. */
  size(): { width: number; height: number }
}
/** Shared native viewport state and part registration. */
interface ScrollContext {
  /** Last measured viewport snapshot. */
  metrics(): ScrollAreaMetrics
  /** Rendered native scrolling element. */
  viewport(): HTMLElement | undefined
  /** Attach or detach the viewport. */
  setViewport(element: HTMLElement | undefined): void
  /** Attach or detach its content measurement wrapper. */
  setContent(element: HTMLElement | undefined): void
  /** Generated viewport ID, overridden by the mounted viewport's author ID. */
  viewportId(): string
  /** Register a reactive viewport ID before DOM mounting. */
  registerId(read: () => string): () => void
  /** Remeasure after a custom scrollbar interaction. */
  measure(): void
  /** Whether the specified custom bar is shown. */
  visible(axis: ScrollAreaAxis): boolean
  /** A drag is active on either track. */
  dragging(): boolean
  /** Track drag bookkeeping. */
  setDragging(axis: ScrollAreaAxis, value: boolean): void
  /** Recent native scrolling for consumer animation hooks. */
  scrolling(): boolean
  /** Register an explicit custom scrollbar. */
  registerBar(entry: BarEntry): () => void
  /** Visible opposite-axis bar thickness. */
  corner(axis: ScrollAreaAxis): number
  /** Hide native bars only when every overflowing axis has a custom control. */
  hideNative(): boolean
}
const Context = createContext<ScrollContext>()
const TrackContext = createContext<{
  /** Owning track's physical axis. */
  axis(): ScrollAreaAxis
  /** Current thumb dimensions and displacement. */
  geometry(): ScrollbarGeometry
  /** Register the thumb for pointer grab-point calculations. */
  setThumb(element: HTMLElement | undefined): void
}>()
const empty: ScrollAreaMetrics = {
  width: 0,
  height: 0,
  scrollWidth: 0,
  scrollHeight: 0,
  left: 0,
  top: 0,
}

/** Require root context while retaining the missing part's name in the error. */
function context(part: string): ScrollContext {
  const value = useContext(Context)
  if (!value) throw new Error(`ScrollArea.${part} must be rendered inside ScrollArea`)
  return value
}
/** Merge structural styles before consumer styles, including string-valued style props. */
function styles(
  base: JSX.CSSProperties,
  author: JSX.CSSProperties | string | undefined | null | false
): JSX.CSSProperties | string {
  if (typeof author === 'string')
    return (
      Object.entries(base)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}:${value}`)
        .join(';') +
      ';' +
      author
    )
  return { ...base, ...author }
}
/** Root whose native viewport owns scrolling; custom tracks are optional siblings. */
function ScrollAreaRoot<T extends ValidComponent = 'div'>(props: ScrollAreaProps<T>): JSX.Element {
  const own = props as ScrollAreaProps<'div'>
  const [viewport, setViewport] = createSignal<HTMLElement>()
  const [content, setContent] = createSignal<HTMLElement>()
  const [metrics, setMetrics] = createSignal<ScrollAreaMetrics>(empty)
  const [hover, setHover] = createSignal(false)
  const [focus, setFocus] = createSignal(false)
  const [scrolling, setScrolling] = createSignal(false)
  const [draggingX, setDraggingX] = createSignal(false)
  const [draggingY, setDraggingY] = createSignal(false)
  const [bars, setBars] = createSignal<BarEntry[]>([], { ownedWrite: true })
  const [idVersion, setIdVersion] = createSignal(0, { ownedWrite: true })
  let currentBars: BarEntry[] = []
  const ids: Array<() => string> = []
  const id = `${createUniqueId()}-viewport`
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))
  const overflowing = (axis: ScrollAreaAxis) =>
    axis === 'horizontal'
      ? metrics().scrollWidth > metrics().width
      : metrics().scrollHeight > metrics().height
  const dragging = () => draggingX() || draggingY()
  const visible = (axis: ScrollAreaAxis) => {
    if (own.type === 'always') return true
    if (!overflowing(axis)) return false
    if (own.type === 'hover') return hover() || focus() || dragging()
    if (own.type === 'scroll') return scrolling() || focus() || dragging()
    return true
  }
  const value: ScrollContext = {
    viewport,
    setViewport,
    setContent,
    metrics,
    scrolling,
    dragging,
    visible,
    measure() {
      const element = viewport()
      if (element) setMetrics(readScrollArea(element))
    },
    viewportId() {
      idVersion()
      return ids.at(-1)?.() ?? id
    },
    registerId(read) {
      ids.push(read)
      if (!isServer) setIdVersion(ids.length)
      return () => {
        const index = ids.indexOf(read)
        if (index >= 0) ids.splice(index, 1)
        if (!isServer) setIdVersion(ids.length)
      }
    },
    setDragging(axis, next) {
      ;(axis === 'horizontal' ? setDraggingX : setDraggingY)(next)
    },
    registerBar(entry) {
      currentBars = [...currentBars, entry]
      setBars(currentBars)
      return () => {
        currentBars = currentBars.filter((other) => other !== entry)
        setBars(currentBars)
      }
    },
    corner(axis) {
      return (
        bars()
          .find((bar) => bar.axis === axis && visible(axis))
          ?.size()[axis === 'horizontal' ? 'height' : 'width'] ?? 0
      )
    },
    hideNative() {
      return (
        bars().length > 0 &&
        (['horizontal', 'vertical'] as const).every(
          (axis) => !overflowing(axis) || bars().some((bar) => bar.axis === axis)
        )
      )
    },
  }
  createEffect(
    () => ({ element: viewport(), child: content() }),
    ({ element, child }) => {
      if (!element) {
        setMetrics(empty)
        setScrolling(false)
        return
      }
      const observer = observeScrollArea(element, child, (next) => setMetrics(next))
      const onScroll = () => {
        setScrolling(true)
        clearTimeout(timer)
        timer = setTimeout(
          () => setScrolling(false),
          Math.max(0, Number.isFinite(own.scrollHideDelay) ? own.scrollHideDelay! : 600)
        )
      }
      element.addEventListener('scroll', onScroll, { passive: true })
      return () => {
        observer.destroy()
        element.removeEventListener('scroll', onScroll)
      }
    }
  )
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'style',
    'type',
    'scrollHideDelay'
  )
  const children = createMemo(() => <Context value={value}>{own.children}</Context>)
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread(
        {
          attrs: {
            'data-part': 'root',
            'data-overflow-x': overflowing('horizontal') ? '' : undefined,
            'data-overflow-y': overflowing('vertical') ? '' : undefined,
            'data-scrolling': scrolling() ? '' : undefined,
            'data-dragging': dragging() ? '' : undefined,
          },
          on: {
            pointerenter: (event: PointerEvent) => {
              if (event.pointerType !== 'touch') setHover(true)
            },
            pointerleave: () => setHover(false),
            focusin: () => setFocus(true),
            focusout: (event: FocusEvent) => {
              const target = event.currentTarget as HTMLElement
              if (!target.contains(event.relatedTarget as Node | null)) setFocus(false)
            },
          },
        },
        rest
      )}
      style={styles({ position: 'relative' }, own.style)}
    >
      {children()}
    </Dynamic>
  )
}

/** Native scrolling region attributes; supply an accessible name through aria-label or aria-labelledby. */
export type ScrollAreaViewportProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T>
/** Native overflow container. Its ordinary wheel, touch and keyboard scrolling stay browser-owned. */
export function ScrollAreaViewport<T extends ValidComponent = 'div'>(
  props: ScrollAreaViewportProps<T>
): JSX.Element {
  const ctx = context('Viewport')
  const own = props as ScrollAreaViewportProps<'div'>
  const generated = untrack(ctx.viewportId)
  const id = () => (typeof own.id === 'string' ? own.id : generated)
  onCleanup(ctx.registerId(id))
  onCleanup(() => {
    if (!isServer) ctx.setViewport(undefined)
  })
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'style', 'id')
  const data = () => {
    const m = ctx.metrics()
    return {
      role: 'region' as const,
      tabindex: m.scrollWidth > m.width || m.scrollHeight > m.height ? 0 : undefined,
      'data-part': 'viewport',
      'data-at-top': m.top <= 1 ? '' : undefined,
      'data-at-bottom': m.top >= m.scrollHeight - m.height - 1 ? '' : undefined,
      'data-at-left': m.left <= 1 ? '' : undefined,
      'data-at-right': m.left >= m.scrollWidth - m.width - 1 ? '' : undefined,
    }
  }
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread({ attrs: data(), on: {} }, rest)}
      id={id()}
      ref={(element: HTMLElement) => {
        ctx.setViewport(element)
        own.ref?.(element)
      }}
      style={styles(
        { overflow: 'auto', 'scrollbar-width': ctx.hideNative() ? 'none' : undefined },
        own.style
      )}
    >
      {own.children}
    </Dynamic>
  )
}

/** Content wrapper attributes. */
export type ScrollAreaContentProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T>
/** Explicit content measurement wrapper, including later child and image size changes. */
export function ScrollAreaContent<T extends ValidComponent = 'div'>(
  props: ScrollAreaContentProps<T>
): JSX.Element {
  const ctx = context('Content')
  const own = props as ScrollAreaContentProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref')
  onCleanup(() => {
    if (!isServer) ctx.setContent(undefined)
  })
  return (
    <Dynamic
      component={own.as ?? 'div'}
      data-part="content"
      {...rest}
      ref={(element: HTMLElement) => {
        ctx.setContent(element)
        own.ref?.(element)
      }}
    >
      {own.children}
    </Dynamic>
  )
}

/** Optional focusable custom track attributes. */
export type ScrollAreaScrollbarProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T> & {
  /** Physical axis; defaults to vertical. */
  orientation?: ScrollAreaAxis
  /** Smallest thumb in CSS pixels; defaults to 18. */
  minThumbSize?: number
}
/** Scrollbar widget controlling the native viewport with pointer, wheel and keyboard input. */
export function ScrollAreaScrollbar<T extends ValidComponent = 'div'>(
  props: ScrollAreaScrollbarProps<T>
): JSX.Element {
  const ctx = context('Scrollbar')
  const own = props as ScrollAreaScrollbarProps<'div'>
  const axis = () => own.orientation ?? 'vertical'
  const [track, setTrack] = createSignal<HTMLElement>()
  const [size, setSize] = createSignal({ width: 0, height: 0, innerWidth: 0, innerHeight: 0 })
  let thumb: HTMLElement | undefined
  let interaction: ReturnType<typeof createScrollbarInteraction> | undefined
  const horizontal = () => axis() === 'horizontal'
  const geometry = () => {
    size()
    const m = ctx.metrics(),
      element = track()
    return scrollbarGeometry({
      viewportSize: horizontal() ? m.width : m.height,
      contentSize: horizontal() ? m.scrollWidth : m.scrollHeight,
      trackSize: horizontal()
        ? (element?.clientWidth ?? size().width)
        : (element?.clientHeight ?? size().height),
      offset: horizontal() ? m.left : m.top,
      minThumbSize: own.minThumbSize,
    })
  }
  createEffect(
    () => ({ orientation: axis(), element: track(), viewport: ctx.viewport() }),
    ({ orientation, element, viewport }) => {
      if (!element) return
      const view = element.ownerDocument.defaultView
      let frame: number | undefined
      const measure = () => {
        frame = undefined
        const next = {
          width: element.offsetWidth,
          height: element.offsetHeight,
          innerWidth: element.clientWidth,
          innerHeight: element.clientHeight,
        }
        const previous = untrack(size)
        if (
          next.width !== previous.width ||
          next.height !== previous.height ||
          next.innerWidth !== previous.innerWidth ||
          next.innerHeight !== previous.innerHeight
        )
          setSize(next)
      }
      const schedule = () => {
        if (frame !== undefined) return
        if (view?.requestAnimationFrame) frame = view.requestAnimationFrame(measure)
        else measure()
      }
      const resize = view?.ResizeObserver ? new view.ResizeObserver(schedule) : undefined
      resize?.observe(element)
      measure()
      const unregister = ctx.registerBar({ axis: orientation, size })
      if (viewport)
        interaction = createScrollbarInteraction({
          viewport,
          track: element,
          orientation,
          thumb: () => thumb,
          thumbSize: () => geometry().size,
          onScroll: ctx.measure,
          onDraggingChange: (next) => ctx.setDragging(orientation, next),
        })
      return () => {
        interaction?.destroy()
        interaction = undefined
        resize?.disconnect()
        if (frame !== undefined) view?.cancelAnimationFrame(frame)
        unregister()
      }
    }
  )
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'style',
    'orientation',
    'minThumbSize'
  )
  const children = createMemo(() => (
    <TrackContext
      value={{
        axis,
        geometry,
        setThumb: (element) => {
          thumb = element
        },
      }}
    >
      {own.children}
    </TrackContext>
  ))
  const attrs = () => {
    const g = geometry(),
      m = ctx.metrics()
    return {
      role: 'scrollbar' as const,
      'aria-controls': ctx.viewportId(),
      'aria-orientation': horizontal() ? ('horizontal' as const) : undefined,
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': String(
        g.max ? Math.round(((horizontal() ? m.left : m.top) / g.max) * 100) : 0
      ),
      'aria-label': horizontal() ? 'Horizontal scroll' : 'Vertical scroll',
      'aria-disabled': g.overflow ? undefined : ('true' as const),
      tabindex: g.overflow ? 0 : -1,
      hidden: !ctx.visible(axis()),
      'data-part': 'scrollbar',
      'data-orientation': axis(),
      'data-state': ctx.visible(axis()) ? 'visible' : 'hidden',
      'data-scrolling': ctx.scrolling() ? '' : undefined,
      'data-dragging': ctx.dragging() ? '' : undefined,
    }
  }
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread(
        {
          attrs: attrs(),
          on: {
            pointerdown: (event: PointerEvent) => interaction?.pointerDown(event),
            keydown: (event: KeyboardEvent) => interaction?.keyDown(event),
            wheel: (event: WheelEvent) => interaction?.wheel(event),
          },
        },
        rest
      )}
      ref={(element: HTMLElement) => {
        setTrack(element)
        own.ref?.(element)
      }}
      style={styles(
        {
          position: 'absolute',
          'touch-action': 'none',
          'user-select': 'none',
          ...(horizontal()
            ? {
                'inset-inline-start': '0',
                'inset-inline-end': `${ctx.corner('vertical')}px`,
                bottom: '0',
              }
            : { top: '0', bottom: `${ctx.corner('horizontal')}px`, 'inset-inline-end': '0' }),
        },
        own.style
      )}
    >
      {children()}
    </Dynamic>
  )
}

/** Thumb presentation attributes. Dimensions and translation follow native scrolling. */
export type ScrollAreaThumbProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T>
/** Pointer grab surface inside a custom scrollbar; the owning track supplies keyboard semantics. */
export function ScrollAreaThumb<T extends ValidComponent = 'div'>(
  props: ScrollAreaThumbProps<T>
): JSX.Element {
  const ctx = useContext(TrackContext)
  if (!ctx) throw new Error('ScrollArea.Thumb must be rendered inside ScrollArea.Scrollbar')
  const own = props as ScrollAreaThumbProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'style')
  onCleanup(() => ctx.setThumb(undefined))
  const style = () => {
    const g = ctx.geometry()
    return ctx.axis() === 'horizontal'
      ? { width: `${g.size}px`, height: '100%', transform: `translateX(${g.position}px)` }
      : { height: `${g.size}px`, width: '100%', transform: `translateY(${g.position}px)` }
  }
  return (
    <Dynamic
      component={own.as ?? 'div'}
      data-part="thumb"
      aria-hidden="true"
      {...rest}
      ref={(element: HTMLElement) => {
        ctx.setThumb(element)
        own.ref?.(element)
      }}
      style={styles({ position: 'absolute', left: '0', top: '0', ...style() }, own.style)}
    >
      {own.children}
    </Dynamic>
  )
}

/** Decorative intersection of horizontal and vertical custom tracks. */
export type ScrollAreaCornerProps<T extends ValidComponent = 'div'> = ScrollAreaPartProps<T>
/** Fills the track intersection only when both custom scrollbars occupy space. */
export function ScrollAreaCorner<T extends ValidComponent = 'div'>(
  props: ScrollAreaCornerProps<T>
): JSX.Element {
  const ctx = context('Corner')
  const own = props as ScrollAreaCornerProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'style')
  return (
    <Dynamic
      component={own.as ?? 'div'}
      data-part="corner"
      aria-hidden="true"
      hidden={!ctx.corner('horizontal') || !ctx.corner('vertical')}
      {...rest}
      style={styles(
        {
          position: 'absolute',
          bottom: '0',
          'inset-inline-end': '0',
          width: `${ctx.corner('vertical')}px`,
          height: `${ctx.corner('horizontal')}px`,
        },
        own.style
      )}
    >
      {own.children}
    </Dynamic>
  )
}

/** Native scrolling root with optional custom, keyboard-operable scrollbar parts. */
export const ScrollArea = Object.assign(ScrollAreaRoot, {
  /** Named native overflow region. */
  Viewport: ScrollAreaViewport,
  /** Content size observation wrapper. */
  Content: ScrollAreaContent,
  /** Optional custom track controlling one physical axis. */
  Scrollbar: ScrollAreaScrollbar,
  /** Proportional drag surface inside a track. */
  Thumb: ScrollAreaThumb,
  /** Decorative intersection of both custom tracks. */
  Corner: ScrollAreaCorner,
})
