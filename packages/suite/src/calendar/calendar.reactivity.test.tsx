/**
 * Reactive calendar state for Calendar and RangeCalendar: prop-driven locale,
 * week start, bounds and read-only/disabled transitions; controlled selection
 * equality through a custom adapter; complete-range commitments; and the
 * reactive children render callback. Inline grids mount no popup, so a single
 * Solid flush settles each transition. Every case uses a fixed provider today.
 */
import { Calendar } from '@xenon-ui/solid/calendar'
import { RangeCalendar } from '@xenon-ui/solid/range-calendar'
import {
  DateProvider,
  createDate,
  dateOnlyAdapter,
  parseDate,
  serializeDate,
} from '@xenon-ui/solid/date'
import type { DateAdapter, DateValue } from '@xenon-ui/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { fireEvent, within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
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
/** Day button located by its adapter-independent ISO date key. */
function day(root: HTMLElement, iso: string) {
  return root.querySelector<HTMLButtonElement>(`button[data-date="${iso}"]`)!
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
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

test('calendar.config.1 calendar.roles.1 calendar.roles.2: a changed locale relabels the heading, weekday columns and day names', () => {
  const [locale, setLocale] = createSignal('en-US')
  const today = createDate(2024, 2, 15)
  const m = mount(() => (
    <DateProvider today={today} locale="en-US" weekStartsOn={1}>
      <Calendar locale={locale()}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('heading')).toHaveTextContent('February 2024')
  expect(m.getByRole('grid')).toHaveAccessibleName('February 2024')
  expect(m.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday')
  expect(day(m.root, '2024-02-15').getAttribute('aria-label')).toContain('February')
  setLocale('fr-FR')
  flush()
  expect(m.getByRole('heading')).toHaveTextContent('février 2024')
  expect(m.getByRole('grid')).toHaveAccessibleName('février 2024')
  expect(m.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'lundi')
  expect(day(m.root, '2024-02-15').getAttribute('aria-label')).toContain('février')
  expect(day(m.root, '2024-02-15')).toHaveAttribute('tabindex', '0')
})

test('calendar.config.1 calendar.roles.1: a changed weekStartsOn moves the weekday columns and leading days', () => {
  const [weekStartsOn, setWeekStartsOn] = createSignal(0)
  const today = createDate(2024, 2, 15)
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar weekStartsOn={weekStartsOn()}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getAllByRole('columnheader').map((header) => header.getAttribute('abbr'))).toEqual([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ])
  expect(m.root.querySelector('[role="grid"] [role="gridcell"]')).toHaveAttribute(
    'data-date',
    '2024-01-28'
  )
  setWeekStartsOn(1)
  flush()
  expect(m.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday')
  expect(m.getAllByRole('columnheader')[6]).toHaveAttribute('abbr', 'Sunday')
  expect(m.root.querySelector('[role="grid"] [role="gridcell"]')).toHaveAttribute(
    'data-date',
    '2024-01-29'
  )
  expect(day(m.root, '2024-02-15')).toHaveAttribute('tabindex', '0')
  expect(m.root.querySelectorAll('button[tabindex="0"]')).toHaveLength(1)
})

test('calendar.bounds.1: tightened bounds reactively disable out-of-range days and paging while keeping a valid selection', () => {
  const change = vi.fn()
  const today = createDate(2026, 9, 14)
  const [min, setMin] = createSignal<DateValue>()
  const [max, setMax] = createSignal<DateValue>()
  const m = mount(() => (
    <DateProvider today={today} locale="en-US">
      <Calendar minValue={min()} maxValue={max()} defaultValue={today} onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('button', { name: 'Previous month' })).toBeEnabled()
  expect(m.getByRole('button', { name: 'Next month' })).toBeEnabled()
  expect(day(m.root, '2026-09-05')).not.toBeDisabled()
  setMin(createDate(2026, 9, 10))
  setMax(createDate(2026, 9, 20))
  flush()
  expect(m.getByRole('button', { name: 'Previous month' })).toBeDisabled()
  expect(m.getByRole('button', { name: 'Next month' })).toBeDisabled()
  const outside = day(m.root, '2026-09-05')
  expect(outside).toBeDisabled()
  expect(outside).toHaveAttribute('data-disabled')
  expect(outside.closest('[role="gridcell"]')).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(outside)
  flush()
  expect(change).not.toHaveBeenCalled()
  expect(day(m.root, '2026-09-14')).toHaveAttribute('tabindex', '0')
  expect(day(m.root, '2026-09-14').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
})

test('calendar.readonly.1 calendar.disabled.1: policies applied after mount gate interaction without clearing the selection', () => {
  const change = vi.fn()
  const today = createDate(2026, 9, 14)
  const [readOnly, setReadOnly] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const m = mount(() => (
    <DateProvider today={today} locale="en-US">
      <Calendar
        readOnly={readOnly()}
        disabled={disabled()}
        defaultValue={today}
        onValueChange={change}
      >
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2026, 9, 16))
  expect(day(m.root, '2026-09-16').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  setReadOnly(true)
  flush()
  expect(m.getByRole('grid')).toHaveAttribute('aria-readonly', 'true')
  fireEvent.click(day(m.root, '2026-09-18'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(day(m.root, '2026-09-16').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  setReadOnly(false)
  setDisabled(true)
  flush()
  expect(m.getByRole('grid')).not.toHaveAttribute('aria-readonly')
  expect(m.getByRole('grid')).toHaveAttribute('aria-disabled', 'true')
  expect(m.getByRole('button', { name: 'Previous month' })).toBeDisabled()
  expect(m.getByRole('button', { name: 'Next month' })).toBeDisabled()
  expect(m.root.querySelectorAll('button[tabindex="0"]')).toHaveLength(0)
  expect(day(m.root, '2026-09-16')).toHaveAttribute('data-selected')
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  setDisabled(false)
  flush()
  expect(m.root.querySelectorAll('button[tabindex="0"]')).toHaveLength(1)
})

/** Application class whose instances are never reference-equal across renders. */
class CivilDay {
  readonly iso: string
  constructor(iso: string) {
    this.iso = iso
    Object.freeze(this)
  }
}
const civilAdapter: DateAdapter<CivilDay> = {
  getFields: (value) => parseDate(value.iso),
  fromFields: (fields) => new CivilDay(serializeDate(fields)),
  addDays: (value, amount) =>
    new CivilDay(serializeDate(dateOnlyAdapter.addDays(parseDate(value.iso), amount))),
  addMonths: (value, amount) =>
    new CivilDay(serializeDate(dateOnlyAdapter.addMonths(parseDate(value.iso), amount))),
  addYears: (value, amount) =>
    new CivilDay(serializeDate(dateOnlyAdapter.addYears(parseDate(value.iso), amount))),
  compare: (a, b) => dateOnlyAdapter.compare(parseDate(a.iso), parseDate(b.iso)),
  getWeekday: (value) => dateOnlyAdapter.getWeekday(parseDate(value.iso)),
  daysInMonth: (value) => dateOnlyAdapter.daysInMonth(parseDate(value.iso)),
  format: (value, options, locale) => dateOnlyAdapter.format(parseDate(value.iso), options, locale),
}

test('calendar.value.1 calendar.value.3: a custom adapter compares freshly built instances so a controlled reselect is silent', () => {
  const change = vi.fn()
  const [iso, setIso] = createSignal('2024-02-15')
  const m = mount(() => (
    <DateProvider today={createDate(2024, 2, 15)} locale="en-US">
      <Calendar
        adapter={civilAdapter}
        value={new CivilDay(iso())}
        onValueChange={(next) => {
          change(next)
          setIso(next.iso)
        }}
      >
        <Calendar.Heading />
        <Calendar.Grid />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('heading')).toHaveTextContent('February 2024')
  expect(m.root.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(1)
  fireEvent.click(day(m.root, '2024-02-16'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  const selected = change.mock.calls[0]?.[0] as CivilDay
  expect(selected).toBeInstanceOf(CivilDay)
  expect(selected.iso).toBe('2024-02-16')
  expect(day(m.root, '2024-02-16').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(day(m.root, '2024-02-15').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'false'
  )
  fireEvent.click(day(m.root, '2024-02-16'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  setIso('2024-02-20')
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(day(m.root, '2024-02-20').closest('[role="gridcell"]')).toHaveAttribute(
    'aria-selected',
    'true'
  )
  expect(m.root.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(1)
})

test('range-calendar.value.1 range-calendar.selection.2 range-calendar.roles.1: a custom adapter commits sorted ranges once and ignores an identical proposal', () => {
  const change = vi.fn()
  const [iso, setIso] = createSignal({ start: '2024-02-12', end: '2024-02-14' })
  const m = mount(() => (
    <DateProvider today={createDate(2024, 2, 15)} locale="en-US">
      <RangeCalendar
        adapter={civilAdapter}
        value={{ start: new CivilDay(iso().start), end: new CivilDay(iso().end) }}
        onValueChange={(next) => {
          change(next)
          setIso({ start: next.start.iso, end: next.end.iso })
        }}
      >
        <RangeCalendar.Heading />
        <RangeCalendar.Grid />
      </RangeCalendar>
    </DateProvider>
  ))
  expect(m.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true')
  expect(m.root.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(3)
  expect(m.root.querySelector('[data-selection-start]')).toHaveAttribute('data-date', '2024-02-12')
  expect(m.root.querySelector('[data-selection-end]')).toHaveAttribute('data-date', '2024-02-14')
  fireEvent.click(day(m.root, '2024-02-20'))
  flush()
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(day(m.root, '2024-02-22'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  const committed = change.mock.calls[0]?.[0] as { start: CivilDay; end: CivilDay }
  expect(committed.start).toBeInstanceOf(CivilDay)
  expect([committed.start.iso, committed.end.iso]).toEqual(['2024-02-20', '2024-02-22'])
  expect(m.root.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(3)
  fireEvent.click(day(m.root, '2024-02-20'))
  flush()
  fireEvent.click(day(m.root, '2024-02-22'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(m.root.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(3)
})

test('the children callback exposes controller state that reacts to paging and uncontrolled selection', () => {
  const change = vi.fn()
  const today = createDate(2026, 9, 14)
  const m = mount(() => (
    <DateProvider today={today} locale="en-US">
      <Calendar defaultValue={today} onValueChange={change}>
        {(state) => (
          <>
            <Calendar.Header>
              <Calendar.Previous disabled={!state.canGoPrevious} />
              <Calendar.Heading>{state.heading}</Calendar.Heading>
              <Calendar.Next disabled={!state.canGoNext} />
            </Calendar.Header>
            <output data-testid="month">{serializeDate(state.visibleMonth)}</output>
            <output data-testid="selection">
              {state.value ? serializeDate(state.value) : 'none'}
            </output>
            <Calendar.Grid />
          </>
        )}
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('heading')).toHaveTextContent('September 2026')
  expect(m.getByTestId('month')).toHaveTextContent('2026-09-01')
  expect(m.getByTestId('selection')).toHaveTextContent('2026-09-14')
  fireEvent.click(m.getByRole('button', { name: 'Next month' }))
  flush()
  expect(m.getByRole('heading')).toHaveTextContent('October 2026')
  expect(m.getByTestId('month')).toHaveTextContent('2026-10-01')
  expect(m.getByTestId('selection')).toHaveTextContent('2026-09-14')
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(day(m.root, '2026-10-05'))
  flush()
  expect(m.getByTestId('selection')).toHaveTextContent('2026-10-05')
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2026, 10, 5))
  expect(m.getByRole('grid')).toHaveAccessibleName('October 2026')
})
