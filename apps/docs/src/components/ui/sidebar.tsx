import type { ComponentProps, JSX } from '@solidjs/web'
import { Collapsible } from '@xenon/solid/collapsible'
import { ChevronDown, Menu, PanelLeft } from 'lucide'
import { Show, omit } from 'solid-js'
import { Button, type ButtonProps } from './button'
import { Drawer, DrawerContent, DrawerTrigger } from './drawer'
import { Icon } from './icon'
import { cn } from '../../lib/utils'
import { SIDEBAR_MOBILE_QUERY, createMediaMatch, type SidebarController } from '../../lib/sidebar'

export interface SidebarProps extends Omit<ComponentProps<'aside'>, 'children'> {
  controller: SidebarController
  /** Accessible name for the panel and the drawer. */
  label: string
  /** Media query below which the panel becomes a drawer. */
  mobileQuery?: string
  children?: JSX.Element
}

/**
 * Responsive host. Above the breakpoint the children live in a docked aside whose
 * width follows the controller's mode; below it the same children live in a
 * Drawer driven by the controller's drawer state. Only one branch is mounted, so
 * crossing the breakpoint remounts the children; keep state you care about in
 * the controller.
 */
export function Sidebar(props: SidebarProps): JSX.Element {
  const rest = omit(props, 'controller', 'label', 'mobileQuery', 'class', 'children')
  const mobile = createMediaMatch(props.mobileQuery ?? SIDEBAR_MOBILE_QUERY)
  return (
    <Show
      when={mobile()}
      fallback={
        <aside
          {...rest}
          id={props.controller.id}
          aria-label={props.label}
          data-slot="sidebar"
          data-mode={props.controller.mode()}
          inert={props.controller.mode() === 'hidden' ? true : undefined}
          class={cn(
            'group/sidebar hidden h-full w-[var(--sidebar-width)] flex-col overflow-hidden border-e-2 border-foreground bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none md:flex',
            'data-[mode=hidden]:border-e-0',
            props.class
          )}
        >
          {props.children}
        </aside>
      }
    >
      <Drawer
        handle={props.controller.drawer}
        open={props.controller.drawerOpen()}
        onOpenChange={props.controller.setDrawerOpen}
      >
        <DrawerContent
          aria-label={props.label}
          data-slot="sidebar"
          data-mode="expanded"
          class={cn('group/sidebar gap-0 p-0', props.class)}
        >
          {props.children}
        </DrawerContent>
      </Drawer>
    </Show>
  )
}

/** Top region, typically a selector. */
export function SidebarHeader(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="sidebar-header"
      class={cn('shrink-0 p-6 pb-0 group-data-[mode=compact]/sidebar:px-2', props.class)}
    />
  )
}

/** Scrolling navigation region. */
export function SidebarContent(props: ComponentProps<'nav'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <nav
      {...rest}
      data-slot="sidebar-content"
      class={cn(
        'scroll-area min-h-0 flex-1 px-6 pb-6 group-data-[mode=compact]/sidebar:px-2',
        props.class
      )}
    />
  )
}

/** Bottom region for account or settings controls. */
export function SidebarFooter(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="sidebar-footer"
      class={cn(
        'shrink-0 border-t border-foreground p-6 group-data-[mode=compact]/sidebar:px-2',
        props.class
      )}
    />
  )
}

export interface SidebarGroupProps extends Omit<ComponentProps<'div'>, 'ref'> {
  /** Fold the group behind a SidebarGroupTrigger. */
  collapsible?: boolean
  /** Initial state of a collapsible group. Default open. */
  defaultOpen?: boolean
}

/** A titled section. With `collapsible`, wraps a Collapsible root for its trigger and content. */
export function SidebarGroup(props: SidebarGroupProps): JSX.Element {
  const rest = omit(props, 'collapsible', 'defaultOpen', 'class')
  const className = () => cn('group/sidebar-group', props.class)
  return props.collapsible ? (
    <Collapsible
      as="div"
      {...rest}
      defaultOpen={props.defaultOpen ?? true}
      data-slot="sidebar-group"
      class={className()}
    />
  ) : (
    <div {...rest} data-slot="sidebar-group" class={className()} />
  )
}

const groupHeadingClass =
  'mb-1.5 flex min-h-8 w-full items-center gap-2 border-b border-foreground px-3 pt-5 pb-2 font-mono text-[11px] font-medium uppercase leading-[19px] tracking-[0.08em] text-foreground'

/** Static heading over a rule. Hidden in compact mode. */
export function SidebarGroupLabel(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="sidebar-group-label"
      class={cn(groupHeadingClass, 'group-data-[mode=compact]/sidebar:hidden', props.class)}
    />
  )
}

type GroupTriggerProps = Omit<ComponentProps<typeof Collapsible.Trigger>, 'class' | 'children'> & {
  class?: string
  children?: JSX.Element
}

/** Heading that folds its group. Same look as the label plus a chevron. */
export function SidebarGroupTrigger(props: GroupTriggerProps): JSX.Element {
  const rest = omit(props, 'class', 'children')
  return (
    <Collapsible.Trigger
      {...(rest as ComponentProps<typeof Collapsible.Trigger>)}
      data-slot="sidebar-group-trigger"
      class={cn(
        groupHeadingClass,
        'group/sidebar-group-trigger cursor-pointer bg-transparent text-start hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-primary group-data-[mode=compact]/sidebar:hidden',
        props.class
      )}
    >
      <span class="me-auto">{props.children}</span>
      <Icon
        icon={ChevronDown}
        class="size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]/sidebar-group-trigger:rotate-180"
      />
    </Collapsible.Trigger>
  )
}

/** Body of a collapsible group. */
export function SidebarGroupContent(props: Omit<ComponentProps<'div'>, 'ref'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <Collapsible.Content
      {...rest}
      data-slot="sidebar-group-content"
      class={cn('[&[hidden]]:hidden', props.class)}
    />
  )
}

export function SidebarMenu(props: ComponentProps<'ul'>): JSX.Element {
  const rest = omit(props, 'class')
  return <ul {...rest} data-slot="sidebar-menu" class={cn('m-0 list-none p-0', props.class)} />
}

export function SidebarMenuItem(props: ComponentProps<'li'>): JSX.Element {
  return <li {...props} data-slot="sidebar-menu-item" />
}

export interface SidebarLinkProps extends Omit<ComponentProps<'a'>, 'children'> {
  /** Marks the current page. Sets aria-current, which drives the style. */
  current?: boolean
  /** Glyph shown in compact mode. Falls back to the label's first letter. */
  icon?: JSX.Element
  children: JSX.Element
}

/**
 * Navigation row per registry sheet 04: 32px, 12px inset, muted text, accent fill
 * on hover, a border when pressed, and the sidebar-primary outline when current.
 */
export function SidebarLink(props: SidebarLinkProps): JSX.Element {
  const rest = omit(props, 'current', 'icon', 'class', 'children')
  return (
    <a
      {...rest}
      aria-current={props.current ? 'page' : undefined}
      data-slot="sidebar-link"
      class={cn(
        'flex min-h-8 items-center gap-3 border border-transparent px-3 py-[5px] text-sm leading-5 text-muted-foreground',
        'hover:bg-accent active:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'aria-[current=page]:border-sidebar-primary aria-[current=page]:bg-sidebar-selected aria-[current=page]:font-medium aria-[current=page]:text-sidebar-primary',
        'group-data-[mode=compact]/sidebar:justify-center group-data-[mode=compact]/sidebar:px-0',
        props.class
      )}
    >
      <span
        aria-hidden="true"
        data-slot="sidebar-link-icon"
        class="hidden size-5 items-center justify-center font-mono text-xs uppercase group-data-[mode=compact]/sidebar:flex"
      >
        {props.icon ?? <Initial>{props.children}</Initial>}
      </span>
      <span
        data-slot="sidebar-link-label"
        class="truncate group-data-[mode=compact]/sidebar:sr-only"
      >
        {props.children}
      </span>
    </a>
  )
}

/** First letter of a text label, for compact rows without an icon. */
function Initial(props: { children: JSX.Element }): JSX.Element {
  const text = () => {
    const value = props.children
    return typeof value === 'string' || typeof value === 'number' ? String(value).charAt(0) : ''
  }
  return <>{text()}</>
}

export interface SidebarTriggerProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  controller: SidebarController
  /** Desktop action. Default flips between expanded and hidden. */
  dock?: (controller: SidebarController) => void
  /** Media query below which the trigger opens the drawer instead. */
  mobileQuery?: string
}

const desktopLabel: Record<
  SidebarController['mode'] extends () => infer M ? M & string : never,
  string
> = { expanded: 'Hide sidebar', compact: 'Hide sidebar', hidden: 'Show sidebar' }

/**
 * Opens the drawer below the breakpoint, where the Drawer primitive supplies the
 * aria relationship. Above it, runs the dock action and reports whether the
 * panel is present: compact still counts as expanded.
 */
export function SidebarTrigger(props: SidebarTriggerProps): JSX.Element {
  const rest = omit(props, 'controller', 'dock', 'mobileQuery', 'class', 'aria-label')
  const mobile = createMediaMatch(props.mobileQuery ?? SIDEBAR_MOBILE_QUERY)
  const dock = () =>
    (props.dock ?? ((c) => (c.mode() === 'hidden' ? c.expand() : c.hide())))(props.controller)
  return (
    <Show
      when={mobile()}
      fallback={
        <Button
          variant="outline"
          size="icon-sm"
          {...rest}
          data-slot="sidebar-trigger"
          aria-label={props['aria-label'] || desktopLabel[props.controller.mode()]}
          aria-expanded={props.controller.mode() !== 'hidden' ? 'true' : 'false'}
          aria-controls={props.controller.id}
          class={cn(props.class)}
          onClick={dock}
        >
          <Icon icon={PanelLeft} />
        </Button>
      }
    >
      <DrawerTrigger
        variant="outline"
        size="icon-sm"
        {...rest}
        handle={props.controller.drawer}
        data-slot="sidebar-trigger"
        aria-label={props['aria-label'] || 'Open navigation'}
        class={cn(props.class)}
      >
        <Icon icon={Menu} />
      </DrawerTrigger>
    </Show>
  )
}
