import { Button } from '../ui/button'
import { SIDEBAR_MODES, sidebar, useSidebarMode } from '../../lib/sidebar'

/**
 * Drives the real docs sidebar in the layout. Nothing here renders a sidebar;
 * it only talks to the controller, which is the point of the model.
 */
export default function SidebarPreview() {
  const mode = useSidebarMode(sidebar)
  return (
    <div class="space-y-10">
      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">Desktop mode, persisted in a cookie</h3>
        <div class="flex flex-wrap items-center gap-4">
          {SIDEBAR_MODES.map((value) => (
            <Button
              variant={mode() === value ? 'default' : 'outline'}
              class="capitalize"
              onClick={() => sidebar.setMode(value)}
            >
              {value}
            </Button>
          ))}
        </div>
        <p class="text-sm text-muted-foreground" role="status">
          Mode: {mode()}
        </p>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">
          Mobile drawer: narrow the window below 1024px, then open it from here or the header
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={sidebar.openDrawer}>
            Open drawer
          </Button>
          <Button variant="outline" onClick={sidebar.closeDrawer}>
            Close drawer
          </Button>
        </div>
        <p class="text-sm text-muted-foreground" role="status">
          Drawer: {sidebar.drawerOpen() ? 'open' : 'closed'}
        </p>
      </div>
    </div>
  )
}
