import {
  Button as ButtonPrimitive,
  type ButtonProps as PrimitiveProps,
} from '@xenon-ui/solid/button'
import type { JSX, ValidComponent } from '@solidjs/web'
import { cva, type VariantProps } from 'class-variance-authority'
import { Show, omit } from 'solid-js'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent, type TooltipHandle } from './tooltip'

const raisedInteraction = [
  '[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:shadow-[3px_3px_0_var(--color-foreground)]',
  'motion-safe:[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:-translate-0.5',
  '[&:not([data-disabled]):not([data-pending]):active]:translate-0 [&:not([data-disabled]):not([data-pending]):active]:shadow-none',
]

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none border border-foreground font-sans text-sm font-normal leading-[22px]',
    'outline-offset-[3px] focus-visible:outline-2 focus-visible:outline-sidebar-primary focus-visible:shadow-none',
    'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:shadow-none',
    'data-pending:cursor-wait data-pending:shadow-none',
    'data-disabled:focus-visible:opacity-100 data-disabled:focus-visible:text-muted-foreground',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-[18px]',
  ],
  {
    variants: {
      variant: {
        default: ['bg-foreground text-background', ...raisedInteraction],
        outline: ['bg-background text-foreground', ...raisedInteraction],
        navigation: [
          'w-full justify-start gap-3 border-transparent bg-transparent text-start text-muted-foreground',
          '[&:not([data-disabled]):not([data-pending]):hover]:bg-accent [&:not([data-disabled]):not([data-pending]):active]:border-foreground',
          'aria-[current=page]:border-sidebar-primary aria-[current=page]:bg-sidebar-selected aria-[current=page]:font-medium aria-[current=page]:text-sidebar-primary',
          'group-data-[mode=compact]/sidebar:justify-center group-data-[mode=compact]/sidebar:px-0',
        ],
      },
      size: {
        default: 'min-h-11 px-[18px] py-[10px]',
        sm: 'min-h-8 px-3 py-1',
        lg: 'min-h-12 px-6 py-3',
        icon: 'size-11 p-0',
        'icon-sm': 'size-8 p-0',
        'icon-lg': 'size-12 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

type Variants = VariantProps<typeof buttonVariants>

export type ButtonProps<T extends ValidComponent = 'button'> = Omit<
  PrimitiveProps<T>,
  keyof Variants | 'class' | 'tooltip' | 'tooltipHandle'
> &
  Variants & {
    class?: string
    /** Descriptive content. Does not replace the button's accessible name. */
    tooltip?: JSX.Element
    /** Stable handle for a caller-owned Tooltip root and viewport. */
    tooltipHandle?: TooltipHandle<JSX.Element>
  }

export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const rest = omit(props, 'as', 'variant', 'size', 'class', 'tooltip', 'tooltipHandle')
  const className = () =>
    cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)

  // Keep the literal host on ButtonPrimitive so anchors retain link semantics.
  const Control = (control: Omit<PrimitiveProps<T>, 'as'>): JSX.Element => {
    // Tooltip display can be disabled while the button remains interactive.
    // Let ButtonPrimitive derive this marker from its own disabled prop.
    const button = omit(
      control as PrimitiveProps<T> & { 'data-disabled'?: string },
      'data-disabled'
    )
    return <ButtonPrimitive<T> {...(button as PrimitiveProps<T>)} as={props.as} />
  }
  const trigger = () => (
    <TooltipTrigger
      {...(rest as unknown as Omit<PrimitiveProps<T>, 'as'>)}
      as={Control}
      class={className()}
      handle={props.tooltipHandle}
      payload={props.tooltip}
    />
  )

  return (
    <Show
      when={props.tooltipHandle != null || (props.tooltip != null && props.tooltip !== false)}
      fallback={
        <ButtonPrimitive<T>
          data-slot="button"
          {...(rest as PrimitiveProps<T>)}
          as={props.as}
          class={className()}
        />
      }
    >
      <Show
        when={props.tooltipHandle}
        fallback={
          <Tooltip>
            {trigger()}
            <TooltipContent>{props.tooltip}</TooltipContent>
          </Tooltip>
        }
      >
        {trigger()}
      </Show>
    </Show>
  )
}
