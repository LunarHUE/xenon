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

export interface MenuProps {
  children?: JSX.Element
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  forceMount?: boolean
  dir?: 'ltr' | 'rtl'
  loop?: boolean
}
export function MenuRoot(props: MenuProps): JSX.Element {
  return createMenu(props)
}
export function MenuSub(props: MenuProps): JSX.Element {
  const parent = useContext(MenuContext)
  if (!parent) throw new Error('Menu.Sub must be rendered inside <Menu>')
  return createMenu(props, parent)
}
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
  let edge: 'first' | 'last' = 'first'
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let hoverTimer: ReturnType<typeof setTimeout> | undefined
  const open = () => (parent?.open() ?? true) && (props.open ?? internal())
  const focus = (entry?: MenuEntry) => {
    setActive(entry)
    entry?.el?.focus({ preventScroll: true })
  }
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
