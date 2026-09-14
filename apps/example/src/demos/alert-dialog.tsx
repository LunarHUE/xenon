import { AlertDialog } from '@tenon/solid/alert-dialog'
import { Button } from '@tenon/solid/button'
import { createSignal } from 'solid-js'
import { Bench, Readout, Section } from '../ui'

export function AlertDialogDemo() {
  const [archived, setArchived] = createSignal(false)
  let restoreButton: HTMLElement | undefined
  return (
    <Section
      index="16"
      title="Alert dialog"
      blurb="A decision that deserves a pause. Cancel receives focus first, and clicking the background leaves the question open."
    >
      <Bench caption="Archive a sample project" note="cancel first · explicit action">
        <div class="overlay-actions overlay-actions--start">
          <AlertDialog finalFocus={archived() ? restoreButton : undefined}>
            <AlertDialog.Trigger class="btn" disabled={archived()}>
              Archive project
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Viewport class="overlay-viewport">
                <AlertDialog.Content class="overlay-sheet">
                  <p class="overlay-sheet__eyebrow">Project / Field notes</p>
                  <AlertDialog.Title class="overlay-sheet__title">
                    Archive this project?
                  </AlertDialog.Title>
                  <AlertDialog.Description class="overlay-sheet__description">
                    It will leave your active project list. This demo changes only the status shown
                    below.
                  </AlertDialog.Description>
                  <div class="overlay-actions">
                    <AlertDialog.Action
                      class="btn btn--danger"
                      aria-label="Confirm archive"
                      onClick={() => setArchived(true)}
                    >
                      Confirm archive
                    </AlertDialog.Action>
                    <AlertDialog.Cancel class="btn" aria-label="Keep project">
                      Keep project
                    </AlertDialog.Cancel>
                  </div>
                </AlertDialog.Content>
              </AlertDialog.Viewport>
            </AlertDialog.Portal>
          </AlertDialog>
          <Button
            ref={(el) => {
              restoreButton = el
            }}
            class="btn btn--quiet"
            disabled={!archived()}
            onClick={() => setArchived(false)}
          >
            Restore project
          </Button>
        </div>
        <Readout
          rows={[
            ['project', 'Field notes'],
            ['status', archived() ? 'archived' : 'active'],
          ]}
        />
      </Bench>
    </Section>
  )
}
