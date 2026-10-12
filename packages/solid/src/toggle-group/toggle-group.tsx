import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import type { ToggleGroupOptions } from '@xenon-ui/core'
import { toggleGroup } from '@xenon-ui/core'
import type { ToggleGroupMode } from '@xenon-ui/core'
import type { ToggleHost } from '@xenon-ui/core'
import type { CompositeDirection } from '@xenon-ui/core'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { ToggleGroupContext, useToggleGroup } from './context'
import type { ToggleGroupContextValue, ToggleGroupEntry } from './context'
import { gate } from '../internal/gate'
import { spread } from '../spread'
import { toolbarHost } from '../internal/toolbar-host'

/** Unified internal payload: scalar/undefined in single mode, array in multiple mode. */
type GroupValue = ToggleGroupOptions<string>['value']

/** Group-owned navigation and host props shared by both selection modes. */
interface Shared extends Pick<ToggleGroupOptions<string>, 'orientation' | 'loop' | 'disabled'> {
  /** Single arrow-navigation axis; defaults to horizontal. */
  orientation?: Exclude<ToggleGroupOptions<string>['orientation'], 'both'>
  /** Horizontal navigation direction. Omission reads nearest dir ancestor or document dir after settling, starting at ltr. */
  dir?: ToggleGroupOptions<string>['direction']
  /** Receives the rendered group host; custom components must forward it. */
  ref?: unknown
  /** Block all selection changes and gated author activation handlers while retaining navigation. Defaults to false. */
  disabled?: ToggleGroupOptions<string>['disabled']
}

/** Single selection, including an empty state after pressing the selected item again. */
interface Single {
  /** Select at most one item. This is the default mode. */
  mode?: 'single'
  /** Controlled selection when defined; undefined uses internal state. */
  value?: string
  /** Initial uncontrolled selection; later changes are ignored. Defaults to empty. */
  defaultValue?: string
  /** Reports the selected key or undefined after accepted activation; uncontrolled state updates first. */
  onValueChange?: (value: string | undefined) => void
}

/** Independent pressed membership with an array payload; empty arrays are allowed. */
interface Multiple {
  /** Enable multiple selection and array callback payloads. */
  mode: 'multiple'
  /** Controlled membership when defined, including an empty array; undefined uses internal state. */
  value?: readonly string[]
  /** Initial uncontrolled membership; later changes are ignored. Defaults to empty. */
  defaultValue?: readonly string[]
  /** Reports the next membership array after accepted activation; uncontrolled state updates first. */
  onValueChange?: (value: readonly string[]) => void
}

/** Internal unified view of the public discriminated selection props. */
type Own = Shared & { mode?: ToggleGroupMode } & {
  value?: GroupValue
  defaultValue?: GroupValue
  onValueChange?: (value: GroupValue) => void
  as?: ValidComponent
}

/** Item-owned identity, disabled state, and host ref. */
interface ItemOwn {
  /** Unique group selection key. Changing it changes the identity used by selection and navigation. */
  value: string
  /** Block activation, OR-combined with group disabled; the item remains a keyboard destination. Defaults to false. */
  disabled?: boolean
  /** Receives the visible item host, used for navigation focus and registration ordering. */
  ref?: unknown
}

/** Polymorphic group props with mode-specific controlled/uncontrolled selection. */
export type ToggleGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Shared, 'ref'> | 'mode' | 'value' | 'defaultValue' | 'onValueChange' | 'as'
> &
  NativeBooleanAttributes<Omit<Shared, 'ref'>> &
  (Single | Multiple) & {
    /** Group host, defaulting to div. Custom components must forward props and refs. */
    as?: T
  }

/** Polymorphic toggle item props; remaining host attributes override core defaults through spread. */
export type ToggleGroupItemProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  Exclude<keyof ItemOwn, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<ItemOwn, 'ref'>> & {
    /** Item host: omitted/button uses button semantics, input uses input-button semantics, and other values are generic. */
    as?: T
  }

/** Sorts available item hosts by document position; missing hosts retain their registration order. */
function byDomOrder(a: ToggleGroupEntry, b: ToggleGroupEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/** Infers core host semantics from the literal as value, without inspecting custom component output. */
function hostOf(as: ValidComponent | undefined): ToggleHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  return 'generic'
}

/**
 * Owns selection state and a DOM-ordered item registry with independent roving focus.
 * Controlled mode is determined whenever value is read. onValueChange fires only
 * for accepted activation, never initialization or navigation. In single mode,
 * setting value to undefined releases control to internal state.
 * Item registration occurs after settling; direction is sampled after the root
 * settles, without observing later ancestor dir changes. Navigation updates active
 * immediately and focuses its registered host after settling.
 */
function ToggleGroupRoot<T extends ValidComponent = 'div'>(
  props: ToggleGroupProps<T>
): JSX.Element {
  const own = props as unknown as Own
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'mode',
    'value',
    'defaultValue',
    'onValueChange',
    'orientation',
    'dir',
    'loop',
    'disabled',
    'ref',
    'children'
  )

  // Keyed children unregister while Solid disposes an owned computation.
  const [entries, setEntries] = createSignal<ToggleGroupEntry[]>([], { ownedWrite: true })
  const [active, setActive] = createSignal<string>()
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')
  const [internal, setInternal] = createSignal<GroupValue>(untrack(() => own.defaultValue))

  const mode = () => own.mode ?? 'single'
  const orientation = () => own.orientation ?? 'horizontal'
  const disabled = () => booleanAttribute(own.disabled)
  const controlled = () => own.value !== undefined
  const current = () => own.value ?? internal()

  /** Resolves the first registered entry with this current value; callers must avoid duplicate keys. */
  const entryFor = (value: string) => entries().find((entry) => entry.value() === value)

  /** Stores a proposal only while uncontrolled, then notifies the current callback. */
  const change = (next: GroupValue) => {
    if (!untrack(controlled)) setInternal(next)
    own.onValueChange?.(next)
  }

  const engine = createMemo(() =>
    toggleGroup<string>({
      items: entries().map((entry) => entry.value()),
      mode: mode(),
      value: current(),
      active: active(),
      disabled: disabled(),
      itemDisabled: (value) => entryFor(value)?.disabled() ?? false,
      host: (value) => entryFor(value)?.host() ?? 'button',
      orientation: orientation(),
      direction: own.dir ?? ambient(),
      loop: own.loop ?? true,
      onValueChange: change,
      onActiveChange: (value) => {
        setActive(value)
        onSettled(() => entryFor(value)?.el?.focus())
      },
    })
  )

  let registered: ToggleGroupEntry[] = []
  /** Sorts on addition and publishes removals; no observer tracks later DOM-only reordering. */
  const register = (entry: ToggleGroupEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      setEntries(registered)
    }
  }

  const context: ToggleGroupContextValue = {
    register,
    part: (entry) => engine().parts.item(entry.value()),
    disabled,
  }

  const content = createMemo(() => (
    <ToggleGroupContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </ToggleGroupContext>
  ))

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(() => own.ref, node)
  }

  onSettled(() => {
    if (!el) return
    const nearest = el.closest('[dir]')
    const value = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(value === 'rtl' ? 'rtl' : 'ltr')
  })

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  return (
    <Host ref={ref} {...spread(engine().parts.root, { ...rest })}>
      {content()}
    </Host>
  )
}

/**
 * Registers one toggle host with the enclosing group after settling and unregisters
 * through lifecycle cleanup. Disabled items retain their roving focus behavior.
 * Author handlers run before core handlers and may cancel them; selected activation
 * handlers are gated while disabled. Generic hosts add Enter/Space activation.
 * Toolbar.Button composition shares the toolbar tab stop and delegates its axis
 * arrows, Home, and End to the toolbar, preserving explicit author overrides.
 * @throws If rendered outside a ToggleGroup.
 */
function ToggleGroupItem<T extends ValidComponent = 'button'>(
  props: ToggleGroupItemProps<T>
): JSX.Element {
  const own = props as ItemOwn & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'disabled', 'ref')
  const context = useToggleGroup('ToggleGroup.Item')
  const composed = toolbarHost(() => own.as)

  const entry: ToggleGroupEntry = {
    el: null,
    value: () => own.value,
    disabled: () => booleanAttribute(own.disabled),
    host: () => (composed.matches() ? 'button' : hostOf(own.as)),
  }

  const interactive = () => !context.disabled() && !entry.disabled()

  const ref = (node: HTMLElement) => {
    entry.el = node
    setRef(() => own.ref, node)
  }

  onSettled(() => context.register(entry))

  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    gate(out, interactive)
    return out
  }

  const Host = dynamic(() => (own.as ?? 'button') as ValidComponent)
  return <Host ref={ref} {...spread(composed.part(context.part(entry)), merged())} />
}

/**
 * Group of pressed buttons with single or multiple selection and independent arrow navigation.
 * Renders group semantics, not a radiogroup. Provide an accessible group name and
 * distinct item values. No hidden form inputs or form-reset selection handling are installed.
 */
export const ToggleGroup = Object.assign(ToggleGroupRoot, {
  /** Toggle item requiring this group's context; see {@link ToggleGroupItemProps}. */
  Item: ToggleGroupItem,
})
