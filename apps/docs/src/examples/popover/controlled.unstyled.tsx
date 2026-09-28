import { Popover } from '@xenon-ui/solid/popover'
import { createSignal } from 'solid-js'

export default function Controlled() {
  const [open, setOpen] = createSignal(false)
  return (
    <div>
      <p>Open: {String(open())}</p>
      <Popover open={open()} onOpenChange={setOpen}>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Positioner sideOffset={8}>
          <Popover.Content>
            <Popover.Title>Filters</Popover.Title>
            <label>
              <input type="checkbox" /> Assigned to me
            </label>
            <button onClick={() => setOpen(false)}>Apply</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    </div>
  )
}
