import { createSignal } from 'solid-js'
import { Button } from '../ui/button'
import { toast } from '../../lib/toast'

/**
 * Every button talks to the manager in lib/toast directly. Nothing here reads
 * context; the page mounts the Toaster as a separate island.
 */
export default function ToastPreview() {
  const [archived, setArchived] = createSignal(false)
  let count = 0
  const save = () => {
    count += 1
    toast.success(`Note ${count} saved`, {
      description:
        count % 2
          ? 'A small detail, kept for later.'
          : 'This longer note takes more room. Hover the stack to read each one at its own height.',
    })
  }
  return (
    <div>
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
                loading: 'Preparing your export',
                success: (file) => ({ title: 'Export ready', description: file }),
                error: 'The export could not finish',
              }
            )
          }
        >
          Export notes
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.error('Could not save', { description: 'Check the connection.' })}
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
    </div>
  )
}
