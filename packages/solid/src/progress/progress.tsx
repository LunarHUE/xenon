import type { NativeBooleanAttributes } from '../internal/host'
import { setRef } from '../internal/host'
import { progress } from '@xenon-ui/core'
import type { ProgressOptions } from '@xenon-ui/core'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createEffect, createMemo, omit } from 'solid-js'

import { spread } from '../spread'

/** Library-owned progress inputs, replacing matching host props. */
interface Own extends ProgressOptions {
  /** Receives the rendered host, which custom components must forward for percentage style updates. */
  ref?: unknown
}

/** Polymorphic host props combined with numeric progress state and formatting. */
export type ProgressProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<Own, 'ref'>> & {
    /** Host or forwarding component, defaulting to div; progressbar semantics remain explicit. */
    as?: T
  }

/**
 * Render reactive progressbar semantics and publish --progress-percentage on the host.
 *
 * @remarks
 * The client effect writes the unrounded numeric percentage without a percent
 * suffix, or removes the custom property when indeterminate. It does not restore
 * a prior value. Supply an accessible name and CSS/children for the visual fill.
 * Remaining host attributes override core attributes through {@link spread}.
 * See {@link progress} for range normalization and zero-width range behavior.
 */
export function Progress<T extends ValidComponent = 'div'>(props: ProgressProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'min', 'max', 'format', 'ref')

  const result = createMemo(() =>
    progress({ value: own.value, min: own.min, max: own.max, format: own.format })
  )

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(() => own.ref, node)
  }

  createEffect(
    () => result().state.percentage,
    (percentage) => {
      if (!el) return
      if (percentage === undefined) el.style.removeProperty('--progress-percentage')
      else el.style.setProperty('--progress-percentage', String(percentage))
    }
  )

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  return <Host ref={ref} {...spread(result().parts.root, { ...rest })} />
}
