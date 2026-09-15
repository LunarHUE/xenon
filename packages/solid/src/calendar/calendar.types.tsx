import { Calendar, type CalendarProps } from './index'
import { RangeCalendar } from '../range-calendar'
import { createDate, type DateAdapter, type DateValue } from '../date'

type BrandedDate = DateValue & { readonly brand: 'custom' }
function verifyCalendarTypes(adapter: DateAdapter<string>, branded: BrandedDate) {
  const plain = (
    <Calendar
      defaultValue={createDate(2024, 2, 15)}
      onValueChange={(value) => {
        void value?.year
      }}
    />
  )
  const custom = (
    <Calendar
      adapter={adapter}
      value="2024-02-15"
      onValueChange={(value) => {
        value?.toUpperCase()
      }}
    />
  )
  const customRange = (
    <RangeCalendar adapter={adapter} value={{ start: '2024-02-15', end: '2024-02-20' }} />
  )
  // @ts-expect-error A string representation requires an explicit adapter.
  const missing = <Calendar value="2024-02-15" />
  // @ts-expect-error A native Date is not the default civil-date representation.
  const native = <Calendar value={new Date()} />
  // @ts-expect-error The explicit string adapter cannot accept DateValue input.
  const mismatch = <Calendar adapter={adapter} value={createDate(2024, 2, 15)} />
  const callback = (
    <Calendar
      adapter={adapter}
      // @ts-expect-error Callback representation must match the explicit string adapter.
      onValueChange={(value: DateValue | undefined) => {
        void value?.year
      }}
    />
  )
  const range = (
    <RangeCalendar
      adapter={adapter}
      // @ts-expect-error Range endpoints must use the adapter's representation.
      value={{ start: createDate(2024, 2, 15), end: createDate(2024, 2, 20) }}
    />
  )
  const brandedCallback = (
    <Calendar
      defaultValue={branded}
      // @ts-expect-error Branded callbacks require an adapter that preserves the brand.
      onValueChange={(value: BrandedDate | undefined) => {
        void value?.brand
      }}
    />
  )
  // @ts-expect-error A branded public props specialization requires its own adapter.
  const brandedProps: CalendarProps<BrandedDate> = { defaultValue: branded }
  return [
    plain,
    custom,
    customRange,
    missing,
    native,
    mismatch,
    callback,
    range,
    brandedCallback,
    brandedProps,
  ]
}
void verifyCalendarTypes
