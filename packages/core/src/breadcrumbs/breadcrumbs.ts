import type { PartProps } from '../part'

/** Label for the breadcrumb navigation landmark. */
export interface BreadcrumbsOptions {
  /** Accessible landmark name, default Breadcrumbs. */
  label?: string
}
/** Breadcrumb landmark snapshot. */
export interface BreadcrumbsState {
  /** Resolved default or supplied landmark name. */
  label: string
}
/** Structural bindings for a breadcrumb trail. */
export interface BreadcrumbsResult {
  /** Resolved landmark label. */
  state: BreadcrumbsState
  /** Native list and link anatomy with explicit current-page marking. */
  parts: {
    /** Navigation landmark. */
    root: PartProps<'nav'>
    /** Ordered breadcrumb list. */
    list: PartProps<'ol'>
    /** One breadcrumb list entry. */
    item: PartProps<'li'>
    /** Native link; current retains href and normal focusability. */
    link: (current?: boolean) => PartProps<'a'>
    /** Noninteractive current-page text. */
    current: PartProps<'span'>
    /** Decorative separator, placed inside a list item. */
    separator: PartProps<'span'>
  }
}
/**
 * Build breadcrumb semantics without routing or inferring the current item.
 * Render list entries as li and links as anchors with href. Mark the current page
 * explicitly. Decorative separators belong inside an li to keep the list valid.
 */
export function breadcrumbs(options: BreadcrumbsOptions = {}): BreadcrumbsResult {
  const label = options.label ?? 'Breadcrumbs'
  return {
    state: { label },
    parts: {
      root: { attrs: { role: 'navigation', 'aria-label': label }, on: {} },
      list: { attrs: {}, on: {} },
      item: { attrs: {}, on: {} },
      link: (current = false) => ({
        attrs: {
          'aria-current': current ? 'page' : undefined,
          'data-state': current ? 'current' : 'idle',
        },
        on: {},
      }),
      current: { attrs: { 'aria-current': 'page', 'data-state': 'current' }, on: {} },
      separator: { attrs: { 'aria-hidden': 'true' }, on: {} },
    },
  }
}
