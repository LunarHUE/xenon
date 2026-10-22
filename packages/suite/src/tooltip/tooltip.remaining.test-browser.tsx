import { Tooltip } from '@xenon-ui/solid/tooltip'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(document.body)
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
async function visible(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return (
        element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden'
      )
    })
    .toBe(true)
}
async function focused(element: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(element)
}
async function absent(m: ReturnType<typeof within>) {
  await expect
    .poll(() => {
      flush()
      return m.queryByRole('tooltip')
    })
    .toBeNull()
}
function Tip(props: {
  name: string
  text: string
  tabindex?: string
  closeOnEscape?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Tooltip
      openDelay={0}
      closeDelay={0}
      closeOnEscape={props.closeOnEscape}
      onOpenChange={props.onOpenChange}
    >
      <Tooltip.Trigger tabindex={props.tabindex}>{props.name}</Tooltip.Trigger>
      <Tooltip.Positioner side="bottom" align="start" flip={false} shift={false}>
        <Tooltip.Content>{props.text}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  )
}

test('trigger state hook follows a complete focus-open and Escape-close lifecycle tooltip.roles.4', async () => {
  const changed = vi.fn()
  const m = mount(() => <Tip name="Action" text="Action details" onOpenChange={changed} />)
  const trigger = m.getByRole('button', { name: 'Action' })
  expect(trigger).toHaveAttribute('data-state', 'closed')
  trigger.focus()
  flush()
  await visible(m.getByText('Action details'))
  expect(trigger).toHaveAttribute('data-state', 'open')
  await userEvent.keyboard('{Escape}')
  await absent(m)
  expect(trigger).toHaveAttribute('data-state', 'closed')
  expect(trigger).not.toHaveAttribute('aria-describedby')
  expect(changed.mock.calls).toEqual([[true], [false]])
})

test('positioned content reports open state and its resolved side and placement tooltip.roles.5', async () => {
  const m = mount(() => <Tip name="Action" text="Action details" />)
  m.getByRole('button', { name: 'Action' }).focus()
  flush()
  const content = m.getByText('Action details')
  await visible(content)
  expect(content).toHaveAttribute('data-state', 'open')
  expect(content).toHaveAttribute('data-side', 'bottom')
  expect(content).toHaveAttribute('data-placement', 'bottom-start')
})

test('native trigger tab order preserves default and author-excluded stops tooltip.roles.6', async () => {
  const m = mount(() => (
    <>
      <button>Before</button>
      <Tip name="Included" text="Included details" />
      <Tip name="Excluded" text="Excluded details" tabindex="-1" />
      <button>After</button>
    </>
  ))
  const included = m.getByRole('button', { name: 'Included' })
  const excluded = m.getByRole('button', { name: 'Excluded' })
  expect(included.tabIndex).toBe(0)
  expect(excluded).toHaveAttribute('tabindex', '-1')
  m.getByRole('button', { name: 'Before' }).focus()
  flush()
  await userEvent.keyboard('{Tab}')
  await focused(included)
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  await focused(included)
  expect(excluded).toHaveAttribute('tabindex', '-1')
})

test('decorative arrow is hidden from accessibility and mirrors the resolved side tooltip.roles.13', async () => {
  const m = mount(() => (
    <Tooltip openDelay={0} closeDelay={0}>
      <Tooltip.Trigger>Action</Tooltip.Trigger>
      <Tooltip.Positioner side="bottom" flip={false} shift={false}>
        <Tooltip.Content>
          Action details
          <Tooltip.Arrow data-testid="arrow" style={{ width: '10px', height: '10px' }} />
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  m.getByRole('button', { name: 'Action' }).focus()
  flush()
  const content = m.getByRole('tooltip', { hidden: true })
  await visible(content)
  const arrow = m.getByTestId('arrow')
  expect(arrow).toHaveAttribute('aria-hidden', 'true')
  expect(arrow).toHaveAttribute('data-side', 'bottom')
  expect(arrow.getAttribute('data-side')).toBe(content.getAttribute('data-side'))
})

test('tooltip content has no dialog ARIA and its trigger has no composite state tooltip.roles.12 tooltip.state.1', async () => {
  const m = mount(() => <Tip name="Action" text="Action details" />)
  const trigger = m.getByRole('button', { name: 'Action' })
  trigger.focus()
  flush()
  await visible(m.getByText('Action details'))
  const content = m.getByRole('tooltip')
  for (const attribute of ['tabindex', 'aria-labelledby', 'aria-describedby', 'aria-modal'])
    expect(content).not.toHaveAttribute(attribute)
  for (const attribute of ['aria-expanded', 'aria-selected', 'aria-checked'])
    expect(trigger).not.toHaveAttribute(attribute)
})

test('disabled Escape dismissal keeps the visible description open tooltip.keyboard.3', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <Tip name="Action" text="Action details" closeOnEscape={false} onOpenChange={changed} />
  ))
  const trigger = m.getByRole('button', { name: 'Action' })
  trigger.focus()
  flush()
  const content = m.getByText('Action details')
  await visible(content)
  await userEvent.keyboard('{Escape}')
  expect(m.getByRole('tooltip')).toBe(content)
  expect(content).toBeVisible()
  expect(trigger).toHaveAttribute('aria-describedby', content.id)
  expect(changed.mock.calls).toEqual([[true]])
})

test('native Tab blur with no pointer intent closes the uncontrolled tooltip tooltip.focus.2 tooltip.focus.11', async () => {
  const changed = vi.fn()
  const m = mount(() => (
    <>
      <button>Before</button>
      <Tip name="Action" text="Action details" onOpenChange={changed} />
      <button>After</button>
      <div
        data-testid="pointer-park"
        style={{ position: 'fixed', right: 0, bottom: 0, width: '8px', height: '8px' }}
      />
    </>
  ))
  // The page keeps the pointer where an earlier file left it, which can be
  // where this tooltip opens (#60). Park it away so no hover intent exists.
  const park = m.getByTestId('pointer-park')
  await userEvent.hover(park)
  expect(park.matches(':hover')).toBe(true)
  const trigger = m.getByRole('button', { name: 'Action' })
  m.getByRole('button', { name: 'Before' }).focus()
  flush()
  await userEvent.keyboard('{Tab}')
  await focused(trigger)
  await visible(m.getByText('Action details'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  await absent(m)
  expect(changed.mock.calls).toEqual([[true], [false]])
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  await focused(trigger)
  await visible(m.getByText('Action details'))
  expect(changed.mock.calls).toEqual([[true], [false], [true]])
})

test('focus-to-focus switching closes the first tooltip and opens the second without hover tooltip.focus.5', async () => {
  const m = mount(() => (
    <Tooltip.Provider>
      <Tip name="First" text="First details" />
      <Tip name="Second" text="Second details" />
    </Tooltip.Provider>
  ))
  m.getByRole('button', { name: 'First' }).focus()
  flush()
  await visible(m.getByText('First details'))
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'Second' }))
  await visible(m.getByText('Second details'))
  expect(m.getByRole('button', { name: 'First' })).toHaveAttribute('data-state', 'closed')
  // Exit presence checks animations on the next frame, even without authored animations.
  await expect.poll(() => m.queryByText('First details')).toBeNull()
  expect(m.getAllByRole('tooltip')).toHaveLength(1)
})

test('ending hover before focus retains the tooltip until native Tab ends both intents tooltip.focus.6', async () => {
  const m = mount(() => (
    <>
      <Tip name="Action" text="Action details" />
      <button style={{ position: 'fixed', left: '350px', top: '200px' }}>After</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Action' })
  await userEvent.hover(trigger)
  const content = m.getByText('Action details')
  await visible(content)
  trigger.focus()
  flush()
  await userEvent.hover(m.getByRole('button', { name: 'After' }))
  expect(trigger).toHaveFocus()
  expect(m.getByRole('tooltip')).toBe(content)
  expect(content).toBeVisible()
  await userEvent.keyboard('{Tab}')
  await focused(m.getByRole('button', { name: 'After' }))
  await absent(m)
})
