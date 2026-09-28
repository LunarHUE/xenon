import { createSignal } from 'solid-js'
import { Collapsible } from '@xenon-ui/solid/collapsible'

export default function Controlled() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Collapsible open={open()} onOpenChange={setOpen}>
        <Collapsible.Trigger>Release notes for 2.4</Collapsible.Trigger>
        <Collapsible.Content>
          Exports now keep their folder structure, and shared links expire
          after 30 days.
        </Collapsible.Content>
      </Collapsible>
      <p>Open: {String(open())}</p>
    </div>
  )
}
