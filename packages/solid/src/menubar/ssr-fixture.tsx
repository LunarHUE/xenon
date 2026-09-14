import { renderToString } from '@solidjs/web'
import { Menubar } from './index'
/** Serialize a controlled menu fixture to verify server roles and ID associations. */
export function renderFixture(open: boolean) {
  return renderToString(() => (
    <Menubar value={open ? 'file' : ''}>
      <Menubar.Menu value="file">
        <Menubar.Trigger id="trigger">File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content id="panel">
            <Menubar.Item>New</Menubar.Item>
          </Menubar.Content>
        </Menubar.Positioner>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger id="other">Edit</Menubar.Trigger>
      </Menubar.Menu>
    </Menubar>
  ))
}
