import { Button } from '@xenon-ui/solid/button'

export default function ButtonAnatomy() {
  return (
    <Button
      data-anatomy="Button"
      class="bg-neutral-950 px-5 py-2.5 text-sm text-white
        hover:bg-neutral-800 focus-visible:outline-2
        focus-visible:outline-offset-4 focus-visible:outline-pink-600
        dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
    >
      <span data-anatomy="label content">Save changes</span>
    </Button>
  )
}
