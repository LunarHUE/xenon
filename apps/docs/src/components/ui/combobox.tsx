import {
  Combobox as ComboboxPrimitive,
  type ComboboxProps as PrimitiveProps,
  type ComboboxInputProps,
  type ComboboxContentProps,
  type ComboboxItemProps,
  type ComboboxTriggerProps,
  type ComboboxValueProps,
  type ComboboxViewportProps,
} from '@xenon-ui/solid/combobox'
import type { ComponentProps } from '@solidjs/web'
import { createUniqueId, omit } from 'solid-js'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, ChevronDown } from 'lucide'
import { Icon } from './icon'
import { cn } from '../../lib/utils'

export type ComboboxProps = PrimitiveProps
export type { ComboboxInputProps, ComboboxItemProps }
export function Combobox(props: ComboboxProps) {
  return <ComboboxPrimitive inputPlacement="popup" {...props} />
}

export function ComboboxValue(props: ComboboxValueProps) {
  const rest = omit(props, 'class')
  return (
    <ComboboxPrimitive.Value
      placeholder="Select an option"
      {...rest}
      class={cn('min-w-0 flex-1 truncate text-start', props.class)}
    />
  )
}

export const comboboxTriggerVariants = cva(
  'group/combobox-trigger relative inline-flex w-full cursor-pointer items-center justify-between gap-[0.75em] rounded-none border border-foreground bg-background font-sans text-sm leading-normal text-foreground outline-offset-[3px] focus-visible:outline-2 focus-visible:outline-sidebar-primary disabled:cursor-not-allowed disabled:opacity-40 aria-expanded:shadow-[3px_3px_0_var(--color-foreground)] motion-safe:aria-expanded:-translate-0.5 [&:not(:disabled):hover:not(:active)]:shadow-[3px_3px_0_var(--color-foreground)] motion-safe:[&:not(:disabled):hover:not(:active)]:-translate-0.5 after:absolute after:inset-0 after:content-[""] motion-safe:[&:not(:disabled):hover]:after:-right-[3px] motion-safe:[&:not(:disabled):hover]:after:-bottom-[3px]',
  {
    variants: {
      size: {
        default: 'px-[0.875em] py-[0.625em]',
        sm: 'px-[0.625em] py-[0.375em]',
      },
    },
    defaultVariants: { size: 'default' },
  }
)

export function ComboboxInput(props: ComboboxInputProps) {
  const rest = omit(props, 'class')
  return (
    <ComboboxPrimitive.Input
      {...rest}
      data-slot="combobox-input"
      class={cn(
        'min-w-0 w-full shrink-0 rounded-none border border-foreground bg-background px-[0.875em] py-[0.625em] font-sans text-sm leading-normal text-foreground placeholder:text-muted-foreground',
        'outline-offset-[3px] focus-visible:outline-2 focus-visible:outline-sidebar-primary disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive',
        props.class
      )}
    />
  )
}

export function ComboboxContent(props: ComboboxContentProps) {
  const rest = omit(props, 'class')
  return (
    <ComboboxPrimitive.Positioner sideOffset={6} collisionPadding={8} matchAnchorSize="width">
      <ComboboxPrimitive.Content
        {...rest}
        data-slot="combobox-content"
        class={cn(
          'group/combobox-content flex max-h-[var(--positioner-available-height)] flex-col overflow-hidden rounded-none border border-foreground bg-popover p-[0.25em] font-sans text-sm leading-normal text-popover-foreground shadow-[3px_3px_0_var(--color-foreground)] outline-none',
          props.class
        )}
      />
    </ComboboxPrimitive.Positioner>
  )
}

export function ComboboxViewport(props: ComboboxViewportProps) {
  const rest = omit(props, 'class')
  return (
    <ComboboxPrimitive.Viewport
      {...rest}
      data-slot="combobox-viewport"
      class={cn('scroll-area min-h-0 max-h-[18em]', props.class)}
    />
  )
}

export function ComboboxGroup(props: ComponentProps<'div'> & { label: string }) {
  const rest = omit(props, 'class', 'label', 'children')
  const labelId = createUniqueId()
  return (
    <div
      {...rest}
      role="group"
      aria-labelledby={labelId}
      data-slot="combobox-group"
      class={cn(
        'not-first:mt-[0.5em] not-first:border-t not-first:border-border [&:not(:has([role=option]:not([hidden])))]:hidden',
        props.class
      )}
    >
      <div
        id={labelId}
        class="px-[0.75em] pt-[0.75em] pb-[0.375em] text-xs font-medium text-muted-foreground"
      >
        {props.label}
      </div>
      {props.children}
    </div>
  )
}

export function ComboboxEmpty(props: ComponentProps<'div'>) {
  const rest = omit(props, 'class')
  return (
    <ComboboxPrimitive.Empty
      {...rest}
      data-slot="combobox-empty"
      class={cn(
        'shrink-0 px-[0.75em] py-[1em] text-muted-foreground [&[hidden]]:hidden',
        props.class
      )}
    />
  )
}

export function ComboboxItem(props: ComboboxItemProps) {
  const rest = omit(props, 'class', 'children')
  return (
    <ComboboxPrimitive.Item
      {...rest}
      data-slot="combobox-item"
      class={cn(
        'group/combobox-item relative flex cursor-pointer items-center gap-[0.75em] px-[0.75em] py-[0.625em] select-none',
        'data-highlighted:bg-accent data-highlighted:outline-2 data-highlighted:-outline-offset-2 data-highlighted:outline-sidebar-primary',
        'data-disabled:cursor-not-allowed data-disabled:text-muted-foreground [&[hidden]]:hidden',
        props.class
      )}
    >
      <span class="min-w-0 flex-1">{props.children}</span>
      <Icon
        icon={Check}
        class="size-[1.25em] shrink-0 invisible group-data-[state=checked]/combobox-item:visible"
      />
    </ComboboxPrimitive.Item>
  )
}

export function ComboboxTrigger(
  props: ComboboxTriggerProps & VariantProps<typeof comboboxTriggerVariants>
) {
  const rest = omit(props, 'class', 'children', 'size')
  return (
    <ComboboxPrimitive.Trigger
      {...rest}
      data-slot="combobox-trigger"
      class={cn(comboboxTriggerVariants({ size: props.size }), props.class)}
    >
      {props.children}
      <Icon
        icon={ChevronDown}
        class="size-[1.25em] shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]/combobox-trigger:rotate-180"
      />
    </ComboboxPrimitive.Trigger>
  )
}
