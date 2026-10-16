import { virtualizer } from '@xenon-ui/core/virtualizer'
import type {
  VirtualAlign,
  VirtualItem,
  VirtualKey,
  VirtualRange,
  VirtualizerOptions,
} from '@xenon-ui/core/virtualizer'
import { createVirtualizerController } from '@xenon-ui/dom/virtualizer'
import type { VirtualizerController, VirtualizerControllerOptions } from '@xenon-ui/dom/virtualizer'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  For,
  createContext,
  createEffect,
  createMemo,
  createProjection,
  createSignal,
  omit,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js'
import { setRef } from '../internal/host'
import { spread } from '../spread'

/** Layout, scroll element and follow options. Read reactively, so pass props or getters. */
export interface CreateVirtualizerOptions extends VirtualizerOptions {
  /** Element that scrolls. Rows render from offset 0 until it is set. */
  scrollElement?: HTMLElement | undefined
  /** Keep the list pinned to its end while the user stays there, as in a log viewer. */
  follow?: boolean
  /** Distance from the end that still counts as the end; defaults to 1. */
  followThreshold?: number
  /** Reports when following stops (user scrolled up) or resumes (user reached the end). */
  onFollowChange?: (following: boolean) => void
}

/** Row sizing options for components that virtualize their list through a `virtual` prop. */
export type VirtualOptions = Pick<
  CreateVirtualizerOptions,
  'size' | 'estimateSize' | 'overscan' | 'paddingStart' | 'paddingEnd' | 'gap'
>

/** Reactive virtual list state and scroll commands. */
export interface VirtualizerHandle {
  /** Rows to render, reconciled by key: scrolling keeps surviving rows and only updates changed fields. */
  readonly items: readonly VirtualItem[]
  /** Current item count. */
  count(): number
  /** Content size for the sizer element. */
  totalSize(): number
  /** Rendered and visible index bounds. */
  range(): VirtualRange
  /** Current scroll offset. */
  offset(): number
  /** Inner height of the scroll element. */
  viewportSize(): number
  /** Whether follow mode currently keeps the list at its end. */
  following(): boolean
  /** Whether a row is in items. Gate aria-activedescendant on this. */
  isRendered(index: number): boolean
  /** Scroll an item into view. Its row renders in the next flush, before the scroll event. */
  scrollToIndex(index: number, options?: { align?: VirtualAlign }): void
  /** Scroll to an offset. */
  scrollToOffset(offset: number): void
  /** Scroll to the end; with follow enabled, following resumes. */
  scrollToEnd(): void
  /** Ref callback that measures a row carrying data-index. No-op with a fixed size. */
  measureElement(element: Element): void
  /** Stop measuring a row before it is removed. */
  unmeasureElement(element: Element): void
}

const whole = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0)
/** Key lookup over a snapshot of every key. */
const lookup = (keys: readonly VirtualKey[]) => (index: number) => keys[index] ?? index

/**
 * Virtualizes a vertical list inside a scroll element the caller owns.
 *
 * @remarks
 * With getKey and estimated sizes, keys are collected for every index whenever
 * the count or getKey's dependencies change, so measurements follow reordered
 * items. Call scrollToIndex after the count change it depends on has flushed.
 */
export function createVirtualizer(options: CreateVirtualizerOptions): VirtualizerHandle {
  const layout = virtualizer({ count: 0 })
  const [offset, setOffset] = createSignal(0, { ownedWrite: true })
  const [viewportSize, setViewportSize] = createSignal(0, { ownedWrite: true })
  const [version, setVersion] = createSignal(0, { ownedWrite: true })
  const [following, setFollowing] = createSignal(false, { ownedWrite: true })
  let controller: VirtualizerController | undefined
  let pending: Element[] = []

  const keys = createMemo(() => {
    const getKey = options.getKey
    if (!getKey || options.size !== undefined) return undefined
    return Array.from({ length: whole(options.count) }, (_, index) => getKey(index))
  })
  const config = createMemo((): VirtualizerOptions => {
    const list = keys()
    return {
      count: options.count,
      size: options.size,
      estimateSize: options.estimateSize,
      getKey: list ? lookup(list) : options.getKey,
      overscan: options.overscan,
      paddingStart: options.paddingStart,
      paddingEnd: options.paddingEnd,
      gap: options.gap,
      sticky: options.sticky,
    }
  })
  let applied: VirtualizerOptions | undefined
  /** Bring the shared layout up to date and subscribe to option and measurement changes. */
  const current = () => {
    const next = config()
    version()
    if (next !== applied) layout.setOptions((applied = next))
  }
  const list = createMemo(() => {
    current()
    return layout.items(offset(), viewportSize())
  })
  const items = createProjection<VirtualItem[]>(() => list().map((item) => ({ ...item })), [], {
    key: 'key',
  })
  const rendered = createMemo(() => new Set(list().map((item) => item.index)))
  const count = createMemo(() => {
    current()
    return layout.count()
  })
  const totalSize = createMemo(() => {
    current()
    return layout.totalSize()
  })
  const range = createMemo(() => {
    current()
    return layout.range(offset(), viewportSize())
  })

  const pull = () => {
    if (!controller) return
    setOffset(controller.offset())
    setViewportSize(controller.viewportSize())
    setFollowing(controller.following())
    setVersion((value) => value + 1)
  }
  const report = (next: boolean) => {
    setFollowing(next)
    untrack(() => options.onFollowChange)?.(next)
  }
  const follow = createMemo((): VirtualizerControllerOptions => ({
    layout,
    follow: !!options.follow,
    followThreshold: options.followThreshold,
    onFollowChange: report,
  }))
  createEffect(
    () => options.scrollElement,
    (element) => {
      if (!element) return
      untrack(current)
      const created = createVirtualizerController(element, untrack(follow))
      controller = created
      pending.forEach((row) => created.measureElement(row))
      pending = []
      const stop = created.subscribe(pull)
      pull()
      return () => {
        stop()
        created.dispose()
        if (controller === created) controller = undefined
      }
    }
  )
  createEffect(follow, (next) => controller?.setOptions(next))
  createEffect(totalSize, () => {
    controller?.update()
    controller?.sync()
  })

  return {
    items,
    count,
    totalSize,
    range,
    offset,
    viewportSize,
    following,
    isRendered: (index) => rendered().has(index),
    scrollToIndex(index, scroll) {
      untrack(current)
      if (controller) controller.scrollToIndex(index, scroll)
      else
        setOffset(
          layout.scrollOffset(
            index,
            scroll?.align ?? 'auto',
            untrack(offset),
            untrack(viewportSize)
          )
        )
    },
    scrollToOffset(next) {
      if (controller) controller.scrollToOffset(next)
      else setOffset(Math.max(0, next))
    },
    scrollToEnd() {
      untrack(current)
      if (controller) controller.scrollToEnd()
      else setOffset(layout.maxOffset(untrack(viewportSize)))
    },
    measureElement(element) {
      if (untrack(() => options.size) !== undefined) return
      if (controller) controller.measureElement(element)
      else pending.push(element)
    },
    unmeasureElement(element) {
      pending = pending.filter((row) => row !== element)
      controller?.unmeasureElement(element)
    },
  }
}

/** Virtual list state shared with descendants, plus the scroll element. */
export interface VirtualListContextValue extends VirtualizerHandle {
  /** Rendered scroll container. */
  root(): HTMLElement | undefined
  /** Whether the root holds focus for a row that scrolled out. Ignore root focus events then. */
  holding(): boolean
}
/** Row focus to restore: the row key and the focused descendant's position, -1 for the row itself. */
interface FocusMemory {
  /** Row identity. */
  key: VirtualKey
  /** Index in the row's querySelectorAll('*'), or -1 for the row. */
  path: number
}
/** Root-owned row registry and focus handoff. */
interface ContextValue {
  /** Public state for useVirtualList. */
  list: VirtualListContextValue
  /** Fixed row size, when set. */
  size(): number | undefined
  /** Record a mounted row element. */
  register(key: VirtualKey, element: HTMLElement): void
  /** Forget a row element and, if it held DOM focus, move focus to the root. */
  release(key: VirtualKey, element: HTMLElement): void
}
const Context = /* @__PURE__ */ createContext<ContextValue | null>(null)

/** Require root context while retaining the missing part's name in the error. */
function context(part: string): ContextValue {
  const value = useContext(Context)
  if (!value) throw new Error(`${part} must be rendered inside VirtualList`)
  return value
}
/** State and scroll commands of the nearest VirtualList, for components built on top of it. */
export function useVirtualList(): VirtualListContextValue {
  return context('useVirtualList').list
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

/** Virtualizer options owned by the root. */
type RootOwn = Omit<CreateVirtualizerOptions, 'scrollElement'> & {
  /** Receives the scroll container. */
  ref?: unknown
}
/** Polymorphic scroll container. Supply the list role and an accessible name. */
export type VirtualListProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof RootOwn, 'ref'> | 'as'
> &
  Omit<RootOwn, 'ref'> & {
    /** Host element, defaulting to div. Custom hosts must forward attributes and refs. */
    as?: T
  }
const optionKeys = [
  'count',
  'size',
  'estimateSize',
  'getKey',
  'overscan',
  'paddingStart',
  'paddingEnd',
  'gap',
  'sticky',
  'follow',
  'followThreshold',
  'onFollowChange',
] as const

/**
 * Scroll container that owns the virtualizer. When the row holding DOM focus
 * scrolls out and unmounts, focus moves here (tabindex -1 while held) and
 * returns to the same row, by key, when it renders again.
 */
export function VirtualListRoot<T extends ValidComponent = 'div'>(
  props: VirtualListProps<T>
): JSX.Element {
  const own = props as RootOwn & {
    as?: ValidComponent
    children?: JSX.Element
    style?: JSX.CSSProperties | string
    tabindex?: number | string
  }
  const [host, setHost] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
  const [restore, setRestore] = createSignal<FocusMemory | undefined>(undefined, {
    ownedWrite: true,
  })
  const [holding, setHolding] = createSignal(false, { ownedWrite: true })
  const rows = new Map<VirtualKey, HTMLElement>()
  let root: HTMLElement | undefined
  let focused: FocusMemory | undefined
  const handle = createVirtualizer({
    get count() {
      return own.count
    },
    get size() {
      return own.size
    },
    get estimateSize() {
      return own.estimateSize
    },
    get getKey() {
      return own.getKey
    },
    get overscan() {
      return own.overscan
    },
    get paddingStart() {
      return own.paddingStart
    },
    get paddingEnd() {
      return own.paddingEnd
    },
    get gap() {
      return own.gap
    },
    get sticky() {
      return own.sticky
    },
    get follow() {
      return own.follow
    },
    get followThreshold() {
      return own.followThreshold
    },
    get onFollowChange() {
      return own.onFollowChange
    },
    get scrollElement() {
      return host()
    },
  })
  const locate = (row: HTMLElement, key: VirtualKey, target: Element): FocusMemory => ({
    key,
    path: row === target ? -1 : [...row.querySelectorAll('*')].indexOf(target),
  })
  const value: ContextValue = {
    list: { ...handle, root: host, holding },
    size: () => own.size,
    register(key, element) {
      rows.set(key, element)
    },
    release(key, element) {
      if (rows.get(key) === element) rows.delete(key)
      if (!root) return
      const doc = element.ownerDocument
      const active = doc.activeElement
      const memory =
        active && element.contains(active)
          ? locate(element, key, active)
          : (!active || active === doc.body) && focused?.key === key
            ? focused
            : undefined
      if (!memory) return
      focused = undefined
      setRestore(memory)
      setHolding(true)
      const target = root
      target.setAttribute('tabindex', '-1')
      // Rows unmount inside the list's computation; focus handlers must not run there.
      queueMicrotask(() => {
        const active = target.ownerDocument.activeElement
        if (target.isConnected && (!active || active === target.ownerDocument.body))
          target.focus({ preventScroll: true })
      })
    },
  }
  createEffect(
    () => {
      const memory = restore()
      return memory && handle.items.some((item) => item.key === memory.key) ? memory : undefined
    },
    (memory) => {
      const row = memory && rows.get(memory.key)
      if (!memory || !row || !root) return
      setRestore(undefined)
      if (root.ownerDocument.activeElement !== root) return
      const target = memory.path < 0 ? row : (row.querySelectorAll('*')[memory.path] ?? row)
      ;(target as HTMLElement).focus({ preventScroll: true })
    }
  )
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'style',
    'tabindex',
    ...optionKeys
  )
  const content = createMemo(() => <Context value={value}>{own.children}</Context>)
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      {...spread(
        {
          attrs: {
            'data-part': 'root',
            'data-following': own.follow && handle.following() ? '' : undefined,
          },
          on: {
            focusin(event: FocusEvent) {
              const target = event.target as Element
              focused = undefined
              for (const [key, row] of rows)
                if (row.contains(target)) focused = locate(row, key, target)
            },
            focusout(event: FocusEvent) {
              const current = event.currentTarget as HTMLElement
              const next = event.relatedTarget as Node | null
              if (event.target === current) setHolding(false)
              if (next && current.contains(next)) return
              if ((event.target as Element).isConnected) {
                focused = undefined
                setRestore(undefined)
              }
            },
          },
        },
        rest
      )}
      tabindex={holding() ? -1 : own.tabindex}
      ref={(element: HTMLElement) => {
        root = element
        setHost(element)
        setRef(() => own.ref, element)
      }}
      style={styles({ overflow: 'auto', 'overflow-anchor': 'none' }, own.style)}
    >
      {content()}
    </Host>
  )
}

/** Sizer attributes. Children render each item, or read useVirtualList().items yourself. */
export type VirtualListViewportProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'as' | 'children'
> & {
  /** Host element, defaulting to div. */
  as?: T
  /** Row renderer called once per mounted key, or static content. Read item fields in JSX. */
  children?: JSX.Element | ((item: VirtualItem) => JSX.Element)
}
/** Inner element sized to the full content so the scrollbar reflects every item. */
export function VirtualListViewport<T extends ValidComponent = 'div'>(
  props: VirtualListViewportProps<T>
): JSX.Element {
  const ctx = context('VirtualList.Viewport')
  const own = props as VirtualListViewportProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'style')
  const content = createMemo(() => {
    const children = own.children
    // Zero-argument functions are resolved JSX, as with Show's function children.
    if (typeof children !== 'function' || children.length === 0) return children as JSX.Element
    const render = children as (item: VirtualItem) => JSX.Element
    return <For each={ctx.list.items}>{(item) => render(item)}</For>
  })
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      data-part="viewport"
      {...rest}
      style={styles(
        { position: 'relative', display: 'flow-root', height: `${ctx.list.totalSize()}px` },
        own.style
      )}
    >
      {content()}
    </Host>
  )
}

/** Row identity and position. */
interface ItemOwn {
  /** Item from the viewport's render function or useVirtualList().items. */
  item: VirtualItem
  /** Receives the row element. */
  ref?: unknown
}
/** Polymorphic row. aria-setsize and aria-posinset props override the defaults. */
export type VirtualListItemProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  Omit<ItemOwn, 'ref'> & {
    /** Host element, defaulting to div. */
    as?: T
  }
/**
 * Absolutely positioned row, measured unless the root has a fixed size.
 * The pinned heading uses position sticky instead, so it stays at the top
 * while its section is in view.
 */
export function VirtualListItem<T extends ValidComponent = 'div'>(
  props: VirtualListItemProps<T>
): JSX.Element {
  const ctx = context('VirtualList.Item')
  const own = props as ItemOwn & {
    as?: ValidComponent
    children?: JSX.Element
    style?: JSX.CSSProperties | string
  }
  const key = untrack(() => own.item.key)
  let element: HTMLElement | undefined
  onCleanup(() => {
    if (!element) return
    ctx.list.unmeasureElement(element)
    ctx.release(key, element)
  })
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'style', 'item')
  const position = (): JSX.CSSProperties => {
    const item = own.item
    const size = ctx.size()
    const height = size === undefined ? undefined : `${size}px`
    return item.pinned
      ? { position: 'sticky', top: '0', 'z-index': '1', 'margin-top': `${item.start}px`, height }
      : {
          position: 'absolute',
          top: '0',
          'inset-inline-start': '0',
          width: '100%',
          transform: `translateY(${item.start}px)`,
          height,
        }
  }
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      {...spread(
        {
          attrs: {
            'data-part': 'item',
            'data-index': String(own.item.index),
            'data-key': String(own.item.key),
            'data-sticky': own.item.sticky ? '' : undefined,
            'data-pinned': own.item.pinned ? '' : undefined,
            'aria-setsize': String(ctx.list.count()),
            'aria-posinset': String(own.item.index + 1),
          },
          on: {},
        },
        rest
      )}
      ref={(node: HTMLElement) => {
        element = node
        ctx.register(key, node)
        ctx.list.measureElement(node)
        setRef(() => own.ref, node)
      }}
      style={styles(position(), own.style)}
    >
      {own.children}
    </Host>
  )
}

/** Virtualized vertical list: scroll container, sizer and positioned rows. */
export const VirtualList = /* @__PURE__ */ Object.assign(VirtualListRoot, {
  /** Root alias for explicit compound composition. */
  Root: VirtualListRoot,
  /** Sizer that renders the current rows. */
  Viewport: VirtualListViewport,
  /** Positioned, measured row. */
  Item: VirtualListItem,
})
export type { VirtualAlign, VirtualItem, VirtualKey, VirtualRange }
