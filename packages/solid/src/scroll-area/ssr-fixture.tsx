import { renderToString } from '@solidjs/web'
import { ScrollArea } from './scroll-area'
/** Serialize the named native viewport and custom controls before layout is available. */
export function renderFixture(): string {
  return renderToString(() => (
    <ScrollArea type="always">
      <ScrollArea.Viewport id="messages" aria-label="Messages" style={{ height: '200px' }}>
        <ScrollArea.Content>
          <p>Readable without JavaScript.</p>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  ))
}
