import {
  Breadcrumbs as BreadcrumbsPrimitive,
  type BreadcrumbsProps as PrimitiveProps,
  type BreadcrumbsListProps as PrimitiveListProps,
  type BreadcrumbsItemProps,
  type BreadcrumbsLinkProps,
  type BreadcrumbsCurrentProps,
  type BreadcrumbsSeparatorProps,
} from '@xenon-ui/solid/breadcrumbs'
import type { JSX, ValidComponent } from '@solidjs/web'
import { cva, type VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

export type BreadcrumbProps<T extends ValidComponent = 'nav'> = PrimitiveProps<T>
export type BreadcrumbItemProps = BreadcrumbsItemProps
export type BreadcrumbLinkProps = BreadcrumbsLinkProps
export type BreadcrumbPageProps = BreadcrumbsCurrentProps
export type BreadcrumbSeparatorProps = BreadcrumbsSeparatorProps

export function Breadcrumb<T extends ValidComponent = 'nav'>(
  props: BreadcrumbProps<T>
): JSX.Element {
  return <BreadcrumbsPrimitive<T> {...props} data-slot="breadcrumb" />
}

export const breadcrumbListVariants = cva(
  'group/breadcrumb-list flex flex-wrap items-center font-sans text-sm leading-[22px] text-foreground',
  {
    variants: {
      variant: {
        default: 'min-h-12 gap-x-[14px] border-b border-muted-foreground',
        compact: 'gap-x-[14px]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export type BreadcrumbListProps = PrimitiveListProps & VariantProps<typeof breadcrumbListVariants>

export function BreadcrumbList(props: BreadcrumbListProps) {
  const rest = omit(props, 'class', 'variant')
  return (
    <BreadcrumbsPrimitive.List
      {...rest}
      data-slot="breadcrumb-list"
      data-variant={props.variant ?? 'default'}
      class={cn(breadcrumbListVariants({ variant: props.variant }), props.class)}
    />
  )
}

export function BreadcrumbItem(props: BreadcrumbItemProps) {
  const rest = omit(props, 'class')
  return (
    <BreadcrumbsPrimitive.Item
      {...rest}
      data-slot="breadcrumb-item"
      class={cn(
        'inline-flex items-center gap-[14px] group-data-[variant=compact]/breadcrumb-list:gap-1',
        props.class
      )}
    />
  )
}

export function BreadcrumbLink(props: BreadcrumbLinkProps) {
  const rest = omit(props, 'class')
  return (
    <BreadcrumbsPrimitive.Link
      {...rest}
      data-slot="breadcrumb-link"
      class={cn(
        'text-muted-foreground transition-colors hover:text-sidebar-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'aria-[current=page]:text-foreground group-data-[variant=compact]/breadcrumb-list:text-foreground',
        props.class
      )}
    />
  )
}

export function BreadcrumbPage(props: BreadcrumbPageProps) {
  const rest = omit(props, 'class')
  return (
    <BreadcrumbsPrimitive.Current
      {...rest}
      data-slot="breadcrumb-page"
      class={cn('text-foreground', props.class)}
    />
  )
}

export function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
  const rest = omit(props, 'class', 'children')
  return (
    <BreadcrumbsPrimitive.Separator
      {...rest}
      data-slot="breadcrumb-separator"
      class={cn('text-foreground', props.class)}
    >
      {props.children ?? '/'}
    </BreadcrumbsPrimitive.Separator>
  )
}
