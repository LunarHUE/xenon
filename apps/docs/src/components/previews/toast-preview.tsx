import { createSignal } from 'solid-js'
import { Button } from '../ui/button'
import { toast } from '../../lib/toast'

/**
 * Every button talks to the manager in lib/toast directly. Nothing here reads
 * context; the page mounts the Toaster as a separate client-only island.
 */
function Controls(props: { theme: 'light' | 'dark' }) {
  const [archived, setArchived] = createSignal(false)
  let count = 0
  const data = { theme: props.theme }
  const save = () => {
    count += 1
    toast.success(`Note ${count} saved`, {
      description:
        count % 2
          ? 'A small detail, kept for later.'
          : 'This longer note takes more room. Hover the stack to read each one at its own height.',
      data,
    })
  }
  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="flex flex-wrap items-center gap-4">
        <Button onClick={save}>Save a note</Button>
        <Button
          variant="outline"
          onClick={() => {
            save()
            save()
            save()
          }}
        >
          Save three
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setArchived(true)
            toast.add({
              title: 'Note archived',
              description: 'Changed your mind? Bring it back.',
              duration: 8000,
              action: { label: 'Undo', onClick: () => setArchived(false) },
              data,
            })
          }}
        >
          Archive with undo
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(
              new Promise<string>((resolve) => setTimeout(() => resolve('notes.txt'), 1200)),
              {
                loading: { title: 'Preparing your export', data },
                success: (file) => ({ title: 'Export ready', description: file, data }),
                error: { title: 'The export could not finish', data },
              }
            )
          }
        >
          Export notes
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.error('Could not save', { description: 'Check the connection.', data })
          }
        >
          Error
        </Button>
        <Button variant="outline" onClick={() => toast.dismiss()}>
          Dismiss all
        </Button>
      </div>
      <p class="mt-6 text-sm text-muted-foreground" role="status">
        Note is {archived() ? 'archived' : 'on your desk'}. Alt+T focuses the stack, Escape
        dismisses the focused one, swipe right or down to throw one away.
      </p>
    </section>
  )
}

export default function ToastPreview() {
  return (
    <div class="space-y-8">
      <Controls theme="light" />
      <Controls theme="dark" />
    </div>
  )
}
