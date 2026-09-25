import { Tooltip } from '@xenon-ui/solid/tooltip'
import { HoverCard } from '@xenon-ui/solid/hover-card'
import { ContextMenu } from '@xenon-ui/solid/context-menu'
import { Menubar } from '@xenon-ui/solid/menubar'
import { NavigationMenu } from '@xenon-ui/solid/navigation-menu'
import { createSignal } from 'solid-js'

/** Closed floating components rendered on the server, then exercised after hydration. */
export function FloatingFixture() {
  const [action, setAction] = createSignal('None')
  return (
    <main>
      <style>{`
      body { margin: 32px; }
      section { margin-bottom: 32px; }
      [role="tooltip"], [role="dialog"], [role="menu"], [data-fixture-panel] {
        background: white; color: black; padding: 12px; border: 1px solid; min-width: 160px;
      }
      [role^="menuitem"] { display: block; }
      nav ul { display: flex; gap: 20px; list-style: none; padding: 0; }
    `}</style>
      <h1>Floating hydration</h1>
      <section aria-label="Tooltip fixture">
        <Tooltip.Provider openDelay={0}>
          <Tooltip forceMount>
            <Tooltip.Trigger id="floating-tooltip-trigger">Explain save</Tooltip.Trigger>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Content id="floating-tooltip">Saves your changes</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip>
        </Tooltip.Provider>
      </section>
      <section aria-label="Hover card fixture">
        <HoverCard forceMount openDelay={0}>
          <HoverCard.Trigger id="floating-card-trigger" href="#profile">
            Profile preview
          </HoverCard.Trigger>
          <HoverCard.Positioner sideOffset={8}>
            <HoverCard.Content id="floating-card" aria-label="Profile preview details">
              <HoverCard.Viewport>
                <a href="#full-profile">View full profile</a>
              </HoverCard.Viewport>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </HoverCard>
      </section>
      <section aria-label="Context menu fixture">
        <ContextMenu forceMount>
          <ContextMenu.Trigger id="floating-context-trigger">Context actions</ContextMenu.Trigger>
          <ContextMenu.Positioner>
            <ContextMenu.Content id="floating-context">
              <ContextMenu.Item onSelect={() => setAction('Context copy')}>
                Copy item
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Positioner>
        </ContextMenu>
      </section>
      <section aria-label="Menubar fixture">
        <Menubar aria-label="Document commands">
          <Menubar.Menu value="file" forceMount>
            <Menubar.Trigger id="floating-file-trigger">File</Menubar.Trigger>
            <Menubar.Positioner>
              <Menubar.Content id="floating-file">
                <Menubar.Item onSelect={() => setAction('New file')}>New file</Menubar.Item>
              </Menubar.Content>
            </Menubar.Positioner>
          </Menubar.Menu>
          <Menubar.Menu value="edit" forceMount>
            <Menubar.Trigger id="floating-edit-trigger">Edit</Menubar.Trigger>
            <Menubar.Positioner>
              <Menubar.Content id="floating-edit">
                <Menubar.Item onSelect={() => setAction('Undo edit')}>Undo edit</Menubar.Item>
              </Menubar.Content>
            </Menubar.Positioner>
          </Menubar.Menu>
        </Menubar>
      </section>
      <section aria-label="Navigation fixture">
        <NavigationMenu aria-label="Site sections" openDelay={0}>
          <NavigationMenu.List>
            <NavigationMenu.Item value="products">
              <NavigationMenu.Trigger id="floating-nav-trigger">Products</NavigationMenu.Trigger>
              <NavigationMenu.Positioner>
                <NavigationMenu.Content id="floating-nav-panel" data-fixture-panel>
                  <NavigationMenu.Viewport>
                    <NavigationMenu.Link href="#product">Product overview</NavigationMenu.Link>
                  </NavigationMenu.Viewport>
                </NavigationMenu.Content>
              </NavigationMenu.Positioner>
            </NavigationMenu.Item>
          </NavigationMenu.List>
        </NavigationMenu>
      </section>
      <button>After floating controls</button>
      <output aria-label="Floating action">{action()}</output>
    </main>
  )
}
