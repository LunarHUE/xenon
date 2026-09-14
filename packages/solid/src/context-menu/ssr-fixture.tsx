import { renderToString } from '@solidjs/web'
import { ContextMenu } from './index'
export function renderFixture(open: boolean) {
  return renderToString(() => (
    <ContextMenu open={open}>
      <ContextMenu.Trigger id="trigger">Region</ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content id="panel">
          <ContextMenu.Item>Copy</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
}
