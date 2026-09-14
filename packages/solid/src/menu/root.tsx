import { menu } from '@tenon/core/menu'
import { isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { serverAssociations } from '../field/server-associations'
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js'
import { createPresence } from '../internal/presence'
import { MenuContext } from './context'
import type { MenuContextValue, MenuEntry } from './context'

/** Shared logical root/submenu props; neither component renders a wrapper host. */
export interface MenuProps {
  /** Menu parts rendered beneath this provider. */
  children?: JSX.Element
  /** Controlled local visibility when defined; undefined uses internal state. Submenus also require their parent to be open. */
  open?: boolean
  /** Initial uncontrolled local visibility, defaulting to false; subsequent changes are ignored. */
  defaultOpen?: boolean
  /** Reports changed effective visibility requests after updating uncontrolled state. Initialization and parent-driven closure are silent. */
  onOpenChange?: (open: boolean) => void
  /** Keep content present after closing; defaults to false. Does not keep the hosting session active after exit. */
  forceMount?: boolean
  /** Own submenu-key direction, otherwise inherited from parent or nearest trigger dir attribute; defaults to ltr. */
  dir?: 'ltr' | 'rtl'
  /** Wrap vertical arrow navigation, including disabled entries. Defaults to true through the core menu. */
  loop?: boolean
}
/**
 * Provides an independent menu state and association scope without a wrapper element.
 * Controlled mode is determined from open on each read. Presence and timers belong
 * to this owner; rendering, hosting, and item behavior are supplied by child parts.
 */
export function MenuRoot(props: MenuProps): JSX.Element {
  return createMenu(props)
}
/**
 * Provides submenu state linked to the nearest menu. Effective visibility is gated
 * by the parent. On the client, parent closure resets internal local open state
 * without a callback; a controlled true prop can reopen when its parent reopens.
 * @throws If rendered outside a Menu provider.
 */
export function MenuSub(props: MenuProps): JSX.Element {
  const parent = useContext(MenuContext)
  if (!parent) throw new Error('Menu.Sub must be rendered inside <Menu>')
  return createMenu(props, parent)
}
/**
 * Owns selection-independent active identity, registration order, presence, and timers.
 *
 * @remarks
 * Core typeahead requests restart a 700ms buffer timeout. Hover leave closes this
 * menu after 200ms without restoration; entering it cancels timers up the parent
 * chain. Owner cleanup cancels both timers. Navigation focus is synchronous and
 * includes disabled entries; typeahead skips disabled matches.
 * ID-reader slots use latest-owner cleanup rather than a stack of prior claims.
 * Server association markers finalize after descendant serialization, while client
 * changes publish a revision. This provider itself neither restores focus nor
 * installs dismissal listeners; content consumes the shared policies.
 */
function createMenu(props: MenuProps, parent?: MenuContextValue): JSX.Element {
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [trigger, setTrigger] = createSignal<HTMLElement>()
  const [content, setContent] = createSignal<HTMLElement>()
  const [entries, setEntries] = createSignal<MenuEntry[]>([], { ownedWrite: true })
  const [active, setActive] = createSignal<MenuEntry>()
  const [search, setSearch] = createSignal('')
  const [restore, setRestore] = createSignal(true)
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let version = 0
  let triggerRead = () => `${base}-trigger`
  let contentRead = () => `${base}-content`
  const triggerId = () => {
    revision()
    return triggerRead()
  }
  const contentId = () => {
    revision()
    return contentRead()
  }
  const associations = isServer ? serverAssociations() : undefined
  let registered: MenuEntry[] = []
  /** Requested opening edge, retained for the content focus scope's initial target. */
  let edge: 'first' | 'last' = 'first'
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimer: ReturnType<typeof setTimeout> | undefined
  const open = () => (parent?.open() ?? true) && (props.open ?? internal())
  /** Stores active identity before focusing its current host without scrolling. */
  const focus = (entry?: MenuEntry) => {
    setActive(entry)
    entry?.el?.focus({ preventScroll: true })
  }
  /** Deduplicates against effective visibility; opening again focuses an edge, while closing resets search. */
  const change = (next: boolean, requested?: 'first' | 'last') => {
    if (next) {
      edge = requested ?? 'first'
      setRestore(true)
      if (untrack(open)) {
        focus(edge === 'first' ? entries()[0] : entries().at(-1))
        return
      }
    } else {
      clearTimeout(searchTimer)
      setSearch('')
    }
    if (untrack(open) === next) return
    if (props.open === undefined) setInternal(next)
    props.onOpenChange?.(next)
  }
  if (parent)
    createEffect(
      () => parent.open(),
      (value) => {
        if (!value && !isServer) setInternal(false)
      }
    )
  const life = createPresence({ open, forceMount: () => props.forceMount ?? false })
  /** Builds core navigation and typeahead, renewing the buffer timeout on each search request. */
  const compute = () =>
    menu({
      open: open(),
      items: entries(),
      active: active(),
      loop: props.loop,
      ids: { trigger: triggerId(), content: contentId() },
      disabled: (entry: MenuEntry) => entry.disabled(),
      textValue: (entry: MenuEntry) => entry.text(),
      search: search(),
      onActiveChange: focus,
      onOpenChange: change,
      onSearchChange(value: string) {
        setSearch(value)
        clearTimeout(searchTimer)
        searchTimer = setTimeout(() => setSearch(''), 700)
      },
    })
  const memo = createMemo(compute)
  const engine = isServer ? compute : memo
  const context: MenuContextValue = {
    parent,
    open,
    change,
    restore,
    engine,
    life,
    trigger,
    setTrigger,
    content,
    dir: () =>
      props.dir ??
      parent?.dir() ??
      (trigger()?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr'),
    closeAll(shouldRestore = true) {
      setRestore(shouldRestore)
      change(false)
      parent?.closeAll(shouldRestore)
    },
    focus,
    initial: () => (edge === 'last' ? entries().at(-1) : entries()[0])?.el ?? content(),
    setContent(el) {
      life.ref(el)
      setContent(el)
    },
    triggerId,
    contentId,
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
    setContentId(read) {
      contentRead = read
      if (!isServer) setRevision(++version)
      return () => {
        if (contentRead === read) {
          contentRead = () => `${base}-content`
          if (!isServer) setRevision(++version)
        }
      }
    },
    setTriggerId(read) {
      triggerRead = read
      if (!isServer) setRevision(++version)
      return () => {
        if (triggerRead === read) {
          triggerRead = () => `${base}-trigger`
          if (!isServer) setRevision(++version)
        }
      }
    },
    register(entry) {
      registered = [...registered, entry].sort((a, b) =>
        a.el && b.el ? (a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1) : 0
      )
      setEntries(registered)
      return () => {
        registered = registered.filter((item) => item !== entry)
        setEntries(registered)
      }
    },
    enter() {
      clearTimeout(hoverTimer)
      parent?.enter()
    },
    leave() {
      clearTimeout(hoverTimer)
      hoverTimer = setTimeout(() => {
        setRestore(false)
        change(false)
      }, 200)
    },
  }
  onCleanup(() => {
    clearTimeout(searchTimer)
    clearTimeout(hoverTimer)
  })
  const inner = createMemo(() => <MenuContext value={context}>{props.children}</MenuContext>)
  const element = <>{inner()}</>
  return associations ? associations.finish(element) : element
}
