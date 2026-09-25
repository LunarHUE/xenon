import { listbox, getListboxItemId } from '@xenon-ui/core/listbox'
import type { ListboxOptions, ListboxValue } from '@xenon-ui/core/listbox'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
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
  ref?: (el: HTMLElement) => void
}
/** Polymorphic listbox root. Supply an accessible name and unique string values. */
export type ListboxProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
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
  disabled?: boolean
  /** Receives the rendered option host. */
  ref?: (el: HTMLElement) => void
}
/** Polymorphic option host; author handlers may cancel core behavior. */
export type ListboxItemProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  ItemOwn & {
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
    'onActiveChange'
  )
  const [value, setValue] = createSignal<ListboxValue>(untrack(() => own.defaultValue))
  const [activeValue, setActiveValue] = createSignal<string | undefined>(
    untrack(() => own.defaultActiveValue)
  )
  const [entries, setEntries] = createSignal<Entry[]>([], { ownedWrite: true })
  const [search, setSearch] = createSignal('')
  const [anchor, setAnchor] = createSignal<string>()
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr')
  let registered: Entry[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let host: HTMLElement | undefined
  let focusing = false
  const entryFor = (key: string) => entries().find((entry) => entry.value() === key)
  /** Reports each request once; synchronous DOM focus events must not report it again. */
  const focus = (next: string) => {
    if (focusing) return
    focusing = true
    try {
      const previous = own.activeValue ?? untrack(activeValue)
      if (own.activeValue === undefined) setActiveValue(next)
      if (previous !== next) own.onActiveChange?.(next)
      if (!own.virtualFocus) entryFor(next)?.el?.focus({ preventScroll: true })
    } finally {
      focusing = false
    }
  }
  const engine = createMemo(() =>
    listbox({
      items: entries().map((entry) => entry.value()),
      value: own.value ?? value(),
      activeValue: own.activeValue ?? activeValue(),
      selectionMode: own.selectionMode,
      disabled: own.disabled,
      readonly: own.readonly,
      loop: own.loop,
      orientation: own.orientation,
      dir: own.dir ?? ambient(),
      virtualFocus: own.virtualFocus,
      id: own.id ?? base,
      isItemDisabled: (key) => entryFor(key)?.disabled() ?? false,
      textValue: (key) => entryFor(key)?.text() ?? key,
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
  const content = createMemo(() => <Context value={context}>{own.children}</Context>)
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(node: HTMLElement) => {
        host = node
        own.ref?.(node)
      }}
      {...spread(engine().parts.root, { ...rest })}
    >
      {content()}
    </Dynamic>
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
    disabled: () => own.disabled ?? false,
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
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(node: HTMLElement) => {
        entry.el = node
        own.ref?.(node)
      }}
      {...spread(part(), { ...rest })}
    >
      {children()}
    </Dynamic>
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
