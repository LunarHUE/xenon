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

/** Open-state and mounting options owned by the root adapter. */
interface Own {
  /** Controlled expanded state while defined; undefined uses internal state. */
  open?: boolean
  /** Initial uncontrolled expanded state, read once at setup. Defaults to false. */
  defaultOpen?: boolean
  /** Synchronous toggle request after updating uncontrolled state. Initialization and external prop changes are silent. */
  onOpenChange?: (open: boolean) => void
  /** Blocks trigger toggles and marks all parts without forcing content closed. Defaults to false. */
  disabled?: boolean
  /** Keep closed content mounted and hidden after its exit completes. Defaults to false. */
  forceMount?: boolean
  /** Receives the rendered root element. */
  ref?: (el: HTMLElement) => void
}

/** Ref option shared by the trigger and content adapters. */
interface PartOwn {
  /** Receives the rendered part element whenever its ref attaches. */
  ref?: (el: HTMLElement) => void
}

/** Root options combined with the selected host props. */
export type CollapsibleProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Rendered root host; defaults to div. */
    as?: T
  }

/** Trigger host props, including an optional author ID synchronized to the group context. */
export type CollapsibleTriggerProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & {
    /** Rendered trigger host; defaults to button. */
    as?: T
  }

/** Content host props, including an optional author ID used by trigger aria-controls. */
export type CollapsibleContentProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof PartOwn | 'as'
> &
  PartOwn & {
    /** Rendered content host; defaults to div. */
    as?: T
  }

/** Host and ID fields read by the shared part implementations. */
type PartProps = PartOwn & {
  /** Literal host or custom component used by Dynamic. */
  as?: ValidComponent
  /** Author ID; undefined uses the root-generated fallback. */
  id?: string
}

/**
 * Provides reactive disclosure state and presence around a rendered root.
 *
 * @remarks
 * Uses {@link createPresence} for an initially settled phase, a one-frame entering
 * phase on later opening, and exit-animation observation before unmounting.
 * Reopening cancels pending exit completion. The adapter supplies lifecycle hooks,
 * not animation styles or focus management. Root attributes have no implicit role.
 * Generated trigger/content IDs are independent of any root id prop.
 * Author host attributes override generated attributes through {@link spread}.
 */
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

  /** Store an uncontrolled toggle before reporting it to the author. */
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

/**
 * Renders the toggle inside a Collapsible root, with expanded/controls associations.
 *
 * @remarks
 * Omitted as, literal button, and literal input use native activation. Other hosts,
 * including custom components, receive generic button semantics and Enter/Space
 * activation from {@link disclosureTrigger}. Author handlers run first and can
 * cancel the core toggle; they are not separately suppressed while disabled.
 * The core blocks disabled toggles. Author IDs synchronize into context in an
 * effect, while the rendered ID immediately uses the supplied value. ID changes
 * have no cleanup that restores a prior part's registration.
 */
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

/**
 * Renders disclosure content while present, retaining it through exit animation.
 *
 * @remarks
 * Requires a Collapsible root. Content has no implicit role or accessible label.
 * Closed force-mounted content is hidden after exit; exiting content is inert.
 * The ref records the element for presence before invoking the author ref.
 * An effect synchronizes an author ID into trigger aria-controls; unmounting this
 * part does not restore a previous ID.
 *
 * Phase changes write --collapsible-panel-height and --collapsible-panel-width:
 * entering/exiting use scroll dimensions in pixels, entered uses auto, and exited
 * removes the properties. These measurements have no resize observer and do not
 * preserve previous inline values; see {@link measure}.
 */
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

/** Disclosure root with context-bound Trigger and Content parts. See {@link CollapsibleProps}. */
export const Collapsible = Object.assign(CollapsibleRoot, {
  /** Toggle host with expanded and content-control associations. */
  Trigger: CollapsibleTrigger,
  /** Presence-managed panel with phase-dependent size properties. */
  Content: CollapsibleContent,
})
