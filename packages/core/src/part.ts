import type { GlobalAttrs, TagAttrs } from './attrs.generated'

/** HTML host tag names recognized by the DOM type definitions. */
export type Tag = keyof HTMLElementTagNameMap

/**
 * Optional global, ARIA, data, and tag-specific attributes for an HTML host.
 * Tags absent from the generated attribute map accept only global attributes.
 */
export type Attrs<T extends Tag> = GlobalAttrs &
  (T extends keyof TagAttrs ? Partial<TagAttrs[T]> : Record<never, never>)

/**
 * Handlers keyed by DOM event name, with `currentTarget` typed as the host.
 * Adapters must bind them to that host so `currentTarget` is available during dispatch.
 */
export type Listeners<T extends Tag> = {
  [K in keyof HTMLElementEventMap]?: (
    event: HTMLElementEventMap[K] & { currentTarget: HTMLElementTagNameMap[T] }
  ) => void
}

/** Attributes and event handlers that an adapter applies to one HTML host. */
export interface PartProps<T extends Tag> {
  /** Host attributes using HTML names such as `tabindex` and `aria-disabled`. */
  attrs: Attrs<T>
  /** DOM event handlers to bind to the same host as the attributes. */
  on: Listeners<T>
}

/**
 * A part whose host tag is erased for adapters that copy attributes and bind handlers.
 * The `never` event parameter lets every {@link PartProps} be assigned here.
 */
export interface AnyPart {
  /** Global attributes exposed by the erased type; the object may retain host-specific keys. */
  attrs: GlobalAttrs
  /** Handlers to bind to their original host; direct calls require restoring the event type. */
  on: { [K in keyof HTMLElementEventMap]?: (event: never) => void }
}
