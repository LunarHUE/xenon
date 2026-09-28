import { Popover } from '@xenon-ui/solid/popover'

export default function Placement() {
  return (
    <Popover>
      <Popover.Trigger>Formatting help</Popover.Trigger>
      <Popover.Positioner side="top" align="start" sideOffset={8}>
        <Popover.Content>
          <Popover.Title>Shortcuts</Popover.Title>
          <dl>
            <dt>Bold</dt>
            <dd>Ctrl B</dd>
            <dt>Link</dt>
            <dd>Ctrl K</dd>
          </dl>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
