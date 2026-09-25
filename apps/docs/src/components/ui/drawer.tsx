import {
  Drawer as DrawerPrimitive,
  type DrawerProps as PrimitiveProps,
  type DrawerHandle as PrimitiveHandle,
  type DialogContentProps as PrimitiveContentProps,
} from '@xenon-ui/solid/drawer'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { buttonVariants, type ButtonProps } from './button'
import { cn } from '../../lib/utils'

export type DrawerProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  PrimitiveProps<T, Payload>,
  'class'
> & { class?: string }

/** Root. Defaults to the left edge, which is where the docs navigation lives. */
export function Drawer<T extends ValidComponent = 'div', Payload = unknown>(
  props: DrawerProps<T, Payload>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <DrawerPrimitive<T, Payload>
      side="left"
      {...(rest as PrimitiveProps<T, Payload>)}
      data-slot="drawer"
      class={cn('contents', props.class)}
    />
  )
}

type PrimitiveTriggerProps<T extends ValidComponent, Payload> = ComponentProps<
  typeof DrawerPrimitive.Trigger<T, Payload>
>

export type DrawerTriggerProps<
  T extends ValidComponent = 'button',
  Payload = unknown,
> = ButtonProps<T> & {
  /** Target a root outside this trigger's Solid ancestry. */
  handle?: PrimitiveHandle<Payload>
  /** Payload selected when this trigger opens the root. */
  payload?: NoInfer<Payload>
}

/** Opening button with the docs Button styling and drawer state hooks. */
export function DrawerTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: DrawerTriggerProps<T, Payload>
): JSX.Element {
  const rest = omit(props, 'variant', 'size', 'class')
  return (
    <DrawerPrimitive.Trigger<T, Payload>
      {...(rest as PrimitiveTriggerProps<T, Payload>)}
      data-slot="drawer-trigger"
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}

export type DrawerContentProps = Omit<PrimitiveContentProps, 'class'> & {
  class?: string
  /** Class for the full-screen native dialog that carries the backdrop. */
  viewportClass?: string
}

/** Sheet placement by `data-side`, anchored inside the fixed viewport. */
const sideClass = cn(
  'data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-80 data-[side=left]:max-w-[calc(100vw-2rem)] data-[side=left]:border-r-2 data-[side=left]:[transform:translateX(calc(var(--drawer-swipe-offset,0px)*-1))]',
  'data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-80 data-[side=right]:max-w-[calc(100vw-2rem)] data-[side=right]:border-l-2 data-[side=right]:[transform:translateX(var(--drawer-swipe-offset,0px))]',
  'data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[calc(100dvh-2rem)] data-[side=top]:border-b-2 data-[side=top]:[transform:translateY(calc(var(--drawer-swipe-offset,0px)*-1))]',
  'data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[calc(100dvh-2rem)] data-[side=bottom]:border-t-2 data-[side=bottom]:[transform:translateY(var(--drawer-swipe-offset,0px))]'
)

/**
 * Slide in from the edge, slide back out while `data-ending-style` is set. Keyframes
 * live in global.css and animate `translate`; the swipe offset uses `transform`, so
 * the two never fight and the entry animation is left alone during a drag. A drag
 * released short of the threshold eases back through the transform transition.
 */
const motionClass = cn(
  'motion-safe:[animation:var(--drawer-in)_220ms_ease-out] motion-safe:data-[ending-style]:[animation:var(--drawer-out)_180ms_ease-in]',
  'transition-transform duration-200 ease-out data-[swiping]:transition-none motion-reduce:transition-none',
  'data-[side=left]:[--drawer-in:drawer-in-left] data-[side=left]:[--drawer-out:drawer-out-left]',
  'data-[side=right]:[--drawer-in:drawer-in-right] data-[side=right]:[--drawer-out:drawer-out-right]',
  'data-[side=top]:[--drawer-in:drawer-in-top] data-[side=top]:[--drawer-out:drawer-out-top]',
  'data-[side=bottom]:[--drawer-in:drawer-in-bottom] data-[side=bottom]:[--drawer-out:drawer-out-bottom]'
)

/**
 * Portal, full-screen viewport with the dimmed backdrop, and the sheet itself.
 * The sheet scrolls on its own; the page behind it is inert while open.
 */
export function DrawerContent(props: DrawerContentProps): JSX.Element {
  const rest = omit(props, 'class', 'viewportClass')
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        // The primitive sets overflow:auto inline. Clip instead: while the sheet is
        // translated off-screen its box would otherwise extend the scroll area, and
        // initial focus scrolls the dialog by that amount, then snaps back.
        style={{ overflow: 'clip' }}
        class={cn(
          'outline-none [&::backdrop]:bg-foreground/20',
          'motion-safe:[&::backdrop]:[animation:drawer-fade-in_220ms_ease-out] motion-safe:data-[ending-style]:[&::backdrop]:[animation:drawer-fade-out_180ms_ease-in]',
          props.viewportClass
        )}
      >
        <DrawerPrimitive.Content
          {...rest}
          data-slot="drawer-content"
          class={cn(
            'scroll-area absolute flex flex-col border-foreground bg-sidebar p-6 font-sans text-sm leading-normal text-sidebar-foreground outline-none',
            sideClass,
            motionClass,
            props.class
          )}
        />
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  )
}

/** Row at the top of the sheet: title on the left, close on the right. */
export function DrawerHeader(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="drawer-header"
      class={cn('mb-4 flex items-center justify-between gap-4', props.class)}
    />
  )
}

export type DrawerTitleProps<T extends ValidComponent = 'h2'> = Omit<
  ComponentProps<typeof DrawerPrimitive.Title<T>>,
  'class'
> & { class?: string }

export function DrawerTitle<T extends ValidComponent = 'h2'>(
  props: DrawerTitleProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <DrawerPrimitive.Title<T>
      {...(rest as ComponentProps<typeof DrawerPrimitive.Title<T>>)}
      data-slot="drawer-title"
      class={cn('text-base font-medium leading-6 text-foreground', props.class)}
    />
  )
}

export type DrawerDescriptionProps<T extends ValidComponent = 'p'> = Omit<
  ComponentProps<typeof DrawerPrimitive.Description<T>>,
  'class'
> & { class?: string }

export function DrawerDescription<T extends ValidComponent = 'p'>(
  props: DrawerDescriptionProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <DrawerPrimitive.Description<T>
      {...(rest as ComponentProps<typeof DrawerPrimitive.Description<T>>)}
      data-slot="drawer-description"
      class={cn('text-sm leading-[22px] text-muted-foreground', props.class)}
    />
  )
}

/** Closing button with the docs Button styling. */
export function DrawerClose<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const rest = omit(props, 'variant', 'size', 'class')
  return (
    <DrawerPrimitive.Close<T>
      {...(rest as ComponentProps<typeof DrawerPrimitive.Close<T>>)}
      data-slot="drawer-close"
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}

/**
 * Grab bar for top and bottom sheets. Dragging it outward past the root's
 * dragThreshold dismisses; it is also a plain close button for keyboards.
 */
export type DrawerHandleProps = Omit<ComponentProps<typeof DrawerPrimitive.Handle>, 'class'> & {
  class?: string
}

export function DrawerHandle(props: DrawerHandleProps): JSX.Element {
  const rest = omit(props, 'class', 'children')
  return (
    <DrawerPrimitive.Handle
      {...(rest as ComponentProps<typeof DrawerPrimitive.Handle>)}
      data-slot="drawer-handle"
      class={cn(
        'group/drawer-handle -mt-3 mb-3 flex h-8 w-full cursor-grab touch-none items-center justify-center self-center border-0 bg-transparent p-0 data-[swiping]:cursor-grabbing',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-primary',
        props.class
      )}
    >
      <span class="h-1 w-12 bg-muted-foreground group-hover/drawer-handle:bg-foreground" />
    </DrawerPrimitive.Handle>
  )
}
