import type { ComponentProps, JSX } from '@solidjs/web'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

/**
 * Frame around a rendered example and the source beneath it. Place an
 * `ExamplePreview` first, then a `CodeBlock` with the `collapsible` prop.
 * The block drops its own border so the frame reads as one surface.
 */
export function Example(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="example"
      class={cn(
        'flex min-w-0 flex-col border border-foreground [&>[data-slot=code-block]]:border-0 [&>[data-slot=code-block]]:border-t [&>[data-slot=code-block]]:border-dashed [&>[data-slot=code-block]]:border-muted-foreground',
        props.class
      )}
    />
  )
}

/** Muted stage that centers the live component. Children keep their own states. */
export function ExamplePreview(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <div
      {...rest}
      data-slot="example-preview"
      class={cn(
        'flex min-h-40 flex-wrap items-center justify-center gap-4 bg-muted p-8 text-foreground',
        props.class
      )}
    />
  )
}
