import { within, cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Tooltip } from './tooltip'
afterEach(() => {
  cleanup()
  flush()
  vi.useRealTimers()
})
function Example(props: { name: string; delay?: number }) {
  return (
    <Tooltip openDelay={props.delay}>
      <Tooltip.Trigger>{props.name}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>{props.name} description</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip>
  )
}
function enter(node: HTMLElement) {
  fireEvent.pointerEnter(node, { pointerType: 'mouse' })
  flush()
}
function leave(node: HTMLElement) {
  fireEvent.pointerLeave(node, { pointerType: 'mouse' })
  flush()
}
function tick(ms: number) {
  vi.advanceTimersByTime(ms)
  flush()
}
test('provider defaults inherit while explicit zero opens immediately', () => {
  vi.useFakeTimers()
  const m = render(() => (
    <Tooltip.Provider openDelay={600}>
      <Example name="Delayed" />
      <Example name="Immediate" delay={0} />
    </Tooltip.Provider>
  ))
  flush()
  enter(m.getByRole('button', { name: 'Delayed' }))
  tick(599)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
  tick(1)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent(
    'Delayed description'
  )
  enter(m.getByRole('button', { name: 'Immediate' }))
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent(
    'Immediate description'
  )
})
test('nested provider overrides retain group warmth and expiry restores the hover delay', () => {
  vi.useFakeTimers()
  const m = render(() => (
    <Tooltip.Provider openDelay={100} closeDelay={0} skipDelay={300} hoverable={false}>
      <Example name="First" />
      <Tooltip.Provider openDelay={500}>
        <Example name="Second" />
      </Tooltip.Provider>
    </Tooltip.Provider>
  ))
  flush()
  const first = m.getByRole('button', { name: 'First' }),
    second = m.getByRole('button', { name: 'Second' })
  enter(first)
  tick(100)
  leave(first)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
  tick(200)
  enter(second)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent(
    'Second description'
  )
  leave(second)
  tick(301)
  enter(first)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
  tick(100)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toBeInTheDocument()
})
test('focus describes without expansion, author IDs lead and aria-disabled still explains a control', () => {
  const m = render(() => (
    <>
      <span id="author-help">Author</span>
      <Tooltip>
        <Tooltip.Trigger aria-disabled="true" aria-describedby="author-help">
          Action
        </Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content id="actual-tip" aria-label="Explanation">
            More
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </>
  ))
  flush()
  const trigger = m.getByRole('button')
  trigger.focus()
  flush()
  expect(trigger).toHaveAttribute('aria-describedby', 'author-help actual-tip')
  expect(trigger).not.toHaveAttribute('aria-expanded')
  expect(trigger).toHaveFocus()
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveAttribute(
    'aria-label',
    'Explanation'
  )
  expect(within(document.body).getByRole('tooltip', { hidden: true })).not.toHaveAttribute(
    'tabindex'
  )
})
test('controlled opening proposes changes and provider false overrides remain local', () => {
  vi.useFakeTimers()
  const changed = vi.fn()
  const m = render(() => (
    <Tooltip.Provider openDelay={500}>
      <Tooltip open={false} openDelay={0} onOpenChange={changed}>
        <Tooltip.Trigger>Fixed</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Hidden</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  flush()
  enter(m.getByRole('button'))
  expect(changed).toHaveBeenCalledWith(true)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
})
test('detached handles share payload and only describe the active trigger', () => {
  const handle = Tooltip.createHandle<string>()
  const m = render(() => (
    <>
      <Tooltip.Trigger handle={handle} payload="First">
        First
      </Tooltip.Trigger>
      <Tooltip.Trigger handle={handle} payload="Second">
        Second
      </Tooltip.Trigger>
      <Tooltip handle={handle} openDelay={0}>
        {(state) => (
          <Tooltip.Positioner>
            <Tooltip.Content>
              <Tooltip.Viewport>{state.payload}</Tooltip.Viewport>
            </Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip>
    </>
  ))
  flush()
  const first = m.getByRole('button', { name: 'First' }),
    second = m.getByRole('button', { name: 'Second' })
  enter(first)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent('First')
  const content = within(document.body).getByRole('tooltip', { hidden: true })
  enter(second)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toBe(content)
  expect(content).toHaveTextContent('Second')
  expect(first).not.toHaveAttribute('aria-describedby')
  expect(second).toHaveAttribute('aria-describedby', content.id)
  handle.close()
  flush()
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
})
test('disabled changes cancel delayed opening and trigger click preserves native action', () => {
  vi.useFakeTimers()
  const [disabled, setDisabled] = createSignal(false),
    action = vi.fn()
  const m = render(() => (
    <Tooltip disabled={disabled()} openDelay={100}>
      <Tooltip.Trigger onClick={action}>Run</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Hint</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  flush()
  const trigger = m.getByRole('button')
  enter(trigger)
  setDisabled(true)
  flush()
  tick(200)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
  fireEvent.click(trigger)
  flush()
  expect(action).toHaveBeenCalledOnce()
  expect(trigger).not.toHaveAttribute('disabled')
})

test('inherited delay changes preserve elapsed time', () => {
  vi.useFakeTimers()
  const [delay, setDelay] = createSignal(100)
  const m = render(() => (
    <Tooltip.Provider openDelay={delay()}>
      <Tooltip>
        <Tooltip.Trigger>Live</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Live policy</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  flush()
  enter(m.getByRole('button', { name: 'Live' }))
  tick(40)
  setDelay(60)
  flush()
  tick(19)
  expect(within(document.body).queryByRole('tooltip', { hidden: true })).toBeNull()
  tick(1)
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent(
    'Live policy'
  )
})

test('author cancellation prevents press dismissal', () => {
  const m = render(() => (
    <Tooltip openDelay={0}>
      <Tooltip.Trigger
        onPointerDown={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
      >
        Keep hint
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Retained</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  flush()
  const trigger = m.getByRole('button')
  enter(trigger)
  fireEvent.pointerDown(trigger, { pointerType: 'mouse', cancelable: true })
  fireEvent.click(trigger)
  flush()
  expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent('Retained')
})
