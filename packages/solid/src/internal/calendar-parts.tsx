import { setRef } from './host'
import type { AnyPart } from '@xenon-ui/core'
import { dynamic } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { For, Show, createMemo, omit, onCleanup } from 'solid-js'
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { spread } from '../spread'
import { CalendarGridContext, useCalendarContext, useCalendarMonth } from './calendar-context'
import type { CalendarDayEntry } from './calendar-context'
import type { CalendarHostProps } from './calendar-types'

/** Header layout attributes. This wrapper adds no accessibility role. */
export type CalendarHeaderProps<As extends ValidComponent = 'div'> = CalendarHostProps<As>
/** Groups the month heading and paging buttons without imposing layout. */
export function CalendarHeader<As extends ValidComponent = 'div'>(
  props: CalendarHeaderProps<As>
): JSX.Element {
  useCalendarContext('Header')
  const own = props as CalendarHeaderProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const Host = dynamic(() => own.as ?? 'div')
  return <Host {...rest}>{own.children}</Host>
}
/** Heading attributes; omitted children render the localized displayed month interval. */
export type CalendarHeadingProps<As extends ValidComponent = 'h2'> = CalendarHostProps<As>
/** Registers the calendar's accessible month heading and announces paging politely. */
export function CalendarHeading<As extends ValidComponent = 'h2'>(
  props: CalendarHeadingProps<As>
): JSX.Element {
  const context = useCalendarContext('Heading')
  const own = props as CalendarHeadingProps<'h2'>
  const id = () => (own.id === false ? undefined : (own.id ?? context.headingId()))
  onCleanup(context.registerHeading(id))
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'id')
  const Host = dynamic(() => own.as ?? 'h2')
  return (
    <Host {...spread(context.result().parts.heading, rest)} id={id()}>
      {own.children === undefined ? context.result().state.heading : own.children}
    </Host>
  )
}
/** Previous-page button props; the default label is Previous month. */
export type CalendarPreviousProps<As extends ValidComponent = 'button'> = ButtonProps<As>
/** Pages backward by the visible month count, retaining focus on the activated control. */
export function CalendarPrevious<As extends ValidComponent = 'button'>(
  props: CalendarPreviousProps<As>
): JSX.Element {
  const context = useCalendarContext('Previous')
  const own = props as CalendarPreviousProps<'button'>
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <Button {...spread(context.result().parts.previousTrigger, rest)}>
      {own.children === undefined ? '‹' : own.children}
    </Button>
  )
}
/** Next-page button props; the default label is Next month. */
export type CalendarNextProps<As extends ValidComponent = 'button'> = ButtonProps<As>
/** Pages forward by the visible month count, retaining focus on the activated control. */
export function CalendarNext<As extends ValidComponent = 'button'>(
  props: CalendarNextProps<As>
): JSX.Element {
  const context = useCalendarContext('Next')
  const own = props as CalendarNextProps<'button'>
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <Button {...spread(context.result().parts.nextTrigger, rest)}>
      {own.children === undefined ? '›' : own.children}
    </Button>
  )
}
/** Native grid table attributes and its displayed-month index. */
export type CalendarGridProps<As extends ValidComponent = 'table'> = CalendarHostProps<As> & {
  /** Zero-based displayed month, defaulting to 0. Render one Grid for each visible month. */
  month?: number
}
/**
 * Renders a native calendar table with localized weekday headings and day buttons.
 * Supplying children replaces its default rows for a custom layout. The month
 * index supplies context to Cell and Day parts. Default row/column identities stay
 * stable during focus and selection updates, preserving the focused DOM button.
 */
export function CalendarGrid<As extends ValidComponent = 'table'>(
  props: CalendarGridProps<As>
): JSX.Element {
  const context = useCalendarContext('Grid')
  const own = props as CalendarGridProps<'table'>
  const month = () => own.month ?? 0
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'month')
  const weeks = () => context.result().state.months[month()]?.weeks ?? []
  const indices = [0, 1, 2, 3, 4, 5, 6]
  const children = createMemo(() => (
    <CalendarGridContext value={month}>
      {own.children === undefined ? (
        <>
          <CalendarGridHead>
            <CalendarRow>
              <For each={indices}>
                {(index) => (
                  <CalendarColumnHeader weekday={context.result().state.weekdays[index]!.weekday} />
                )}
              </For>
            </CalendarRow>
          </CalendarGridHead>
          <CalendarGridBody>
            <For each={weeks().map((_, index) => index)}>
              {(row) => (
                <CalendarRow>
                  <For each={indices}>
                    {(column) => (
                      <CalendarCell date={weeks()[row]?.[column]?.value}>
                        <Show when={weeks()[row]?.[column]?.value !== undefined}>
                          <CalendarDay date={weeks()[row]![column]!.value} />
                        </Show>
                      </CalendarCell>
                    )}
                  </For>
                </CalendarRow>
              )}
            </For>
          </CalendarGridBody>
        </>
      ) : (
        own.children
      )}
    </CalendarGridContext>
  ))
  const Host = dynamic(() => own.as ?? 'table')
  return <Host {...spread(context.result().parts.grid(month()), rest)}>{children()}</Host>
}
/** Native table heading section attributes. */
export type CalendarGridHeadProps<As extends ValidComponent = 'thead'> = CalendarHostProps<As>
/** Renders a native table heading section for a custom calendar grid. */
export function CalendarGridHead<As extends ValidComponent = 'thead'>(
  props: CalendarGridHeadProps<As>
): JSX.Element {
  const context = useCalendarContext('GridHead')
  const own = props as CalendarGridHeadProps<'thead'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const Host = dynamic(() => own.as ?? 'thead')
  return <Host {...spread(context.result().parts.gridHead, rest)}>{own.children}</Host>
}
/** Native table body section attributes. */
export type CalendarGridBodyProps<As extends ValidComponent = 'tbody'> = CalendarHostProps<As>
/** Renders a native table body section for custom week rows. */
export function CalendarGridBody<As extends ValidComponent = 'tbody'>(
  props: CalendarGridBodyProps<As>
): JSX.Element {
  const context = useCalendarContext('GridBody')
  const own = props as CalendarGridBodyProps<'tbody'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const Host = dynamic(() => own.as ?? 'tbody')
  return <Host {...spread(context.result().parts.gridBody, rest)}>{own.children}</Host>
}
/** Native table row attributes. */
export type CalendarRowProps<As extends ValidComponent = 'tr'> = CalendarHostProps<As>
/** Renders one header or week row without changing its native table semantics. */
export function CalendarRow<As extends ValidComponent = 'tr'>(
  props: CalendarRowProps<As>
): JSX.Element {
  const context = useCalendarContext('Row')
  const own = props as CalendarRowProps<'tr'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const Host = dynamic(() => own.as ?? 'tr')
  return <Host {...spread(context.result().parts.row, rest)}>{own.children}</Host>
}
/** Weekday column header attributes. */
export type CalendarColumnHeaderProps<As extends ValidComponent = 'th'> = CalendarHostProps<As> & {
  /** Weekday number, Sunday=0 through Saturday=6. */
  weekday: number
}
/** Renders localized weekday text and a full-name abbreviation for assistive technology. */
export function CalendarColumnHeader<As extends ValidComponent = 'th'>(
  props: CalendarColumnHeaderProps<As>
): JSX.Element {
  const context = useCalendarContext('ColumnHeader')
  const own = props as unknown as CalendarColumnHeaderProps<'th'>
  const weekday = () =>
    context.result().state.weekdays.find((day) => day.weekday === own.weekday) ??
    context.result().state.weekdays[0]!
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'weekday')
  const Host = dynamic(() => own.as ?? 'th')
  return (
    <Host {...spread(context.result().parts.headerCell(weekday()), rest)}>
      {own.children === undefined ? weekday().shortLabel : own.children}
    </Host>
  )
}
/** Native grid-cell attributes bound to a date in the enclosing Grid month. */
export type CalendarCellProps<
  T = unknown,
  As extends ValidComponent = 'td',
> = CalendarHostProps<As> & {
  /** Date represented by this cell. Undefined represents year-boundary padding. */
  date: T | undefined
}
/** Applies selection, availability and range hooks to a native table cell. */
export function CalendarCell<T = unknown, As extends ValidComponent = 'td'>(
  props: CalendarCellProps<T, As>
): JSX.Element {
  const context = useCalendarContext('Cell')
  const month = useCalendarMonth()
  const own = props as unknown as CalendarCellProps<unknown, 'td'>
  const rest = omit(props as Record<string, unknown>, 'as', 'children', 'date')
  const Host = dynamic(() => own.as ?? 'td')
  return (
    <Host {...spread(context.result().parts.cell(context.day(own.date, month())), rest)}>
      {own.children}
    </Host>
  )
}
/** Day-button attributes bound to the enclosing root's representation and Grid month. */
export type CalendarDayProps<
  T = unknown,
  As extends ValidComponent = 'button',
> = ButtonProps<As> & {
  /** Date in the same representation as the enclosing calendar adapter. */
  date: T
}
/**
 * Renders one native day button with localized naming, roving focus and selection.
 * Children override the day number. Author handlers run before calendar handlers
 * and can cancel them. Focus moves after accepted keyboard navigation or day
 * activation; unavailable dates remain focusable but cannot be selected.
 */
export function CalendarDay<T = unknown, As extends ValidComponent = 'button'>(
  props: CalendarDayProps<T, As>
): JSX.Element {
  const context = useCalendarContext('Day')
  const month = useCalendarMonth()
  const own = props as unknown as CalendarDayProps<unknown, 'button'>
  const day = () => context.day(own.date, month())
  const entry: CalendarDayEntry = { day }
  onCleanup(context.register(entry))
  const rest = omit(props as Record<string, unknown>, 'children', 'date', 'ref')
  const part = () => {
    const original = context.result().parts.day(day())
    return {
      attrs: original.attrs,
      on: {
        ...original.on,
        focus(event: FocusEvent) {
          if (!day().outsideMonth)
            original.on.focus?.(event as FocusEvent & { currentTarget: HTMLButtonElement })
        },
        click(event: MouseEvent) {
          original.on.click?.(event as PointerEvent & { currentTarget: HTMLButtonElement })
          if (!original.attrs.disabled) context.focusDay()
        },
        keydown(event: KeyboardEvent) {
          if (event.isComposing) return
          original.on.keydown?.(event as KeyboardEvent & { currentTarget: HTMLButtonElement })
          if (
            event.defaultPrevented &&
            [
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'Home',
              'End',
              'PageUp',
              'PageDown',
            ].includes(event.key)
          )
            context.focusDay()
        },
        pointerenter(event: PointerEvent) {
          if (event.pointerType !== 'touch')
            original.on.pointerenter?.(event as PointerEvent & { currentTarget: HTMLButtonElement })
        },
        pointerleave(event: PointerEvent) {
          if (event.pointerType !== 'touch')
            original.on.pointerleave?.(event as PointerEvent & { currentTarget: HTMLButtonElement })
        },
      },
    } as AnyPart
  }
  return (
    <Button
      ref={(element: HTMLElement) => {
        entry.element = element
        setRef(() => own.ref, element)
      }}
      {...spread(part(), rest)}
    >
      {own.children === undefined
        ? own.date === undefined
          ? ''
          : context.adapter().getFields(own.date).day
        : own.children}
    </Button>
  )
}
