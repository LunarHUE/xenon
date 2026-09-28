import { Popover } from '@xenon-ui/solid/popover'
import { createSignal } from 'solid-js'

export default function Controlled() {
  const [open, setOpen] = createSignal(false)
  return (
    <div class="grid justify-items-center gap-3">
      <p class="font-mono text-xs">Open: {String(open())}</p>
      <Popover open={open()} onOpenChange={setOpen}>
        <Popover.Trigger
          class="border border-neutral-950 px-4 py-2 text-sm hover:bg-neutral-100
            focus-visible:outline-2 focus-visible:outline-offset-4
            focus-visible:outline-pink-600 dark:border-neutral-400
            dark:hover:bg-neutral-800"
        >
          Filters
        </Popover.Trigger>
        <Popover.Positioner sideOffset={8}>
          <Popover.Content
            class="grid w-60 gap-3 border border-neutral-950 bg-white p-4 text-sm
              text-neutral-950 dark:border-neutral-600
              dark:bg-neutral-900 dark:text-white"
          >
            <Popover.Title class="font-semibold">Filters</Popover.Title>
            <label class="flex items-center gap-2">
              <input type="checkbox" class="accent-pink-600" /> Assigned to me
            </label>
            <button
              onClick={() => setOpen(false)}
              class="justify-self-end bg-neutral-950 px-3 py-1.5 text-white
                focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-pink-600 dark:bg-white dark:text-neutral-950"
            >
              Apply
            </button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    </div>
  )
}
