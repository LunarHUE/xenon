import { createDate } from '@tenon/core/date'
import type { DateValue } from '@tenon/core/date'
import type { JSX } from '@solidjs/web'
import { createContext, createMemo, untrack, useContext } from 'solid-js'

/** Locale and civil-date defaults, independent of a calendar's chosen representation. */
export interface DateProviderProps {
  /** Formatting locale. Nested providers inherit it; the outer default is en-US. */
  locale?: string
  /** First weekday, Sunday=0 through Saturday=6. Omission defaults to Sunday, independently of locale. */
  weekStartsOn?: number
  /** Shared date-only clock snapshot. Pass the same fields on server and client for stable hydration. */
  today?: DateValue
  /** Date controls receiving these defaults without an added DOM wrapper. */
  children?: JSX.Element
}
/** Resolved provider defaults read by representation-specific calendar roots. */
export interface DateEnvironment {
  /** Current formatting locale. */
  locale(): string
  /** Current first-weekday override, or undefined to use Sunday. */
  weekStartsOn(): number | undefined
  /** Shared Gregorian fields, converted by each root's explicit adapter. */
  today(): DateValue
}
const DateContext = createContext<DateEnvironment | null>(null)
/** Capture the local civil day once. Callers needing stable SSR should supply an explicit today snapshot. */
export function localToday(): DateValue {
  const now = new Date()
  return createDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}
/**
 * Shares locale, week start and a date-only today snapshot. It never supplies a
 * custom date adapter: each calendar using another representation must provide
 * that adapter explicitly. Nested providers inherit unspecified defaults.
 */
export function DateProvider(props: DateProviderProps): JSX.Element {
  const parent = useContext(DateContext)
  const fallback = untrack(() => props.today ?? parent?.today() ?? localToday())
  const context: DateEnvironment = {
    locale: () => props.locale ?? parent?.locale() ?? 'en-US',
    weekStartsOn: () => props.weekStartsOn ?? parent?.weekStartsOn(),
    today: () => props.today ?? parent?.today() ?? fallback,
  }
  const children = createMemo(() => <DateContext value={context}>{props.children}</DateContext>)
  return <>{children()}</>
}
/** Read optional date defaults for an adapter without requiring a provider. */
export function useDateEnvironment(): DateEnvironment | null {
  return useContext(DateContext)
}
