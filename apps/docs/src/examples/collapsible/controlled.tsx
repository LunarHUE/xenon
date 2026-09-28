import { createSignal } from 'solid-js'
import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function Controlled() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="flex w-80 flex-col gap-3 text-sm">
      <Collapsible
        open={open()}
        onOpenChange={setOpen}
        class="border border-neutral-950 bg-white text-neutral-950
          dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
      >
        <Collapsible.Trigger
          class="w-full px-4 py-3 text-left font-medium hover:bg-neutral-100
            focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-pink-600 dark:hover:bg-neutral-900"
        >
          Release notes for 2.4
        </Collapsible.Trigger>
        <Collapsible.Content
          class="border-t border-neutral-200 px-4 py-3 text-neutral-600
            dark:border-neutral-800 dark:text-neutral-400"
        >
          Exports now keep their folder structure, and shared links expire
          after 30 days.
        </Collapsible.Content>
      </Collapsible>
      <p class="font-mono text-xs text-neutral-600 dark:text-neutral-400">
        Open: {String(open())}
      </p>
    </div>
  )
}
