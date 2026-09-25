import type { JSX } from '@solidjs/web'
import { Menu } from 'lucide'
import { SidebarTrigger, type SidebarTriggerProps } from './sidebar'
import { DrawerTrigger } from './drawer'
import { Icon } from './icon'
import { sidebar } from '../../lib/sidebar'

/** The docs trigger, bound to the docs controller so Astro can mount it anywhere. */
export function DocsSidebarTrigger(props: Omit<SidebarTriggerProps, 'controller'>): JSX.Element {
  return <SidebarTrigger controller={sidebar} {...props} />
}

/**
 * The narrow shell's menu button. It only ever opens the drawer; the bar it sits
 * in is hidden at widths where the sidebar docks. Before opening it records where
 * the bar ends, so the drawer and its scrim start below the bars instead of
 * covering them.
 */
export function DocsMenuButton(props: { class?: string }): JSX.Element {
  const measure = (event: MouseEvent & { currentTarget: HTMLElement }) => {
    const bar = event.currentTarget.closest('[data-docs-context-bar]')
    const top = Math.max(0, bar?.getBoundingClientRect().bottom ?? 0)
    document.documentElement.style.setProperty('--docs-drawer-top', `${top}px`)
  }
  return (
    <DrawerTrigger
      variant="outline"
      size="icon-sm"
      handle={sidebar.drawer}
      aria-label="Open navigation"
      class={props.class}
      onClick={measure}
    >
      <Icon icon={Menu} />
    </DrawerTrigger>
  )
}
