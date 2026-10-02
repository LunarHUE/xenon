import { Popover } from '@xenon-ui/solid/popover'

export default function ShareLink() {
  return (
    <Popover>
      <Popover.Trigger
        class="bg-neutral-950 px-5 py-2.5 text-sm text-white hover:bg-neutral-800
          focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-pink-600 dark:bg-white dark:text-neutral-950
          dark:hover:bg-neutral-200"
      >
        Share
      </Popover.Trigger>
      <Popover.Positioner sideOffset={8}>
        <Popover.Content
          class="relative grid w-72 gap-1 border border-neutral-950 bg-white p-4
            text-sm text-neutral-950 shadow-[4px_4px_0_var(--color-neutral-950)]
            dark:border-neutral-600 dark:bg-neutral-900
            dark:text-white dark:shadow-[4px_4px_0_var(--color-neutral-600)]"
        >
          <Popover.Title class="pr-8 font-semibold">Share this draft</Popover.Title>
          <Popover.Description class="text-neutral-600 dark:text-neutral-400">
            Anyone with the link can view it.
          </Popover.Description>
          <input
            readonly
            aria-label="Draft link"
            value="https://xenon.dev/d/q3-roadmap"
            class="mt-2 border border-neutral-300 bg-neutral-50 px-2 py-1.5 font-mono
              text-xs focus-visible:outline-2 focus-visible:outline-pink-600
              dark:border-neutral-700 dark:bg-neutral-950"
          />
          <Popover.Close
            class="absolute top-3 right-3 grid size-7 place-items-center
              hover:bg-neutral-100 focus-visible:outline-2
              focus-visible:outline-pink-600 dark:hover:bg-neutral-800"
          >
            <svg viewBox="0 0 16 16" class="size-4" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
