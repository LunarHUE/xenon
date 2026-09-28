import { createSignal } from 'solid-js'
import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function Controlled() {
  const [accepted, setAccepted] = createSignal(false)

  return (
    <div class="flex flex-col gap-3 text-sm">
      <label class="flex items-center gap-3">
        <Checkbox
          checked={accepted()}
          onCheckedChange={setAccepted}
          class="size-4 accent-neutral-950 focus-visible:outline-2
            focus-visible:outline-offset-4 focus-visible:outline-pink-600
            dark:accent-white"
        />
        I accept the terms of service
      </label>
      <p class="text-neutral-500">Accepted: {String(accepted())}</p>
    </div>
  )
}
