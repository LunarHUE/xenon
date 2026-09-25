import {
  Collapsible as CollapsiblePrimitive,
  type CollapsibleProps as PrimitiveProps,
  type CollapsibleTriggerProps as PrimitiveTriggerProps,
  type CollapsibleContentProps as PrimitiveContentProps,
} from '@xenon-ui/solid/collapsible'
import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

type Styled<Props> = Omit<Props, 'class'> & { class?: string }

export type CollapsibleProps<T extends ValidComponent = 'div'> = Styled<PrimitiveProps<T>>
export type CollapsibleTriggerProps<T extends ValidComponent = 'button'> = Styled<
  PrimitiveTriggerProps<T>
>
export type CollapsibleContentProps<T extends ValidComponent = 'div'> = Styled<
  PrimitiveContentProps<T>
>

export function Collapsible<T extends ValidComponent = 'div'>(
  props: CollapsibleProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <CollapsiblePrimitive<T>
      {...(rest as PrimitiveProps<T>)}
      data-slot="collapsible"
      class={cn(props.class)}
    />
  )
}

/** Unstyled; the consumer decides what a disclosure control looks like. */
export function CollapsibleTrigger<T extends ValidComponent = 'button'>(
  props: CollapsibleTriggerProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <CollapsiblePrimitive.Trigger<T>
      {...(rest as PrimitiveTriggerProps<T>)}
      data-slot="collapsible-trigger"
      class={cn(props.class)}
    />
  )
}

/**
 * Animates height between zero and the panel's measured size. The primitive
 * writes the measured height into `--collapsible-panel-height` while entering
 * or exiting and `auto` once settled; the starting and ending style markers are
 * the closed end of the same transition.
 */
export function CollapsibleContent<T extends ValidComponent = 'div'>(
  props: CollapsibleContentProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <CollapsiblePrimitive.Content<T>
      {...(rest as PrimitiveContentProps<T>)}
      data-slot="collapsible-content"
      class={cn(
        'overflow-hidden [interpolate-size:allow-keywords] [height:var(--collapsible-panel-height,auto)]',
        'transition-[height,opacity] duration-[260ms] ease-[cubic-bezier(0.2,0.7,0.3,1)] motion-reduce:transition-none',
        'data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0',
        '[&[hidden]]:hidden',
        props.class
      )}
    />
  )
}
