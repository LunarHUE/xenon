import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { RangeCalendar } from './index'
import type { CalendarRange } from './index'
import { createDate } from '../date'

const today = createDate(2024, 2, 28)
const leap = createDate(2024, 2, 29)
const march = createDate(2024, 3, 1)
const old = { start: createDate(2024, 2, 10), end: createDate(2024, 2, 12) }

afterEach(cleanup)

function day(root: HTMLElement, date: string) {
  const node = root.querySelector<HTMLButtonElement>(
    `button[data-date="${date}"]:not([data-outside-month])`
  )
  expect(node, `owning day ${date}`).not.toBeNull()
  return node!
}
function click(root: HTMLElement, date: string) {
  day(root, date).click()
  flush()
}
function Parts() {
  return (
    <>
      <RangeCalendar.Grid />
      <RangeCalendar.Grid month={1} />
    </>
  )
}

test('a newly unavailable leap day invalidates an existing draft, then removing it permits completion', () => {
  const [blocked, setBlocked] = createSignal(false)
  const change = vi.fn()
  const m = render(() => (
    <RangeCalendar
      today={today}
      defaultValue={old}
      visibleMonths={2}
      isDateUnavailable={(value) => blocked() && value.day === 29 && value.month === 2}
      onValueChange={change}
    >
      <Parts />
    </RangeCalendar>
  ))
  click(m.container, '2024-02-28')
  day(m.container, '2024-03-01').dispatchEvent(new Event('pointerenter'))
  flush()
  expect(day(m.container, '2024-02-29')).toHaveAttribute('data-highlighted')
  setBlocked(true)
  flush()
  expect(day(m.container, '2024-02-29')).toHaveAttribute('aria-disabled', 'true')
  expect(day(m.container, '2024-02-29')).not.toHaveAttribute('data-highlighted')
  click(m.container, '2024-03-01')
  expect(change).not.toHaveBeenCalled()
  expect(day(m.container, '2024-02-28')).toHaveAttribute('data-selection-start')
  setBlocked(false)
  flush()
  expect(day(m.container, '2024-02-29')).toHaveAttribute('data-highlighted')
  click(m.container, '2024-03-01')
  expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: march })
  expect(day(m.container, '2024-02-29').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(day(m.container, '2024-03-01')).toHaveAttribute('data-selection-end')
})

test('tightened bounds reject an existing anchor until the owner restores inclusive bounds', () => {
  const [min, setMin] = createSignal(today)
  const change = vi.fn()
  const m = render(() => (
    <RangeCalendar
      today={today}
      visibleMonths={2}
      minValue={min()}
      maxValue={march}
      onValueChange={change}
    >
      <Parts />
    </RangeCalendar>
  ))
  click(m.container, '2024-02-28')
  setMin(leap)
  flush()
  expect(day(m.container, '2024-02-28')).toBeDisabled()
  click(m.container, '2024-03-01')
  expect(change).not.toHaveBeenCalled()
  setMin(today)
  flush()
  click(m.container, '2024-03-01')
  expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: march })
})

test.each(['disabled', 'readOnly'] as const)(
  '%s pauses an existing draft and resuming completes its original anchor',
  (policy) => {
    const [paused, setPaused] = createSignal(false)
    const change = vi.fn()
    const m = render(() => (
      <RangeCalendar
        today={today}
        visibleMonths={2}
        disabled={policy === 'disabled' && paused()}
        readOnly={policy === 'readOnly' && paused()}
        onValueChange={change}
      >
        <Parts />
      </RangeCalendar>
    ))
    click(m.container, '2024-02-28')
    setPaused(true)
    flush()
    click(m.container, '2024-03-01')
    expect(change).not.toHaveBeenCalled()
    setPaused(false)
    flush()
    expect(day(m.container, '2024-02-28')).toHaveAttribute('data-selection-start')
    click(m.container, '2024-03-01')
    expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: march })
  }
)

test('external range replacement during a draft is revealed when Escape cancels the draft', () => {
  const [value, setValue] = createSignal<CalendarRange>(old)
  const change = vi.fn()
  const m = render(() => (
    <RangeCalendar today={today} value={value()} visibleMonths={2} onValueChange={change}>
      <Parts />
    </RangeCalendar>
  ))
  click(m.container, '2024-02-28')
  setValue({ start: leap, end: march })
  flush()
  expect(day(m.container, '2024-02-28')).toHaveAttribute('data-selected')
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  day(m.container, '2024-02-28').dispatchEvent(event)
  flush()
  expect(event.defaultPrevented).toBe(true)
  expect(day(m.container, '2024-02-28')).not.toHaveAttribute('data-selected')
  expect(day(m.container, '2024-02-29')).toHaveAttribute('data-selection-start')
  expect(day(m.container, '2024-03-01')).toHaveAttribute('data-selection-end')
  expect(day(m.container, '2024-02-10')).not.toHaveAttribute('data-selected')
  expect(change).not.toHaveBeenCalled()
})

test('a refused proposal clears the draft and a delayed owner update paints a normalized range without stealing outside focus', () => {
  const [value, setValue] = createSignal<CalendarRange>(old)
  const change = vi.fn()
  const m = render(() => (
    <>
      <button data-testid="outside">Outside</button>
      <RangeCalendar today={today} value={value()} visibleMonths={2} onValueChange={change}>
        <Parts />
      </RangeCalendar>
    </>
  ))
  click(m.container, '2024-03-01')
  click(m.container, '2024-02-28')
  expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: march })
  expect(day(m.container, '2024-02-10')).toHaveAttribute('data-selected')
  expect(day(m.container, '2024-02-28')).not.toHaveAttribute('data-selected')
  m.getByTestId('outside').focus()
  setValue({ start: march, end: today })
  flush()
  expect(document.activeElement).toBe(m.getByTestId('outside'))
  expect(day(m.container, '2024-02-28')).toHaveAttribute('data-selection-start')
  expect(day(m.container, '2024-03-01')).toHaveAttribute('data-selection-end')
  expect(day(m.container, '2024-02-29').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(m.container.querySelector('[data-highlighted]')).toBeNull()
  expect(change).toHaveBeenCalledTimes(1)
})
