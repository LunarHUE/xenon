import { Button as ButtonPrimitive, type ButtonProps as PrimitiveProps } from '@xenon/solid/button'
import type { JSX, ValidComponent } from '@solidjs/web'
import { cva, type VariantProps } from 'class-variance-authority'
import { omit } from 'solid-js'
import { cn } from '../../lib/utils'

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none border border-foreground font-sans text-sm font-normal leading-[22px]',
    'outline-offset-[3px] focus-visible:outline-2 focus-visible:outline-sidebar-primary focus-visible:shadow-none',
    '[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:shadow-[3px_3px_0_var(--color-foreground)]',
    'motion-safe:[&:not([data-disabled]):not([data-pending]):hover:not(:active)]:-translate-0.5',
    '[&:not([data-disabled]):not([data-pending]):active]:translate-0 [&:not([data-disabled]):not([data-pending]):active]:shadow-none',
    'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:shadow-none',
    'data-pending:cursor-wait data-pending:shadow-none',
    'data-disabled:focus-visible:opacity-100 data-disabled:focus-visible:text-muted-foreground',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-[18px]',
  ],
  {
    variants: {
      variant: {
        default: 'bg-foreground text-background',
        outline: 'bg-background text-foreground',
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
  keyof Variants | 'class'
> &
  Variants & { class?: string }

export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const rest = omit(props, 'variant', 'size', 'class')

  return (
    <ButtonPrimitive<T>
      {...(rest as PrimitiveProps<T>)}
      data-slot="button"
      class={cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)}
    />
  )
}
