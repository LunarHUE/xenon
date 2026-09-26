import type { JSX } from '@solidjs/web'
import { Menu } from 'lucide'
import { SidebarTrigger, type SidebarTriggerProps } from './sidebar'
import { DrawerTrigger } from './drawer'
import { Icon } from './icon'
import { sidebar, type SidebarController } from '../../lib/sidebar'

/**
 * Flips the docked sidebar and keeps focus on the toggle. The docs render one
 * trigger in the sidebar's top row and one in the header, and CSS shows the one
 * that fits the mode, so the pressed button disappears. Once the new mode has
 * rendered, focus moves to the trigger that is still usable.
 */
function dockKeepingFocus(controller: SidebarController) {
  const pressed = document.activeElement
  if (controller.mode() === 'hidden') controller.expand()
  else controller.hide()
  if (!(pressed instanceof HTMLElement) || pressed.dataset.slot !== 'sidebar-trigger') return
  requestAnimationFrame(() => {
    const usable = (el: HTMLElement) => el.checkVisibility({ visibilityProperty: true }) && !el.closest('[inert]')
    if (usable(pressed) && document.activeElement === pressed) return
    const triggers = document.querySelectorAll<HTMLElement>('[data-slot="sidebar-trigger"]')
    Array.from(triggers)
      .find((el) => el !== pressed && usable(el))
      ?.focus()
  })
}

/** The docs trigger, bound to the docs controller so Astro can mount it anywhere. */
export function DocsSidebarTrigger(
  props: Omit<SidebarTriggerProps, 'controller' | 'dock'>
): JSX.Element {
  return <SidebarTrigger controller={sidebar} dock={dockKeepingFocus} {...props} />
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
