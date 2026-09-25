import { Calendar } from '@xenon-ui/solid/calendar'
import { RangeCalendar } from '@xenon-ui/solid/range-calendar'
import { DateProvider, createDate, serializeDate } from '@xenon-ui/solid/date'
import { createSignal } from 'solid-js'

/** Shared civil-day snapshot makes server and client independent of the ambient clock. */
export function CalendarFixture() {
  const today = createDate(2024, 2, 15)
  const [selected, setSelected] = createSignal('2024-02-15')
  const [range, setRange] = createSignal('2024-02-12 / 2024-02-14')
  return (
    <DateProvider today={today} locale="en-US" weekStartsOn={1}>
      <Calendar
        id="calendar-hydrated"
        defaultValue={today}
        onValueChange={(value) => setSelected(value ? serializeDate(value) : 'Empty')}
      >
        <Calendar.Header>
          <Calendar.Previous>Previous month</Calendar.Previous>
          <Calendar.Heading id="calendar-heading" />
          <Calendar.Next>Next month</Calendar.Next>
        </Calendar.Header>
        <Calendar.Grid id="calendar-grid" />
      </Calendar>
      <output id="calendar-selected">{selected()}</output>
      <RangeCalendar
        id="range-hydrated"
        visibleMonths={2}
        defaultValue={{ start: createDate(2024, 2, 12), end: createDate(2024, 2, 14) }}
        onValueChange={(value) =>
          setRange(
            value ? `${serializeDate(value.start)} / ${serializeDate(value.end)}` : 'No range'
          )
        }
      >
        <RangeCalendar.Header>
          <RangeCalendar.Previous>Previous range months</RangeCalendar.Previous>
          <RangeCalendar.Heading />
          <RangeCalendar.Next>Next range months</RangeCalendar.Next>
        </RangeCalendar.Header>
        <RangeCalendar.Grid month={0} />
        <RangeCalendar.Grid month={1} />
      </RangeCalendar>
      <output id="calendar-range">{range()}</output>
    </DateProvider>
  )
}
