/** Native calendar assertions adapted from APG grid guidance and upstream date behavior evidence. */
import { Calendar } from '@xenon-ui/solid/calendar'
import { RangeCalendar } from '@xenon-ui/solid/range-calendar'
import { DateProvider, createDate } from '@xenon-ui/solid/date'
import type { DateValue } from '@xenon-ui/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { flush } from 'solid-js'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
async function click(element: HTMLElement) {
  await userEvent.click(element)
  flush()
}
function Parts() {
  return (
    <>
      <Calendar.Header>
        <Calendar.Previous>Previous</Calendar.Previous>
        <Calendar.Heading />
        <Calendar.Next>Next</Calendar.Next>
      </Calendar.Header>
      <Calendar.Grid />
    </>
  )
}
function RangeParts() {
  return (
    <>
      <RangeCalendar.Header>
        <RangeCalendar.Previous>Previous</RangeCalendar.Previous>
        <RangeCalendar.Heading />
        <RangeCalendar.Next>Next</RangeCalendar.Next>
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

test('calendar.focus.1 calendar.keyboard.1: one roving day crosses month boundaries without selecting', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <button>Before</button>
      <Calendar defaultValue={createDate(2026, 9, 30)} onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
  const initial = day(m.root, createDate(2026, 9, 30))
  initial.focus()
  await key('{ArrowRight}')
  expect(day(m.root, createDate(2026, 10, 1))).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('October 2026')
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 9, 30))).toHaveFocus()
  await key('{ArrowUp}')
  expect(day(m.root, createDate(2026, 9, 23))).toHaveFocus()
  await key('{ArrowDown}')
  expect(day(m.root, createDate(2026, 9, 30))).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

test('calendar.keyboard.2: Home and End follow the provider week start', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" weekStartsOn={1} today={reference}>
      <Calendar>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, createDate(2026, 9, 16)).focus()
  await key('{Home}')
  expect(day(m.root, createDate(2026, 9, 14))).toHaveFocus()
  await key('{End}')
  expect(day(m.root, createDate(2026, 9, 20))).toHaveFocus()
})

test('calendar.keyboard.3: month and year paging clamp dates while preserving native focus', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar defaultValue={createDate(2024, 1, 31)}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, createDate(2024, 1, 31)).focus()
  await key('{PageDown}')
  expect(day(m.root, createDate(2024, 2, 29))).toHaveFocus()
  await key('{Shift>}{PageDown}{/Shift}')
  expect(day(m.root, createDate(2025, 2, 28))).toHaveFocus()
  await key('{Shift>}{PageUp}{/Shift}')
  expect(day(m.root, createDate(2024, 2, 28))).toHaveFocus()
  await key('{PageUp}')
  expect(day(m.root, createDate(2024, 1, 28))).toHaveFocus()
})

test('calendar.keyboard.1: RTL reverses horizontal arrows and keeps vertical week navigation', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar dir="rtl">
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, reference).focus()
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 9, 15))).toHaveFocus()
  await key('{ArrowRight}')
  expect(day(m.root, reference)).toHaveFocus()
  await key('{ArrowDown}')
  expect(day(m.root, createDate(2026, 9, 21))).toHaveFocus()
})

test('calendar.unavailable.1 calendar.keyboard.4: unavailable dates are inspectable and native activation commits once', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar onValueChange={change} isDateUnavailable={(date) => date.day === 15}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  day(m.root, reference).focus()
  await key('{ArrowRight}')
  const unavailable = day(m.root, createDate(2026, 9, 15))
  expect(unavailable).toHaveFocus()
  expect(unavailable).toHaveAttribute('aria-disabled', 'true')
  await key('{Enter}')
  expect(change).not.toHaveBeenCalled()
  await key('{ArrowRight}')
  await key(' ')
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2026, 9, 16))
  await key('{Enter}')
  expect(change).toHaveBeenCalledTimes(1)
})

test('calendar.bounds.1: inclusive min and max constrain keyboard and month controls', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar minValue={createDate(2026, 9, 10)} maxValue={createDate(2026, 9, 20)}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('button', { name: /previous/i })).toBeDisabled()
  expect(m.getByRole('button', { name: /next/i })).toBeDisabled()
  day(m.root, createDate(2026, 9, 10)).focus()
  await key('{ArrowLeft}')
  expect(day(m.root, createDate(2026, 9, 10))).toHaveFocus()
  day(m.root, createDate(2026, 9, 20)).focus()
  await key('{ArrowRight}')
  expect(day(m.root, createDate(2026, 9, 20))).toHaveFocus()
})

test('calendar.readonly.1 calendar.disabled.1: readonly permits navigation while disabled prevents it', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar readOnly onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('grid')).toHaveAttribute('aria-readonly', 'true')
  day(m.root, reference).focus()
  await key('{ArrowRight}{Enter}')
  expect(day(m.root, createDate(2026, 9, 15))).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  const disabled = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar disabled>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(disabled.getByRole('grid')).toHaveAttribute('aria-disabled', 'true')
  expect(disabled.getByRole('button', { name: /next/i })).toBeDisabled()
  expect(disabled.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(0)
})

test('calendar.value.2: controlled selection waits for the owner and arrival preserves outside focus', async () => {
  const change = vi.fn()
  const before = document.createElement('button')
  before.textContent = 'Before'
  document.body.append(before)
  cleanups.push(() => before.remove())
  before.focus()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar value={reference} onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(before).toHaveFocus()
  await click(day(m.root, createDate(2026, 9, 16)))
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2026, 9, 16))
  expect(day(m.root, reference).closest('[role="gridcell"],td')).toHaveAttribute(
    'aria-selected',
    'true'
  )
})

test('range-calendar.selection.1 range-calendar.selection.2 range-calendar.preview.1: reverse drafting commits a sorted range once', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar onValueChange={change}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await click(day(m.root, createDate(2026, 9, 20)))
  expect(change).not.toHaveBeenCalled()
  await userEvent.hover(day(m.root, createDate(2026, 9, 17)))
  flush()
  expect(m.root.querySelectorAll('[data-highlighted]')).not.toHaveLength(0)
  await click(day(m.root, createDate(2026, 9, 17)))
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 17),
    end: createDate(2026, 9, 20),
  })
  expect(m.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
  expect(
    m.root.querySelectorAll('[role="gridcell"][aria-selected="true"],td[aria-selected="true"]')
  ).toHaveLength(4)
})

test('range-calendar.selection.3: Escape cancels only the draft and preserves the committed range', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar
        defaultValue={{ start: createDate(2026, 9, 10), end: createDate(2026, 9, 12) }}
        onValueChange={change}
      >
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await click(day(m.root, createDate(2026, 9, 17)))
  await key('{ArrowRight}{Escape}')
  expect(change).not.toHaveBeenCalled()
  expect(m.root.querySelectorAll('[data-highlighted]')).toHaveLength(0)
  expect(
    m.root.querySelectorAll('[role="gridcell"][aria-selected="true"],td[aria-selected="true"]')
  ).toHaveLength(3)
  await click(day(m.root, createDate(2026, 9, 20)))
  expect(change).not.toHaveBeenCalled()
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 20),
    end: createDate(2026, 9, 20),
  })
})

test('range-calendar.bounds.1: an unavailable interior date prevents committing across it', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar onValueChange={change} isDateUnavailable={(date) => date.day === 18}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await click(day(m.root, createDate(2026, 9, 16)))
  await click(day(m.root, createDate(2026, 9, 20)))
  expect(change).not.toHaveBeenCalled()
  await click(day(m.root, createDate(2026, 9, 17)))
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 16),
    end: createDate(2026, 9, 17),
  })
})

test('calendar.layout.2 range-calendar.preview.2: adjacent grids share one tab stop and draft across months', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <RangeCalendar visibleMonths={2} onValueChange={change}>
        <RangeCalendar.Header>
          <RangeCalendar.Previous />
          <RangeCalendar.Heading />
          <RangeCalendar.Next />
        </RangeCalendar.Header>
        <RangeCalendar.Grid month={0} />
        <RangeCalendar.Grid month={1} />
      </RangeCalendar>
    </DateProvider>
  ))
  expect(m.getAllByRole('grid')).toHaveLength(2)
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
  const september = m.getAllByRole('grid')[0]!
  await click(day(september, createDate(2026, 9, 30)))
  await key('{ArrowRight}')
  const october = m.getAllByRole('grid')[1]!
  expect(day(october, createDate(2026, 10, 1))).toHaveFocus()
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
  await key('{Enter}')
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 30),
    end: createDate(2026, 10, 1),
  })
})

test('calendar.a11y.1 range-calendar.a11y.1: selected and constrained grids satisfy the shared axe rules', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar defaultValue={reference} isDateUnavailable={(date) => date.day === 18}>
        <Parts />
      </Calendar>
      <RangeCalendar defaultValue={{ start: reference, end: createDate(2026, 9, 18) }}>
        <RangeParts />
      </RangeCalendar>
    </DateProvider>
  ))
  await expectNoViolations(m.root)
})

test('calendar.keyboard.5: paging controls retain native focus when replacing month cells', async () => {
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  const next = m.getByRole('button', { name: 'Next month' })
  await click(next)
  expect(next).toHaveFocus()
  expect(m.getByRole('heading')).toHaveTextContent('October 2026')
  expect(m.root.querySelectorAll('[role="grid"] button[tabindex="0"]')).toHaveLength(1)
})

test('calendar.keyboard.5: clicking a spillover date selects its original day and focuses the new canonical cell', async () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider locale="en-US" today={reference}>
      <Calendar defaultVisibleMonth={createDate(2024, 2, 1)} fixedWeeks onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  const spillover = day(m.root, createDate(2024, 3, 5))
  expect(spillover).toHaveAttribute('data-outside-month')
  await click(spillover)
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2024, 3, 5))
  expect(m.getByRole('heading')).toHaveTextContent('March 2024')
  expect(day(m.root, createDate(2024, 3, 5))).toHaveFocus()
  expect(day(m.root, createDate(2024, 3, 5))).not.toHaveAttribute('data-outside-month')
})
