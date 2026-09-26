import type { JSX } from '@solidjs/web'
import { For, Show } from 'solid-js'
import { BookOpen, Download, Blocks, FileText } from 'lucide'
import { Button } from './ui/button'
import { Icon, type IconNode } from './ui/icon'
import { Tooltip, TooltipContent, TooltipViewport, createTooltipHandle } from './ui/tooltip'
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
  SidebarItemLabel,
  useSidebar,
} from './ui/sidebar'
import { sidebar } from '../lib/sidebar'
import type { NavSection } from '../lib/nav'

const navigationIcons: Record<string, IconNode> = {
  '/docs/overview/': BookOpen,
  '/docs/installation/': Download,
  '/docs/components/': Blocks,
}

export interface DocsSidebarProps {
  sections: NavSection[]
  /** Href of the current row, from Astro, so the server renders it marked. */
  current?: string
}

/**
 * The docs navigation as an island. Astro cannot pass Solid children across the
 * island boundary, so this maps plain data onto the sidebar parts.
 */
export function DocsSidebar(props: DocsSidebarProps): JSX.Element {
  return (
    <Sidebar
      controller={sidebar}
      label="Documentation"
      // The menu button records where the narrow bars end; sheet and scrim start there.
      drawerClass="data-[side=left]:top-[var(--docs-drawer-top,0px)]"
      drawerViewportClass="[&::backdrop]:top-[var(--docs-drawer-top,0px)]"
    >
      <DocsSidebarContents {...props} />
    </Sidebar>
  )
}

/** Own one shared tooltip inside the sidebar's presentation context. */
function DocsSidebarContents(props: DocsSidebarProps): JSX.Element {
  const presentation = useSidebar()
  const hints = createTooltipHandle<JSX.Element>()
  const rows = (section: NavSection) => (
    <SidebarMenu>
      <For each={section.links}>
        {(link) => (
          <SidebarMenuItem>
            <Button
              as="a"
              variant="navigation"
              size="sm"
              href={link.href}
              aria-current={link.href === props.current ? 'page' : undefined}
              tooltip={presentation.mode() === 'compact' ? link.label : undefined}
              tooltipHandle={hints}
            >
              <Icon icon={navigationIcons[link.href] ?? FileText} />
              <SidebarItemLabel>{link.label}</SidebarItemLabel>
            </Button>
          </SidebarMenuItem>
        )}
      </For>
    </SidebarMenu>
  )
  return (
    <>
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
      <Tooltip
        handle={hints}
        disabled={presentation.mode() !== 'compact'}
        openDelay={0}
        closeDelay={0}
      >
        {(state) => (
          <TooltipContent side="right">
            <TooltipViewport>{state.payload}</TooltipViewport>
          </TooltipContent>
        )}
      </Tooltip>
    </>
  )
}
