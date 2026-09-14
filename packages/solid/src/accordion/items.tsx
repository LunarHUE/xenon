import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onSettled,
  untrack,
} from 'solid-js'

import { AccordionItemContext, useAccordion, useAccordionItem } from './context'
import type { AccordionEntry, AccordionItemContextValue } from './context'
import { createPresence, measure } from '../internal/presence'
import { spread } from '../spread'

interface ItemOwn {
  value: string
  disabled?: boolean
  forceMount?: boolean
  ref?: (el: HTMLElement) => void
}

interface PartOwn {
  ref?: (el: HTMLElement) => void
}

type PartProps = PartOwn & { as?: ValidComponent; id?: string }

export type AccordionItemProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  ItemOwn & { as?: T }

export type AccordionTriggerProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & { as?: T }

export type AccordionPanelProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & { as?: T }

export function AccordionItem<T extends ValidComponent = 'div'>(
  props: AccordionItemProps<T>
): JSX.Element {
  const own = props as ItemOwn & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'disabled',
    'forceMount',
    'ref',
    'children'
  )
  const context = useAccordion('Accordion.Item')

  const base = createUniqueId()
  const [triggerId, setTriggerId] = createSignal(`${base}-trigger`)
  const [panelId, setPanelId] = createSignal(`${base}-panel`)

  const entry: AccordionEntry = {
    value: untrack(() => own.value),
    el: null,
    disabled: () => own.disabled ?? false,
    status: () => life.status(),
    ids: () => ({ trigger: triggerId(), content: panelId() }),
    setTriggerId: (id) => setTriggerId(id ?? `${base}-trigger`),
    setPanelId: (id) => setPanelId(id ?? `${base}-panel`),
  }

  const life = createPresence({
    open: () => context.isOpen(entry.value),
    forceMount: () => own.forceMount ?? context.forceMount(),
  })

  onSettled(() => context.register(entry))

  const value: AccordionItemContextValue = {
    entry,
    present: life.present,
    status: life.status,
    trigger: () => context.trigger(entry),
    panel: () => context.panel(entry),
    panelRef: life.ref,
  }

  const inner = createMemo(() => (
    <AccordionItemContext value={value}>
      {(props as { children?: JSX.Element }).children}
    </AccordionItemContext>
  ))

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={own.ref}
      {...spread(context.item(entry), { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
}

export function AccordionTrigger<T extends ValidComponent = 'button'>(
  props: AccordionTriggerProps<T>
): JSX.Element {
  const own = props as PartProps
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  const context = useAccordionItem('Accordion.Trigger')

  createEffect(
    () => own.id,
    (id) => {
      context.entry.setTriggerId(id)
    }
  )

  const ref = (node: HTMLElement) => {
    context.entry.el = node
    own.ref?.(node)
  }

  return (
    <Dynamic
      component={(own.as ?? 'button') as ValidComponent}
      ref={ref}
      {...spread(context.trigger(), { ...rest })}
    />
  )
}

export function AccordionPanel<T extends ValidComponent = 'div'>(
  props: AccordionPanelProps<T>
): JSX.Element {
  const own = props as PartProps
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  const context = useAccordionItem('Accordion.Panel')

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    context.panelRef(node)
    own.ref?.(node)
  }

  createEffect(
    () => own.id,
    (id) => {
      context.entry.setPanelId(id)
    }
  )

  createEffect(
    () => context.status(),
    (status) => {
      if (el) measure(el, 'accordion-panel', status)
    }
  )

  return (
    <Show when={context.present()}>
      <Dynamic
        component={(own.as ?? 'div') as ValidComponent}
        ref={ref}
        {...spread(context.panel(), { ...rest })}
      />
    </Show>
  )
}
