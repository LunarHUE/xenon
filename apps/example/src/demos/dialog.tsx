import { Dialog } from '@tenon/solid/dialog'
import { createSignal } from 'solid-js'
import { Bench, Readout, Section } from '../ui'

export function DialogDemo() {
  const [open, setOpen] = createSignal(false)
  const [name, setName] = createSignal('Alex Morgan')
  return (
    <Section
      index="15"
      title="Dialog"
      blurb="Open an editor, move through its controls, then return to the button that opened it. The rest of the page waits while the dialog is open."
    >
      <Bench caption="Profile editor" note="modal · nested focus">
        <Dialog open={open()} onOpenChange={setOpen}>
          <Dialog.Trigger class="btn">Edit display name</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Viewport class="overlay-viewport">
              <Dialog.Content class="overlay-sheet">
                <p class="overlay-sheet__eyebrow">Profile / 01</p>
                <Dialog.Title class="overlay-sheet__title">Make yourself known.</Dialog.Title>
                <Dialog.Description class="overlay-sheet__description">
                  Your display name appears beside your comments.
                </Dialog.Description>
                <label class="overlay-field">
                  Display name
                  <input
                    class="input"
                    value={name()}
                    onInput={(event) => setName(event.currentTarget.value)}
                  />
                </label>
                <div class="overlay-actions">
                  <Dialog>
                    <Dialog.Trigger class="btn btn--quiet">Naming guidelines</Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Viewport class="overlay-viewport">
                        <Dialog.Content class="overlay-sheet">
                          <Dialog.Title class="overlay-sheet__title">
                            A name people recognize.
                          </Dialog.Title>
                          <Dialog.Description class="overlay-sheet__description">
                            Use your name or a familiar nickname. You can change it whenever you
                            like.
                          </Dialog.Description>
                          <Dialog.Close class="btn" aria-label="Back to editor">
                            Back to editor
                          </Dialog.Close>
                        </Dialog.Content>
                      </Dialog.Viewport>
                    </Dialog.Portal>
                  </Dialog>
                  <Dialog.Close class="btn" aria-label="Done editing">
                    Done editing
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Viewport>
          </Dialog.Portal>
        </Dialog>
        <p class="prose">
          Open the naming guidelines for a second dialog. Escape closes one dialog at a time.
        </p>
        <Readout
          rows={[
            ['open', String(open())],
            ['display name', name() || 'empty'],
          ]}
        />
      </Bench>
    </Section>
  )
}
