import type { AnyPart, CompositeDirection } from '@kit/core'
import { tabs } from '@kit/core'
import type { TabsActivationMode, TabsOrientation } from '@kit/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, onSettled, untrack } from 'solid-js'

import { TabsContext } from './context'
import type { TabEntry, TabsContextValue } from './context'
import { TabsList, TabsPanel, TabsTab } from './parts'
import { spread } from '../spread'

interface Own {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  activationMode?: TabsActivationMode
  orientation?: TabsOrientation
  dir?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

export type TabsProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function byDomOrder(a: TabEntry, b: TabEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

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
  const ordinalOf = (value: string) => {
    let ordinal = ordinals.get(value)
    if (ordinal === undefined) {
      ordinal = ordinals.size
      ordinals.set(value, ordinal)
    }
    return ordinal
  }
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

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab: TabsTab,
  Panel: TabsPanel,
})
