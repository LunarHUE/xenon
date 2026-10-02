import { Popover } from '@xenon-ui/solid/popover'
import { createSignal } from 'solid-js'

/** Note editor retained from the removed example app for the arrow paint-order regression. */
export function PopoverPaintFixture() {
  const [note, setNote] = createSignal('Remember the small details.')
  return (
    <Popover>
      <Popover.Trigger>Edit note</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={12} collisionPadding={16}>
          <Popover.Content class="demo-popover">
            <Popover.Viewport>
              <Popover.Arrow class="demo-popover__arrow" />
              <div class="demo-popover__surface">
                <Popover.Title>A note for later.</Popover.Title>
                <Popover.Description>Keep it short enough to remember.</Popover.Description>
                <label>
                  Note
                  <input value={note()} onInput={(event) => setNote(event.currentTarget.value)} />
                </label>
                <Popover.Close aria-label="Done with note">Done</Popover.Close>
              </div>
            </Popover.Viewport>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover>
  )
}
