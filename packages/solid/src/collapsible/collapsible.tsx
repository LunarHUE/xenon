import { collapsible } from '@tenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  untrack,
} from 'solid-js'

import { CollapsibleContext, useCollapsible } from './context'
import type { CollapsibleContextValue } from './context'
import { disclosureTrigger } from '../internal/disclosure-trigger'
import { createPresence, measure } from '../internal/presence'
import { spread } from '../spread'

interface Own {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  forceMount?: boolean
  ref?: (el: HTMLElement) => void
}

interface PartOwn {
  ref?: (el: HTMLElement) => void
}

export type CollapsibleProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

export type CollapsibleTriggerProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & { as?: T }

export type CollapsibleContentProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & { as?: T }

type PartProps = PartOwn & { as?: ValidComponent; id?: string }

function CollapsibleRoot<T extends ValidComponent = 'div'>(
  props: CollapsibleProps<T>
): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'forceMount',
    'ref',
    'children'
  )

  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultOpen ?? false))
  const [triggerId, setTriggerId] = createSignal(`${base}-trigger`)
  const [contentId, setContentId] = createSignal(`${base}-panel`)

  const controlled = () => own.open !== undefined
  const open = () => own.open ?? internal()
  const forceMount = () => own.forceMount ?? false

  const life = createPresence({ open, forceMount })

  const change = (next: boolean) => {
    if (!untrack(controlled)) setInternal(next)
    own.onOpenChange?.(next)
  }

  const result = createMemo(() =>
    collapsible({
      ids: { trigger: triggerId(), content: contentId() },
      open: open(),
      status: life.status(),
      forceMount: forceMount(),
      disabled: own.disabled ?? false,
      onOpenChange: change,
    })
  )

  const context: CollapsibleContextValue = {
    present: life.present,
    status: life.status,
    trigger: () => result().parts.trigger,
    content: () => result().parts.content,
    contentRef: life.ref,
    setTriggerId: (id) => setTriggerId(id ?? `${base}-trigger`),
    setContentId: (id) => setContentId(id ?? `${base}-panel`),
  }

  const inner = createMemo(() => (
    <CollapsibleContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </CollapsibleContext>
  ))

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={own.ref}
      {...spread(result().parts.root, { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
}

export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleTriggerProps<T>
): JSX.Element {
  const own = props as PartProps
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'id')
  const context = useCollapsible('Collapsible.Trigger')

  createEffect(
    () => own.id,
    (id) => {
      context.setTriggerId(id)
    }
  )

  return (
    <Dynamic
      component={(own.as ?? 'button') as ValidComponent}
      ref={own.ref}
      {...spread(
        disclosureTrigger(context.trigger(), !own.as || own.as === 'button' || own.as === 'input'),
        { ...rest, id: own.id ?? context.trigger().attrs.id }
      )}
    />
  )
}

export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleContentProps<T>
): JSX.Element {
  const own = props as PartProps
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'id')
  const context = useCollapsible('Collapsible.Content')

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    context.contentRef(node)
    own.ref?.(node)
  }

  createEffect(
    () => own.id,
    (id) => {
      context.setContentId(id)
    }
  )

  createEffect(
    () => context.status(),
    (status) => {
      if (el) measure(el, 'collapsible-panel', status)
    }
  )

  return (
    <Show when={context.present()}>
      <Dynamic
        component={(own.as ?? 'div') as ValidComponent}
        ref={ref}
        {...spread(context.content(), { ...rest, id: own.id ?? context.content().attrs.id })}
      />
    </Show>
  )
}

export const Collapsible = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
})
