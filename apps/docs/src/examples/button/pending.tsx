import { Button } from '@xenon-ui/solid/button'

export default function Pending() {
  return (
    <Button
      pending
      class="bg-neutral-950 px-5 py-2.5 text-sm text-white
        focus-visible:outline-2 focus-visible:outline-offset-4
        focus-visible:outline-pink-600 data-pending:cursor-progress
        data-pending:opacity-70 dark:bg-white dark:text-neutral-950"
    >
      Saving...
    </Button>
  )
}
