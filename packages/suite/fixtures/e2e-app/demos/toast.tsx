import { Toast } from '@xenon-ui/solid/toast'
import { For, createSignal } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

/** Exercise one explicitly scoped notification manager with consumer-owned motion. */
export function ToastDemo() {
  const manager = Toast.createManager()
  return (
    <Toast.Provider manager={manager} duration={5000} limit={3}>
      <ToastControls />
      <Toast.Portal>
        <Toast.Viewport class="demo-toasts" aria-label="Desk notifications" gap={12}>
          <For each={manager.toasts()}>
            {(item) => (
              <Toast.Content toast={item} class="demo-toast" swipeDirection={['right', 'down']}>
                <div class="demo-toast__heading">
                  <span class="demo-toast__type" aria-hidden="true">
                    {item.type}
                  </span>
                  <Toast.Close class="demo-toast__close" aria-label="Dismiss notification">
                    ×
                  </Toast.Close>
                </div>
                <Toast.Title class="demo-toast__title" />
                <Toast.Description class="demo-toast__description" />
                <Toast.Action class="btn demo-toast__action" />
              </Toast.Content>
            )}
          </For>
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

/** Buttons remain focused when they create a toast; the shortcut reaches its actions. */
function ToastControls() {
  const toast = Toast.useManager()
  const [archived, setArchived] = createSignal(false)
  let count = 0
  const add = () => {
    count += 1
    toast.add({
      title: `Note ${count} saved`,
      description:
        count % 2
          ? 'A small detail, kept for later.'
          : 'This longer note takes a little more room. Hover over the stack to read each notification at its own height.',
      type: 'success',
    })
  }
  return (
    <Section
      index="30"
      title="Toast"
      blurb="News from your desk. Notifications wait while you read, stack when you leave, and move aside with a swipe."
    >
      <Bench caption="The outbox" note="a stack of three · five seconds">
        <div class="floating-tools">
          <button class="btn" onClick={add}>
            Save a note
          </button>
          <button
            class="btn btn--quiet"
            onClick={() => {
              add()
              add()
              add()
            }}
          >
            Save three notes
          </button>
          <button
            class="btn btn--quiet"
            onClick={() => {
              setArchived(true)
              toast.add({
                title: 'Note archived',
                description: 'Changed your mind? Bring it back.',
                duration: 8000,
                action: { label: 'Undo archive', onClick: () => setArchived(false) },
              })
            }}
          >
            Archive with undo
          </button>
          <button
            class="btn btn--quiet"
            onClick={() =>
              toast.promise(
                new Promise<string>((resolve) => setTimeout(() => resolve('Desk notes.txt'), 1200)),
                {
                  loading: 'Preparing your export…',
                  success: (filename) => ({ title: 'Export ready', description: filename }),
                  error: 'The export could not finish.',
                }
              )
            }
          >
            Export notes
          </button>
          <button class="btn btn--quiet" onClick={() => toast.dismiss()}>
            Dismiss all
          </button>
        </div>
        <p class="prose">
          Add a few notes quickly, then hover over the stack. Try a swipe to the right or down.{' '}
          <Keys>Alt</Keys> + <Keys>T</Keys> reaches notifications; <Keys>Esc</Keys> dismisses the
          focused one.
        </p>
        <Readout
          rows={[
            ['note', archived() ? 'archived' : 'on your desk'],
            ['notifications', String(toast.toasts().filter((item) => item.open).length)],
          ]}
        />
      </Bench>
    </Section>
  )
}
