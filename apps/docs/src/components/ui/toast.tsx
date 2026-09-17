import { Toast as ToastPrimitive, type ToastViewportProps } from '@xenon/solid/toast'
import type { JSX } from '@solidjs/web'
import { For, omit } from 'solid-js'
import { X } from 'lucide'
import { buttonVariants } from './button'
import { Icon } from './icon'
import { cn } from '../../lib/utils'
import { toast } from '../../lib/toast'

export type ToasterProps = Omit<ToastViewportProps<'div'>, 'as' | 'children' | 'class'> & {
  class?: string
}

/**
 * Renders the shared `toast` manager from `lib/toast`. Mount it once, near the
 * end of the layout. It never renders a wrapper of its own; the stack lives in a
 * portaled region at the bottom-right corner. Limit and duration come from the
 * manager. Stack geometry and motion are in global.css under `[data-slot=toast]`.
 */
export function Toaster(props: ToasterProps): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <ToastPrimitive.Provider manager={toast}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          aria-label="Notifications"
          gap={12}
          {...rest}
          data-slot="toaster"
          class={cn(
            'fixed inset-auto right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-100 m-0 w-[min(24rem,calc(100vw-2rem))] overflow-visible border-0 bg-transparent p-0 text-foreground outline-none',
            props.class
          )}
        >
          <For each={toast.toasts()}>{(item) => <ToastItem toast={item} />}</For>
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

type Record = ReturnType<typeof toast.toasts>[number]

const typeLabel: { [K in Record['type']]: string } = {
  default: 'Note',
  success: 'Done',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  loading: 'Working',
}

/** One notification: type eyebrow, close, title, description, optional action. */
function ToastItem(props: { toast: Record }): JSX.Element {
  return (
    <ToastPrimitive.Content
      toast={props.toast}
      swipeDirection={['right', 'down']}
      data-slot="toast"
      class="border border-foreground bg-background px-5 py-4 font-sans text-sm leading-[22px] text-foreground shadow-[3px_3px_0_var(--color-foreground)]"
    >
      <div class="mb-1.5 flex items-center justify-between gap-4">
        <span
          aria-hidden="true"
          class="font-mono text-[11px] uppercase leading-4 tracking-[0.14em] text-sidebar-primary [[data-type=error]_&]:text-destructive"
        >
          {typeLabel[props.toast.type]}
        </span>
        <ToastPrimitive.Close
          aria-label="Dismiss notification"
          class="-me-2 flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sidebar-primary"
        >
          <Icon icon={X} class="size-4" />
        </ToastPrimitive.Close>
      </div>
      <ToastPrimitive.Title class="font-medium" />
      <ToastPrimitive.Description class="mt-1 text-muted-foreground empty:hidden" />
      {props.toast.action && (
        <ToastPrimitive.Action
          class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-3')}
        />
      )}
    </ToastPrimitive.Content>
  )
}
