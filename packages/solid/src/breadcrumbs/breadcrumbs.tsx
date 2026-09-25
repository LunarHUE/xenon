import { breadcrumbs } from '@xenon-ui/core/breadcrumbs'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit } from 'solid-js'
import { spread } from '../spread'

/** Navigation landmark host props. */
export type BreadcrumbsProps<T extends ValidComponent = 'nav'> = ComponentProps<T> & {
  /** Root host, default nav. Author ARIA naming overrides the default Breadcrumbs label. */
  as?: T
}
/** Native ordered-list props. */
export type BreadcrumbsListProps = ComponentProps<'ol'>
/** Native list-entry props; put separators inside entries. */
export type BreadcrumbsItemProps = ComponentProps<'li'>
/** Native link props with optional current-page state. */
export type BreadcrumbsLinkProps = ComponentProps<'a'> & {
  /** Mark this link as the current page without removing href or its tab stop. */
  current?: boolean
}
/** Noninteractive current-page text props. */
export type BreadcrumbsCurrentProps = ComponentProps<'span'>
/** Decorative separator props; supply text or artwork as children. */
export type BreadcrumbsSeparatorProps = ComponentProps<'span'>

/** Render the named navigation landmark. Children remain separate from attributes. */
function BreadcrumbsRoot<T extends ValidComponent = 'nav'>(
  props: BreadcrumbsProps<T>
): JSX.Element {
  const own = props as { as?: ValidComponent; children?: JSX.Element }
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  return (
    <Dynamic component={own.as ?? 'nav'} {...spread(breadcrumbs().parts.root, { ...rest })}>
      {own.children}
    </Dynamic>
  )
}
/** Render an ordered list without injected separators or links. */
function List(props: BreadcrumbsListProps): JSX.Element {
  const rest = omit(props, 'children')
  return <ol {...spread(breadcrumbs().parts.list, { ...rest })}>{props.children}</ol>
}
/** Render a single ordered breadcrumb entry. */
function Item(props: BreadcrumbsItemProps): JSX.Element {
  const rest = omit(props, 'children')
  return <li {...spread(breadcrumbs().parts.item, { ...rest })}>{props.children}</li>
}
/** Preserve native anchor navigation, modifiers and author handlers. */
function Link(props: BreadcrumbsLinkProps): JSX.Element {
  const rest = omit(props, 'children', 'current')
  const part = createMemo(() => breadcrumbs().parts.link(props.current))
  return <a {...spread(part(), { ...rest })}>{props.children}</a>
}
/** Render current-page text with no synthetic role or keyboard behavior. */
function Current(props: BreadcrumbsCurrentProps): JSX.Element {
  const rest = omit(props, 'children')
  return <span {...spread(breadcrumbs().parts.current, { ...rest })}>{props.children}</span>
}
/** Hide author-supplied separator content from accessibility APIs. */
function Separator(props: BreadcrumbsSeparatorProps): JSX.Element {
  const rest = omit(props, 'children')
  return <span {...spread(breadcrumbs().parts.separator, { ...rest })}>{props.children}</span>
}
/** Native breadcrumb anatomy with explicit current-page marking and no routing dependency. */
export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  /** Explicit root alias. */
  Root: BreadcrumbsRoot,
  /** Ordered-list container. */
  List,
  /** One list entry. */
  Item,
  /** Native navigation link. */
  Link,
  /** Noninteractive current-page text. */
  Current,
  /** Decorative separator content. */
  Separator,
})
