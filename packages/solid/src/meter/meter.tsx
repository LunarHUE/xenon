import { meter } from '@xenon-ui/core/meter'
import type { MeterOptions } from '@xenon-ui/core/meter'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createEffect, omit } from 'solid-js'
import { spread } from '../spread'

/** Numeric measurement options owned by the adapter. */
interface Own extends Omit<MeterOptions, 'host'> {
  /** Receives the host for optional author work. Custom hosts must forward refs. */
  ref?: (el: HTMLElement) => void
}
/** Polymorphic read-only measurement props. Supply aria-label or aria-labelledby. */
export type MeterProps<T extends ValidComponent = 'meter'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Native meter by default; other hosts receive role=meter. */
    as?: T
  }
/** Render a bounded measurement and expose the numeric --meter-percentage CSS property. */
export function Meter<T extends ValidComponent = 'meter'>(props: MeterProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent; children?: JSX.Element }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'min',
    'max',
    'format',
    'ref',
    'children'
  )
  const result = createMemo(() =>
    meter({
      value: own.value,
      min: own.min,
      max: own.max,
      format: own.format,
      host: own.as === undefined || own.as === 'meter' ? 'meter' : 'generic',
    })
  )
  let element: HTMLElement | undefined
  createEffect(
    () => result().state.percentage,
    (percentage) => element?.style.setProperty('--meter-percentage', String(percentage))
  )
  return (
    <Dynamic
      component={own.as ?? 'meter'}
      ref={(node: HTMLElement) => {
        element = node
        own.ref?.(node)
      }}
      {...spread(result().parts.root, { ...rest })}
    >
      {own.children}
    </Dynamic>
  )
}
