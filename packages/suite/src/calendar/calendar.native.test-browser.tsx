/**
 * Native keyboard traversal for Calendar and RangeCalendar: year and leap month
 * boundaries, RTL week semantics, and range drafting/reversal from real key input.
 * A fixed DateProvider today keeps every traversal deterministic.
 */
import { Calendar } from '@xenon/solid/calendar'
import { RangeCalendar } from '@xenon/solid/range-calendar'
import { DateProvider, createDate } from '@xenon/solid/date'
import type { DateValue } from '@xenon/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { flush } from 'solid-js'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
const reference = createDate(2026, 9, 14)
function mount(children: () => JSX.Element) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(children, root)
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, ...within(root) }
}
function day(root: HTMLElement, date: DateValue) {
  const text = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date.year, date.month - 1, date.day))
  return within(root)
    .getAllByRole('button')
    .find((button) => button.getAttribute('aria-label')?.includes(text)) as HTMLButtonElement
}
async function key(value: string) {
  await userEvent.keyboard(value)
  flush()
}
function Parts() {
  return (
    <>
      <Calendar.Header>
        <Calendar.Previous />
        <Calendar.Heading />
        <Calendar.Next />
      </Calendar.Header>
      <Calendar.Grid />
    </>
  )
}
function RangeParts() {
  return (
    <>
      <RangeCalendar.Heading />
      <RangeCalendar.Grid />
    </>
  )
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('calendar.keyboard.1 calendar.keyboard.5: arrows cross the New Year and page the heading back', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar
        defaultValue={createDate(2026, 12, 31)}
        defaultVisibleMonth={createDate(2026, 12, 1)}
        onValueChange={change}
      >
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('heading')).toHaveTextContent('December 2026')
  day(m.root, createDate(2026, 12, 31)).focus()
  await key('{ArrowRight}')
  expect(day(m.root, createDate(2027, 1, 1))).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('January 2027')
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 12, 31))).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('December 2026')
  await key('{ArrowUp}')
  expect(day(m.root, createDate(2026, 12, 24))).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('calendar.keyboard.3: month paging crosses the year and re-clamps the focused day', async () => {
  const crossing = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar
        defaultValue={createDate(2026, 12, 15)}
        defaultVisibleMonth={createDate(2026, 12, 1)}
      >
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(crossing.root, createDate(2026, 12, 15)).focus()
  await key('{PageDown}')
  expect(day(crossing.root, createDate(2027, 1, 15))).toHaveFocus()
  expect(crossing.getByRole('heading')).toHaveTextContent('January 2027')
  await key('{PageUp}')
  expect(day(crossing.root, createDate(2026, 12, 15))).toHaveFocus()
  expect(crossing.getByRole('heading')).toHaveTextContent('December 2026')

  const clamping = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar defaultValue={createDate(2027, 3, 31)} defaultVisibleMonth={createDate(2027, 3, 1)}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(clamping.root, createDate(2027, 3, 31)).focus()
  await key('{PageUp}')
  expect(day(clamping.root, createDate(2027, 2, 28))).toHaveFocus()
  await key('{PageDown}')
  expect(day(clamping.root, createDate(2027, 3, 28))).toHaveFocus()
})

test('calendar.keyboard.2: End crosses the leap month while Home returns to the week start', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar defaultValue={createDate(2024, 2, 29)} defaultVisibleMonth={createDate(2024, 2, 1)}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, createDate(2024, 2, 29)).focus()
  await key('{Home}')
  expect(day(m.root, createDate(2024, 2, 25))).toHaveFocus()
  await key('{End}')
  expect(day(m.root, createDate(2024, 3, 2))).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('March 2024')
  await key('{Home}')
  expect(day(m.root, createDate(2024, 2, 25))).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('February 2024')
})

test('calendar.keyboard.2 calendar.keyboard.1: RTL Home and End stay chronological while horizontal arrows reverse', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar dir="rtl">
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 16)).focus()
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 9, 17))).toHaveFocus()
  await key('{ArrowRight}')
  expect(day(m.root, createDate(2026, 9, 16))).toHaveFocus()
  await key('{Home}')
  expect(day(m.root, createDate(2026, 9, 13))).toHaveFocus()
  await key('{End}')
  expect(day(m.root, createDate(2026, 9, 19))).toHaveFocus()
})

test('range-calendar.selection.1 range-calendar.selection.2: keyboard-only reverse drafting commits a sorted range once', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar onValueChange={change}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 20)).focus()
  await key('{Enter}')
  expect(change).not.toHaveBeenCalled()
  await key('{ArrowLeft}')
  await key('{ArrowLeft}')
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 9, 17))).toHaveFocus()
  expect(m.root.querySelectorAll('td[data-highlighted]')).toHaveLength(4)
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 17),
    end: createDate(2026, 9, 20),
  })
  expect(m.root.querySelector('td[data-selection-start]')).toHaveAttribute(
    'data-date',
    '2026-09-17'
  )
  expect(m.root.querySelector('td[data-selection-end]')).toHaveAttribute('data-date', '2026-09-20')
})

test('range-calendar.preview.2 range-calendar.selection.2: paging keeps the range anchor and previews the next month', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar onValueChange={change}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 30)).focus()
  await key('{Enter}')
  expect(change).not.toHaveBeenCalled()
  await key('{PageDown}')
  expect(m.getByRole('heading')).toHaveTextContent('October 2026')
  expect(day(m.root, createDate(2026, 10, 30))).toHaveFocus()
  expect(m.root.querySelectorAll('td[data-highlighted]')).not.toHaveLength(0)
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 30),
    end: createDate(2026, 10, 30),
  })
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
})

test('range-calendar.bounds.1 range-calendar.preview.1: an unavailable date cannot be an endpoint and clears the draft preview', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar onValueChange={change} isDateUnavailable={(date) => date.day === 18}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 16)).focus()
  await key('{Enter}')
  await key('{ArrowRight}')
  expect(m.root.querySelectorAll('td[data-highlighted]')).toHaveLength(2)
  await key('{ArrowRight}')
  expect(day(m.root, createDate(2026, 9, 18))).toHaveFocus()
  expect(day(m.root, createDate(2026, 9, 18))).toHaveAttribute('aria-disabled', 'true')
  expect(m.root.querySelectorAll('td[data-highlighted]')).toHaveLength(0)
  await key('{Enter}')
  expect(change).not.toHaveBeenCalled()
  await key('{ArrowLeft}')
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 16),
    end: createDate(2026, 9, 17),
  })
})
