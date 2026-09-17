import {
  Tooltip as TooltipPrimitive,
  TooltipProvider,
  type TooltipProps as PrimitiveProps,
  type TooltipTriggerProps as PrimitiveTriggerProps,
  type TooltipContentProps as PrimitiveContentProps,
  type TooltipPositionerProps as PrimitivePositionerProps,
} from '@xenon/solid/tooltip'
import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

export { TooltipProvider }
export type { TooltipProviderProps } from '@xenon/solid/tooltip'

export type TooltipProps<T extends ValidComponent = 'div', Payload = unknown> = PrimitiveProps<
  T,
  Payload
>

/** Root. Delays and hoverability come from the nearest TooltipProvider. */
export function Tooltip<T extends ValidComponent = 'div', Payload = unknown>(
  props: TooltipProps<T, Payload>
): JSX.Element {
  return <TooltipPrimitive<T, Payload> {...props} data-slot="tooltip" />
}

export type TooltipTriggerProps<
  T extends ValidComponent = 'button',
  Payload = unknown,
> = PrimitiveTriggerProps<T, Payload>

/** Unstyled trigger. Wrap a Button or an icon control with `as`. */
export function TooltipTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: TooltipTriggerProps<T, Payload>
): JSX.Element {
  return <TooltipPrimitive.Trigger<T, Payload> {...props} data-slot="tooltip-trigger" />
}

type PositionerOptions = Pick<
  PrimitivePositionerProps,
  'side' | 'align' | 'sideOffset' | 'alignOffset' | 'collisionPadding'
>

export type TooltipContentProps = Omit<PrimitiveContentProps<'div'>, 'as' | 'class'> &
  PositionerOptions & { class?: string }

/** Enter from the anchor's side by 4px, leave the same way. Keyframes live in global.css. */
const motionClass = cn(
  'motion-safe:[animation:tooltip-in_140ms_ease-out] motion-safe:data-[state=closed]:[animation:tooltip-out_100ms_ease-in]',
  'data-[instant]:[animation-duration:0ms]',
  'group-data-[side=top]/tooltip-positioner:[--tooltip-from:0_4px]',
  'group-data-[side=bottom]/tooltip-positioner:[--tooltip-from:0_-4px]',
  'group-data-[side=left]/tooltip-positioner:[--tooltip-from:4px_0]',
  'group-data-[side=right]/tooltip-positioner:[--tooltip-from:-4px_0]'
)

/**
 * Portal, positioner, and the inverted label surface. Defaults to the top side
 * with an 8px gap; the positioner flips and shifts to stay inside the viewport.
 */
export function TooltipContent(props: TooltipContentProps): JSX.Element {
  const rest = omit(
    props,
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionPadding',
    'class'
  )
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={props.side ?? 'top'}
        align={props.align}
        sideOffset={props.sideOffset ?? 8}
        alignOffset={props.alignOffset}
        collisionPadding={props.collisionPadding ?? 8}
        data-slot="tooltip-positioner"
        class="group/tooltip-positioner z-50"
      >
        <TooltipPrimitive.Content
          {...rest}
          data-slot="tooltip-content"
          class={cn(
            'max-w-xs border border-foreground bg-foreground px-3 py-1.5 font-sans text-xs leading-[18px] text-background',
            'shadow-[3px_3px_0_var(--color-sidebar-primary)] [transform-origin:var(--positioner-transform-origin)]',
            motionClass,
            props.class
          )}
        />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}
