import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function ButtonHost() {
  return (
    <Checkbox
      as="button"
      name="archived"
      class="group flex items-center gap-3 border border-neutral-950 px-4 py-2.5
        text-sm focus-visible:outline-2 focus-visible:outline-offset-4
        focus-visible:outline-pink-600 data-[state=checked]:bg-neutral-950
        data-[state=checked]:text-white dark:border-white
        dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-neutral-950"
    >
      <svg
        viewBox="0 0 12 12"
        aria-hidden="true"
        class="size-4 border border-current fill-none stroke-transparent
          stroke-2 p-0.5 group-data-[state=checked]:stroke-current"
      >
        <path d="M2 6.5 5 9.5 10 3" />
      </svg>
      Include archived projects
    </Checkbox>
  )
}
