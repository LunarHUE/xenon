import { separator } from '@xenon/core'
import type { SeparatorHost, SeparatorOptions } from '@xenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit } from 'solid-js'

import { spread } from '../spread'

/** Library-owned separator semantics, replacing matching host props. */
interface Own extends Omit<SeparatorOptions, 'host'> {
  /** Receives the rendered separator element through the host ref. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic host props with structural or decorative separator semantics. */
export type SeparatorProps<T extends ValidComponent = 'hr'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Host or forwarding component, defaulting to hr. Other as values receive an explicit role. */
    as?: T
  }

/** Only the literal hr or an omitted as uses native implicit separator semantics. */
function hostOf(as: ValidComponent | undefined): SeparatorHost {
  return as === undefined || as === 'hr' ? 'hr' : 'generic'
}

/**
 * Render a native hr by default, with reactive orientation and decorative state.
 *
 * Other hosts receive explicit separator semantics. Only nondecorative vertical
 * separators emit aria-orientation; data-orientation always carries the axis.
 * Author attributes override generated ones through {@link spread}. Custom
 * components must forward props and ref. Layout and appearance belong to the caller.
 */
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
