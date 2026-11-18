import type { IconNode } from 'lucide'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX } from '@solidjs/web'
import { For, omit } from 'solid-js'
import { cn } from '../../lib/utils'

export type { IconNode }

export interface IconProps extends ComponentProps<'svg'> {
  /** Icon data from the framework-free `lucide` package. */
  icon: IconNode
  /** Stroke width in viewBox units. Default 1.5 to match the docs artboards. */
  strokeWidth?: number
}

/**
 * Render a lucide icon node. Decorative by default; pass `aria-label` and drop
 * `aria-hidden` when the icon carries meaning on its own.
 */
export function Icon(props: IconProps): JSX.Element {
  const rest = omit(props, 'icon', 'strokeWidth', 'class')
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      {...rest}
      stroke-width={props.strokeWidth ?? 1.5}
      data-slot="icon"
      class={cn('lucide', props.class)}
    >
      <For each={props.icon}>
        {([tag, attrs]) => {
          const Shape = dynamic(() => tag)
          return <Shape {...attrs} />
        }}
      </For>
    </svg>
  )
}
