/**
 * The contract between core and every adapter.
 *
 * A component in core is a function from options to one PartProps per part
 * (root, trigger, content, ...). Adapters spread `attrs` onto the element and
 * bind `on` with addEventListener or the framework's equivalent. Nothing in
 * this shape is framework-flavored: attribute names are the HTML spelling
 * (`class`, `for`, `tabindex`), event names are the DOM spelling (`keydown`).
 */

/** Attributes in HTML spelling. `undefined` means "do not set". */
export type Attrs = Record<string, string | number | boolean | undefined>

/** Native DOM listeners keyed by event name. */
export type Listeners = {
  [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
}

export interface PartProps {
  attrs: Attrs
  on: Listeners
}
