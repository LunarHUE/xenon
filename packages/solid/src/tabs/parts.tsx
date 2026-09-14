import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit, onSettled } from 'solid-js'

import { useTabs } from './context'
import type { TabEntry } from './context'
import { hasFocusable } from './focusable'
import { Button } from '../button'
import type { ButtonProps } from '../button'
import { spread } from '../spread'

interface ListOwn {
  ref?: (el: HTMLElement) => void
}

interface TabOwn {
  value: string
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

interface PanelOwn {
  value: string
  ref?: (el: HTMLElement) => void
}

export type TabsListProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof ListOwn | 'as'
> &
  ListOwn & { as?: T }

export type TabsTabProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof TabOwn | 'as'
> &
  TabOwn & { as?: T }

export type TabsPanelProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof PanelOwn | 'as'
> &
  PanelOwn & { as?: T }

const WATCHED = ['contenteditable', 'disabled', 'href', 'tabindex', 'type']

export function TabsList<T extends ValidComponent = 'div'>(props: TabsListProps<T>): JSX.Element {
  const own = props as ListOwn & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  const context = useTabs('Tabs.List')

  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(context.listPart(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

export function TabsTab<T extends ValidComponent = 'button'>(props: TabsTabProps<T>): JSX.Element {
  const own = props as TabOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'value', 'disabled', 'ref')
  const context = useTabs('Tabs.Tab')

  const disabled = () => context.disabled() || (own.disabled ?? false)
  const entry: TabEntry = { el: null, value: () => own.value, disabled }

  const ref = (node: HTMLElement) => {
    entry.el = node
    own.ref?.(node)
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

export function TabsPanel<T extends ValidComponent = 'div'>(props: TabsPanelProps<T>): JSX.Element {
  const own = props as PanelOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'ref', 'children')
  const context = useTabs('Tabs.Panel')

  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
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

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(context.panelPart(own.value), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}
