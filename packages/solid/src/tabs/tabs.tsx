import type { AnyPart, CompositeDirection } from '@tenon/core'
import { tabs } from '@tenon/core'
import type { TabsActivationMode, TabsOrientation } from '@tenon/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, onSettled, untrack } from 'solid-js'

import { TabsContext } from './context'
import type { TabEntry, TabsContextValue } from './context'
import { TabsList, TabsPanel, TabsTab } from './parts'
import { spread } from '../spread'

/** Library-owned selection and navigation policy for a Tabs root. */
interface Own {
  /** Controlled selection when defined. Unknown client values normalize to the first enabled tab, then the first tab. */
  value?: string
  /** Initial uncontrolled selection, read once; omission lets the core choose the first enabled tab. */
  defaultValue?: string
  /** Synchronously reports a different selection after updating uncontrolled state. Initialization is silent; controlled callers must supply the next value. */
  onValueChange?: (value: string) => void
  /** Automatic selection during navigation by default; manual mode waits for tab activation. */
  activationMode?: TabsActivationMode
  /** Arrow-navigation axis and orientation hooks. Defaults to horizontal. */
  orientation?: TabsOrientation
  /** Explicit horizontal arrow direction; omission samples the nearest dir attribute after settling, starting at ltr. */
  dir?: CompositeDirection
  /** Wrap arrow navigation at enabled ends. Defaults to true. */
  loop?: boolean
  /** Disable all tab buttons and exclude them from keyboard destinations. Defaults to false. */
  disabled?: boolean
  /** Receives the root host, used for ambient direction lookup; custom hosts must forward it. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic root props with controlled/uncontrolled selection and navigation settings. */
export type TabsProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Root host or forwarding component, defaulting to div. */
    as?: T
  }

/** Sorts entries with known hosts by DOM position; missing hosts compare equally. */
function byDomOrder(a: TabEntry, b: TabEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Owns tab registrations, paired IDs, selection, and the separately focused value.
 *
 * @remarks
 * Controlled mode is checked whenever value is read. Navigation schedules DOM
 * focus after settling; leaving the list clears the focused value so the selected
 * tab regains the tab stop. Ambient direction is sampled after settling without
 * observing later ancestor changes. Author root attributes override core hooks.
 * Server reads rebuild from registrations collected so far. Generated tab/panel
 * IDs share a stable per-value ordinal; explicit IDs are claimed only on the client.
 */
function TabsRoot<T extends ValidComponent = 'div'>(props: TabsProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'defaultValue',
    'onValueChange',
    'activationMode',
    'orientation',
    'dir',
    'loop',
    'disabled',
    'ref',
    'children'
  )

  // Keyed tab disposal unregisters while its parent computation is running.
  const [entries, setEntries] = createSignal<TabEntry[]>([], { ownedWrite: true })
  const [focused, setFocused] = createSignal<string>()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultValue))
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')
  const [claimed, setClaimed] = createSignal<Record<string, string>>({})
  const [focusable, setFocusable] = createSignal<Record<string, boolean>>({})

  const base = createUniqueId()
  const ordinals = new Map<string, number>()
  /** Assigns an ordinal once per encountered value and retains it until root disposal. */
  const ordinalOf = (value: string) => {
    let ordinal = ordinals.get(value)
    if (ordinal === undefined) {
      ordinal = ordinals.size
      ordinals.set(value, ordinal)
    }
    return ordinal
  }
  /** Uses a retained author claim before generating the paired part ID. */
  const idFor = (part: 'tab' | 'panel', value: string) =>
    claimed()[`${part}:${value}`] ?? `${base}-${part}-${ordinalOf(value)}`

  const orientation = () => own.orientation ?? 'horizontal'
  const direction = () => own.dir ?? ambient()
  const disabled = () => own.disabled ?? false
  const controlled = () => own.value !== undefined
  const current = () => own.value ?? internal()

  let registered: TabEntry[] = []
  const items = createMemo(() => entries().map((entry) => entry.value()))
  const entryOf = (value: string) =>
    (isServer ? registered : entries()).find((entry) => entry.value() === value)

  /** Filters disabled entries only without an explicit selection, and includes that selection before its tab registers. */
  const serverItems = () => {
    const selected = current()
    const values = registered
      .filter((entry) => selected !== undefined || !entry.disabled())
      .map((entry) => entry.value())
    if (selected !== undefined && !values.includes(selected)) values.push(selected)
    return values
  }
  const build = () =>
    tabs<string>({
      items: isServer ? serverItems() : items(),
      ids: {
        tab: (value) => idFor('tab', value),
        panel: (value) => idFor('panel', value),
      },
      value: current(),
      active: focused(),
      disabled: (value) => disabled() || (entryOf(value)?.disabled() ?? false),
      panelFocusable: (value) => focusable()[value] ?? false,
      orientation: orientation(),
      direction: direction(),
      loop: own.loop,
      activationMode: own.activationMode,
      onValueChange(value) {
        if (!untrack(controlled)) setInternal(value)
        own.onValueChange?.(value)
      },
      onActiveChange(value) {
        setFocused(value)
        if (value === undefined) return
        onSettled(() => entryOf(value)?.el?.focus())
      },
    })
  const result = createMemo(build)
  const engine = () => (isServer ? build() : result())
  /** Sorts on addition and removes by identity; DOM-only reordering does not re-sort the registry. */
  const register = (entry: TabEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    if (!isServer) setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      if (!isServer) setEntries(registered)
    }
  }

  const context: TabsContextValue = {
    register,
    claimId: (part, value, id) => setClaimed((prev) => ({ ...prev, [`${part}:${value}`]: id })),
    probePanel: (value, next) =>
      setFocusable((prev) => (prev[value] === next ? prev : { ...prev, [value]: next })),
    listPart: () => engine().parts.list,
    tabPart: (value) => engine().parts.tab(value),
    panelPart: (value) => engine().parts.panel(value),
    orientation,
    disabled,
  }

  const content = createMemo(() => (
    <TabsContext value={context}>{(props as { children?: JSX.Element }).children}</TabsContext>
  ))

  const part = (): AnyPart => ({
    attrs: {
      ...engine().parts.root.attrs,
      'data-disabled': disabled() ? '' : undefined,
    },
    on: {},
  })

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  onSettled(() => {
    if (!el) return
    const nearest = el.closest('[dir]')
    const value = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(value === 'rtl' ? 'rtl' : 'ltr')
  })

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

/** Tabs root with List, Tab, and Panel parts that require its context. Panels stay mounted while inactive. */
export const Tabs = Object.assign(TabsRoot, {
  /** Tablist semantics and focus-leave reporting. Supply its accessible name. */
  List: TabsList,
  /** Registered button selecting the panel with the same value. */
  Tab: TabsTab,
  /** Persistently mounted panel with selection-driven hidden state and focusability probing. */
  Panel: TabsPanel,
})
