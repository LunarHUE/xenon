import { Popover } from '@xenon-ui/solid/popover'

export default function Placement() {
  return (
    <Popover>
      <Popover.Trigger
        class="border border-neutral-950 px-4 py-2 text-sm hover:bg-neutral-100
          focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-pink-600 dark:border-neutral-400
          dark:hover:bg-neutral-800"
      >
        Formatting help
      </Popover.Trigger>
      <Popover.Positioner side="top" align="start" sideOffset={8}>
        <Popover.Content
          class="grid w-64 gap-2 border border-neutral-950 bg-white p-4 text-sm
            text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2
            focus-visible:outline-pink-600 dark:border-neutral-600
            dark:bg-neutral-900 dark:text-white"
        >
          <Popover.Title class="font-semibold">Shortcuts</Popover.Title>
          <dl class="grid grid-cols-[1fr_auto] gap-y-1 text-neutral-600 dark:text-neutral-400">
            <dt>Bold</dt>
            <dd class="font-mono text-xs">Ctrl B</dd>
            <dt>Link</dt>
            <dd class="font-mono text-xs">Ctrl K</dd>
          </dl>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
