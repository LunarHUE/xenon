import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function ShippingDetails() {
  return (
    <Collapsible
      class="w-80 border border-neutral-950 bg-white text-sm text-neutral-950
        dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
    >
      <Collapsible.Trigger
        class="group flex w-full items-center justify-between px-4 py-3
          text-left font-medium hover:bg-neutral-100 focus-visible:outline-2
          focus-visible:outline-offset-2 focus-visible:outline-pink-600
          dark:hover:bg-neutral-900"
      >
        Shipping details
        <span aria-hidden="true" class="group-data-[state=open]:rotate-180">
          ▾
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content
        class="border-t border-neutral-200 px-4 py-3 text-neutral-600
          dark:border-neutral-800 dark:text-neutral-400"
      >
        Orders ship within two business days. The tracking link arrives by
        email once the parcel leaves the warehouse.
      </Collapsible.Content>
    </Collapsible>
  )
}
