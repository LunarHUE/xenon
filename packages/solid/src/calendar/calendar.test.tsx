import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Calendar } from './index'
import { RangeCalendar } from '../range-calendar'
import { createDate, DateProvider } from '../date'

afterEach(cleanup)
async function settle() {
  flush()
  await Promise.resolve()
  flush()
}
function day(root: HTMLElement, date: string) {
  return root.querySelector<HTMLButtonElement>(
    `button[data-date="${date}"]:not([data-outside-month])`
  )!
}

test('implicit two-month window remains stable between focus and range activation', async () => {
  const change = vi.fn()
  const focus = vi.fn()
  const month = vi.fn()
  const m = render(() => (
    <RangeCalendar
      today={createDate(2024, 2, 15)}
      visibleMonths={2}
      onValueChange={change}
      onFocusedValueChange={focus}
      onVisibleMonthChange={month}
    >
      <RangeCalendar.Heading />
      <RangeCalendar.Grid />
      <RangeCalendar.Grid month={1} />
    </RangeCalendar>
  ))
  await settle()
  expect(focus).not.toHaveBeenCalled()
  expect(month).not.toHaveBeenCalled()
  day(m.container, '2024-02-20').click()
  await settle()
  const target = day(m.container, '2024-03-05')
  target.focus()
  await settle()
  expect(day(m.container, '2024-03-05')).toBe(target)
  target.click()
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2024, 2, 20),
    end: createDate(2024, 3, 5),
  })
  expect(month).not.toHaveBeenCalled()
  expect(m.container.querySelectorAll('button[tabindex="0"]')).toHaveLength(1)
})

test('spillover pointer focus retains the activation date until click pages the calendar', async () => {
  const change = vi.fn()
  const m = render(() => (
    <Calendar today={createDate(2024, 2, 15)} fixedWeeks onValueChange={change}>
      <Calendar.Grid />
    </Calendar>
  ))
  await settle()
  const target = m.container.querySelector<HTMLButtonElement>('button[data-date="2024-03-05"]')!
  target.focus()
  await settle()
  expect(target.dataset.date).toBe('2024-03-05')
  target.click()
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2024, 3, 5))
  expect(document.activeElement).toBe(day(m.container, '2024-03-05'))
})

test('nested providers inherit the civil clock while root locale and week start override defaults', async () => {
  const m = render(() => (
    <DateProvider today={createDate(2024, 2, 15)} locale="en-US" weekStartsOn={1}>
      <DateProvider locale="fr-FR">
        <Calendar locale="en-US" weekStartsOn={0}>
          <Calendar.Heading id="month-title" />
          <Calendar.Grid />
        </Calendar>
      </DateProvider>
    </DateProvider>
  ))
  await settle()
  expect(m.getByRole('group')).toHaveAttribute('aria-labelledby', 'month-title')
  expect(m.getByRole('grid')).toHaveAccessibleName('February 2024')
  expect(m.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Sunday')
  expect(day(m.container, '2024-02-15')).toHaveAttribute('aria-current', 'date')
})
