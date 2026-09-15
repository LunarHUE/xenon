import { Calendar } from '@xenon/solid/calendar'
import { RangeCalendar } from '@xenon/solid/range-calendar'
import {
  DateProvider,
  createDate,
  parseDate,
  serializeDate,
  dateOnlyAdapter,
} from '@xenon/solid/date'
import type { DateAdapter } from '@xenon/solid/date'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { fireEvent, within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'

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

test('calendar.roles.1 calendar.roles.2 calendar.roles.3 calendar.config.1: provider today, named grid and weekday headers are deterministic', () => {
  const m = mount(() => (
    <DateProvider today={today} locale="en-US" weekStartsOn={1}>
      <Calendar>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(m.getByRole('grid')).toHaveAccessibleName('September 2026')
  expect(m.getByRole('heading')).toHaveAttribute('aria-live', 'polite')
  expect(m.getAllByRole('columnheader')[0]).toHaveAttribute('abbr', 'Monday')
  expect(day(m.root, '2026-09-14')).toHaveAttribute('aria-current', 'date')
  expect(day(m.root, '2026-09-14')).toHaveAttribute('tabindex', '0')
  expect(m.getByRole('button', { name: 'Previous month' })).toHaveAttribute('type', 'button')
})

test('calendar.value.2 calendar.value.3: uncontrolled default selection updates once without a mount callback', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar defaultValue={today} onValueChange={change}>
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(createDate(2026, 9, 16))
  expect(day(m.root, '2026-09-16').closest('td')).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).toHaveBeenCalledTimes(1)
})

test('calendar.value.2: accepted controlled changes remain reactive', () => {
  const m = mount(() => {
    const [value, setValue] = createSignal(today)
    return (
      <DateProvider today={today}>
        <Calendar value={value()} onValueChange={setValue}>
          <Parts />
        </Calendar>
        <output>{serializeDate(value())}</output>
      </DateProvider>
    )
  })
  fireEvent.click(day(m.root, '2026-09-18'))
  flush()
  expect(m.getByRole('status')).toHaveTextContent('2026-09-18')
  expect(day(m.root, '2026-09-18').closest('td')).toHaveAttribute('aria-selected', 'true')
})

test('calendar.cancel.1: author canceled day click and keyboard navigation do not change the calendar', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar onValueChange={change}>
        <Calendar.Heading />
        <Calendar.Grid>
          <Calendar.GridBody>
            <Calendar.Row>
              <Calendar.Cell date={today}>
                <Calendar.Day
                  date={today}
                  onClick={(event) => event.preventDefault()}
                  onKeyDown={(event) => event.preventDefault()}
                />
              </Calendar.Cell>
            </Calendar.Row>
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-14'))
  flush()
  expect(change).not.toHaveBeenCalled()
  fireEvent.keyDown(day(m.root, '2026-09-14'), { key: 'ArrowRight' })
  flush()
  expect(day(m.root, '2026-09-14')).toHaveAttribute('tabindex', '0')
})

/** A custom representation proves adapters preserve application date objects. */
class ISODate {
  readonly iso: string
  constructor(iso: string) {
    this.iso = iso
    Object.freeze(this)
  }
}
const isoAdapter: DateAdapter<ISODate> = {
  getFields: (value) => parseDate(value.iso),
  fromFields: (fields) => new ISODate(serializeDate(fields)),
  addDays: (value, amount) =>
    new ISODate(serializeDate(dateOnlyAdapter.addDays(parseDate(value.iso), amount))),
  addMonths: (value, amount) =>
    new ISODate(serializeDate(dateOnlyAdapter.addMonths(parseDate(value.iso), amount))),
  addYears: (value, amount) =>
    new ISODate(serializeDate(dateOnlyAdapter.addYears(parseDate(value.iso), amount))),
  compare: (a, b) => dateOnlyAdapter.compare(parseDate(a.iso), parseDate(b.iso)),
  getWeekday: (value) => dateOnlyAdapter.getWeekday(parseDate(value.iso)),
  daysInMonth: (value) => dateOnlyAdapter.daysInMonth(parseDate(value.iso)),
  format: (value, options, locale) => dateOnlyAdapter.format(parseDate(value.iso), options, locale),
}

test('calendar.value.1: a custom ISO adapter preserves its object type through navigation and selection', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <Calendar
        adapter={isoAdapter}
        defaultValue={new ISODate('2026-09-14')}
        onValueChange={change}
      >
        <Parts />
      </Calendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  const selected = change.mock.calls[0]?.[0]
  expect(selected).toBeInstanceOf(ISODate)
  expect(selected.iso).toBe('2026-09-16')
  expect(m.getByRole('grid')).toHaveAccessibleName('September 2026')
})

test('range-calendar.value.1 range-calendar.selection.1: custom adapter ranges contain complete native application values only', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar adapter={isoAdapter} onValueChange={change}>
        <RangeCalendar.Header>
          <RangeCalendar.Heading />
        </RangeCalendar.Header>
        <RangeCalendar.Grid />
      </RangeCalendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-18'))
  flush()
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  const selected = change.mock.calls[0]?.[0]
  expect(selected.start).toBeInstanceOf(ISODate)
  expect(selected.end).toBeInstanceOf(ISODate)
  expect([selected.start.iso, selected.end.iso]).toEqual(['2026-09-16', '2026-09-18'])
})

test('range-calendar.readonly.1: readonly and disabled range calendars cannot create a draft', () => {
  for (const policy of [{ readOnly: true }, { disabled: true }]) {
    const change = vi.fn()
    const m = mount(() => (
      <DateProvider today={today}>
        <RangeCalendar {...policy} onValueChange={change}>
          <RangeCalendar.Heading />
          <RangeCalendar.Grid />
        </RangeCalendar>
      </DateProvider>
    ))
    fireEvent.click(day(m.root, '2026-09-14'))
    flush()
    fireEvent.click(day(m.root, '2026-09-16'))
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(m.root.querySelectorAll('[data-highlighted]')).toHaveLength(0)
  }
})

test('range-calendar.cancel.1: Escape is left to its ancestor when no draft exists', () => {
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar>
        <RangeCalendar.Heading />
        <RangeCalendar.Grid />
      </RangeCalendar>
    </DateProvider>
  ))
  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
  day(m.root, '2026-09-14').dispatchEvent(escape)
  flush()
  expect(escape.defaultPrevented).toBe(false)
})

test('range-calendar.value.1: a controlled range stays committed until its owner accepts the completed proposal', () => {
  const change = vi.fn()
  const value = { start: today, end: createDate(2026, 9, 16) }
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar value={value} onValueChange={change}>
        <RangeCalendar.Heading />
        <RangeCalendar.Grid />
      </RangeCalendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-20'))
  flush()
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(day(m.root, '2026-09-22'))
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith({
    start: createDate(2026, 9, 20),
    end: createDate(2026, 9, 22),
  })
  expect(day(m.root, '2026-09-15').closest('td')).toHaveAttribute('aria-selected', 'true')
  expect(day(m.root, '2026-09-21').closest('td')).toHaveAttribute('aria-selected', 'false')
})

test('range-calendar.cancel.1: canceled first-day activation does not start a range draft', () => {
  const change = vi.fn()
  const m = mount(() => (
    <DateProvider today={today}>
      <RangeCalendar onValueChange={change}>
        <RangeCalendar.Heading />
        <RangeCalendar.Grid>
          <RangeCalendar.GridBody>
            <RangeCalendar.Row>
              <RangeCalendar.Cell date={today}>
                <RangeCalendar.Day date={today} onClick={(event) => event.preventDefault()} />
              </RangeCalendar.Cell>
              <RangeCalendar.Cell date={createDate(2026, 9, 16)}>
                <RangeCalendar.Day date={createDate(2026, 9, 16)} />
              </RangeCalendar.Cell>
            </RangeCalendar.Row>
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </DateProvider>
  ))
  fireEvent.click(day(m.root, '2026-09-14'))
  flush()
  expect(m.root.querySelectorAll('[data-highlighted]')).toHaveLength(0)
  fireEvent.click(day(m.root, '2026-09-16'))
  flush()
  expect(change).not.toHaveBeenCalled()
})
