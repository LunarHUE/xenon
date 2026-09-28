import { Popover } from '@xenon-ui/solid/popover'

export default function Arrow() {
  return (
    <Popover>
      <Popover.Trigger
        class="text-sm underline decoration-dotted underline-offset-4
          focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-pink-600"
      >
        What counts as a seat?
      </Popover.Trigger>
      <Popover.Positioner sideOffset={10}>
        <Popover.Content
          class="relative isolate focus-visible:outline-2
            focus-visible:outline-offset-2 focus-visible:outline-pink-600"
        >
          <Popover.Arrow class="-z-10 size-3">
            <div
              class="size-full rotate-45 border border-neutral-950 bg-white
                dark:border-neutral-600 dark:bg-neutral-900"
            />
          </Popover.Arrow>
          <div
            class="grid w-64 gap-1 border border-neutral-950 bg-white p-4 text-sm
              text-neutral-950 dark:border-neutral-600 dark:bg-neutral-900
              dark:text-white"
          >
            <Popover.Title class="font-semibold">Seats</Popover.Title>
            <Popover.Description class="text-neutral-600 dark:text-neutral-400">
              Each member who can sign in takes one seat. Guests are free.
            </Popover.Description>
          </div>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
