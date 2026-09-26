import type { JSX } from '@solidjs/web'
import { For } from 'solid-js'
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
  SidebarMenu,
  SidebarMenuItem,
  SidebarItemLabel,
  useSidebar,
} from './ui/sidebar'
import { DocsSidebarTrigger } from './ui/sidebar-trigger-island'
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
      // Docked, the panel is pinned to the viewport and its navigation scrolls on its own.
      // It stacks over the header, which slides under it while the width animates.
      class="lg:sticky lg:top-0 lg:z-40 lg:h-dvh lg:self-start"
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
      {/*
       * Docked only; the drawer opens under the header, which already shows the
       * wordmark. The row is as tall as the header so their rules meet, and
       * global.css pins it while expanded (data-docs-sidebar-brand). The aside's
       * 2px end border sits inside its width, so 22px of end padding puts the
       * button where the header's own trigger sits when the sidebar is hidden.
       */}
      <div class="hidden h-14 shrink-0 lg:block group-data-[mode=hidden]/sidebar:invisible">
        <div
          data-docs-sidebar-brand
          class="flex h-14 items-center justify-between gap-3 border-b-2 border-foreground bg-sidebar ps-6 pe-[22px] group-data-[mode=compact]/sidebar:justify-center group-data-[mode=compact]/sidebar:px-0"
        >
          <a
            href="/docs/overview/"
            class="text-[28px] leading-[34px] font-bold tracking-[-0.04em] whitespace-nowrap outline-offset-4 focus-visible:outline-2 focus-visible:outline-sidebar-primary group-data-[mode=compact]/sidebar:hidden"
          >
            xenon
          </a>
          <DocsSidebarTrigger mobileQuery="not all" class="shrink-0" />
        </div>
      </div>
      <SidebarHeader>
        <div class="flex h-[42px] items-center justify-between border border-foreground bg-background px-3 text-sm shadow-[3px_3px_0_var(--color-foreground)] group-data-[mode=compact]/sidebar:hidden">
          <span class="font-medium">Solid</span>
          <span class="font-mono text-xs text-muted-foreground">0.0.0</span>
        </div>
      </SidebarHeader>
      <SidebarContent aria-label="Documentation sections">
        <For each={props.sections}>
          {(section) => (
            <SidebarGroup>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              {rows(section)}
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
