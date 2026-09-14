import { progress } from '@tenon/core'
import type { ProgressOptions } from '@tenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createEffect, createMemo, omit } from 'solid-js'

import { spread } from '../spread'

interface Own {
  value?: ProgressOptions['value']
  min?: ProgressOptions['min']
  max?: ProgressOptions['max']
  format?: ProgressOptions['format']
  ref?: (el: HTMLElement) => void
}

export type ProgressProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

export function Progress<T extends ValidComponent = 'div'>(props: ProgressProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'min', 'max', 'format', 'ref')

  const result = createMemo(() =>
    progress({ value: own.value, min: own.min, max: own.max, format: own.format })
  )

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  createEffect(
    () => result().state.percentage,
    (percentage) => {
      if (!el) return
      if (percentage === undefined) el.style.removeProperty('--progress-percentage')
      else el.style.setProperty('--progress-percentage', String(percentage))
    }
  )

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(result().parts.root, { ...rest })}
    />
  )
}
