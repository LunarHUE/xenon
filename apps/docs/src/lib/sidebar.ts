import { Drawer, type DrawerHandle } from '@xenon/solid/drawer'
import { isServer } from '@solidjs/web'
import { createMemo, createSignal, onCleanup, onSettled } from 'solid-js'

/**
 * Desktop presentation of a docked sidebar. `compact` keeps it present at rail
 * width; `hidden` removes it from the layout. The mobile drawer is a separate axis.
 */
export type SidebarMode = 'expanded' | 'compact' | 'hidden'

export const SIDEBAR_MODES: readonly SidebarMode[] = ['expanded', 'compact', 'hidden']

export interface CreateSidebarOptions {
  /** Initial desktop mode. Default expanded. */
  mode?: SidebarMode
  /** Called after every desktop mode change; persistence lives here, not in the controller. */
  onModeChange?: (mode: SidebarMode) => void
  /** Stable id for the docked panel so triggers can reference it. */
  id?: string
}

export interface SidebarController {
  /** Id of the docked panel element. */
  readonly id: string
  /** Drawer handle wiring detached triggers to the mounted mobile drawer. */
  readonly drawer: DrawerHandle
  /** Whether the mobile drawer is open. Temporary and never persisted. */
  drawerOpen: () => boolean
  setDrawerOpen: (open: boolean) => void
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
  /** Desktop mode. Ignored below the breakpoint. */
  mode: () => SidebarMode
  setMode: (mode: SidebarMode) => void
  expand: () => void
  compact: () => void
  hide: () => void
}

let count = 0

/**
 * Control state for one sidebar: the temporary mobile drawer and the persistent
 * desktop mode, kept apart on purpose. Owns no DOM and reads no storage; the
 * application projects the mode onto its layout and persists it as it likes.
 */
export function createSidebar(options: CreateSidebarOptions = {}): SidebarController {
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [mode, setModeSignal] = createSignal<SidebarMode>(options.mode ?? 'expanded')
  const setMode = (next: SidebarMode) => {
    if (next === mode()) return
    setModeSignal(next)
    options.onModeChange?.(next)
  }
  return {
    id: options.id ?? `sidebar-${++count}`,
    drawer: Drawer.createHandle(),
    drawerOpen,
    setDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    toggleDrawer: () => setDrawerOpen(!drawerOpen()),
    mode,
    setMode,
    expand: () => setMode('expanded'),
    compact: () => setMode('compact'),
    hide: () => setMode('hidden'),
  }
}

/**
 * Read the desktop mode inside a component that may hydrate. The server and the
 * hydrating client both render `expanded`; the real mode is computed once
 * hydration ends, which updates every binding. Plain client renders compute at once.
 */
export function useSidebarMode(controller: SidebarController): () => SidebarMode {
  return createMemo(() => controller.mode(), { ssrSource: 'client', loadingValue: 'expanded' })
}

/** Below this the sidebar becomes a drawer. Matches the docs mobile breakpoint token. */
export const SIDEBAR_MOBILE_QUERY = '(max-width: 767px)'

/**
 * Reactive media query match that is false during server render and hydration,
 * then follows the browser. Call inside a component.
 */
export function createMediaMatch(query: string): () => boolean {
  const [matches, setMatches] = createSignal(false)
  let unsubscribe: (() => void) | undefined
  onSettled(() => {
    const media = matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    unsubscribe = () => media.removeEventListener('change', update)
  })
  onCleanup(() => unsubscribe?.())
  return matches
}

/*
 * Docs integration. The cookie is the single store, read by the layout when
 * rendering on demand, by the boot script before first paint, and here on load.
 */
const COOKIE = 'sidebar'
const ONE_YEAR = 60 * 60 * 24 * 365

function readMode(): SidebarMode {
  const match = document.cookie.match(/(?:^|; )sidebar=(expanded|compact|hidden)(?:;|$)/)
  return (match?.[1] as SidebarMode | undefined) ?? 'expanded'
}

/** The docs sidebar. Any island can import it to render a trigger or change the mode. */
export const sidebar: SidebarController = createSidebar({
  id: 'docs-sidebar',
  mode: isServer ? 'expanded' : readMode(),
  onModeChange(mode) {
    document.cookie = `${COOKIE}=${mode}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
    document.querySelector('[data-docs-shell]')?.setAttribute('data-sidebar', mode)
  },
})
