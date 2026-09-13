import type { GlobalAttrs, TagAttrs } from './attrs.generated'

export type Tag = keyof HTMLElementTagNameMap

export type Attrs<T extends Tag> = GlobalAttrs &
  (T extends keyof TagAttrs ? Partial<TagAttrs[T]> : Record<never, never>)

export type Listeners<T extends Tag> = {
  [K in keyof HTMLElementEventMap]?: (
    event: HTMLElementEventMap[K] & { currentTarget: HTMLElementTagNameMap[T] }
  ) => void
}

export interface PartProps<T extends Tag> {
  attrs: Attrs<T>
  on: Listeners<T>
}

/**
 * A part of any tag. Adapters take this: they only flatten attrs and bind
 * listeners, so they never need to know the host. `never` on the event
 * parameter is what lets every `PartProps<T>` be assignable here.
 */
export interface AnyPart {
  attrs: GlobalAttrs
  on: { [K in keyof HTMLElementEventMap]?: (event: never) => void }
}
