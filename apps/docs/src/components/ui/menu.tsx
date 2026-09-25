import {
  Menu as MenuPrimitive,
  type MenuProps,
  type MenuTriggerProps as PrimitiveTriggerProps,
  type MenuContentProps as PrimitiveContentProps,
  type MenuPositionerProps,
  type MenuItemProps as PrimitiveItemProps,
} from '@xenon-ui/solid/menu'
import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

export type { MenuProps }

/** Root. Adds no DOM. */
export function Menu<Payload = unknown>(props: MenuProps<Payload>): JSX.Element {
  return <MenuPrimitive<Payload> {...props} />
}

export type MenuTriggerProps<T extends ValidComponent = 'button'> = Omit<
  PrimitiveTriggerProps<T>,
  'class'
> & { class?: string }

/** Opening button. Unstyled apart from the focus ring, so callers can shape it to its place. */
export function MenuTrigger<T extends ValidComponent = 'button'>(
  props: MenuTriggerProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <MenuPrimitive.Trigger<T>
      {...(rest as PrimitiveTriggerProps<T>)}
      data-slot="menu-trigger"
      class={cn(
        'group/menu-trigger cursor-pointer outline-offset-[3px] focus-visible:outline-2 focus-visible:outline-sidebar-primary',
        props.class
      )}
    />
  )
}

export type MenuContentProps = Omit<PrimitiveContentProps, 'class'> &
  Pick<MenuPositionerProps, 'side' | 'align' | 'sideOffset' | 'alignOffset'> & { class?: string }

/** Positioned list with the docs popup surface: hard border, offset shadow. */
export function MenuContent(props: MenuContentProps): JSX.Element {
  const rest = omit(props, 'class', 'side', 'align', 'sideOffset', 'alignOffset')
  return (
    <MenuPrimitive.Positioner
      side={props.side}
      align={props.align ?? 'start'}
      sideOffset={props.sideOffset ?? 6}
      alignOffset={props.alignOffset}
      collisionPadding={8}
    >
      <MenuPrimitive.Content
        {...(rest as PrimitiveContentProps)}
        data-slot="menu-content"
        class={cn(
          'scroll-area flex max-h-[min(var(--positioner-available-height),24rem)] min-w-44 flex-col border border-foreground bg-popover p-1 font-sans text-sm leading-normal text-popover-foreground shadow-[3px_3px_0_var(--color-foreground)] outline-none',
          props.class
        )}
      />
    </MenuPrimitive.Positioner>
  )
}

export type MenuItemProps<T extends ValidComponent = 'button'> = Omit<
  PrimitiveItemProps<T>,
  'class'
> & { class?: string }

/**
 * One row. Rows take real focus as the arrow keys move, so the ring is on :focus.
 * `aria-current="page"` marks the row for the page you are on.
 */
export function MenuItem<T extends ValidComponent = 'button'>(
  props: MenuItemProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <MenuPrimitive.Item<T>
      {...(rest as PrimitiveItemProps<T>)}
      data-slot="menu-item"
      class={cn(
        'flex w-full cursor-pointer items-center gap-3 border border-transparent bg-transparent px-3 py-1.5 text-start text-foreground no-underline select-none',
        'hover:bg-accent focus:bg-accent focus:outline-2 focus:-outline-offset-2 focus:outline-sidebar-primary',
        'aria-[current=page]:border-sidebar-primary aria-[current=page]:bg-sidebar-selected aria-[current=page]:text-sidebar-primary',
        props.class
      )}
    />
  )
}
