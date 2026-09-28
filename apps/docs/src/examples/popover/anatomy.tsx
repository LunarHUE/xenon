import { Popover } from '@xenon-ui/solid/popover'

// The leader lengths stagger the part labels so they don't overlap.
export default function PopoverAnatomy() {
  return (
    <Popover
      data-anatomy="Popover"
      defaultOpen
      initialFocus={false}
      class="mb-24 w-[40rem] max-w-full"
    >
      <Popover.Trigger
        data-anatomy="Popover.Trigger"
        style={{ '--anatomy-leader': '87px' }}
        class="bg-neutral-950 px-5 py-2.5 text-sm text-white hover:bg-neutral-800
          focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-pink-600 dark:bg-white dark:text-neutral-950
          dark:hover:bg-neutral-200"
      >
        Share
      </Popover.Trigger>
      <Popover.Positioner
        data-anatomy="Popover.Positioner"
        side="right"
        sideOffset={28}
        style={{ '--anatomy-leader': '86px' }}
      >
        <Popover.Content
          data-anatomy="Popover.Content"
          style={{ '--anatomy-leader': '62px' }}
          class="flex w-[33rem] items-center justify-between border border-neutral-950
            bg-white px-4 py-2.5 text-sm text-neutral-950 dark:border-neutral-600
            dark:bg-neutral-900 dark:text-white"
        >
          <Popover.Arrow
            data-anatomy="Popover.Arrow"
            style={{ '--anatomy-leader': '77px' }}
            class="size-3"
          >
            <div
              class="size-full rotate-45 border-b border-l border-neutral-950 bg-white
                dark:border-neutral-600 dark:bg-neutral-900"
            />
          </Popover.Arrow>
          <Popover.Title data-anatomy="Popover.Title" class="font-semibold">
            Draft shared
          </Popover.Title>
          <div class="flex items-center gap-8">
            <Popover.Description data-anatomy="Popover.Description">
              Anyone with the link can view it.
            </Popover.Description>
            <Popover.Close data-anatomy="Popover.Close" class="px-1">
              ×
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
