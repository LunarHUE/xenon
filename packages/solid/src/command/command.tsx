import { command, getCommandGroupHeadingId, getCommandItemId } from '@xenon-ui/core/command'
import type { CommandItem, CommandOptions } from '@xenon-ui/core/command'
import type { PartProps } from '@xenon-ui/core'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createProjection,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import type { Accessor } from 'solid-js'
import { booleanAttribute, setRef } from '../internal/host'
import { createShortcut } from '../shortcuts/shortcuts'
import type { ShortcutHandle } from '../shortcuts/shortcuts'
import { spread } from '../spread'
import { VirtualList, useVirtualList } from '../virtual-list/virtual-list'
import type { VirtualItem, VirtualOptions, VirtualizerHandle } from '../virtual-list/virtual-list'
import { VisuallyHidden } from '../visually-hidden'

/** Passed to an item's onSelect. Cancel it to keep Command.Dialog open. */
export interface CommandSelectEvent {
  /** The selected item's value. */
  readonly value: string
  /** Whether a handler canceled the default close. */
  readonly defaultPrevented: boolean
  /** Keep Command.Dialog open after this selection. */
  preventDefault(): void
}

/** Root state and callbacks. Undefined controlled props fall back to internal state. */
export interface CommandRootOwn extends Pick<CommandOptions, 'shouldFilter' | 'filter' | 'loop'> {
  /**
   * Items to filter and rank, for virtualized or data-driven lists. Omit to use the
   * mounted Command.Item children, which filter in place and keep author order.
   */
  items?: readonly CommandItem[]
  /** Order results by score while a query is set. Applies with `items` only. Defaults to true. */
  sort?: boolean
  /** Controlled search text. */
  query?: string
  /** Initial uncontrolled search text. */
  defaultQuery?: string
  /** Reports new search text. */
  onQueryChange?: (query: string) => void
  /** Controlled highlighted item. */
  activeValue?: string
  /** Initial uncontrolled highlighted item. */
  defaultActiveValue?: string
  /** Reports a new highlight from the keyboard or pointer. */
  onActiveChange?: (value: string | undefined) => void
  /** Controlled page stack, outermost first. Empty means the root page. */
  pages?: readonly string[]
  /** Initial uncontrolled page stack. */
  defaultPages?: readonly string[]
  /** Reports a pushed or popped page stack. */
  onPagesChange?: (pages: readonly string[]) => void
  /**
   * Text announced through a polite live region after results change, or false for
   * none. Defaults to "No results", "1 result" or "N results".
   */
  announce?: false | ((count: number, query: string) => string)
  /** Milliseconds to wait for typing to settle before announcing. Defaults to 500. */
  announceDelay?: number
  /**
   * Runs for every chosen item, after the item's own onSelect. Data-driven and
   * virtualized lists, which render no Command.Item, handle selection here.
   */
  onSelect?: (value: string, event: CommandSelectEvent) => void
}
/** Polymorphic root host; defaults to div. */
export type CommandRootProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof CommandRootOwn | 'as'
> &
  CommandRootOwn & {
    /** Root host; defaults to div. */
    as?: T
  }

/** One mounted Command.Item. */
interface Entry {
  value(): string
  keywords(): readonly string[] | undefined
  disabled(): boolean
  group(): string | undefined
  el?: HTMLElement
  onSelect?(value: string, event: CommandSelectEvent): void
}

/** Live palette state for custom parts, read through {@link useCommand}. */
export interface CommandContextValue {
  /** Current search text. */
  query: Accessor<string>
  /** Request new search text. */
  setQuery(query: string): void
  /** Current page stack, outermost first. */
  pages: Accessor<readonly string[]>
  /** Current page, or undefined on the root page. */
  page: Accessor<string | undefined>
  /** Open a nested page. Clears the query. */
  pushPage(page: string): void
  /** Leave the current page. Clears the query. */
  popPage(): void
  /** Highlighted, visible item. */
  activeValue: Accessor<string | undefined>
  /** Visible items in display order. */
  items: Accessor<readonly CommandItem[]>
  /** Run an item as if it were chosen. */
  select(value: string): void
}

interface Internal extends CommandContextValue {
  base: string
  engine: Accessor<ReturnType<typeof command>>
  register(entry: Entry): () => void
  setInput(el: HTMLInputElement): void
  /** Forget the input if it is still this one. */
  releaseInput(el: HTMLInputElement): void
  root: Accessor<HTMLElement | undefined>
  addLoading(): () => void
  loading: Accessor<boolean>
  /** Virtualized list, when Command.List renders one. */
  virtual: Accessor<VirtualBinding | undefined>
  setVirtual(binding: VirtualBinding | undefined): void
}

/** A virtualized Command.List and the row index of each item value. */
interface VirtualBinding {
  handle: VirtualizerHandle
  index(value: string): number
}

const Context = /* @__PURE__ */ createContext<Internal | null>(null)
const GroupContext = /* @__PURE__ */ createContext<Accessor<string> | null>(null)
const ItemContext = /* @__PURE__ */ createContext<ShortcutHandle | null>(null)

/** Hooks Command.Dialog into the palette rendered inside it. */
interface Bridge {
  setInput(el: HTMLInputElement): void
  releaseInput(el: HTMLInputElement): void
  selected(event: CommandSelectEvent, pagesChanged: boolean): void
  openShortcut?: string
  close(): void
}
const BridgeContext = /* @__PURE__ */ createContext<Bridge | null>(null)

function useInternal(name: string): Internal {
  const context = useContext(Context)
  if (!context) throw new Error(`${name} must be rendered inside <Command>`)
  return context
}

/** Read the nearest palette's query, pages and highlight. Throws outside a root. */
export function useCommand(): CommandContextValue {
  return useInternal('useCommand')
}

const order = (a: Entry, b: Entry) =>
  a.el && b.el ? (a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1) : 0

/** Default live-region text. */
const results = (count: number) =>
  count === 0 ? 'No results' : count === 1 ? '1 result' : `${count} results`

/**
 * Owns the query, highlight, page stack and filtering for a command palette.
 *
 * @remarks
 * Works inline or inside {@link CommandDialog}. Mounted items register in DOM
 * order and hide while the query filters them out, so their markup keeps author
 * order. Pass `items` to rank results instead, and render them from the
 * collection Command.List passes to a function child. A query or page change
 * moves the highlight back to the first visible item.
 */
export function CommandRoot<T extends ValidComponent = 'div'>(
  props: CommandRootProps<T>
): JSX.Element {
  const own = props as CommandRootOwn & {
    as?: ValidComponent
    id?: string
    ref?: unknown
    children?: JSX.Element
  }
  const bridge = useContext(BridgeContext)
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'items',
    'sort',
    'shouldFilter',
    'filter',
    'loop',
    'query',
    'defaultQuery',
    'onQueryChange',
    'activeValue',
    'defaultActiveValue',
    'onActiveChange',
    'pages',
    'defaultPages',
    'onPagesChange',
    'announce',
    'announceDelay',
    'onSelect'
  )
  const base = untrack(() => own.id) ?? `xenon-command-${createUniqueId()}`
  const [internalQuery, setInternalQuery] = createSignal(untrack(() => own.defaultQuery ?? ''))
  const [internalActive, setInternalActive] = createSignal(untrack(() => own.defaultActiveValue))
  const [internalPages, setInternalPages] = createSignal<readonly string[]>(
    untrack(() => own.defaultPages ?? [])
  )
  const [entries, setEntries] = createSignal<Entry[]>([], { ownedWrite: true })
  const [loadingCount, setLoadingCount] = createSignal(0, { ownedWrite: true })
  const [root, setRoot] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
  const [virtual, setVirtual] = createSignal<VirtualBinding | undefined>(undefined, {
    ownedWrite: true,
  })
  let registered: Entry[] = []
  const query = () => own.query ?? internalQuery()
  const pages = () => own.pages ?? internalPages()
  const setQuery = (next: string) => {
    if (next === untrack(query)) return
    if (own.query === undefined) setInternalQuery(next)
    own.onQueryChange?.(next)
    setActive(undefined)
  }
  const setActive = (next: string | undefined) => {
    if (own.activeValue === undefined) setInternalActive(next)
    if (next !== undefined) own.onActiveChange?.(next)
  }
  const setPages = (next: readonly string[]) => {
    if (own.pages === undefined) setInternalPages(next)
    own.onPagesChange?.(next)
    setQuery('')
    setActive(undefined)
  }
  const fromChildren = () => own.items === undefined
  const engine = createMemo(() =>
    command({
      items:
        own.items ??
        entries().map((entry) => ({
          value: entry.value(),
          keywords: entry.keywords(),
          disabled: entry.disabled(),
          group: entry.group(),
        })),
      id: base,
      query: query(),
      activeValue: own.activeValue ?? internalActive(),
      shouldFilter: own.shouldFilter,
      filter: own.filter,
      sort: fromChildren() ? false : own.sort,
      loop: own.loop,
      depth: pages().length,
      onActiveChange: setActive,
      onSelect: (value) => select(value),
      onPopPage: () => popPage(),
    })
  )
  const popPage = () => {
    const current = untrack(pages)
    if (current.length) setPages(current.slice(0, -1))
  }
  /** Run an item's handler, then let Command.Dialog close unless it was canceled. */
  const select = (value: string) => {
    const entry = registered.find((candidate) => candidate.value() === value)
    if (entry?.disabled()) return
    let prevented = false
    const event: CommandSelectEvent = {
      value,
      get defaultPrevented() {
        return prevented
      },
      preventDefault() {
        prevented = true
      },
    }
    const before = untrack(pages)
    entry?.onSelect?.(value, event)
    own.onSelect?.(value, event)
    bridge?.selected(event, untrack(pages) !== before)
  }
  // Keep the highlight in view. A virtual list scrolls by index, which also mounts the row.
  createEffect(
    () => engine().state.activeValue,
    (value) => {
      if (value === undefined) return
      const list = untrack(virtual)
      if (list) {
        const index = untrack(() => list.index(value))
        if (index >= 0) list.handle.scrollToIndex(index)
        return
      }
      untrack(root)
        ?.ownerDocument.getElementById(getCommandItemId(base, value))
        ?.scrollIntoView?.({ block: 'nearest' })
    }
  )
  const [message, setMessage] = createSignal('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let previousQuery = untrack(query)
  createEffect(
    () => ({ count: engine().state.count, query: query() }),
    (next) => {
      // Items registering after mount change the count without a search, so
      // announce only a new query or new results for a query that is set.
      const searched = next.query !== previousQuery || next.query !== ''
      previousQuery = next.query
      if (!searched) return
      const announce = untrack(() => own.announce)
      if (announce === false) return
      clearTimeout(timer)
      timer = setTimeout(
        () => setMessage((announce ?? results)(next.count, next.query)),
        untrack(() => own.announceDelay) ?? 500
      )
    }
  )
  onCleanup(() => clearTimeout(timer))
  const context: Internal = {
    base,
    engine,
    query,
    setQuery,
    pages,
    page: () => pages().at(-1),
    pushPage: (page) => setPages([...untrack(pages), page]),
    popPage,
    activeValue: () => engine().state.activeValue,
    items: () => engine().state.items,
    select,
    root,
    setInput: (el) => bridge?.setInput(el),
    releaseInput: (el) => bridge?.releaseInput(el),
    loading: () => loadingCount() > 0,
    virtual,
    setVirtual: (binding) => setVirtual(() => binding),
    addLoading() {
      setLoadingCount((count) => count + 1)
      return () => setLoadingCount((count) => count - 1)
    },
    register(entry) {
      registered = [...registered, entry].sort(order)
      setEntries(registered)
      return () => {
        registered = registered.filter((other) => other !== entry)
        setEntries(registered)
      }
    },
  }
  onSettled(() => {
    const host = untrack(root)
    if (!host) return
    // Moved items keep their owners, so reorder registrations when the DOM changes.
    const observer = new MutationObserver(() => {
      const sorted = [...registered].sort(order)
      if (sorted.some((entry, index) => entry !== registered[index])) {
        registered = sorted
        setEntries(registered)
      }
    })
    observer.observe(host, { childList: true, subtree: true })
    return () => observer.disconnect()
  })
  const content = createMemo(() => (
    <Context value={context}>
      {own.children}
      {bridge?.openShortcut ? <CloseShortcut binding={bridge.openShortcut} /> : undefined}
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true" data-part="announcer">
        {message()}
      </VisuallyHidden>
    </Context>
  ))
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      ref={(el: HTMLElement) => {
        setRoot(el)
        setRef(() => own.ref, el)
      }}
      data-part="root"
      data-page={pages().at(-1)}
      data-empty={engine().state.empty ? '' : undefined}
      {...rest}
    >
      {content()}
    </Host>
  )
}

/** Inside Command.Dialog, the open shortcut also closes it while the palette has focus. */
function CloseShortcut(props: { binding: string }): JSX.Element {
  const bridge = useContext(BridgeContext)!
  const context = useInternal('Command.Dialog')
  createShortcut(
    untrack(() => props.binding),
    () => bridge.close(),
    {
      scope: context.root,
    }
  )
  return undefined
}

/** Native input props; the root owns the value. */
export type CommandInputProps = Omit<ComponentProps<'input'>, 'value'>
/** Search field. It keeps DOM focus while the highlight moves through the list. */
export function CommandInput(props: CommandInputProps): JSX.Element {
  const context = useInternal('Command.Input')
  const rest = omit(props as Record<string, unknown>, 'ref')
  let element: HTMLInputElement | undefined
  onCleanup(() => element && context.releaseInput(element))
  /** Under virtualization the highlighted row may be scrolled out and unmounted. */
  const mounted = () => {
    const list = context.virtual()
    const active = context.activeValue()
    return !list || active === undefined || list.handle.isRendered(list.index(active))
  }
  const part = (): PartProps<'input'> => {
    const core = context.engine().parts.input
    return {
      ...core,
      attrs: {
        ...core.attrs,
        type: 'text',
        'aria-busy': context.loading() ? 'true' : undefined,
        'aria-activedescendant': mounted() ? core.attrs['aria-activedescendant'] : undefined,
      },
      on: {
        ...core.on,
        input(event) {
          context.setQuery(event.currentTarget.value)
          // Controlled queries can refuse the edit.
          event.currentTarget.value = untrack(context.query)
        },
      },
    }
  }
  return (
    <input
      {...spread(part(), rest)}
      ref={(el) => {
        element = el
        context.setInput(el)
        setRef(() => props.ref, el)
      }}
    />
  )
}

/** Collection callback for data-driven lists. Read it in tracked JSX such as For's each. */
export type CommandListChildren = JSX.Element | ((items: readonly CommandItem[]) => JSX.Element)
/** Native div props for the listbox. */
export type CommandListProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Items, groups and status parts, or a callback receiving the visible items. */
  children?: CommandListChildren
  /**
   * Render only the options in view; the list becomes the scroll container. Needs
   * the root's `items` and `renderItem`. Read once. Handle selection with the root's onSelect.
   */
  virtual?: VirtualOptions
  /** With `virtual`, renders the contents of one item's option. */
  renderItem?: (item: CommandItem) => JSX.Element
  /** With `virtual`, a sticky heading row rendered before each group's first item. */
  groupHeading?: (group: string) => JSX.Element
}
/** Listbox holding groups and items. A function child receives the visible items in order. */
export function CommandList(props: CommandListProps): JSX.Element {
  // eslint-disable-next-line solid/components-return-once -- virtual is read once.
  if (untrack(() => props.virtual)) return <VirtualCommandList {...props} />
  const context = useInternal('Command.List')
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'virtual',
    'groupHeading',
    'renderItem'
  )
  const items = createProjection<CommandItem[]>(() => [...context.engine().state.items], [], {
    key: 'value',
  })
  const children = createMemo(() => {
    const value = props.children
    return typeof value === 'function' ? value(items) : value
  })
  return (
    <div
      {...spread(context.engine().parts.list, {
        'aria-label': 'Commands',
        'aria-busy': context.loading() ? 'true' : undefined,
        ...rest,
      })}
    >
      {children()}
    </div>
  )
}

/** One virtual row: an option, or a group heading when `groupHeading` is set. */
type Row = { kind: 'item'; value: string } | { kind: 'group'; value: string }
const rowKey = (row: Row) => `${row.kind}:${row.value}`

/** Command.List over a virtualizer. Rows are keyed by value, so filtering keeps them mounted. */
function VirtualCommandList(props: CommandListProps): JSX.Element {
  const context = useInternal('Command.List')
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'virtual',
    'groupHeading',
    'renderItem'
  )
  const options = untrack(() => props.virtual)!
  const heading = untrack(() => props.groupHeading)
  const render = untrack(() => props.renderItem) ?? ((item: CommandItem) => item.value)
  const rows = createMemo(() => {
    const out: Row[] = []
    let group: string | undefined
    for (const item of context.engine().state.items) {
      if (heading && item.group !== undefined && item.group !== group)
        out.push({ kind: 'group', value: item.group })
      group = item.group
      out.push({ kind: 'item', value: item.value })
    }
    return out
  })
  const lookup = createMemo(() => {
    const index = new Map<string, number>()
    const ordinal = new Map<string, number>()
    rows().forEach((row, position) => {
      if (row.kind !== 'item') return
      index.set(row.value, position)
      ordinal.set(row.value, ordinal.size + 1)
    })
    return { index, ordinal }
  })
  // The virtualizer calls these outside tracking scopes, so each closes over one snapshot
  // and a new function stands for new rows.
  const getKey = createMemo(() => {
    const staticRows = rows()
    return (index: number) => rowKey(staticRows[index]!)
  })
  const sticky = createMemo(() => {
    const staticRows = rows()
    return heading ? (index: number) => staticRows[index]?.kind === 'group' : undefined
  })
  const data = createMemo(
    () => new Map(context.engine().state.items.map((item) => [item.value, item]))
  )
  function Bind(): JSX.Element {
    const handle = useVirtualList()
    context.setVirtual({ handle, index: (value) => lookup().index.get(value) ?? -1 })
    onCleanup(() => context.setVirtual(undefined))
    return undefined
  }
  function Line(line: { item: VirtualItem }): JSX.Element {
    const key = String(untrack(() => line.item.key))
    const kind = key.slice(0, key.indexOf(':'))
    const value = key.slice(kind.length + 1)
    // A row's key, and so its kind, is fixed for its lifetime.
    if (kind === 'group')
      // eslint-disable-next-line solid/components-return-once
      return (
        <VirtualList.Item
          item={line.item}
          data-part="group-heading"
          role="presentation"
          aria-setsize={undefined}
          aria-posinset={undefined}
        >
          {heading!(value)}
        </VirtualList.Item>
      )
    const item = untrack(() => data().get(value)) ?? { value }
    return (
      <VirtualList.Item
        item={line.item}
        {...spread(context.engine().parts.item(value), {
          'aria-setsize': String(context.engine().state.count),
          'aria-posinset': String(lookup().ordinal.get(value) ?? 0),
        })}
      >
        {render(item)}
      </VirtualList.Item>
    )
  }
  return (
    <VirtualList
      {...spread(context.engine().parts.list, {
        'aria-label': 'Commands',
        'aria-busy': context.loading() ? 'true' : undefined,
        ...rest,
      })}
      {...options}
      count={rows().length}
      getKey={getKey()}
      sticky={sticky()}
    >
      <Bind />
      <VirtualList.Viewport>{(item: VirtualItem) => <Line item={item} />}</VirtualList.Viewport>
    </VirtualList>
  )
}

/** Native div props plus the group's identity. */
export type CommandGroupProps = ComponentProps<'div'> & {
  /** Identity for ranking and navigation. Defaults to a generated value. */
  value?: string
}
/** Items under one heading. Hidden while none of its items match. */
export function CommandGroup(props: CommandGroupProps): JSX.Element {
  const context = useInternal('Command.Group')
  const generated = createUniqueId()
  const value = () => props.value ?? generated
  const rest = omit(props, 'value', 'children')
  const children = createMemo(() => <GroupContext value={value}>{props.children}</GroupContext>)
  return <div {...spread(context.engine().parts.group(value()), rest)}>{children()}</div>
}

/** Native div props for a group's visible name. */
export type CommandGroupHeadingProps = ComponentProps<'div'>
/** Names the enclosing group through its aria-labelledby. */
export function CommandGroupHeading(props: CommandGroupHeadingProps): JSX.Element {
  const context = useInternal('Command.GroupHeading')
  const group = useContext(GroupContext)
  if (!group) throw new Error('Command.GroupHeading must be rendered inside <Command.Group>')
  return (
    <div
      data-part="group-heading"
      {...props}
      id={getCommandGroupHeadingId(context.base, group())}
    />
  )
}

/** Item identity, search terms and behavior. */
interface ItemOwn {
  /** Unique identity, also the text the default filter scores. */
  value: string
  /** Extra search terms. */
  keywords?: readonly string[]
  /** Skip during navigation and ignore activation. */
  disabled?: JSX.BooleanAttribute
  /** Runs when the item is chosen by Enter, click or its shortcut. */
  onSelect?: (value: string, event: CommandSelectEvent) => void
  /**
   * Binding such as `Mod+Shift+P` that runs this item while the palette is active.
   * Read once. Announced through aria-keyshortcuts and rendered by Command.Shortcut.
   */
  shortcut?: string
}
/** Native div props plus item options. */
export type CommandItemProps = Omit<ComponentProps<'div'>, keyof ItemOwn> & ItemOwn
/** An option. It hides while the query filters it out and never takes DOM focus. */
export function CommandItem(props: CommandItemProps): JSX.Element {
  const context = useInternal('Command.Item')
  const group = useContext(GroupContext)
  const rest = omit(
    props,
    'value',
    'keywords',
    'disabled',
    'onSelect',
    'shortcut',
    'children',
    'ref'
  )
  const entry: Entry = {
    value: () => props.value,
    keywords: () => props.keywords,
    disabled: () => booleanAttribute(props.disabled),
    group: () => group?.(),
    onSelect: (value, event) => props.onSelect?.(value, event),
  }
  onSettled(() => context.register(entry))
  const binding = untrack(() => props.shortcut)
  const shortcut = binding
    ? createShortcut(binding, () => context.select(untrack(() => props.value)), {
        scope: context.root,
        description: untrack(() => props.value),
        enabled: () => !booleanAttribute(props.disabled),
      })
    : undefined
  const children = createMemo(() => (
    <ItemContext value={shortcut ?? null}>{props.children}</ItemContext>
  ))
  return (
    <div
      {...spread(context.engine().parts.item(props.value), {
        'aria-keyshortcuts': shortcut?.ariaKeyshortcuts(),
        ...rest,
      })}
      ref={(el) => {
        entry.el = el
        setRef(() => props.ref, el)
      }}
    >
      {children()}
    </div>
  )
}

/** Native kbd props; a function child receives the key tokens. */
export type CommandShortcutProps = Omit<ComponentProps<'kbd'>, 'children'> & {
  /** Custom rendering for tokens such as `['⌘', 'K']`. Defaults to one kbd per token. */
  children?: (keys: readonly string[]) => JSX.Element
}
/** Shows the enclosing item's shortcut. Hidden from assistive technology, which reads aria-keyshortcuts. */
export function CommandShortcut(props: CommandShortcutProps): JSX.Element {
  const shortcut = useContext(ItemContext)
  const rest = omit(props, 'children')
  // The item's shortcut is read once, so this branch is fixed for the component's lifetime.
  // eslint-disable-next-line solid/components-return-once
  if (!shortcut) return undefined
  return (
    <kbd data-part="shortcut" aria-hidden="true" {...rest}>
      {props.children
        ? props.children(shortcut.keys())
        : shortcut.keys().map((key) => <kbd>{key}</kbd>)}
    </kbd>
  )
}

/** Native div props for the empty state. */
export type CommandEmptyProps = ComponentProps<'div'>
/** Shown while nothing matches the query. */
export function CommandEmpty(props: CommandEmptyProps): JSX.Element {
  const context = useInternal('Command.Empty')
  return <div data-part="empty" {...spread(context.engine().parts.empty, { ...props })} />
}

/** Native div props plus optional determinate progress. */
export type CommandLoadingProps = ComponentProps<'div'> & {
  /** Percent complete, from 0 to 100. Omit for indeterminate loading. */
  progress?: number
  /** Accessible name. Defaults to "Loading". */
  label?: string
}
/** Progress for an async source. While mounted, the list and input report aria-busy. */
export function CommandLoading(props: CommandLoadingProps): JSX.Element {
  const context = useInternal('Command.Loading')
  onCleanup(context.addLoading())
  const rest = omit(props, 'progress', 'label')
  return (
    <div
      data-part="loading"
      role="progressbar"
      aria-label={props.label ?? 'Loading'}
      aria-valuemin={props.progress === undefined ? undefined : 0}
      aria-valuemax={props.progress === undefined ? undefined : 100}
      aria-valuenow={props.progress}
      {...rest}
    />
  )
}

/** Native div props plus whether to stay visible during search. */
export type CommandSeparatorProps = ComponentProps<'div'> & {
  /** Keep the divider while a query is set. Defaults to false. */
  alwaysRender?: boolean
}
/** Divider between groups, hidden while a query is set. */
export function CommandSeparator(props: CommandSeparatorProps): JSX.Element {
  const context = useInternal('Command.Separator')
  const rest = omit(props, 'alwaysRender')
  const part = () => {
    const core = context.engine().parts.separator
    return props.alwaysRender ? { ...core, attrs: { ...core.attrs, hidden: undefined } } : core
  }
  return <div data-part="separator" {...spread(part(), rest)} />
}

export { BridgeContext }
export type { Bridge }
