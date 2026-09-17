import type { JSX } from '@solidjs/web'
import { SidebarTrigger, type SidebarTriggerProps } from './sidebar'
import { sidebar } from '../../lib/sidebar'

/** The docs trigger, bound to the docs controller so Astro can mount it anywhere. */
export function DocsSidebarTrigger(props: Omit<SidebarTriggerProps, 'controller'>): JSX.Element {
  return <SidebarTrigger controller={sidebar} {...props} />
}
