import type { PartProps } from '../part'

/** Native horizontal-rule semantics or a host requiring an explicit separator role. */
export type SeparatorHost = 'hr' | 'generic'

/** Separator axis used for ARIA and styling; does not set CSS dimensions. */
export type SeparatorOrientation = 'horizontal' | 'vertical'

/** Host semantics, axis, and whether the separator conveys structure. */
export interface SeparatorOptions {
  /**
   * Match the rendered host; hr relies on its implicit separator role.
   * @defaultValue 'hr'
   */
  host?: SeparatorHost
  /**
   * Axis exposed as data-orientation. Only a nondecorative vertical separator gets aria-orientation.
   * @defaultValue 'horizontal'
   */
  orientation?: SeparatorOrientation
  /**
   * Use role=none and omit aria-orientation on either host.
   * @defaultValue false
   */
  decorative?: boolean
}

/** Resolved separator options. */
export interface SeparatorState {
  /** Host semantics used to determine whether an explicit role is needed. */
  host: SeparatorHost
  /** Axis exposed by the styling hook. */
  orientation: SeparatorOrientation
  /** Whether structural separator semantics are suppressed. */
  decorative: boolean
}

/** Separator snapshot and attributes; no interaction listeners are supplied. */
export interface SeparatorResult {
  /** Resolved options used to generate the root. */
  state: SeparatorState
  /** Attributes to apply to the selected host. */
  parts: {
    /** Role and orientation attributes, typed as a div bundle even for the hr host. */
    root: PartProps<'div'>
  }
}

/** Builds separator attributes without rendering a host or applying layout styles. */
export function separator(options: SeparatorOptions = {}): SeparatorResult {
  const host = options.host ?? 'hr'
  const orientation = options.orientation ?? 'horizontal'
  const decorative = options.decorative ?? false

  const state: SeparatorState = { host, orientation, decorative }

  const role = decorative ? 'none' : host === 'hr' ? undefined : 'separator'

  const root: PartProps<'div'> = {
    attrs: {
      role,
      'aria-orientation': !decorative && orientation === 'vertical' ? 'vertical' : undefined,
      'data-orientation': orientation,
    },
    on: {},
  }

  return { state, parts: { root } }
}
