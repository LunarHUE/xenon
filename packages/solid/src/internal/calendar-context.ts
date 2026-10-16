import { createContext, useContext } from 'solid-js'
import type { DateAdapter } from '@xenon-ui/core/date'
import type { CalendarDay, CalendarOptions, CalendarResult } from '@xenon-ui/core/calendar'
import type { Association } from '../field/server-associations'

/** Extra draft inputs shared only with the range engine. */
export interface CalendarDraftOptions {
  /** First day of an unfinished range. */
  anchorValue?: unknown
  /** Current preview endpoint. */
  previewValue?: unknown
  /** Accept the range engine's anchor request. */
  onAnchorValueChange?: (value: unknown | undefined) => void
  /** Accept the range engine's preview request. */
  onPreviewValueChange?: (value: unknown | undefined) => void
}
/** Erased internal engine inputs; public roots enforce their date representation. */
export type CalendarEngineOptions = CalendarOptions<unknown> & CalendarDraftOptions
/** Engine shared by both public families without importing either runtime from the other. */
export type CalendarEngine = CalendarResult<unknown> & {
  /** Range-only hover preview request. */
  preview?: (value?: unknown) => void
  /** Shared snapshot with optional range draft state. */
  state: CalendarResult<unknown>['state'] & CalendarDraftOptions
}
/** Live mounted day identity used to focus the canonical in-month button after navigation. */
export interface CalendarDayEntry {
  /** Native host after its forwarded ref attaches. */
  element?: HTMLElement
  /** Current cell value and owning month. */
  day(): CalendarDay<unknown>
}
/** Shared internal calendar context. Public custom layouts consume the root render callback instead. */
export interface CalendarContextValue {
  /** Name used in missing-ancestor diagnostics. */
  family: 'Calendar' | 'RangeCalendar'
  /** Current core snapshot. */
  result(): CalendarEngine
  /** Explicit root adapter, or the default immutable date-only adapter. */
  adapter(): DateAdapter<unknown>
  /** Find a date in one rendered month, preserving its outside-month flag. */
  day(value: unknown, month: number): CalendarDay<unknown>
  /** Register a day host without changing state; returns cleanup. */
  register(entry: CalendarDayEntry): () => void
  /** Focus the current canonical in-month day after reactive rendering settles. */
  focusDay(): void
  /** Default stable heading ID. */
  headingId(): string
  /** Register a live author heading ID and return cleanup. */
  registerHeading(read: () => string | undefined): () => void
  /** Defer server ID references until all descendants have registered. */
  association(name: Association, read: () => string | undefined): string | undefined
}
/** Shared calendar provider; isolated roots keep independent registries and values. */
export const CalendarContext = /* @__PURE__ */ createContext<CalendarContextValue | null>(null)
/** Owning month index for Grid descendants. */
export const CalendarGridContext = /* @__PURE__ */ createContext<(() => number) | null>(null)
/** Read required calendar context and identify the missing ancestor in errors. */
export function useCalendarContext(part: string): CalendarContextValue {
  const context = useContext(CalendarContext)
  if (!context)
    throw new Error(`Calendar.${part} must be rendered inside Calendar or RangeCalendar`)
  return context
}
/** Read the current grid month or default to the first grid for custom layouts. */
export function useCalendarMonth(): () => number {
  return useContext(CalendarGridContext) ?? (() => 0)
}
