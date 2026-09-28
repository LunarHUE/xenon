import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function ProductUpdates() {
  return (
    <label class="flex items-center gap-3 text-sm">
      <span class="relative grid size-4 place-items-center">
        <Checkbox
          class="peer size-4 appearance-none border border-neutral-950
            bg-white focus-visible:outline-2 focus-visible:outline-offset-4
            focus-visible:outline-pink-600 data-[state=checked]:bg-neutral-950
            dark:border-white dark:bg-neutral-950
            dark:data-[state=checked]:bg-white"
        />
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          class="pointer-events-none absolute hidden size-3 fill-none
            stroke-white stroke-2 peer-data-[state=checked]:block
            dark:stroke-neutral-950"
        >
          <path d="M2 6.5 5 9.5 10 3" />
        </svg>
      </span>
      Email me product updates
    </label>
  )
}
