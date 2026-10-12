import { listbox, getListboxItemId } from '@xenon-ui/core/listbox'
import type { ListboxOptions as CoreListboxOptions, ListboxValue } from '@xenon-ui/core/listbox'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
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
import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import { spread } from '../spread'
import { VirtualList, useVirtualList } from '../virtual-list/virtual-list'
import type {
  VirtualItem,
  VirtualListContextValue,
  VirtualOptions,
} from '../virtual-list/virtual-list'

type ListboxOptions = NativeBooleanAttributes<CoreListboxOptions>

/**
 * Listbox state, navigation, and host configuration.
 * Undefined value/activeValue props use internal state; callbacks run after state updates.
 * Items, typeahead, and range-selection anchors are managed by the adapter.
 */
interface Own extends Omit<
  ListboxOptions,
  | 'items'
  | 'id'
  | 'isItemDisabled'
  | 'textValue'
  | 'search'
  | 'onSearchChange'
  | 'anchorValue'
  | 'onAnchorChange'
> {
  /** Initial uncontrolled selection. Later changes are ignored. */
  defaultValue?: ListboxOptions['value']
  /** Horizontal navigation direction; inherits the nearest dir after settling. */
  dir?: ListboxOptions['dir']
  /** Initial uncontrolled active identity. */
  defaultActiveValue?: ListboxOptions['activeValue']
  /** Receives the rendered host. */
  ref?: unknown
  /**
   * Every option as data, in order. Required with `virtual`, where navigation,
   * typeahead and selection work over this list instead of the mounted items.
   */
  items?: readonly ListboxItemData[]
  /**
   * Render only the options in view; the root becomes the scroll container. Needs
   * `items`. Read once. Focus that scrolls out stays on the root and returns with its row.
   */
  virtual?: VirtualOptions
  /** With `virtual`, renders the contents of one option. Defaults to its text or value. */
  renderItem?: (item: ListboxItemData) => JSX.Element
}
/** One option of a data-driven listbox. */
export interface ListboxItemData {
  /** Unique selection identity. */
  value: string
  /** Searchable label; defaults to the value. */
  textValue?: string
  /** Skip during navigation and selection. */
  disabled?: boolean
}
/** Polymorphic listbox root. Supply an accessible name and unique string values. */
export type ListboxProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  Omit<Own, 'ref'> & {
    /** Root host; defaults to div. Custom hosts must forward attributes and refs. */
    as?: T
  }
/** Option identity, searchable text, and disabled behavior. */
interface ItemOwn {
  /** Unique selection identity used to derive a stable ID under the root ID. */
  value: string
  /** Searchable label, otherwise current host text content or value. */
  textValue?: string
  /** Skip this option during navigation and selection. */
  disabled?: JSX.BooleanAttribute
  /** Receives the rendered option host. */
  ref?: unknown
}
/** Polymorphic option host; author handlers may cancel core behavior. */
export type ListboxItemProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof ItemOwn, 'ref'> | 'as'
> &
  Omit<ItemOwn, 'ref'> & {
    /** Option host; defaults to div. */
    as?: T
  }
/** Registered option with live metadata and its current focus target. */
interface Entry {
  /** Actual host, available after rendering. */
  el?: HTMLElement
  /** Live selection identity. */
  value(): string
  /** Live exclusion state. */
  disabled(): boolean
  /** Live searchable label. */
  text(): string
}
/** Root-owned engine and option registration. */
interface ContextValue {
  /** Current core snapshot. */
  engine(): ReturnType<typeof listbox>
  /** Registers an option and returns its cleanup. */
  register(entry: Entry): () => void
  /** Whether pointerdown must preserve an external focus owner. */
  virtualFocus(): boolean
}
const Context = createContext<ContextValue>()
/**
 * Owns controlled/uncontrolled selection, active identity, DOM order, and a 700ms
 * typeahead timeout. Roving focus is the default; virtualFocus leaves DOM focus
 * with the caller. Initialization and focus navigation do not change selection.
 * Registration sorts known hosts. Child-list mutations refresh navigation order
 * after the mutation observer runs, including moves that preserve item owners.
 */
export function ListboxRoot<T extends ValidComponent = 'div'>(props: ListboxProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent; id?: string; children?: JSX.Element }
  const base = createUniqueId()
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'value',
    'defaultValue',
    'onValueChange',
    'selectionMode',
    'disabled',
    'readonly',
    'loop',
    'orientation',
    'dir',
    'virtualFocus',
    'activeValue',
    'defaultActiveValue',
    'onActiveChange',
    'items',
    'virtual',
    'renderItem'
  )
  const [value, setValue] = createSignal<ListboxValue>(untrack(() => own.defaultValue))
  const [activeValue, setActiveValue] = createSignal<string | undefined>(
    untrack(() => own.defaultActiveValue)
  )
  const [entries, setEntries] = createSignal<Entry[]>([], { ownedWrite: true })
  const [search, setSearch] = createSignal('')
  const [anchor, setAnchor] = createSignal<string>()
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr', { ownedWrite: true })
  let registered: Entry[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let host: HTMLElement | undefined
  let focusing = false
  const entryFor = (key: string) => entries().find((entry) => entry.value() === key)
  const virtual = untrack(() => own.virtual)
  const [list, setList] = createSignal<VirtualListContextValue | undefined>(undefined, {
    ownedWrite: true,
  })
  const [pending, setPending] = createSignal<string | undefined>(undefined, { ownedWrite: true })
  /** Mounted virtual rows by value. */
  const rows = new Map<string, HTMLElement>()
  const data = createMemo(() => new Map((own.items ?? []).map((item) => [item.value, item])))
  const indexOf = createMemo(
    () => new Map((own.items ?? []).map((item, index) => [item.value, index]))
  )
  /** Reports each request once; synchronous DOM focus events must not report it again. */
  const focus = (next: string) => {
    if (focusing) return
    focusing = true
    try {
      const previous = own.activeValue ?? untrack(activeValue)
      if (own.activeValue === undefined) setActiveValue(next)
      if (previous !== next) own.onActiveChange?.(next)
      if (own.virtualFocus) return
      if (!virtual) {
        entryFor(next)?.el?.focus({ preventScroll: true })
        return
      }
      const row = rows.get(next)
      if (row) row.focus({ preventScroll: true })
      else setPending(next)
      const index = untrack(indexOf).get(next)
      if (index !== undefined) untrack(list)?.scrollToIndex(index)
    } finally {
      focusing = false
    }
  }
  const engine = createMemo(() =>
    listbox({
      items: own.items
        ? own.items.map((item) => item.value)
        : entries().map((entry) => entry.value()),
      value: own.value ?? value(),
      activeValue: own.activeValue ?? activeValue(),
      selectionMode: own.selectionMode,
      disabled: booleanAttribute(own.disabled),
      readonly: booleanAttribute(own.readonly),
      loop: own.loop,
      orientation: own.orientation,
      dir: own.dir ?? ambient(),
      virtualFocus: own.virtualFocus,
      id: own.id ?? base,
      isItemDisabled: (key) =>
        own.items ? !!data().get(key)?.disabled : (entryFor(key)?.disabled() ?? false),
      textValue: (key) =>
        own.items ? (data().get(key)?.textValue ?? key) : (entryFor(key)?.text() ?? key),
      search: search(),
      anchorValue: anchor(),
      onAnchorChange: setAnchor,
      onActiveChange: focus,
      onValueChange(next) {
        if (own.value === undefined) setValue(next)
        own.onValueChange?.(next)
      },
      onSearchChange(next) {
        setSearch(next)
        clearTimeout(timer)
        timer = setTimeout(() => setSearch(''), 700)
      },
    })
  )
  const context: ContextValue = {
    engine,
    virtualFocus: () => own.virtualFocus ?? false,
    register(entry) {
      registered = [...registered, entry].sort((a, b) =>
        a.el && b.el ? (a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1) : 0
      )
      setEntries(registered)
      return () => {
        registered = registered.filter((other) => other !== entry)
        setEntries(registered)
      }
    },
  }
  onCleanup(() => clearTimeout(timer))
  onSettled(() => {
    const direction =
      own.dir ??
      host?.parentElement?.closest('[dir]')?.getAttribute('dir') ??
      host?.ownerDocument.dir
    setAmbient(direction === 'rtl' ? 'rtl' : 'ltr')
    if (!host) return
    const observer = new MutationObserver(() => {
      const ordered = [...registered].sort((a, b) =>
        a.el && b.el ? (a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1) : 0
      )
      if (ordered.some((entry, index) => entry !== registered[index])) {
        registered = ordered
        setEntries(registered)
      }
    })
    observer.observe(host, { childList: true, subtree: true })
    return () => observer.disconnect()
  })
  // A keyboard move to an unmounted row scrolls it in; focus it once it renders.
  createEffect(
    () => {
      const value = pending()
      const index = value === undefined ? undefined : indexOf().get(value)
      return index !== undefined && list()?.isRendered(index) ? value : undefined
    },
    (value) => {
      if (value === undefined) return
      setPending(undefined)
      rows.get(value)?.focus({ preventScroll: true })
    }
  )
  const content = createMemo(() => <Context value={context}>{own.children}</Context>)
  if (virtual) {
    const render =
      untrack(() => own.renderItem) ?? ((item: ListboxItemData) => item.textValue ?? item.value)
    const getKey = createMemo(() => {
      const items = own.items ?? []
      return (index: number) => items[index]?.value ?? index
    })
    function Bind(): JSX.Element {
      setList(useVirtualList())
      onCleanup(() => setList(undefined))
      return undefined
    }
    function Row(row: { item: VirtualItem }): JSX.Element {
      const value = String(untrack(() => row.item.key))
      const item = untrack(() => data().get(value)) ?? { value }
      let element: HTMLElement | undefined
      onCleanup(() => {
        if (element && rows.get(value) === element) rows.delete(value)
      })
      return (
        <VirtualList.Item
          item={row.item}
          {...spread(engine().parts.item(value))}
          ref={(node: HTMLElement) => {
            element = node
            rows.set(value, node)
          }}
        >
          {render(item)}
        </VirtualList.Item>
      )
    }
    // eslint-disable-next-line solid/components-return-once -- virtual is read once.
    return (
      <VirtualList
        as={own.as}
        ref={(node: HTMLElement) => {
          host = node
          setRef(() => own.ref, node)
        }}
        {...spread(
          {
            ...engine().parts.root,
            on: {
              ...engine().parts.root.on,
              // Focus parked on the root for a scrolled-out row must not pull the list back.
              focus(event: FocusEvent & { currentTarget: HTMLDivElement }) {
                if (!untrack(list)?.holding()) engine().parts.root.on.focus?.(event)
              },
            },
          },
          { ...rest }
        )}
        {...virtual}
        count={own.items?.length ?? 0}
        getKey={getKey()}
      >
        <Bind />
        <VirtualList.Viewport>{(item: VirtualItem) => <Row item={item} />}</VirtualList.Viewport>
      </VirtualList>
    )
  }
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      ref={(node: HTMLElement) => {
        host = node
        setRef(() => own.ref, node)
      }}
      {...spread(engine().parts.root, { ...rest })}
    >
      {content()}
    </Host>
  )
}
/** Registers an enabled-only option with the nearest Listbox. Throws without a root. */
export function ListboxItem<T extends ValidComponent = 'div'>(
  props: ListboxItemProps<T>
): JSX.Element {
  const own = props as ItemOwn & { as?: ValidComponent }
  const context = useContext(Context)
  if (!context) throw new Error('Listbox.Item must be rendered inside <Listbox>')
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'value',
    'textValue',
    'disabled',
    'children'
  )
  const children = createMemo(() => props.children as JSX.Element)
  const entry: Entry = {
    value: () => own.value,
    disabled: () => booleanAttribute(own.disabled),
    text: () => own.textValue ?? entry.el?.textContent ?? own.value,
  }
  onSettled(() => context.register(entry))
  const part = () => {
    const core = context.engine().parts.item(own.value)
    return {
      ...core,
      on: {
        ...core.on,
        pointerdown(event: PointerEvent) {
          if (context.virtualFocus()) event.preventDefault()
        },
      },
    }
  }
  const Host = dynamic(() => own.as ?? 'div')
  return (
    <Host
      ref={(node: HTMLElement) => {
        entry.el = node
        setRef(() => own.ref, node)
      }}
      {...spread(part(), { ...rest })}
    >
      {children()}
    </Host>
  )
}
/** Standalone listbox with single/multiple selection and compound options. */
export const Listbox = Object.assign(ListboxRoot, {
  /** Root alias for explicit compound composition. */
  Root: ListboxRoot,
  /** Option requiring a Listbox ancestor. */
  Item: ListboxItem,
})
export { getListboxItemId }
export type { ListboxValue }
