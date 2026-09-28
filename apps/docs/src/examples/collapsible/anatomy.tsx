import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function CollapsibleAnatomy() {
  return (
    <Collapsible
      defaultOpen
      data-anatomy="Collapsible"
      class="flex w-96 items-start gap-6 text-sm text-neutral-950
        dark:text-white"
    >
      <Collapsible.Trigger
        data-anatomy="Collapsible.Trigger"
        class="group flex shrink-0 items-center gap-2 border border-neutral-950
          bg-white px-3 py-2 font-medium focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-pink-600
          dark:border-neutral-700 dark:bg-neutral-950"
      >
        Shipping details
        <span aria-hidden="true" class="group-data-[state=open]:rotate-180">
          ▾
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content
        data-anatomy="Collapsible.Content"
        class="py-2 text-neutral-600 dark:text-neutral-400"
      >
        Ships in two business days.
      </Collapsible.Content>
    </Collapsible>
  )
}
