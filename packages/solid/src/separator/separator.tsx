import { separator } from '@kit/core'
import type { SeparatorHost, SeparatorOptions } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit } from 'solid-js'

import { spread } from '../spread'

interface Own {
  orientation?: SeparatorOptions['orientation']
  decorative?: SeparatorOptions['decorative']
  ref?: (el: HTMLElement) => void
}

export type SeparatorProps<T extends ValidComponent = 'hr'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function hostOf(as: ValidComponent | undefined): SeparatorHost {
  return as === undefined || as === 'hr' ? 'hr' : 'generic'
}

export function Separator<T extends ValidComponent = 'hr'>(props: SeparatorProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'orientation', 'decorative', 'ref')

  const result = createMemo(() =>
    separator({
      host: hostOf(own.as),
      orientation: own.orientation,
      decorative: own.decorative,
    })
  )

  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Dynamic
      component={(own.as ?? 'hr') as ValidComponent}
      ref={ref}
      {...spread(result().parts.root, { ...rest })}
    />
  )
}
