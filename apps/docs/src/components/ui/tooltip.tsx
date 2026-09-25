import {
  Tooltip as TooltipPrimitive,
  TooltipProvider,
  createTooltipHandle,
  type TooltipProps as PrimitiveProps,
  type TooltipTriggerProps as PrimitiveTriggerProps,
  type TooltipContentProps as PrimitiveContentProps,
  type TooltipPositionerProps as PrimitivePositionerProps,
  type TooltipViewportProps as PrimitiveViewportProps,
} from '@xenon-ui/solid/tooltip'
import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

export { TooltipProvider, createTooltipHandle }
export type {
  TooltipProviderProps,
  TooltipHandle,
  TooltipRenderState,
} from '@xenon-ui/solid/tooltip'

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
 *
 * A shared root (one `Tooltip` with a handle, many triggers) keeps this content
 * mounted while the active trigger changes, so the positioner glides to the new
 * anchor instead of reopening. The glide is gated on the viewport's transitioning
 * state, which also bounds it to the same 200ms as the content cross-fade.
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
        // Glide only while the viewport is switching content. The positioner starts
        // at inset 0, so an unconditional transition would sweep in from the corner.
        class="group/tooltip-positioner z-50 has-data-transitioning:transition-[top,left] has-data-transitioning:duration-200 has-data-transitioning:ease-out motion-reduce:transition-none"
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

export type TooltipViewportProps = Omit<PrimitiveViewportProps, 'class'> & { class?: string }

/**
 * Place inside `TooltipContent` of a shared root. When the payload changes the
 * outgoing label fades while the box resizes to the incoming one, using the
 * measured size variables the primitive publishes.
 */
export function TooltipViewport(props: TooltipViewportProps): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <TooltipPrimitive.Viewport
      {...rest}
      data-slot="tooltip-viewport"
      class={cn(
        'relative overflow-hidden [height:var(--viewport-height)] [width:var(--viewport-width)]',
        'transition-[width,height] duration-200 ease-out motion-reduce:transition-none',
        '[&>[data-current]]:w-max',
        '[&>[data-current]]:transition-opacity [&>[data-previous]]:transition-opacity [&>[data-current]]:duration-200 [&>[data-previous]]:duration-200',
        '[&>[data-starting-style]]:opacity-0 [&>[data-ending-style]]:opacity-0',
        props.class
      )}
    />
  )
}
