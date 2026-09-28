import { createSignal } from 'solid-js'
import { Button } from '@xenon-ui/solid/button'
import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function Form() {
  const [sent, setSent] = createSignal('Not sent yet')
  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget as HTMLFormElement)
    const entries = [...data].map(([name, value]) => `${name}=${value}`)
    setSent(entries.join('&') || 'No entries')
  }

  return (
    <form onSubmit={submit} class="flex flex-col items-start gap-3 text-sm">
      <label class="flex items-center gap-3">
        <Checkbox
          name="digest"
          value="weekly"
          defaultChecked
          class="size-4 accent-neutral-950 focus-visible:outline-2
            focus-visible:outline-offset-4 focus-visible:outline-pink-600
            dark:accent-white"
        />
        Weekly digest
      </label>
      <label class="flex items-center gap-3">
        <Checkbox
          name="announcements"
          class="size-4 accent-neutral-950 focus-visible:outline-2
            focus-visible:outline-offset-4 focus-visible:outline-pink-600
            dark:accent-white"
        />
        Product announcements
      </label>
      <Button
        type="submit"
        class="mt-2 bg-neutral-950 px-5 py-2.5 text-white hover:bg-neutral-800
          focus-visible:outline-2 focus-visible:outline-offset-4
          focus-visible:outline-pink-600 dark:bg-white dark:text-neutral-950
          dark:hover:bg-neutral-200"
      >
        Save preferences
      </Button>
      <p class="font-mono text-xs text-neutral-500">{sent()}</p>
    </form>
  )
}
