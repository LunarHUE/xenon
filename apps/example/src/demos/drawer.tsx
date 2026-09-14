import { Drawer } from '@tenon/solid/drawer'
import { Checkbox } from '@tenon/solid/checkbox'
import { createSignal } from 'solid-js'
import { Bench, Readout, Section } from '../ui'

export function DrawerDemo() {
  const [open, setOpen] = createSignal(false)
  const [digest, setDigest] = createSignal(true)
  return (
    <Section
      index="17"
      title="Drawer"
      blurb="A panel at the edge of the page. Drag its handle down, press Escape, or use the closing button to return to your place."
    >
      <Bench caption="Bottom sheet" note="120px drag threshold · keyboard close">
        <Drawer side="bottom" dragThreshold={120} open={open()} onOpenChange={setOpen}>
          <Drawer.Trigger class="btn">Notification settings</Drawer.Trigger>
          <Drawer.Content class="overlay-sheet demo-drawer">
            <Drawer.Handle class="demo-drawer__handle" aria-label="Close notification settings">
              <span />
            </Drawer.Handle>
            <p class="overlay-sheet__eyebrow">Preferences / Notifications</p>
            <Drawer.Title class="overlay-sheet__title">Less noise. Your choice.</Drawer.Title>
            <Drawer.Description class="overlay-sheet__description">
              Choose what reaches your inbox.
            </Drawer.Description>
            <label class="overlay-choice">
              <Checkbox
                class="check"
                checked={digest()}
                onCheckedChange={(next) => setDigest(next === true)}
              />{' '}
              Send a weekly digest
            </label>
            <div class="overlay-actions">
              <Drawer.Close class="btn" aria-label="Done with notifications">
                Done with notifications
              </Drawer.Close>
            </div>
          </Drawer.Content>
        </Drawer>
        <Readout
          rows={[
            ['open', String(open())],
            ['drag threshold', '120px'],
            ['weekly digest', digest() ? 'on' : 'off'],
          ]}
        />
      </Bench>
    </Section>
  )
}
