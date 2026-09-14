import type { PartProps } from '../part'

export type SeparatorHost = 'hr' | 'generic'

export type SeparatorOrientation = 'horizontal' | 'vertical'

export interface SeparatorOptions {
  host?: SeparatorHost
  orientation?: SeparatorOrientation
  decorative?: boolean
}

export interface SeparatorState {
  host: SeparatorHost
  orientation: SeparatorOrientation
  decorative: boolean
}

export interface SeparatorResult {
  state: SeparatorState
  parts: { root: PartProps<'div'> }
}

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
