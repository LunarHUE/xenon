import type { JSX } from '@solidjs/web'
import { For, Show } from 'solid-js'
import { ChevronDown } from 'lucide'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb'
import { Icon } from '../ui/icon'
import { cn } from '../../lib/utils'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '../ui/menu'
import type { Crumb } from '../page/docs-breadcrumb'

/** One row of the component switcher. */
export interface SwitcherLink {
  label: string
  href: string
  /** The component on screen. */
  current?: boolean
}

export interface ContextCrumbsProps {
  crumbs: Crumb[]
  /** Other components to jump to. When set, the last crumb opens a menu of them. */
  switcher?: SwitcherLink[]
}

/**
 * The breadcrumb in the narrow bar. It sets smaller and quieter than the page
 * trail it replaces, and on component pages the last crumb is a menu button that
 * lists every component.
 */
export function ContextCrumbs(props: ContextCrumbsProps): JSX.Element {
  const last = () => props.crumbs.length - 1
  return (
    <Breadcrumb class="min-w-0">
      <BreadcrumbList variant="compact" class="flex-nowrap gap-x-3 whitespace-nowrap sm:gap-x-4">
        <For each={props.crumbs}>
          {(crumb, index) => (
            <BreadcrumbItem
              // The switcher keeps its full label; earlier crumbs give way first.
              class={cn(
                'min-w-0 gap-3 sm:gap-4 group-data-[variant=compact]/breadcrumb-list:gap-3 sm:group-data-[variant=compact]/breadcrumb-list:gap-4',
                index() === last() && props.switcher && 'shrink-0'
              )}
            >
              <Show
                when={index() < last()}
                fallback={
                  <BreadcrumbPage class="min-w-0">
                    <Show
                      when={props.switcher}
                      fallback={<span class="block truncate">{crumb.label}</span>}
                    >
                      {(links) => <ComponentSwitcher label={crumb.label} links={links()} />}
                    </Show>
                  </BreadcrumbPage>
                }
              >
                <Show
                  when={crumb.href}
                  fallback={<span class="truncate text-muted-foreground">{crumb.label}</span>}
                >
                  {(href) => (
                    <BreadcrumbLink
                      href={href()}
                      class="truncate text-muted-foreground group-data-[variant=compact]/breadcrumb-list:text-muted-foreground"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </Show>
                <BreadcrumbSeparator class="text-muted-foreground">/</BreadcrumbSeparator>
              </Show>
            </BreadcrumbItem>
          )}
        </For>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function ComponentSwitcher(props: { label: string; links: SwitcherLink[] }): JSX.Element {
  return (
    <Menu>
      <MenuTrigger class="inline-flex h-8 max-w-full items-center gap-2 border border-foreground bg-background px-2.5 text-foreground">
        <span class="truncate">{props.label}</span>
        <span class="sr-only">, switch component</span>
        <Icon
          icon={ChevronDown}
          class="size-3 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none group-data-[state=open]/menu-trigger:rotate-180"
        />
      </MenuTrigger>
      <MenuContent aria-label="Components">
        <For each={props.links}>
          {(link) => (
            <MenuItem as="a" href={link.href} aria-current={link.current ? 'page' : undefined}>
              {link.label}
            </MenuItem>
          )}
        </For>
      </MenuContent>
    </Menu>
  )
}
