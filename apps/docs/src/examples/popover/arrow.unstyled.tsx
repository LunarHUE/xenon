import { Popover } from '@xenon-ui/solid/popover'

export default function Arrow() {
  return (
    <Popover>
      <Popover.Trigger>What counts as a seat?</Popover.Trigger>
      <Popover.Positioner sideOffset={10}>
        <Popover.Content>
          <Popover.Arrow>
            <div />
          </Popover.Arrow>
          <div>
            <Popover.Title>Seats</Popover.Title>
            <Popover.Description>
              Each member who can sign in takes one seat. Guests are free.
            </Popover.Description>
          </div>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
