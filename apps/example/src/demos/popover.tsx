import { Popover } from '@tenon/solid/popover'
import { createSignal } from 'solid-js'
import { Bench, Readout, Section } from '../ui'

export function PopoverDemo() {
  const [note, setNote] = createSignal('Remember the small details.')
  return (
    <Section
      index="18"
      title="Popover"
      blurb="A small editor beside its trigger. The page stays interactive, and the panel follows its anchor as you scroll or resize."
    >
      <Bench caption="An anchored note" note="nonmodal · collision handling · arrow">
        <Popover>
          <Popover.Trigger class="btn">Edit note</Popover.Trigger>
          <Popover.Positioner side="top" align="start" sideOffset={12} collisionPadding={16}>
            <Popover.Content class="overlay-sheet demo-popover">
              <Popover.Arrow class="demo-popover__arrow" />
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
            </Popover.Content>
          </Popover.Positioner>
        </Popover>
        <p class="prose">
          Tab through the editor to leave it. Clicking elsewhere or pressing Escape also closes the
          panel.
        </p>
        <Readout rows={[['note', note() || 'empty']]} />
      </Bench>
    </Section>
  )
}
