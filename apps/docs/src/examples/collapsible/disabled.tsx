import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function Disabled() {
  return (
    <Collapsible
      disabled
      class="w-80 border border-neutral-950 bg-white text-sm text-neutral-950
        data-disabled:border-neutral-300 dark:border-neutral-700
        dark:bg-neutral-950 dark:text-white
        dark:data-disabled:border-neutral-800"
    >
      <Collapsible.Trigger
        class="flex w-full items-baseline justify-between px-4 py-3 text-left
          font-medium focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-pink-600 data-disabled:cursor-not-allowed
          data-disabled:text-neutral-400 dark:data-disabled:text-neutral-600"
      >
        Billing history
        <span class="text-xs font-normal">No invoices yet</span>
      </Collapsible.Trigger>
      <Collapsible.Content class="border-t border-neutral-200 px-4 py-3">
        Your invoices appear here after the first charge.
      </Collapsible.Content>
    </Collapsible>
  )
}
