import { Popover } from '@xenon-ui/solid/popover'

export default function Anchor() {
  return (
    <Popover>
      <Popover.Anchor
        class="flex w-72 border border-neutral-950 bg-white text-sm
          dark:border-neutral-400 dark:bg-neutral-900"
      >
        <input
          aria-label="Search issues"
          placeholder="Search issues"
          class="min-w-0 flex-1 bg-transparent px-3 py-2 focus-visible:outline-2
            focus-visible:-outline-offset-2 focus-visible:outline-pink-600"
        />
        <Popover.Trigger
          class="border-l border-neutral-950 px-3 hover:bg-neutral-100
            focus-visible:outline-2 focus-visible:-outline-offset-2
            focus-visible:outline-pink-600 dark:border-neutral-400
            dark:hover:bg-neutral-800"
        >
          Filters
        </Popover.Trigger>
      </Popover.Anchor>
      <Popover.Positioner sideOffset={4} matchAnchorSize="width">
        <Popover.Content
          class="grid gap-2 border border-neutral-950 bg-white p-3 text-sm
            text-neutral-950 dark:border-neutral-600
            dark:bg-neutral-900 dark:text-white"
        >
          <Popover.Title class="font-semibold">Status</Popover.Title>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="accent-pink-600" checked /> Open
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="accent-pink-600" /> Closed
          </label>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
