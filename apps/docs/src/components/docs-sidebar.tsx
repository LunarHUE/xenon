import type { JSX } from '@solidjs/web'
import { For, Show } from 'solid-js'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupTrigger,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarLink,
} from './ui/sidebar'
import { sidebar } from '../lib/sidebar'
import type { NavSection } from '../lib/nav'

export interface DocsSidebarProps {
  sections: NavSection[]
  /** Current pathname, from Astro, so the server renders the current row. */
  current: string
}

/**
 * The docs navigation as an island. Astro cannot pass Solid children across the
 * island boundary, so this maps plain data onto the sidebar parts.
 */
export function DocsSidebar(props: DocsSidebarProps): JSX.Element {
  const rows = (section: NavSection) => (
    <SidebarMenu>
      <For each={section.links}>
        {(link) => (
          <SidebarMenuItem>
            <SidebarLink href={link.href} current={link.href === props.current}>
              {link.label}
            </SidebarLink>
          </SidebarMenuItem>
        )}
      </For>
    </SidebarMenu>
  )
  return (
    <Sidebar controller={sidebar} label="Documentation">
      <SidebarHeader>
        <div class="flex h-[42px] items-center justify-between border border-foreground bg-background px-3 text-sm shadow-[3px_3px_0_var(--color-foreground)] group-data-[mode=compact]/sidebar:hidden">
          <span class="font-medium">Solid</span>
          <span class="font-mono text-xs text-muted-foreground">0.0.0</span>
        </div>
      </SidebarHeader>
      <SidebarContent aria-label="Documentation sections">
        <For each={props.sections}>
          {(section) => (
            <SidebarGroup collapsible={section.collapsible}>
              <Show
                when={section.collapsible}
                fallback={<SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
              >
                <SidebarGroupTrigger>{section.label}</SidebarGroupTrigger>
                <SidebarGroupContent>{rows(section)}</SidebarGroupContent>
              </Show>
              <Show when={!section.collapsible}>{rows(section)}</Show>
            </SidebarGroup>
          )}
        </For>
      </SidebarContent>
    </Sidebar>
  )
}
