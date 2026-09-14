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
import type { MenuContextValue, MenuEntry, MenuTriggerEntry } from './context'
import { attachOverlayHandle, createOverlayHandle } from '../internal/overlay-handle'
import type { OverlayHandle } from '../internal/overlay-handle'
import type { LayerHandle } from '@tenon/dom'
import type { PositioningAnchor } from '../positioning'

/** Connects detached menu triggers and imperative requests to one mounted root. */
export type MenuHandle<Payload = unknown> = OverlayHandle<Payload, MenuContextValue>
/**
 * Create a typed handle for one mounted menu Root. Detached commands are ignored
 * without queuing. Opening requires an enabled registered trigger host;
 * openWithPayload uses the active or first registered trigger and preserves the
 * supplied data. Visibility requests still follow the Root's controlled policy.
 */
export function createMenuHandle<Payload = unknown>(): MenuHandle<Payload> {
  return createOverlayHandle<Payload, MenuContextValue>()
}
/** Live root render state. Read properties in JSX to retain Solid reactivity. */
export interface MenuRenderState<Payload = unknown> {
  /** Effective popup visibility. */
  readonly open: boolean
  /** Active opener ID. */
  readonly triggerId: string
  /** Active trigger's data or an imperative payload. */
  readonly payload: Payload | undefined
}

/** Shared logical root/submenu props; neither component renders a wrapper host. */
export interface MenuProps<Payload = unknown> {
  /** Static menu parts or a callback receiving live open, triggerId, and payload getters. Read callback state within JSX. */
  children?: JSX.Element | ((state: MenuRenderState<Payload>) => JSX.Element)
  /** Shares this root with detached triggers. One root may attach at a time. */
  handle?: MenuHandle<Payload>
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
export function MenuRoot<Payload = unknown>(props: MenuProps<Payload>): JSX.Element {
  return createMenu(props)
}
/**
 * Provides submenu state linked to the nearest menu. Effective visibility is gated
 * by the parent. On the client, parent closure resets internal local open state
 * without a callback; a controlled true prop can reopen when its parent reopens.
 * @throws If rendered outside a Menu provider.
 */
export function MenuSub<Payload = unknown>(props: MenuProps<Payload>): JSX.Element {
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
function createMenu<Payload>(props: MenuProps<Payload>, parent?: MenuContextValue): JSX.Element {
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const [anchor, setAnchor] = createSignal<PositioningAnchor>()
  const [payload, setPayload] = createSignal<unknown>()
  const [selectedTrigger, setSelectedTrigger] = createSignal<MenuTriggerEntry | undefined>(
    undefined,
    {
      ownedWrite: true,
    }
  )
  const [layer, setLayer] = createSignal<LayerHandle | undefined>(undefined, { ownedWrite: true })
  let triggers: MenuTriggerEntry[] = []
  const listeners = new Set<() => void>()
  const [content, setContent] = createSignal<HTMLElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const [entries, setEntries] = createSignal<MenuEntry[]>([], { ownedWrite: true })
  const [active, setActive] = createSignal<MenuEntry>()
  const [search, setSearch] = createSignal('')
  const [restore, setRestore] = createSignal(true)
  const [focusRevision, setFocusRevision] = createSignal(0)
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let version = 0
  let triggerRead = () => `${base}-trigger`
  let contentRead = () => `${base}-content`
  const triggerId = () => {
    revision()
    return selectedTrigger()?.id() ?? triggers[0]?.id() ?? triggerRead()
  }
  const contentId = () => {
    revision()
    return contentRead()
  }
  const associations = isServer ? serverAssociations() : undefined
  let registered: MenuEntry[] = []
  /** Requested opening edge, retained for the content focus scope's initial target. */
  let edge: 'first' | 'last' | 'content' = 'first'
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimer: ReturnType<typeof setTimeout> | undefined
  const open = () => (parent?.open() ?? true) && (props.open ?? internal())
  /** Stores active identity before focusing its current host without scrolling. */
  const focus = (entry?: MenuEntry) => {
    setActive(entry)
    entry?.el?.focus({ preventScroll: true })
  }
  /** Deduplicates against effective visibility; opening again focuses an edge, while closing resets search. */
  const change = (next: boolean, requested?: 'first' | 'last' | 'content') => {
    if (next) {
      edge = requested ?? 'first'
      setRestore(true)
      if (untrack(open)) {
        if (edge === 'content') {
          focus()
          content()?.focus({ preventScroll: true })
        } else focus(edge === 'first' ? entries()[0] : entries().at(-1))
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
    payload,
    focusRevision,
    triggerElements() {
      revision()
      return triggers.flatMap((entry) => (entry.element ? [entry.element] : []))
    },
    layer,
    setLayer,
    beforeChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    registerTrigger(entry) {
      triggers.push(entry)
      if (entry.element && !untrack(trigger)) setTrigger(entry.element)
      if (!isServer) setRevision(++version)
      return () => {
        triggers = triggers.filter((other) => other !== entry)
        if (untrack(selectedTrigger) === entry) {
          setSelectedTrigger(undefined)
          setTrigger(triggers[0]?.element)
        }
        if (!isServer) setRevision(++version)
      }
    },
    activeTrigger: (entry) => (selectedTrigger() ?? triggers[0]) === entry,
    activate(entry, requested, toggle = false) {
      if (entry.disabled() || !entry.element) return
      const same = context.activeTrigger(entry)
      const wasOpen = untrack(open)
      if (wasOpen && (!same || entry.payload() !== untrack(payload)))
        for (const listener of listeners) listener()
      setSelectedTrigger(entry)
      setTrigger(entry.element)
      setPayload(() => entry.payload())
      if (toggle && same && wasOpen) change(false)
      else {
        change(true, requested)
        if (wasOpen) setFocusRevision((value) => value + 1)
      }
    },
    parent,
    open,
    change,
    restore,
    engine,
    life,
    trigger,
    anchor: () => anchor() ?? trigger(),
    setAnchor,
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
    initial: () =>
      edge === 'content'
        ? content()
        : ((edge === 'last' ? entries().at(-1) : entries()[0])?.el ?? content()),
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
  const handle = untrack(() => props.handle)
  if (handle)
    onCleanup(
      attachOverlayHandle(handle, {
        context,
        readOpen: open,
        dispatch(command) {
          if (command.type === 'close') {
            context.closeAll()
            return
          }
          if (command.type === 'open') {
            const entry =
              command.triggerId === undefined
                ? (untrack(selectedTrigger) ?? triggers[0])
                : triggers.find((candidate) => candidate.id() === command.triggerId)
            if (entry) context.activate(entry)
            return
          }
          const entry = untrack(selectedTrigger) ?? triggers[0]
          if (!entry?.element || entry.disabled()) return
          if (untrack(open)) for (const listener of listeners) listener()
          setSelectedTrigger(entry)
          setTrigger(entry.element)
          setPayload(() => command.payload)
          change(true)
        },
      })
    )
  const state: MenuRenderState<Payload> = {
    get open() {
      return open()
    },
    get triggerId() {
      return triggerId()
    },
    get payload() {
      return payload() as Payload | undefined
    },
  }
  const renderChildren = () => {
    const children = props.children
    return typeof children === 'function' ? children(state) : children
  }
  const inner = createMemo(() => <MenuContext value={context}>{renderChildren()}</MenuContext>)
  const element = <>{inner()}</>
  return associations ? associations.finish(element) : element
}
