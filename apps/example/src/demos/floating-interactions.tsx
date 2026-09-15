import { Tooltip } from '@xenon/solid/tooltip'
import { HoverCard } from '@xenon/solid/hover-card'
import { ContextMenu } from '@xenon/solid/context-menu'
import { Menubar } from '@xenon/solid/menubar'
import { NavigationMenu } from '@xenon/solid/navigation-menu'
import { createSignal } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

export function TooltipDemo() {
  const [saved, setSaved] = createSignal(false)
  return (
    <Section
      index="25"
      title="Tooltip"
      blurb="A little context for an ordinary button. Hover pauses before showing a hint; keyboard focus reveals it immediately."
    >
      <Bench caption="Desk tools" note="shared defaults · local override">
        <div class="floating-tools">
          <Tooltip>
            <Tooltip.Trigger class="btn" onClick={() => setSaved(!saved())}>
              {saved() ? 'Saved' : 'Save note'}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side="top" sideOffset={10} collisionPadding={16}>
                <Tooltip.Content class="demo-tooltip">Keep this note on your desk.</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip>
          <Tooltip>
            <Tooltip.Trigger class="btn btn--quiet">Reading mode</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side="top" sideOffset={10} collisionPadding={16}>
                <Tooltip.Content class="demo-tooltip">
                  A quieter view for a longer read.
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip>
          <Tooltip openDelay={0}>
            <Tooltip.Trigger class="btn btn--quiet">Quick hint</Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner side="top" sideOffset={10} collisionPadding={16}>
                <Tooltip.Content class="demo-tooltip">
                  This hint opens without a wait.
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip>
        </div>
        <p class="prose">
          Move between the first two buttons after a hint opens. The next hint appears without
          another pause. Quick hint always opens immediately.
        </p>
        <Readout rows={[['note', saved() ? 'saved to desk' : 'not saved']]} />
      </Bench>
    </Section>
  )
}

export function HoverCardDemo() {
  const [following, setFollowing] = createSignal(false)
  return (
    <Section
      index="26"
      title="Hover card"
      blurb="Preview a link without leaving the page. Move into the card to read more or use its controls."
    >
      <Bench caption="From the contributors" note="native link · interactive preview">
        <p class="floating-byline">
          Field notes by{' '}
          <HoverCard openDelay={350} closeDelay={250}>
            <HoverCard.Trigger class="floating-link" href="#navigation-menu">
              Mara Ellis
            </HoverCard.Trigger>
            <HoverCard.Portal>
              <HoverCard.Positioner
                side="bottom"
                align="start"
                sideOffset={12}
                collisionPadding={16}
              >
                <HoverCard.Content class="overlay-sheet floating-profile">
                  <HoverCard.Viewport>
                    <div class="floating-profile__heading">
                      <span class="floating-monogram" aria-hidden="true">
                        ME
                      </span>
                      <div>
                        <HoverCard.Title class="overlay-sheet__title">Mara Ellis</HoverCard.Title>
                        <p class="floating-kicker">Writer &amp; field observer</p>
                      </div>
                    </div>
                    <HoverCard.Description class="overlay-sheet__description">
                      Collecting walks, small discoveries, and the details worth keeping.
                    </HoverCard.Description>
                    <button
                      class="btn"
                      type="button"
                      aria-pressed={following() ? 'true' : 'false'}
                      onClick={() => setFollowing(!following())}
                    >
                      {following() ? 'Following Mara' : 'Follow Mara'}
                    </button>
                  </HoverCard.Viewport>
                </HoverCard.Content>
              </HoverCard.Positioner>
            </HoverCard.Portal>
          </HoverCard>
        </p>
        <p class="prose">
          Hover the name, or focus the link and wait. The link still works as a link. The Follow
          button belongs to the preview.
        </p>
        <Readout rows={[['following', String(following())]]} />
      </Bench>
    </Section>
  )
}

export function ContextMenuDemo() {
  const [action, setAction] = createSignal('none')
  return (
    <Section
      index="27"
      title="Context menu"
      blurb="Actions at the point of interest. Right-click the note, or focus it and use the keyboard shortcut."
    >
      <Bench caption="A note on the worktable" note="pointer position · keyboard anchor">
        <ContextMenu>
          <ContextMenu.Trigger
            class="floating-note"
            aria-label="Actions for the afternoon walk note"
          >
            <span class="floating-kicker">Field note · 014</span>
            <strong>The afternoon walk</strong>
            <span>Take the longer way home.</span>
            <span class="floating-note__hint">Right-click for actions</span>
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner sideOffset={4} collisionPadding={16}>
              <ContextMenu.Content class="demo-menu" aria-label="Note actions">
                <ContextMenu.Item class="demo-menu__item" onSelect={() => setAction('opened')}>
                  Open note
                </ContextMenu.Item>
                <ContextMenu.Item class="demo-menu__item" onSelect={() => setAction('duplicated')}>
                  Duplicate note
                </ContextMenu.Item>
                <ContextMenu.Separator class="demo-menu__separator" />
                <ContextMenu.Item class="demo-menu__item" onSelect={() => setAction('archived')}>
                  Move to archive
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu>
        <p class="prose">
          Focus the note and press <Keys>Shift</Keys> + <Keys>F10</Keys>. Use the arrow keys to
          choose an action, then <Keys>Enter</Keys>.
        </p>
        <Readout rows={[['last action', action()]]} />
      </Bench>
    </Section>
  )
}

export function MenubarDemo() {
  const [action, setAction] = createSignal('ready')
  const [guides, setGuides] = createSignal(true)
  return (
    <Section
      index="28"
      title="Menubar"
      blurb="A familiar row of application commands. One Tab stop enters the bar; arrow keys move between menus and their choices."
    >
      <Bench caption="The notebook editor" note="roving focus · menu switching">
        <div class="floating-editor">
          <Menubar class="floating-menubar" aria-label="Notebook commands">
            <Menubar.Menu value="file">
              <Menubar.Trigger class="floating-menubar__trigger">File</Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Positioner align="start" sideOffset={6} collisionPadding={16}>
                  <Menubar.Content class="demo-menu">
                    <Menubar.Item
                      class="demo-menu__item"
                      onSelect={() => setAction('new page created')}
                    >
                      New page
                    </Menubar.Item>
                    <Menubar.Item
                      class="demo-menu__item"
                      onSelect={() => setAction('notebook saved')}
                    >
                      Save notebook
                    </Menubar.Item>
                  </Menubar.Content>
                </Menubar.Positioner>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu value="edit">
              <Menubar.Trigger class="floating-menubar__trigger">Edit</Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Positioner align="start" sideOffset={6} collisionPadding={16}>
                  <Menubar.Content class="demo-menu">
                    <Menubar.Item
                      class="demo-menu__item"
                      onSelect={() => setAction('last change undone')}
                    >
                      Undo
                    </Menubar.Item>
                    <Menubar.Item
                      class="demo-menu__item"
                      onSelect={() => setAction('page duplicated')}
                    >
                      Duplicate page
                    </Menubar.Item>
                  </Menubar.Content>
                </Menubar.Positioner>
              </Menubar.Portal>
            </Menubar.Menu>
            <Menubar.Menu value="view">
              <Menubar.Trigger class="floating-menubar__trigger">View</Menubar.Trigger>
              <Menubar.Portal>
                <Menubar.Positioner align="start" sideOffset={6} collisionPadding={16}>
                  <Menubar.Content class="demo-menu">
                    <Menubar.CheckboxItem
                      class="demo-menu__item"
                      checked={guides()}
                      onCheckedChange={setGuides}
                    >
                      <span class="demo-menu__indicator">
                        <Menubar.ItemIndicator>✓</Menubar.ItemIndicator>
                      </span>
                      Show ruled lines
                    </Menubar.CheckboxItem>
                  </Menubar.Content>
                </Menubar.Positioner>
              </Menubar.Portal>
            </Menubar.Menu>
          </Menubar>
          <div class="floating-editor__page" data-guides={guides() ? '' : undefined}>
            <p>Things noticed along the way.</p>
            <p>A loose list, with room to grow.</p>
          </div>
        </div>
        <Readout
          rows={[
            ['editor', action()],
            ['ruled lines', guides() ? 'visible' : 'hidden'],
          ]}
        />
      </Bench>
    </Section>
  )
}

export function NavigationMenuDemo() {
  return (
    <Section
      index="29"
      title="Navigation menu"
      blurb="Site navigation with ordinary links and disclosure buttons. Browse the panels with a pointer or follow the native Tab order."
    >
      <Bench caption="The field guide" note="shared viewport · native links">
        <NavigationMenu aria-label="Explore the component studies">
          <NavigationMenu.List class="floating-navigation">
            <NavigationMenu.Item value="write">
              <NavigationMenu.Trigger class="floating-navigation__trigger">
                Write <span aria-hidden="true">↓</span>
              </NavigationMenu.Trigger>
            </NavigationMenu.Item>
            <NavigationMenu.Item value="explore">
              <NavigationMenu.Trigger class="floating-navigation__trigger">
                Explore <span aria-hidden="true">↓</span>
              </NavigationMenu.Trigger>
            </NavigationMenu.Item>
            <li>
              <NavigationMenu.Link class="floating-link" href="#navigation-menu" current>
                Field guide
              </NavigationMenu.Link>
            </li>
          </NavigationMenu.List>
          <NavigationMenu.Portal>
            <NavigationMenu.Positioner align="start" sideOffset={12} collisionPadding={16}>
              <NavigationMenu.Viewport class="floating-navigation__viewport">
                <NavigationMenu.Content value="write" class="floating-navigation__panel">
                  <p class="floating-kicker">Start with a thought</p>
                  <NavigationMenu.Link href="#editable">
                    Edit in place <span>Give a small thought its own title.</span>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link href="#tags-input">
                    Collect a few tags <span>Keep related ideas together.</span>
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
                <NavigationMenu.Content
                  value="explore"
                  class="floating-navigation__panel floating-navigation__panel--wide"
                >
                  <p class="floating-kicker">Make room to explore</p>
                  <NavigationMenu.Link href="#tabs">
                    Change your view <span>Move between the pages of a study.</span>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link href="#accordion">
                    Open the details <span>Read a little more, one section at a time.</span>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link href="#popover">
                    Leave yourself a note <span>A small editor, right where you need it.</span>
                  </NavigationMenu.Link>
                </NavigationMenu.Content>
              </NavigationMenu.Viewport>
            </NavigationMenu.Positioner>
          </NavigationMenu.Portal>
        </NavigationMenu>
        <p class="prose">
          Hover to browse, click to keep exploring, or use <Keys>↓</Keys> to enter a panel. Each
          link leads to another study on this page.
        </p>
      </Bench>
    </Section>
  )
}
