import { Popover } from '@xenon-ui/solid/popover'

export default function Anchor() {
  return (
    <Popover>
      <Popover.Anchor>
        <input aria-label="Search issues" placeholder="Search issues" />
        <Popover.Trigger>Filters</Popover.Trigger>
      </Popover.Anchor>
      <Popover.Positioner sideOffset={4} matchAnchorSize="width">
        <Popover.Content>
          <Popover.Title>Status</Popover.Title>
          <label>
            <input type="checkbox" checked /> Open
          </label>
          <label>
            <input type="checkbox" /> Closed
          </label>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
