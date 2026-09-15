import { Calendar } from '@tenon/solid/calendar'
import { RangeCalendar } from '@tenon/solid/range-calendar'
import { DateProvider, createDate, serializeDate } from '@tenon/solid/date'
import type { DateValue } from '@tenon/solid/date'
import { createSignal } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

const today = createDate(2026, 9, 14)
const start = createDate(2026, 9, 1)
const end = createDate(2026, 10, 31)
/** Dates are fixed so the behavior sheet reads the same on every visit. */
const label = (date: DateValue | undefined) => (date ? serializeDate(date) : 'not selected')

/** One appointment date, with boundaries and a visible unavailable day. */
export function CalendarDemo() {
  const [value, setValue] = createSignal<DateValue | undefined>(today)
  return (
    <Section
      index="31"
      title="Calendar"
      blurb="A date without a time zone. Move through the month with the arrow keys, then choose a day for your next studio visit."
    >
      <Bench caption="Studio appointments" note="September–October 2026 · closed on the 18th">
        <DateProvider locale="en-US" weekStartsOn={1} today={today}>
          <div class="calendar-study">
            <Calendar
              class="demo-calendar"
              value={value()}
              onValueChange={setValue}
              minValue={start}
              maxValue={end}
              isDateUnavailable={(date) => date.month === 9 && date.day === 18}
              aria-label="Studio appointment"
            >
              <Calendar.Header class="demo-calendar__header">
                <Calendar.Previous class="demo-calendar__nav">←</Calendar.Previous>
                <Calendar.Heading class="demo-calendar__heading" />
                <Calendar.Next class="demo-calendar__nav">→</Calendar.Next>
              </Calendar.Header>
              <Calendar.Grid class="demo-calendar__grid" />
            </Calendar>
            <div class="calendar-study__notes">
              <p class="calendar-study__eyebrow">An afternoon at the studio</p>
              <p class="prose">
                The 18th is reserved for a workshop. You can still focus the date to inspect it, but
                it cannot be booked.
              </p>
              <p class="prose">
                <Keys>←</Keys> <Keys>→</Keys> move one day. <Keys>PgUp</Keys> and <Keys>PgDn</Keys>{' '}
                turn the page. <Keys>Enter</Keys> makes the selection.
              </p>
              <Readout
                rows={[
                  ['appointment', label(value())],
                  ['reference today', '2026-09-14'],
                ]}
              />
            </div>
          </div>
        </DateProvider>
      </Bench>
    </Section>
  )
}

/** Two adjacent months share one keyboard focus and one complete range value. */
export function RangeCalendarDemo() {
  const [value, setValue] = createSignal<{ start: DateValue; end: DateValue } | undefined>({
    start: createDate(2026, 9, 24),
    end: createDate(2026, 9, 28),
  })
  return (
    <Section
      index="32"
      title="Range calendar"
      blurb="Make room for a few days away. Choose a beginning and an end; the days between them belong to the same plan."
    >
      <Bench caption="A short residency" note="two months · one continuous stay">
        <DateProvider locale="en-US" weekStartsOn={1} today={today}>
          <RangeCalendar
            class="demo-calendar demo-calendar--range"
            value={value()}
            onValueChange={setValue}
            visibleMonths={2}
            minValue={start}
            maxValue={end}
            isDateUnavailable={(date) => date.month === 10 && date.day === 12}
            aria-label="Residency dates"
          >
            {(calendar) => (
              <>
                <RangeCalendar.Header class="demo-calendar__header">
                  <RangeCalendar.Previous class="demo-calendar__nav">←</RangeCalendar.Previous>
                  <RangeCalendar.Heading class="demo-calendar__heading" />
                  <RangeCalendar.Next class="demo-calendar__nav">→</RangeCalendar.Next>
                </RangeCalendar.Header>
                <div class="demo-calendar__months">
                  <div>
                    <h3 class="demo-calendar__month-label">{calendar.months[0]?.heading}</h3>
                    <RangeCalendar.Grid month={0} class="demo-calendar__grid" />
                  </div>
                  <div>
                    <h3 class="demo-calendar__month-label">{calendar.months[1]?.heading}</h3>
                    <RangeCalendar.Grid month={1} class="demo-calendar__grid" />
                  </div>
                </div>
              </>
            )}
          </RangeCalendar>
          <div class="calendar-study__legend">
            <span class="calendar-study__swatch" /> Confirmed dates{' '}
            <span class="calendar-study__swatch calendar-study__swatch--preview" /> Preview
          </div>
          <p class="prose">
            Choose two dates in either order. Hover or use the arrow keys to preview your stay.{' '}
            <Keys>Esc</Keys> cancels a draft. October 12 is unavailable, so a stay cannot cross it.
          </p>
          <Readout
            rows={[
              ['arrival', label(value()?.start)],
              ['departure', label(value()?.end)],
            ]}
          />
        </DateProvider>
      </Bench>
    </Section>
  )
}
