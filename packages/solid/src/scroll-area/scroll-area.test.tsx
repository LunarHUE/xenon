import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { ScrollArea } from './scroll-area'
const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}
function dimensions(element: HTMLElement) {
  Object.defineProperties(element, {
    clientWidth: { value: 100 },
    clientHeight: { value: 100 },
    scrollWidth: { value: 500 },
    scrollHeight: { value: 500 },
  })
}
test('native metrics drive semantics, author IDs stay live and content identity survives scrolling', async () => {
  const [id, setId] = createSignal('author-viewport')
  const view = render(() => (
    <ScrollArea>
      <ScrollArea.Viewport id={id()} aria-label="Messages" ref={dimensions}>
        <ScrollArea.Content>
          <input aria-label="Draft" value="Keep me" />
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar orientation="horizontal">
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  ))
  await settle()
  const viewport = view.getByRole('region'),
    input = view.getByRole('textbox'),
    bar = view.getByRole('scrollbar', { name: 'Vertical scroll' })
  expect(viewport).toHaveAttribute('tabindex', '0')
  expect(bar).toHaveAttribute('aria-controls', 'author-viewport')
  expect(bar).not.toHaveAttribute('aria-orientation')
  expect(viewport.style.scrollbarWidth).toBe('none')
  fireEvent.keyDown(bar, { key: 'End' })
  await settle()
  expect(viewport.scrollTop).toBe(400)
  expect(bar).toHaveAttribute('aria-valuenow', '100')
  expect(viewport).toHaveAttribute('data-at-bottom')
  setId('renamed')
  await settle()
  expect(bar).toHaveAttribute('aria-controls', 'renamed')
  expect(view.getByRole('textbox')).toBe(input)
  expect(input).toHaveValue('Keep me')
})
test('optional bars never conceal an overflowing axis without a custom replacement', async () => {
  const [horizontal, setHorizontal] = createSignal(false)
  const view = render(() => (
    <ScrollArea>
      <ScrollArea.Viewport aria-label="Both axes" ref={dimensions}>
        <ScrollArea.Content>Long content</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
      {horizontal() && (
        <ScrollArea.Scrollbar orientation="horizontal">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      )}
    </ScrollArea>
  ))
  await settle()
  const viewport = view.getByRole('region')
  expect(viewport.style.scrollbarWidth).toBe('')
  setHorizontal(true)
  await settle()
  expect(viewport.style.scrollbarWidth).toBe('none')
  setHorizontal(false)
  await settle()
  expect(viewport.style.scrollbarWidth).toBe('')
})
test('hover and focus reveal bars and author cancellation vetoes keyboard scrolling', async () => {
  const handler = vi.fn((event: KeyboardEvent) => event.preventDefault())
  const view = render(() => (
    <ScrollArea type="hover" data-testid="root">
      <ScrollArea.Viewport aria-label="Content" ref={dimensions}>
        <ScrollArea.Content>Content</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar onKeyDown={handler}>
        <ScrollArea.Thumb />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  ))
  await settle()
  const bar = view.getByRole('scrollbar', { hidden: true })
  expect(bar).toHaveAttribute('hidden')
  fireEvent.pointerEnter(view.getByTestId('root'), { pointerType: 'mouse' })
  await settle()
  expect(bar).not.toHaveAttribute('hidden')
  fireEvent.keyDown(bar, { key: 'End' })
  await settle()
  expect(handler).toHaveBeenCalledOnce()
  expect(view.getByRole('region').scrollTop).toBe(0)
  fireEvent.pointerLeave(view.getByTestId('root'))
  await settle()
  expect(bar).toHaveAttribute('hidden')
  fireEvent.focusIn(view.getByRole('region'))
  await settle()
  expect(bar).not.toHaveAttribute('hidden')
})

test('content replacement does not strand the scroll visibility timer', async () => {
  vi.useFakeTimers()
  try {
    const [show, setShow] = createSignal(true)
    const view = render(() => (
      <ScrollArea type="scroll" scrollHideDelay={50} data-testid="root">
        <ScrollArea.Viewport aria-label="Content" ref={dimensions}>
          {show() && <ScrollArea.Content>Content</ScrollArea.Content>}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar>
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea>
    ))
    await settle()
    fireEvent.scroll(view.getByRole('region'))
    await settle()
    expect(view.getByTestId('root')).toHaveAttribute('data-scrolling')
    setShow(false)
    await settle()
    vi.advanceTimersByTime(60)
    await settle()
    expect(view.getByTestId('root')).not.toHaveAttribute('data-scrolling')
    expect(view.getByRole('scrollbar', { hidden: true })).toHaveAttribute('hidden')
    view.unmount()
  } finally {
    vi.useRealTimers()
  }
})
