import { createSignal } from 'solid-js'
import { Checkbox } from '@xenon-ui/solid/checkbox'

export default function Controlled() {
  const [accepted, setAccepted] = createSignal(false)

  return (
    <div>
      <label>
        <Checkbox checked={accepted()} onCheckedChange={setAccepted} />
        I accept the terms of service
      </label>
      <p>Accepted: {String(accepted())}</p>
    </div>
  )
}
