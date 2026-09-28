import { Popover } from '@xenon-ui/solid/popover'

export default function ShareLink() {
  return (
    <Popover>
      <Popover.Trigger>Share</Popover.Trigger>
      <Popover.Positioner sideOffset={8}>
        <Popover.Content>
          <Popover.Title>Share this draft</Popover.Title>
          <Popover.Description>Anyone with the link can view it.</Popover.Description>
          <input readOnly aria-label="Draft link" value="https://xenon.dev/d/q3-roadmap" />
          <Popover.Close>×</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  )
}
