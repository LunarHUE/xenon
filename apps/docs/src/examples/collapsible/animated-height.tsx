import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function AnimatedHeight() {
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
        Order summary, 3 items
        <span aria-hidden="true" class="group-data-[state=open]:rotate-180">
          ▾
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content
        class="h-(--collapsible-panel-height,auto) overflow-hidden
          transition-[height] duration-300 ease-out
          [interpolate-size:allow-keywords] data-ending-style:h-0
          data-starting-style:h-0 motion-reduce:transition-none"
      >
        <ul
          class="list-none space-y-1 border-t border-neutral-200 px-4 py-3
            text-neutral-600 tabular-nums dark:border-neutral-800
            dark:text-neutral-400"
        >
          <li class="flex justify-between">Canvas tote <span>$24.00</span></li>
          <li class="flex justify-between">Enamel mug <span>$18.00</span></li>
          <li class="flex justify-between">Linen notebook <span>$12.50</span></li>
        </ul>
      </Collapsible.Content>
    </Collapsible>
  )
}
