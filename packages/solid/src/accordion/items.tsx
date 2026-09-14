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
import { disclosureTrigger } from '../internal/disclosure-trigger'
import { createPresence, measure } from '../internal/presence'
import { spread } from '../spread'

/** Item-owned identity, disabled state, and mounting override. */
interface ItemOwn {
  /** Unique selection key captured once on item creation; later prop changes do not change its identity. */
  value: string
  /** Local trigger disabled flag, OR-combined with root disabled. Defaults to false. */
  disabled?: boolean
  /** Overrides root panel mounting even when false; omission inherits the root setting. */
  forceMount?: boolean
  /** Receives the item wrapper, not its trigger or panel. */
  ref?: (el: HTMLElement) => void
}

/** Shared trigger/panel host ref contract. */
interface PartOwn {
  /** Receives the rendered part host; custom components must forward it. */
  ref?: (el: HTMLElement) => void
}

/** Internal polymorphic part inputs used to update cross-part associations. */
type PartProps = PartOwn & {
  /** Rendered host used for native trigger classification. */
  as?: ValidComponent
  /** Author ID; effects update the shared association, while undefined restores its fallback. */
  id?: string
}

/** Polymorphic wrapper props with item-local state. */
export type AccordionItemProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof ItemOwn | 'as'
> &
  ItemOwn & {
    /** Wrapper host, defaulting to div. */
    as?: T
  }

/** Polymorphic trigger props; an author ID updates the panel naming association on the client. */
export type AccordionTriggerProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & {
    /** Trigger host, defaulting to button; literal input also retains native activation, others get generic button keys. */
    as?: T
  }

/** Polymorphic panel props; an author ID updates trigger aria-controls on the client. */
export type AccordionPanelProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & {
    /** Panel host, defaulting to div; custom components must forward props and refs. */
    as?: T
  }

/**
 * Provides stable item IDs and {@link createPresence} lifecycle to its descendants.
 * Registers after settling and removes the entry on owner cleanup. Local forceMount
 * overrides root presence attributes as well as the panel mounting decision.
 * @throws If rendered outside Accordion.
 */
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
    panel: () => {
      const panel = context.panel(entry)
      // Item forceMount can override the root; its presence owns hidden state.
      return { attrs: { ...panel.attrs, ...life.part().attrs }, on: panel.on }
    },
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

/**
 * Renders the item's disclosure and navigation trigger. Its ref supplies the focus
 * target and DOM ordering. {@link disclosureTrigger} adds generic activation where
 * needed; {@link spread} lets author handlers cancel core behavior. Disabled core
 * activation is blocked, but this part does not gate author handlers.
 * @throws If rendered outside Accordion.Item.
 */
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
      {...spread(
        disclosureTrigger(context.trigger(), !own.as || own.as === 'button' || own.as === 'input'),
        { ...rest, id: own.id ?? context.trigger().attrs.id }
      )}
    />
  )
}

/**
 * Renders while item presence requires it, retaining exit content until animation
 * completion. The ref feeds exit observation. Phase changes call {@link measure}
 * for --accordion-panel-height/width; no continuous resize observer is installed.
 * Author attributes override generated panel attributes through {@link spread}.
 * @throws If rendered outside Accordion.Item.
 */
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
        {...spread(context.panel(), { ...rest, id: own.id ?? context.panel().attrs.id })}
      />
    </Show>
  )
}
