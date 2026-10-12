import { booleanAttribute, setRef } from '../internal/host'
import type { MenubarOptions } from '@xenon-ui/core/menubar'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js'
import { menubar } from '@xenon-ui/core/menubar'
import { MenuRoot } from '../menu/root'
import type { MenuProps } from '../menu/root'
import { MenuContent } from '../menu/content'
import type { MenuContentProps } from '../menu/content'
import { useMenu } from '../menu/context'
import type { MenuContextValue, MenuTriggerEntry } from '../menu/context'
import { spread } from '../spread'

interface Entry {
  value: string
  menu: MenuContextValue
  trigger?: MenuTriggerEntry
}
interface BarContext {
  value(): string | undefined
  register(entry: Entry): () => void
  activate(entry: Entry | undefined, edge?: 'first' | 'last' | 'content'): void
  change(value: string | undefined): void
  engine(): ReturnType<typeof menubar<Entry>>
  focus(entry: Entry): void
  move(entry: Entry, event: KeyboardEvent): void
  dir(): 'ltr' | 'rtl'
}
const BarContext = createContext<BarContext>()
const EntryContext = createContext<Entry>()
function useBar() {
  const bar = useContext(BarContext)
  if (!bar) throw new Error('Menubar parts must be rendered inside Menubar')
  return bar
}
/** Menubar container props and caller-owned open identity. */
export type MenubarProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'value' | 'defaultValue' | 'onValueChange'
> & {
  /** Container host; defaults to div. Supply aria-label or aria-labelledby. */
  as?: T
  /** Controlled open menu identity; null closes all menus and undefined uses internal state. Empty string is a valid identity. */
  value?: string | null
  /** Initial uncontrolled open menu identity; defaults to null. */
  defaultValue?: string | null
  /** Reports requested open identity; null means all closed. Initialization is silent. */
  onValueChange?: (value: string | null) => void
  /** Top-level navigation axis; defaults to horizontal. */
  orientation?: MenubarOptions<string>['orientation']
  /** Wrap enabled trigger navigation; defaults to true. */
  loop?: MenubarOptions<string>['loop']
  /** Navigation direction; defaults to ltr. */
  dir?: MenubarOptions<string>['dir']
}
/** Persistent menuitem row with one open popup and an enabled roving tab stop. Focus alone and hover over a closed bar never open a menu. */
export function MenubarRoot<T extends ValidComponent = 'div'>(props: MenubarProps<T>): JSX.Element {
  const own = props as MenubarProps<'div'>
  const [internal, setInternal] = createSignal<string | null>(
    untrack(() => props.defaultValue ?? null),
    { ownedWrite: true }
  )
  let registered: Entry[] = []
  const [entrySignal, setEntries] = createSignal<Entry[]>([], { ownedWrite: true })
  const entries = () => (isServer ? registered : entrySignal())
  // Popup disposal can synchronously restore native focus during reconciliation.
  const [active, setActive] = createSignal<Entry | undefined>(undefined, { ownedWrite: true })
  const value = () => {
    const selected = props.value === undefined ? internal() : props.value
    return selected === null ? undefined : selected
  }
  const change = (next: string | undefined) => {
    if (next === untrack(value)) return
    if (props.value === undefined) setInternal(next ?? null)
    props.onValueChange?.(next ?? null)
  }
  function focus(entry: Entry) {
    setActive(entry)
    entry.trigger?.element?.focus({ preventScroll: true })
  }
  function activate(entry: Entry | undefined, edge: 'first' | 'last' | 'content' = 'first') {
    const previous = entries().find((item) => item.value === value())
    if (previous && previous !== entry) {
      previous.menu.resetChildren()
      previous.menu.closeAll(false)
      if (!entry) return
    }
    if (entry?.trigger) {
      setActive(entry)
      entry.menu.activate(entry.trigger, edge)
    } else if (!entry) change(undefined)
  }
  function navigate(entry: Entry) {
    const opened = value() !== undefined
    focus(entry)
    if (opened) activate(entry)
  }
  const compute = () =>
    menubar({
      items: entries(),
      active: active(),
      value: entries().find((entry) => entry.value === value()),
      disabled: (entry: Entry) => !entry.trigger || entry.trigger.disabled(),
      textValue: (entry: Entry) => entry.trigger?.element?.textContent ?? '',
      orientation: props.orientation,
      dir: props.dir,
      loop: props.loop,
      onActiveChange: navigate,
      onValueChange: activate,
    })
  const memo = createMemo(compute)
  const engine = isServer ? compute : memo
  const bar: BarContext = {
    value,
    change,
    activate,
    engine,
    focus,
    dir: () => props.dir ?? 'ltr',
    register(entry) {
      registered = [...registered, entry]
      if (!isServer) setEntries(registered)
      return () => {
        registered = registered.filter((item) => item !== entry)
        if (!isServer) setEntries(registered)
        // Removing an uncontrolled open menu ends the session. Otherwise the
        // next arrow movement treats its stale identity as an open popup.
        if (untrack(() => props.value === undefined && internal() === entry.value))
          setInternal(null)
      }
    },
    move(entry, event) {
      engine()
        .parts.trigger(entry)
        .on.keydown?.(event as never)
    },
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'loop'
  )
  const children = createMemo(() => <BarContext value={bar}>{own.children}</BarContext>)
  const Host = dynamic(() => own.as ?? 'div')
  return <Host {...spread(engine().parts.root, { ...rest })}>{children()}</Host>
}
/** One top-level menu's identity and shared Menu settings. */
export interface MenubarMenuProps extends Omit<MenuProps, 'open' | 'defaultOpen' | 'children'> {
  /** Trigger, positioner, and item parts for this menu. */
  children?: JSX.Element
  /** Unique identity within this menubar. */
  value: string
}
/** Connects a top-level Menu state provider to the containing menubar. */
export function MenubarMenu(props: MenubarMenuProps): JSX.Element {
  const bar = useBar()
  const rest = omit(
    props as unknown as Record<string, unknown>,
    'children',
    'value',
    'onOpenChange'
  )
  function Bridge(): JSX.Element {
    const menu = useMenu('Menubar.Menu')
    const entry: Entry = {
      get value() {
        return props.value
      },
      menu,
    }
    const children = createMemo(() => (
      <EntryContext value={entry}>{props.children as JSX.Element}</EntryContext>
    ))
    return <>{children()}</>
  }
  return (
    <MenuRoot
      {...rest}
      dir={props.dir ?? bar.dir()}
      open={bar.value() === props.value}
      onOpenChange={(open) => {
        bar.change(open ? props.value : undefined)
        props.onOpenChange?.(open)
      }}
    >
      <Bridge />
    </MenuRoot>
  )
}
/** Top-level button props. */
export type MenubarTriggerProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Trigger host; defaults to button. */
  as?: T
  /** Skip this trigger during navigation and block opening. */
  disabled?: JSX.BooleanAttribute
}
/** Menuitem trigger with roving focus, click toggling, and hover switching only while a menu is open. */
export function MenubarTrigger<T extends ValidComponent = 'button'>(
  props: MenubarTriggerProps<T>
): JSX.Element {
  const bar = useBar()
  const entry = useContext(EntryContext)
  if (!entry) throw new Error('Menubar.Trigger must be rendered inside Menubar.Menu')
  const own = props as MenubarTriggerProps<'button'>
  const id = createUniqueId()
  const trigger: MenuTriggerEntry = {
    id: () => (typeof own.id === 'string' ? own.id : id),
    disabled: () => booleanAttribute(own.disabled),
    payload: () => undefined,
  }
  entry.trigger = trigger
  onCleanup(entry.menu.registerTrigger(trigger))
  onCleanup(bar.register(entry))
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'ref', 'disabled')
  const part = () => {
    const shared = bar.engine().parts.trigger(entry)
    return {
      ...shared,
      attrs: {
        ...shared.attrs,
        id: trigger.id(),
        'aria-controls': entry.menu.association('aria-controls', () =>
          entry.menu.open() ? entry.menu.contentId() : undefined
        ),
        'data-state': entry.menu.open() ? 'open' : 'closed',
      },
      on: {
        ...shared.on,
        focus() {
          bar.focus(entry)
        },
        pointerenter() {
          if (bar.value() !== undefined && bar.value() !== entry.value && !trigger.disabled())
            bar.activate(entry, 'content')
        },
      },
    }
  }
  const children = createMemo(() => own.children)
  const Host = dynamic(() => own.as ?? 'button')
  return (
    <Host
      {...spread(part(), { ...rest })}
      ref={(element: HTMLElement) => {
        trigger.element = element
        entry.menu.setTrigger(element)
        setRef(own.ref, element)
      }}
    >
      {children()}
    </Host>
  )
}
/** Menu surface props; horizontal keys hand focus to adjacent top-level menus. */
export type MenubarContentProps<T extends ValidComponent = 'div'> = MenuContentProps<T>
/** Shared Menu surface with top-level left/right switching. Nested submenu back keys retain Menu's local close behavior. */
export function MenubarContent<T extends ValidComponent = 'div'>(
  props: MenubarContentProps<T>
): JSX.Element {
  const bar = useBar()
  const entry = useContext(EntryContext)
  const menu = useMenu('Menubar.Content')
  const rest = omit(props as Record<string, unknown>, 'children')
  const children = createMemo(() => props.children)
  return (
    <MenuContent<ValidComponent>
      {...spread(
        {
          attrs: {},
          on: {
            keydown(event: KeyboardEvent) {
              if (
                !entry ||
                event.defaultPrevented ||
                event.isComposing ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey
              )
                return
              if ((event.target as HTMLElement).closest('[role="menu"]') !== menu.content()) return
              if (!menu.parent && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))
                bar.move(entry, event)
              else if (
                event.target === menu.content() &&
                ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)
              ) {
                event.preventDefault()
                menu.change(true, ['ArrowUp', 'End'].includes(event.key) ? 'last' : 'first')
              }
            },
          },
        },
        { ...rest }
      )}
    >
      {children()}
    </MenuContent>
  )
}
