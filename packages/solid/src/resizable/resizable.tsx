import { booleanAttribute, setRef } from '../internal/host'
import { resizable } from '@xenon-ui/core/resizable'
import type {
  ResizableOptions,
  ResizablePanelOptions,
  ResizableResult,
} from '@xenon-ui/core/resizable'
import { startResizableDrag } from '@xenon-ui/dom/resizable'
import { isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { spread } from '../spread'
import { serverAttributes } from './server-attributes'

/** Percent-based split layout options. */
export interface ResizableProps
  extends
    Omit<JSX.IntrinsicElements['div'], never>,
    Omit<ResizableOptions, 'panels' | 'direction'> {
  /** Initial uncontrolled percentages; never emits a mount callback. */
  defaultSizes?: ResizableOptions['sizes']
  /** Receives different requested percentages; controlled sizes remain authoritative. */
  onSizesChange?: (sizes: number[]) => void
  /** Receives the final request once per changed completed gesture. */
  onSizesCommit?: (sizes: number[]) => void
  /** Panel count for SSR equal defaults; inferred from sizes, then defaults, then 2. */
  panelCount?: number
  /** Reading direction, otherwise inherited from ancestors. */
  dir?: ResizableOptions['direction']
}
/** One panel in an ordered, contiguous layout. */
export interface ResizablePanelProps
  extends
    Omit<JSX.IntrinsicElements['div'], never>,
    Omit<ResizablePanelOptions, 'id' | 'label' | 'labelledBy'> {
  /** Stable zero-based panel position, read once on mount. */
  index: number
}
/** Focusable handle between index and index + 1. */
export interface ResizableHandleProps extends Omit<JSX.IntrinsicElements['div'], never> {
  /** Stable zero-based primary panel position, read once on mount. */
  index: number
}
/** Root-owned registry and interaction coordination. */
interface Context {
  /** Stable generated ID prefix. */
  id: string
  /** Current normalized controller. */
  result(): ResizableResult
  /** Register live panel attributes; disposal removes the same registration. */
  register(index: number, read: () => ResizablePanelOptions): () => void
  /** Request an accepted change. */
  change(sizes: number[]): void
  /** Finish keyboard or pointer requests. */
  commit(): void
  /** Start an author-approved native gesture. */
  start(event: PointerEvent, index: number, handle: HTMLElement): void
  /** Cancel an active gesture when its handle leaves. */
  cancel(): void
  /** Defer computed attributes until server sibling registration finishes. */
  attributes<T extends object>(read: () => T): T
  /** Current dragged handle index. */
  dragging(): number | undefined
}
const ResizableContext = createContext<Context>()
/** Require a root for every part. */
function useResizable(): Context {
  const context = useContext(ResizableContext)
  if (!context) throw new Error('Resizable parts must be rendered inside <Resizable>')
  return context
}
/** Merge author CSS after structural layout defaults. */
function style(
  value: JSX.IntrinsicElements['div']['style'],
  defaults: JSX.CSSProperties
): JSX.CSSProperties | string {
  return typeof value === 'string'
    ? `${Object.entries(defaults)
        .map(([key, item]) => `${key}:${item}`)
        .join(';')};${value}`
    : { ...defaults, ...(typeof value === 'object' ? value : {}) }
}
/** Serialize structural and authored panel CSS with Solid's hyphenated property names. */
function cssText(value: JSX.CSSProperties | string): string {
  return typeof value === 'string'
    ? value
    : Object.entries(value)
        .filter(([, item]) => item != null)
        .map(([key, item]) => `${key}:${item}`)
        .join(';')
}
/** Own uncontrolled state, live panel metadata and pointer cancellation. */
function ResizableRoot(props: ResizableProps): JSX.Element {
  const id = createUniqueId()
  const server = isServer ? serverAttributes() : undefined
  const [internal, setInternal] = createSignal<readonly number[] | undefined>(
    untrack(() => props.defaultSizes)
  )
  const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('ltr')
  const [dragging, setDragging] = createSignal<number | undefined>(undefined, { ownedWrite: true })
  const [version, setVersion] = createSignal(0, { ownedWrite: true })
  const registry = new Map<number, () => ResizablePanelOptions>()
  let revision = 0
  let root: HTMLDivElement | undefined
  let cleanupDrag: (() => void) | undefined
  let pending: number[] | undefined
  const configuration = () => {
    if (!isServer) version()
    const count = Math.max(
      props.panelCount ?? props.sizes?.length ?? props.defaultSizes?.length ?? 2,
      ...Array.from(registry.keys(), (index) => index + 1)
    )
    return Array.from(
      { length: Math.min(1000, Math.max(2, Number.isFinite(count) ? Math.floor(count) : 2)) },
      (_, index) => registry.get(index)?.() ?? { id: `${id}-panel-${index}` }
    )
  }
  const compute = () =>
    resizable({
      panels: configuration(),
      sizes: props.sizes ?? internal(),
      orientation: props.orientation,
      direction: props.dir ?? direction(),
      disabled: booleanAttribute(props.disabled),
      step: props.step,
      largeStep: props.largeStep,
    })
  const memo = createMemo(compute)
  const result = () => (isServer ? compute() : memo())
  const change = (sizes: number[]) => {
    if (sizes.every((size, i) => size === result().state.sizes[i])) return
    pending = [...sizes]
    if (props.sizes === undefined) setInternal(sizes)
    props.onSizesChange?.([...sizes])
  }
  const commit = () => {
    const next = pending
    pending = undefined
    if (next) props.onSizesCommit?.(next)
  }
  const cancel = () => {
    cleanupDrag?.()
    cleanupDrag = undefined
    pending = undefined
    if (!isServer) setDragging(undefined)
  }
  const context: Context = {
    attributes: (read) => {
      const attrs = read()
      return server
        ? (Object.fromEntries(
            Object.keys(attrs).map((name) => [
              name,
              server.attribute(name, () => {
                const value = (read() as Record<string, unknown>)[name]
                if (name === 'style' && value && typeof value === 'object')
                  return Object.entries(value)
                    .filter(([, item]) => item != null)
                    .map(([key, item]) => `${key}:${item}`)
                    .join(';')
                return value === undefined || value === false
                  ? undefined
                  : value === true
                    ? ''
                    : String(value)
              }),
            ])
          ) as typeof attrs)
        : attrs
    },
    id,
    result,
    change,
    commit,
    cancel,
    dragging,
    register: (index, read) => {
      if (!Number.isInteger(index) || index < 0 || index >= 1000)
        throw new Error('Resizable.Panel index must be an integer from 0 to 999')
      if (registry.has(index)) throw new Error(`Duplicate Resizable.Panel index ${index}`)
      registry.set(index, read)
      if (!isServer) setVersion(++revision)
      return () => {
        registry.delete(index)
        if (!isServer) {
          cancel()
          setVersion(++revision)
        }
      }
    },
    start: (event, index, handle) => {
      if (
        !root ||
        !result().state.interactive ||
        cleanupDrag ||
        !Number.isInteger(index) ||
        index < 0 ||
        index + 1 >= result().state.sizes.length
      )
        return
      const snapshot = result()
      const baseline = snapshot.state.sizes[index]!
      const cleanup = startResizableDrag(handle, root, event, {
        orientation: snapshot.state.orientation,
        direction: snapshot.state.direction,
        onMove: (delta) => change(result().resize(index, baseline + delta)),
        onEnd: (canceled) => {
          cleanupDrag = undefined
          setDragging(undefined)
          if (canceled) pending = undefined
          else commit()
        },
      })
      if (cleanup) {
        pending = undefined
        cleanupDrag = cleanup
        setDragging(index)
      }
    },
  }
  onCleanup(cancel)
  let lastConfiguration: string | undefined
  createEffect(
    () => `${result().state.interactive}:${result().state.orientation}:${result().state.direction}`,
    (configuration) => {
      if (lastConfiguration !== undefined && configuration !== lastConfiguration) cancel()
      lastConfiguration = configuration
    }
  )
  onSettled(() => {
    if (root)
      setDirection(
        root.ownerDocument.defaultView?.getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr'
      )
  })
  const rest = omit(
    props,
    'children',
    'sizes',
    'defaultSizes',
    'onSizesChange',
    'onSizesCommit',
    'panelCount',
    'orientation',
    'disabled',
    'step',
    'largeStep',
    'style',
    'ref'
  )
  const content = createMemo(() => (
    <ResizableContext value={context}>{props.children}</ResizableContext>
  ))
  const element = (
    <div
      {...spread({ attrs: context.attributes(() => result().parts.root.attrs), on: {} }, rest)}
      data-dragging={dragging() !== undefined ? '' : undefined}
      style={style(props.style, {
        display: 'flex',
        'flex-direction': result().state.orientation === 'horizontal' ? 'row' : 'column',
      })}
      ref={(el) => {
        root = el
        setRef(() => props.ref, el)
      }}
    >
      {content()}
    </div>
  )
  // eslint-disable-next-line solid/components-return-once -- server-only finalization; environment is fixed for the owner
  return server ? server.finish(element) : element
}
/** Register constraints and size a panel with flex weights over available panel space. */
function ResizablePanel(props: ResizablePanelProps): JSX.Element {
  const context = useResizable()
  const index = untrack(() => props.index)
  const id = () => (typeof props.id === 'string' ? props.id : `${context.id}-panel-${index}`)
  onCleanup(
    untrack(() =>
      // The root reads this retained accessor inside its controller memo.
      // eslint-disable-next-line solid/reactivity
      context.register(index, () => ({
        id: id(),
        minSize: props.minSize,
        maxSize: props.maxSize,
        collapsible: props.collapsible,
        label: typeof props['aria-label'] === 'string' ? props['aria-label'] : undefined,
        labelledBy:
          typeof props['aria-labelledby'] === 'string' ? props['aria-labelledby'] : undefined,
      }))
    )
  )
  const rest = omit(props, 'children', 'index', 'minSize', 'maxSize', 'collapsible', 'style')
  const size = () => context.result().state.sizes[index] ?? 0
  const attrs = () => ({
    ...context.result().parts.panel(index).attrs,
    inert: size() === 0 ? true : undefined,
    style: cssText(
      style(props.style, {
        flex: `${size()} 1 0px`,
        'min-width': '0',
        'min-height': '0',
        overflow: 'hidden',
        '--resizable-panel-size': `${size()}%`,
      })
    ),
  })
  return (
    <div
      {...spread({ attrs: context.attributes(attrs), on: {} }, rest)}
      id={id()}
      data-resizable-panel=""
    >
      {props.children}
    </div>
  )
}
/** Render the separator; author handlers run before resizing and may cancel it. */
function ResizableHandle(props: ResizableHandleProps): JSX.Element {
  const context = useResizable()
  const index = untrack(() => props.index)
  let element: HTMLDivElement | undefined
  let restore: number | undefined
  onCleanup(() => {
    if (context.dragging() === index) context.cancel()
  })
  const rest = omit(props, 'children', 'index', 'ref', 'style')
  const part = () => ({
    attrs: context.attributes(() => context.result().parts.handle(index).attrs),
    on: {
      pointerdown: (event: PointerEvent) => {
        if (element) context.start(event, index, element)
      },
      keydown: (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !context.result().state.interactive)
          return
        const current = context.result()
        let next: number[] | undefined
        if (event.key === 'Enter') {
          if (event.repeat) return
          next = current.toggle(index, restore)
          if (next.every((size, i) => size === current.state.sizes[i])) return
          if (current.state.sizes[index]! > 0) restore = current.state.sizes[index]
        } else next = current.key(index, event.key, event.shiftKey)
        if (!next) return
        event.preventDefault()
        context.change(next)
      },
      keyup: (event: KeyboardEvent) => {
        if (event.key === 'Enter' || context.result().key(index, event.key, event.shiftKey))
          context.commit()
      },
      blur: () => context.commit(),
    },
  })
  return (
    <div
      {...spread(part(), rest)}
      data-dragging={context.dragging() === index ? '' : undefined}
      style={style(props.style, { flex: '0 0 auto', 'touch-action': 'none' })}
      ref={(el) => {
        element = el
        setRef(() => props.ref, el)
      }}
    >
      {props.children}
    </div>
  )
}
/** Headless percent split layout with adjacent handles and optional primary collapse. */
export const Resizable = Object.assign(ResizableRoot, {
  /** Ordered pane with percent constraints. */
  Panel: ResizablePanel,
  /** Focusable separator before the next pane. */
  Handle: ResizableHandle,
})
