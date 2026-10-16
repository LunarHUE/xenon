import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute } from '../internal/host'
import { pagination } from '@xenon-ui/core/pagination'
import type {
  PaginationOptions,
  PaginationState,
  PaginationResult,
} from '@xenon-ui/core/pagination'
import { dynamic } from '@solidjs/web'
import type { JSX, ComponentProps, ValidComponent } from '@solidjs/web'
import { createContext, useContext, createMemo, createSignal, untrack, omit } from 'solid-js'
import { spread } from '../spread'
import { gate } from '../internal/gate'

/** Root-controlled and initial pagination inputs. */
interface Own extends PaginationOptions {
  /** Initial uncontrolled page, read once; defaults to 1. */
  defaultPage?: PaginationOptions['page']
  /** Static content or a render function receiving reactive state getters. */
  children?: JSX.Element | ((state: PaginationState) => JSX.Element)
}
/** Navigation host props and page-count configuration. */
export type PaginationProps<T extends ValidComponent = 'nav'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<Own, 'ref'>> & {
    /** Root host, default nav. Other hosts retain the navigation role. */
    as?: T
  }
/** Button or link host props shared by directional controls. */
export type PaginationControlProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Rendered host, default button; anchors with href remain native links. */
  as?: T
  /** Blocks this control in addition to root and boundary disabling. */
  disabled?: JSX.BooleanAttribute
}
/** A control selecting one exact page. */
export type PaginationItemProps<T extends ValidComponent = 'button'> = PaginationControlProps<T> & {
  /** One-based target page. Invalid targets are disabled. */
  page: number
}
/** Decorative omission marker host props. */
export type PaginationEllipsisProps<T extends ValidComponent = 'span'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Host, default span; content is author supplied. */
  as?: T
}
const Context = /* @__PURE__ */ createContext<() => PaginationResult>()
/** Require a pagination root around controls. */
function usePagination() {
  const context = useContext(Context)
  if (!context) throw new Error('Pagination controls must be used inside Pagination')
  return context
}
/** Own uncontrolled state and provide the pure core snapshot to child controls. */
function PaginationRoot<T extends ValidComponent = 'nav'>(props: PaginationProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'count',
    'page',
    'defaultPage',
    'onPageChange',
    'siblingCount',
    'boundaryCount',
    'disabled',
    'children'
  )
  const [internal, setInternal] = createSignal(untrack(() => own.defaultPage ?? 1))
  const result = createMemo(() =>
    pagination({
      count: own.count,
      page: own.page ?? internal(),
      siblingCount: own.siblingCount,
      boundaryCount: own.boundaryCount,
      disabled: booleanAttribute(own.disabled),
      onPageChange: (page) => {
        if (own.page === undefined) setInternal(page)
        own.onPageChange?.(page)
      },
    })
  )
  const state: PaginationState = {
    get page() {
      return result().state.page
    },
    get count() {
      return result().state.count
    },
    get pages() {
      return result().state.pages
    },
    get disabled() {
      return result().state.disabled
    },
  }
  const inner = createMemo(() => (
    <Context value={result}>
      {typeof own.children === 'function' ? own.children(state) : own.children}
    </Context>
  ))
  const Host = dynamic(() => own.as ?? 'nav')
  return <Host {...spread(result().parts.root, { ...rest })}>{inner()}</Host>
}
/** Bind a page request while preserving native keyboard and navigation behavior. */
function Control(
  props: Record<string, unknown>,
  kind: 'item' | 'previous' | 'next' | 'first' | 'last'
): JSX.Element {
  const context = usePagination()
  const rest = omit(props, 'as', 'page', 'disabled', 'children')
  const result = createMemo(() => {
    const host =
      props.as === undefined || props.as === 'button'
        ? 'button'
        : props.as === 'a' && props.href != null
          ? 'link'
          : 'generic'
    const options = {
      host,
      disabled: booleanAttribute(props.disabled as boolean | '' | undefined),
    } as const
    return kind === 'item'
      ? context().parts.item(props.page as number, options)
      : context().parts[kind](options)
  })
  const merged = () => {
    const out = { ...rest }
    const blocked = result().attrs['data-disabled'] !== undefined
    // eslint-disable-next-line solid/reactivity -- gate reads the current part only on activation
    gate(out, () => result().attrs['data-disabled'] === undefined)
    if (props.as === 'a' && blocked) out.href = undefined
    return out
  }
  const Host = dynamic(() => (props.as ?? 'button') as ValidComponent)
  return <Host {...spread(result(), merged())}>{props.children as JSX.Element}</Host>
}
/** Select a numbered page; repeated selection is silent. */
function Item<T extends ValidComponent = 'button'>(props: PaginationItemProps<T>): JSX.Element {
  return Control(props as Record<string, unknown>, 'item')
}
/** Request the preceding page, disabling at page one. */
function Previous<T extends ValidComponent = 'button'>(
  props: PaginationControlProps<T>
): JSX.Element {
  return Control(props as Record<string, unknown>, 'previous')
}
/** Request the following page, disabling at the final page. */
function Next<T extends ValidComponent = 'button'>(props: PaginationControlProps<T>): JSX.Element {
  return Control(props as Record<string, unknown>, 'next')
}
/** Request page one, disabling when already selected. */
function First<T extends ValidComponent = 'button'>(props: PaginationControlProps<T>): JSX.Element {
  return Control(props as Record<string, unknown>, 'first')
}
/** Request the final page, disabling when already selected. */
function Last<T extends ValidComponent = 'button'>(props: PaginationControlProps<T>): JSX.Element {
  return Control(props as Record<string, unknown>, 'last')
}
/** Render author-supplied decorative omission content. */
function Ellipsis<T extends ValidComponent = 'span'>(
  props: PaginationEllipsisProps<T>
): JSX.Element {
  const context = usePagination()
  const own = props as { as?: ValidComponent; children?: JSX.Element }
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  const Host = dynamic(() => own.as ?? 'span')
  return <Host {...spread(context().parts.ellipsis, { ...rest })}>{own.children}</Host>
}
/** Compound page navigation with native Tab order and consumer-rendered page ranges. */
export const Pagination = /* @__PURE__ */ Object.assign(PaginationRoot, {
  /** Explicit root alias. */
  Root: PaginationRoot,
  /** Numbered page control. */
  Item,
  /** Previous-page control. */
  Previous,
  /** Next-page control. */
  Next,
  /** First-page control. */
  First,
  /** Last-page control. */
  Last,
  /** Decorative omitted-page marker. */
  Ellipsis,
})
