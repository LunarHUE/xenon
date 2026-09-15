import { render } from '@solidjs/web'
import { ScrollArea } from '@tenon/solid/scroll-area'
import type { ScrollAreaType } from '@tenon/solid/scroll-area'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { onTestFinished } from 'vitest'

/** Native scrolling fixture dimensions and optional custom tracks. */
export interface FixtureOptions {
  /** Include the horizontal custom scrollbar, default false. */
  horizontal?: boolean
  /** Include the vertical custom scrollbar, default true. */
  vertical?: boolean
  /** Native inherited writing direction. */
  dir?: 'ltr' | 'rtl'
  /** Custom scrollbar visibility policy. */
  type?: ScrollAreaType
  /** Initial content width in pixels, default 240. */
  contentWidth?: number
  /** Initial content height in pixels, default 900. */
  contentHeight?: number
}
/** Mount real measurable native overflow without mocking geometry or observers. */
export function mountScrollArea(options: FixtureOptions = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const [shown, setShown] = createSignal(true)
  const [contentSize, setContentSize] = createSignal({
    width: options.contentWidth ?? 240,
    height: options.contentHeight ?? 900,
  })
  const [viewportSize, setViewportSize] = createSignal({ width: 240, height: 180 })
  const [viewportId, setViewportId] = createSignal('scroll-area-viewport')
  const dispose = render(
    () => (
      <>
        <button>Before scroll area</button>
        {shown() && (
          <ScrollArea
            dir={options.dir}
            type={options.type}
            data-testid="root"
            style={{ width: `${viewportSize().width}px`, height: `${viewportSize().height}px` }}
          >
            <ScrollArea.Viewport
              id={viewportId()}
              aria-label="Scrollable articles"
              style={{ width: '100%', height: '100%' }}
            >
              <ScrollArea.Content
                data-testid="content"
                style={{ width: `${contentSize().width}px`, height: `${contentSize().height}px` }}
              >
                Article content
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            {options.vertical !== false && (
              <ScrollArea.Scrollbar data-testid="vertical" style={{ width: '12px' }}>
                <ScrollArea.Thumb style={{ background: 'gray' }} />
              </ScrollArea.Scrollbar>
            )}
            {options.horizontal && (
              <ScrollArea.Scrollbar
                orientation="horizontal"
                data-testid="horizontal"
                style={{ height: '12px' }}
              >
                <ScrollArea.Thumb style={{ background: 'gray' }} />
              </ScrollArea.Scrollbar>
            )}
            <ScrollArea.Corner data-testid="corner" />
          </ScrollArea>
        )}
        <button>After scroll area</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const view = within(container)
  return {
    container,
    ...view,
    viewport: () => view.getByRole('region', { name: 'Scrollable articles' }),
    resizeContent: (width: number, height: number) => {
      setContentSize({ width, height })
      flush()
    },
    resizeViewport: (width: number, height: number) => {
      setViewportSize({ width, height })
      flush()
    },
    renameViewport: (id: string) => {
      setViewportId(id)
      flush()
    },
    remove: () => {
      setShown(false)
      flush()
    },
  }
}
