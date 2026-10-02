import { Popover } from '@xenon-ui/solid/popover'
import { createSignal } from 'solid-js'
import { Bench, Readout, Section } from '../ui'

export function PopoverDemo() {
  const [note, setNote] = createSignal('Remember the small details.')
  const shared = Popover.createHandle<{ title: string; body: string }>()
  return (
    <Section
      index="18"
      title="Popover"
      blurb="A small editor beside its trigger. The page stays interactive, and the panel follows its anchor as you scroll or resize."
    >
      <Bench caption="An anchored note" note="nonmodal · collision handling · arrow">
        <Popover>
          <Popover.Trigger class="btn">Edit note</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="top" align="start" sideOffset={12} collisionPadding={16}>
              <Popover.Content class="demo-popover">
                <Popover.Viewport>
                  <Popover.Arrow class="demo-popover__arrow" />
                  <div class="overlay-sheet demo-popover__surface">
                    <Popover.Title class="overlay-sheet__title">A note for later.</Popover.Title>
                    <Popover.Description class="overlay-sheet__description">
                      Keep it short enough to remember.
                    </Popover.Description>
                    <label class="overlay-field">
                      Note
                      <input
                        class="input"
                        value={note()}
                        onInput={(event) => setNote(event.currentTarget.value)}
                      />
                    </label>
                    <div class="overlay-actions">
                      <Popover.Close class="btn" aria-label="Done with note">
                        Done
                      </Popover.Close>
                    </div>
                  </div>
                </Popover.Viewport>
              </Popover.Content>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover>
        <p class="prose">
          Tab through the editor to leave it. Clicking elsewhere or pressing Escape also closes the
          panel.
        </p>
        <Readout rows={[['note', note() || 'empty']]} />
      </Bench>
      <Bench caption="Two notes, one panel" note="shared content · animated switch">
        <div class="overlay-actions overlay-actions--start">
          <Popover.Trigger
            class="btn"
            handle={shared}
            payload={{ title: 'Reading note', body: 'Leave a little room in the margins.' }}
          >
            Reading note
          </Popover.Trigger>
          <Popover.Trigger
            class="btn btn--quiet"
            handle={shared}
            payload={{
              title: 'Workshop note',
              body: 'Bring your sketchbook and a favorite pencil. We will spend the afternoon drawing the small details that usually go unnoticed.',
            }}
          >
            Workshop note
          </Popover.Trigger>
        </div>
        <Popover handle={shared}>
          {(state) => (
            <Popover.Portal>
              <Popover.Positioner
                class="demo-popover__positioner"
                side="top"
                sideOffset={12}
                collisionPadding={16}
              >
                <Popover.Content class="demo-popover demo-popover--shared">
                  <Popover.Viewport class="demo-popover__viewport">
                    <div
                      class="overlay-sheet demo-popover__surface demo-popover__note"
                      data-wide={state.payload?.title === 'Workshop note' ? '' : undefined}
                    >
                      <Popover.Title class="overlay-sheet__title">
                        {state.payload?.title}
                      </Popover.Title>
                      <Popover.Description class="overlay-sheet__description">
                        {state.payload?.body}
                      </Popover.Description>
                      <Popover.Close class="btn" aria-label="Close shared note">
                        Done
                      </Popover.Close>
                    </div>
                  </Popover.Viewport>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Portal>
          )}
        </Popover>
        <p class="prose">Open either note, then switch to the other while the panel stays open.</p>
      </Bench>
    </Section>
  )
}
