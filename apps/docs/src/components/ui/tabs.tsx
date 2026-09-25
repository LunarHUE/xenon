import {
  Tabs as TabsPrimitive,
  type TabsProps as PrimitiveProps,
  type TabsListProps as PrimitiveListProps,
  type TabsTabProps as PrimitiveTabProps,
  type TabsPanelProps as PrimitivePanelProps,
} from '@xenon-ui/solid/tabs'
import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

type Styled<Props> = Omit<Props, 'class'> & { class?: string }

export type TabsProps<T extends ValidComponent = 'div'> = Styled<PrimitiveProps<T>>
export type TabsListProps<T extends ValidComponent = 'div'> = Styled<PrimitiveListProps<T>>
export type TabsTriggerProps<T extends ValidComponent = 'button'> = Styled<PrimitiveTabProps<T>>
export type TabsContentProps<T extends ValidComponent = 'div'> = Styled<PrimitivePanelProps<T>>

export function Tabs<T extends ValidComponent = 'div'>(props: TabsProps<T>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <TabsPrimitive<T>
      {...(rest as PrimitiveProps<T>)}
      data-slot="tabs"
      class={cn('flex min-w-0 flex-col gap-6 data-[orientation=vertical]:flex-row', props.class)}
    />
  )
}

export function TabsList<T extends ValidComponent = 'div'>(props: TabsListProps<T>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <TabsPrimitive.List<T>
      {...(rest as PrimitiveListProps<T>)}
      data-slot="tabs-list"
      class={cn(
        'group/tabs-list flex flex-wrap items-stretch gap-y-2 border-b-1 border-foreground',
        'data-[orientation=vertical]:shrink-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:flex-nowrap data-[orientation=vertical]:gap-0 data-[orientation=vertical]:border-e data-[orientation=vertical]:border-b-0',
        props.class
      )}
    />
  )
}

export function TabsTrigger<T extends ValidComponent = 'button'>(
  props: TabsTriggerProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <TabsPrimitive.Tab<T>
      {...(rest as PrimitiveTabProps<T>)}
      data-slot="tabs-trigger"
      class={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-[0.5em] whitespace-nowrap rounded-none border border-foreground bg-background px-[1.25em] py-[0.75em] font-sans text-sm leading-normal text-muted-foreground',
        'data-selected:bg-[linear-gradient(var(--color-sidebar-selected),var(--color-sidebar-selected))] data-selected:font-semibold data-selected:text-tab-active',
        'group-data-[orientation=horizontal]/tabs-list:border-b-0',
        'group-data-[orientation=horizontal]/tabs-list:[&:not(:first-child)]:-ms-px',
        'group-data-[orientation=vertical]/tabs-list:border-e-0 group-data-[orientation=vertical]/tabs-list:[&:not(:first-child)]:-mt-px',
        'after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1 data-selected:after:bg-tab-active',
        'group-data-[orientation=vertical]/tabs-list:justify-start group-data-[orientation=vertical]/tabs-list:after:inset-x-auto group-data-[orientation=vertical]/tabs-list:after:inset-y-0 group-data-[orientation=vertical]/tabs-list:after:end-0 group-data-[orientation=vertical]/tabs-list:after:h-auto group-data-[orientation=vertical]/tabs-list:after:w-1',
        'focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-[5px] focus-visible:outline-sidebar-primary',
        '[&:not([data-disabled]):hover:not(:active)]:z-10 [&:not([data-disabled]):hover:not(:active)]:shadow-[3px_3px_0_var(--color-foreground)]',
        'motion-safe:[&:not([data-disabled]):hover:not(:active)]:-translate-0.5',
        'active:translate-0 active:shadow-none data-disabled:cursor-not-allowed data-disabled:text-muted-foreground/40',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-[1.25em]',
        props.class
      )}
    />
  )
}

export function TabsContent<T extends ValidComponent = 'div'>(
  props: TabsContentProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <TabsPrimitive.Panel<T>
      {...(rest as PrimitivePanelProps<T>)}
      data-slot="tabs-content"
      class={cn(
        'min-w-0 flex-1 text-sm leading-6 text-foreground outline-offset-4 focus-visible:outline-2 focus-visible:outline-sidebar-primary',
        props.class
      )}
    />
  )
}
