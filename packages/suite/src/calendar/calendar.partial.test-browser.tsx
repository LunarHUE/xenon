import { Calendar } from '@xenon/solid/calendar'
import { RangeCalendar } from '@xenon/solid/range-calendar'
import { DateProvider, createDate, serializeDate } from '@xenon/solid/date'
import type { DateValue } from '@xenon/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []
const today = createDate(2026, 9, 14)

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

function day(root: HTMLElement, value: DateValue | string) {
  const iso = typeof value === 'string' ? value : serializeDate(value)
  return root.querySelector<HTMLButtonElement>(`button[data-date="${iso}"]`)!
}

async function press(value: string) {
  await userEvent.keyboard(value)
  flush()
}

function CalendarParts() {
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
      <RangeCalendar.Header>
        <RangeCalendar.Previous />
        <RangeCalendar.Heading />
        <RangeCalendar.Next />
      </RangeCalendar.Header>
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

test('calendar.a11y.1: an explicitly min/max constrained grid passes the shared axe rules', async () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar minValue={createDate(2026, 9, 10)} maxValue={createDate(2026, 9, 20)}>
        <CalendarParts />
      </Calendar>
    </DateProvider>
  ))
  await expectNoViolations(m.root)
})

test('calendar.focus.1: initial tab focus clamps an out-of-interval selected date to the minimum', () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar
        defaultValue={createDate(2026, 9, 5)}
        minValue={createDate(2026, 9, 10)}
        maxValue={createDate(2026, 9, 20)}
      >
        <CalendarParts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.root.querySelectorAll('button[tabindex="0"]')).toHaveLength(1)
  expect(day(m.root, createDate(2026, 9, 10))).toHaveAttribute('tabindex', '0')
  expect(day(m.root, createDate(2026, 9, 5))).toBeDisabled()
})

test('calendar.layout.1: the calendar renders its semantics without injecting visual theme CSS', () => {
  const stylesBefore = document.head.querySelectorAll('style,link[rel="stylesheet"]').length
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar fixedWeeks>
        <CalendarParts />
      </Calendar>
    </DateProvider>
  ))
  expect(document.head.querySelectorAll('style,link[rel="stylesheet"]')).toHaveLength(stylesBefore)
  expect(m.root.querySelectorAll('style,link[rel="stylesheet"]')).toHaveLength(0)
  expect(m.root.querySelectorAll('[style]')).toHaveLength(0)
  expect(m.root.querySelectorAll('[role="gridcell"]')).toHaveLength(42)
})

test('calendar.roles.3: both paging controls are explicitly named non-submit buttons', () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar>
        <CalendarParts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('button', { name: 'Previous month' })).toHaveAttribute('type', 'button')
  expect(m.getByRole('button', { name: 'Next month' })).toHaveAttribute('type', 'button')
})

test('calendar.unavailable.1: pointer activation of an unavailable day does not commit a value', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar onValueChange={change} isDateUnavailable={(value) => value.day === 15}>
        <CalendarParts />
      </Calendar>
    </DateProvider>
  ))
  const unavailable = day(m.root, createDate(2026, 9, 15))
  expect(unavailable).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(unavailable)
  flush()
  expect(change).not.toHaveBeenCalled()
})

test('range-calendar.a11y.1: default and unavailable range grids each pass the shared axe rules', async () => {
  const defaultGrid = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await expectNoViolations(defaultGrid.root)
  const unavailable = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar isDateUnavailable={(value) => value.day === 18}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await expectNoViolations(unavailable.root)
  const selected = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar defaultValue={{ start: today, end: createDate(2026, 9, 16) }}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await expectNoViolations(selected.root)
})

test('range-calendar.bounds.1: min and max reject out-of-bounds endpoints before accepting a valid range', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar
        minValue={createDate(2026, 9, 10)}
        maxValue={createDate(2026, 9, 20)}
        onValueChange={change}
      >
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await userEvent.click(day(m.root, createDate(2026, 9, 12)))
  fireEvent.click(day(m.root, createDate(2026, 9, 5)))
  fireEvent.click(day(m.root, createDate(2026, 9, 21)))
  expect(change).not.toHaveBeenCalled()
  await userEvent.click(day(m.root, createDate(2026, 9, 20)))
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 12),
    end: createDate(2026, 9, 20),
  })
})

test('range-calendar.cancel.1: canceled second activation preserves the active draft', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar onValueChange={change}>
        <RangeCalendar.Heading />
        <RangeCalendar.Grid>
          <RangeCalendar.GridBody>
            <RangeCalendar.Row>
              <RangeCalendar.Cell date={today}>
                <RangeCalendar.Day date={today} />
              </RangeCalendar.Cell>
              <RangeCalendar.Cell date={createDate(2026, 9, 16)}>
                <RangeCalendar.Day
                  date={createDate(2026, 9, 16)}
                  onClick={(event) => event.preventDefault()}
                />
              </RangeCalendar.Cell>
            </RangeCalendar.Row>
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-14'))
  flush()
  const draftBefore = [...m.root.querySelectorAll<HTMLElement>('[data-highlighted]')].map(
    (cell) =>
      `${cell.dataset.date}:${cell.hasAttribute('data-selection-start')}:${cell.hasAttribute('data-selection-end')}`
  )
  expect(draftBefore).not.toHaveLength(0)
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).not.toHaveBeenCalled()
  const draftAfter = [...m.root.querySelectorAll<HTMLElement>('[data-highlighted]')].map(
    (cell) =>
      `${cell.dataset.date}:${cell.hasAttribute('data-selection-start')}:${cell.hasAttribute('data-selection-end')}`
  )
  expect(draftAfter).toEqual(draftBefore)
})

test('range-calendar.keyboard.1: Home, End and Space navigate and finish a draft once', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar onValueChange={change}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 16)).focus()
  await press('{Home}')
  expect(day(m.root, createDate(2026, 9, 13))).toHaveFocus()
  await press(' ')
  expect(change).not.toHaveBeenCalled()
  await press('{End}')
  expect(day(m.root, createDate(2026, 9, 19))).toHaveFocus()
  await press('{Shift>}{PageDown}{/Shift}')
  expect(m.getByRole('heading')).toHaveTextContent('September 2027')
  await press('{Shift>}{PageUp}{/Shift}')
  expect(m.getByRole('heading')).toHaveTextContent('September 2026')
  expect(day(m.root, createDate(2026, 9, 19))).toHaveFocus()
  await press('{PageDown}')
  expect(m.getByRole('heading')).toHaveTextContent('October 2026')
  expect(day(m.root, createDate(2026, 10, 19))).toHaveFocus()
  await press('{PageUp}')
  expect(m.getByRole('heading')).toHaveTextContent('September 2026')
  expect(day(m.root, createDate(2026, 9, 19))).toHaveFocus()
  await press(' ')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 13),
    end: createDate(2026, 9, 19),
  })
})

test('range-calendar.preview.1: draft endpoint and interior markers stay distinct from committed markers', async () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await userEvent.click(day(m.root, createDate(2026, 9, 14)))
  await userEvent.hover(day(m.root, createDate(2026, 9, 17)))
  flush()
  expect(m.root.querySelector('[data-selection-start]')).not.toBeNull()
  expect(m.root.querySelectorAll('[role="gridcell"][data-highlighted]')).toHaveLength(4)
  expect(m.root.querySelector('[role="gridcell"][data-selection-start]')).toHaveAttribute(
    'data-date',
    '2026-09-14'
  )
  expect(m.root.querySelector('[role="gridcell"][data-selection-end]')).toHaveAttribute(
    'data-date',
    '2026-09-17'
  )
  const interior = m.root.querySelectorAll<HTMLElement>(
    '[role="gridcell"][data-highlighted]:not([data-selection-start]):not([data-selection-end])'
  )
  expect(interior).toHaveLength(2)
  interior.forEach((cell) => {
    expect(cell).toHaveAttribute('aria-selected', 'false')
    expect(cell).not.toHaveAttribute('data-selected')
  })
})

test('range-calendar.readonly.1: read-only range calendars allow focus navigation without drafting', async () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar readOnly>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  day(m.root, today).focus()
  await press('{ArrowRight}')
  expect(day(m.root, createDate(2026, 9, 15))).toHaveFocus()
  await press('{Enter}')
  expect(m.root.querySelectorAll('[data-highlighted]')).toHaveLength(0)
})
