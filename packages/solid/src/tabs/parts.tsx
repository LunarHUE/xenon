import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit, onSettled } from 'solid-js'

import { useTabs } from './context'
import type { TabEntry } from './context'
import { hasFocusable } from './focusable'
import { Button } from '../button'
import type { ButtonProps } from '../button'
import { spread } from '../spread'

/** Library-owned tablist ref. */
interface ListOwn {
  /** Receives the rendered list host. */
  ref?: unknown
}

/** Selection identity and disabled state for one tab. */
interface TabOwn {
  /** Unique string key shared with the associated panel. */
  value: string
  /** OR-combined with root disabled state to block button activation and skip keyboard destinations. Defaults to false; composite focus reporting is not gated. */
  disabled?: boolean
  /** Receives the tab host used for registration order and deferred focus. */
  ref?: unknown
}

/** Panel identity and the ref used for descendant probing. */
interface PanelOwn {
  /** Key matching its tab; keep stable while mounted because the observer captures it after settling. */
  value: string
  /** Receives the panel host inspected by the focusability observer. */
  ref?: unknown
}

/** Polymorphic tablist props; remaining attributes and handlers merge over the core part. */
export type TabsListProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof ListOwn, 'ref'> | 'as'
> &
  Omit<ListOwn, 'ref'> & {
    /** List host or forwarding component, defaulting to div. */
    as?: T
  }

/** Polymorphic tab props; explicit host IDs are reflected in associations after client settling. */
export type TabsTabProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  Exclude<keyof TabOwn, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<TabOwn, 'ref'>> & {
    /** Host forwarded to Button, defaulting to button; custom components must forward props/ref. */
    as?: T
  }

/** Polymorphic panel props; author attributes may override generated hidden/tabindex values. */
export type TabsPanelProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof PanelOwn, 'ref'> | 'as'
> &
  Omit<PanelOwn, 'ref'> & {
    /** Panel host or forwarding component, defaulting to div. */
    as?: T
  }

/** Attributes that trigger a new structural focusability probe; child-list changes are also observed. */
const WATCHED = ['contenteditable', 'disabled', 'href', 'tabindex', 'type']

/**
 * Renders tablist role/orientation and resets the navigation target when focus leaves.
 * Author handlers run first; spread skips core only when defaultPrevented is true.
 * Native focusout is not cancelable, so preventDefault normally cannot suppress this handler.
 * @throws If rendered outside Tabs.
 */
export function TabsList<T extends ValidComponent = 'div'>(props: TabsListProps<T>): JSX.Element {
  const own = props as ListOwn & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  const context = useTabs('Tabs.List')

  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  const ref = (node: HTMLElement) => setRef(() => own.ref, node)

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  return (
    <Host ref={ref} {...spread(context.listPart(), { ...rest })}>
      {content()}
    </Host>
  )
}

/**
 * Registers a tab and composes core navigation/selection with Button activation.
 *
 * @remarks
 * Registers during SSR and after client settling, with client cleanup on disposal.
 * A supplied ID is forwarded immediately but claimed for linked attributes only
 * after client settling; claims remain until the root is disposed. Author handlers
 * precede core handlers and can cancel navigation or selection. Disabled state is
 * inherited from the root and forwarded to Button after author-prop merging.
 * @throws If rendered outside Tabs.
 */
export function TabsTab<T extends ValidComponent = 'button'>(props: TabsTabProps<T>): JSX.Element {
  const own = props as TabOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'value', 'disabled', 'ref')
  const context = useTabs('Tabs.Tab')

  const disabled = () => context.disabled() || booleanAttribute(own.disabled)
  const entry: TabEntry = { el: null, value: () => own.value, disabled }

  const ref = (node: HTMLElement) => {
    entry.el = node
    setRef(() => own.ref, node)
  }

  if (isServer) context.register(entry)

  onSettled(() => {
    if (own.id !== undefined) context.claimId('tab', own.value, own.id)
    return context.register(entry)
  })

  const merged = () => {
    const out = spread(context.tabPart(own.value), { ...rest })
    out['disabled'] = disabled()
    return out as unknown as ButtonProps
  }

  return <Button {...merged()} ref={ref} />
}

/**
 * Keeps a panel mounted and hides it while unselected, unless author props override hidden.
 *
 * @remarks
 * After client settling, claims any author ID and probes descendants with
 * {@link hasFocusable}. A selected panel gets tabindex=0 only when that probe is
 * false. A MutationObserver reruns it for child-list changes and WATCHED attributes
 * throughout the subtree, then disconnects on cleanup. It does not observe layout,
 * visibility changes, or shadow content. SSR starts without a probe result.
 * The observer captures value at setup; use a stable panel value. ID claims and
 * cached probe results remain in the root after cleanup. Custom hosts must forward
 * props/ref for probing and associations to work.
 * @throws If rendered outside Tabs.
 */
export function TabsPanel<T extends ValidComponent = 'div'>(props: TabsPanelProps<T>): JSX.Element {
  const own = props as PanelOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'ref', 'children')
  const context = useTabs('Tabs.Panel')

  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(() => own.ref, node)
  }

  onSettled(() => {
    if (own.id !== undefined) context.claimId('panel', own.value, own.id)
    const node = el
    if (!node) return
    const value = own.value
    const probe = () => context.probePanel(value, hasFocusable(node))
    probe()
    const observer = new MutationObserver(probe)
    observer.observe(node, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: WATCHED,
    })
    return () => observer.disconnect()
  })

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  return (
    <Host ref={ref} {...spread(context.panelPart(own.value), { ...rest })}>
      {content()}
    </Host>
  )
}
