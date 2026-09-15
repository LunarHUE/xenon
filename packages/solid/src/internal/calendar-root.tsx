import { dateKey, dateOnlyAdapter } from '@tenon/core/date'
import type { DateAdapter } from '@tenon/core/date'
import { Dynamic, isServer } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, onSettled, untrack } from 'solid-js'
import { localToday, useDateEnvironment } from '../date/date-provider'
import { serverAssociations } from '../field/server-associations'
import { spread } from '../spread'
import { CalendarContext } from './calendar-context'
import type {
  CalendarContextValue,
  CalendarDayEntry,
  CalendarEngine,
  CalendarEngineOptions,
} from './calendar-context'
import type { CalendarBaseProps, CalendarRenderState } from './calendar-types'

/** Internal props after public overloads establish a matching value and adapter type. */
export type InternalCalendarProps = CalendarBaseProps<unknown, unknown, ValidComponent> & {
  /** Representation adapter, defaulting to date-only operations. */
  adapter?: DateAdapter<unknown>
}
/**
 * Share state and DOM focus hosting between the independently imported calendar
 * engines. Date equality comes from the root adapter; initialization is silent.
 * Keyboard and day activation request DOM focus explicitly, so paging buttons
 * and externally controlled month changes never steal focus.
 */
export function createCalendarRoot(
  props: InternalCalendarProps,
  family: 'Calendar' | 'RangeCalendar',
  buildEngine: (options: CalendarEngineOptions) => CalendarEngine
): JSX.Element {
  const environment = useDateEnvironment()
  const own = props
  const adapter = () => own.adapter ?? (dateOnlyAdapter as DateAdapter<unknown>)
  const fallbackToday = untrack(() =>
    own.today === undefined
      ? (environment?.today() ?? localToday())
      : adapter().getFields(own.today)
  )
  const today = () => own.today ?? adapter().fromFields(environment?.today() ?? fallbackToday)
  const initial = untrack(() =>
    buildEngine({
      adapter: adapter(),
      today: today(),
      value: own.value ?? own.defaultValue,
      focusedValue: own.focusedValue ?? own.defaultFocusedValue,
      visibleMonth: own.visibleMonth ?? own.defaultVisibleMonth,
      minValue: own.minValue,
      maxValue: own.maxValue,
      isDateUnavailable: own.isDateUnavailable,
      disabled: own.disabled,
      readOnly: own.readOnly,
      locale: own.locale ?? environment?.locale() ?? 'en-US',
      weekStartsOn: own.weekStartsOn ?? environment?.weekStartsOn(),
      dir: own.dir,
      fixedWeeks: own.fixedWeeks,
      visibleMonths: own.visibleMonths,
    })
  )
  const [internalValue, setInternalValue] = createSignal(untrack(() => own.defaultValue))
  const [internalFocus, setInternalFocus] = createSignal(
    untrack(() => own.defaultFocusedValue ?? initial.state.focusedValue)
  )
  const [internalMonth, setInternalMonth] = createSignal(
    untrack(() => own.defaultVisibleMonth ?? initial.state.visibleMonth)
  )
  const [anchor, setAnchor] = createSignal<unknown>()
  const [preview, setPreview] = createSignal<unknown>()
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr')
  const [headingVersion, setHeadingVersion] = createSignal(0, { ownedWrite: true })
  const headings: Array<() => string | undefined> = []
  const days = new Set<CalendarDayEntry>()
  const generated = createUniqueId()
  const associations = isServer ? serverAssociations() : undefined
  let element!: HTMLElement
  const value = () => (own.value === undefined ? internalValue() : own.value)
  const focus = () => (own.focusedValue === undefined ? internalFocus() : own.focusedValue)
  const month = () => (own.visibleMonth === undefined ? internalMonth() : own.visibleMonth)
  const equal = (a: unknown, b: unknown) =>
    a === undefined || b === undefined ? a === b : adapter().compare(a, b) === 0
  const equalSelection = (a: unknown, b: unknown) => {
    if (a === undefined || b === undefined || family === 'Calendar') return equal(a, b)
    const left = a as { start: unknown; end: unknown },
      right = b as { start: unknown; end: unknown }
    return equal(left.start, right.start) && equal(left.end, right.end)
  }
  const options = (): CalendarEngineOptions => ({
    adapter: adapter(),
    today: today(),
    value: value(),
    focusedValue: focus(),
    visibleMonth: month(),
    minValue: own.minValue,
    maxValue: own.maxValue,
    isDateUnavailable: own.isDateUnavailable,
    disabled: own.disabled,
    readOnly: own.readOnly,
    locale: own.locale ?? environment?.locale() ?? 'en-US',
    weekStartsOn: own.weekStartsOn ?? environment?.weekStartsOn(),
    dir: own.dir ?? ambient(),
    fixedWeeks: own.fixedWeeks,
    visibleMonths: own.visibleMonths,
    headingId: (() => {
      headingVersion()
      return headings.at(-1)?.()
    })(),
    anchorValue: anchor(),
    previewValue: preview(),
    onAnchorValueChange: (next) => setAnchor(() => next),
    onPreviewValueChange: (next) => setPreview(() => next),
    onValueChange(next) {
      if (next === undefined || untrack(() => equalSelection(next, value()))) return
      if (own.value === undefined) setInternalValue(() => next)
      own.onValueChange?.(next)
    },
    onFocusedValueChange(next) {
      if (untrack(() => equal(next, focus()))) return
      if (own.focusedValue === undefined) setInternalFocus(() => next)
      own.onFocusedValueChange?.(next)
    },
    onVisibleMonthChange(next) {
      const current = untrack(month)
      if (current !== undefined) {
        const a = adapter().getFields(current),
          b = adapter().getFields(next)
        if (a.year === b.year && a.month === b.month) return
      }
      if (own.visibleMonth === undefined) setInternalMonth(() => next)
      own.onVisibleMonthChange?.(next)
    },
  })
  const build = () => buildEngine(options())
  const memo = createMemo(build)
  const result = () => (isServer ? build() : memo())
  const context: CalendarContextValue = {
    family,
    adapter,
    result,
    day(date, index) {
      if (date === undefined)
        return { value: undefined, key: `blank-${index}`, outsideMonth: true, monthIndex: index }
      return (
        result()
          .state.months[index]?.weeks.flat()
          .find((cell) => cell.value !== undefined && equal(cell.value, date)) ?? {
          value: date,
          key: dateKey(adapter(), date),
          outsideMonth: true,
          monthIndex: index,
        }
      )
    },
    register(entry) {
      days.add(entry)
      return () => {
        days.delete(entry)
      }
    },
    focusDay() {
      onSettled(() =>
        untrack(() => {
          const focused = result().state.focusedValue
          const target = [...days].find((entry) => {
            const day = entry.day()
            return (
              !day.outsideMonth &&
              day.value !== undefined &&
              equal(day.value, focused) &&
              entry.element?.isConnected
            )
          })?.element
          if (target && target.ownerDocument.activeElement !== target) target.focus()
        })
      )
    },
    headingId: () => `${generated}-heading`,
    registerHeading(read) {
      headings.push(read)
      if (!isServer) setHeadingVersion((version) => version + 1)
      return () => {
        const index = headings.indexOf(read)
        if (index >= 0) headings.splice(index, 1)
        if (!isServer) setHeadingVersion((version) => version + 1)
      }
    },
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
  }
  onSettled(() =>
    untrack(() => {
      setAmbient(
        element.parentElement?.closest('[dir]')?.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr'
      )
    })
  )
  const state: CalendarRenderState<unknown, unknown> = {
    get value() {
      return result().state.value
    },
    get today() {
      return result().state.today
    },
    get focusedValue() {
      return result().state.focusedValue
    },
    get visibleMonth() {
      return result().state.visibleMonth
    },
    get weeks() {
      return result().state.weeks
    },
    get months() {
      return result().state.months
    },
    get weekdays() {
      return result().state.weekdays
    },
    get heading() {
      return result().state.heading
    },
    get canGoPrevious() {
      return result().state.canGoPrevious
    },
    get canGoNext() {
      return result().state.canGoNext
    },
    get anchorValue() {
      return result().state.anchorValue
    },
    get previewValue() {
      return result().state.previewValue
    },
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'adapter',
    'value',
    'defaultValue',
    'onValueChange',
    'focusedValue',
    'defaultFocusedValue',
    'onFocusedValueChange',
    'visibleMonth',
    'defaultVisibleMonth',
    'onVisibleMonthChange',
    'visibleMonths',
    'minValue',
    'maxValue',
    'isDateUnavailable',
    'disabled',
    'readOnly',
    'locale',
    'weekStartsOn',
    'today',
    'dir',
    'fixedWeeks'
  )
  const children = createMemo(() => (
    <CalendarContext value={context}>
      {(() => {
        const children = props.children
        return typeof children === 'function' ? children(state) : children
      })()}
    </CalendarContext>
  ))
  const output = (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(node: HTMLElement) => {
        element = node
        own.ref?.(node)
      }}
      {...spread(
        {
          ...result().parts.root,
          attrs: {
            ...result().parts.root.attrs,
            'aria-labelledby': own['aria-label']
              ? undefined
              : context.association(
                  'aria-labelledby',
                  () => result().parts.root.attrs['aria-labelledby']
                ),
          },
        },
        rest
      )}
    >
      {children()}
    </Dynamic>
  )
  return associations ? associations.finish(output) : output
}
