import type { JSX } from '@solidjs/web'
import { createSignal, omit, onCleanup } from 'solid-js'
import { Button, type ButtonProps } from '../ui/button'
import { cn } from '../../lib/utils'

export type CopyState = 'idle' | 'copied' | 'error'

export interface CreateCopyOptions {
  /** Milliseconds before a copied or failed state returns to idle. Default 2000. */
  resetAfter?: number
}

/** Clipboard state for a single piece of text. Returns to idle after `resetAfter`. */
export function createCopy(text: () => string, options: CreateCopyOptions = {}) {
  const [state, setState] = createSignal<CopyState>('idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  const settle = (next: CopyState) => {
    setState(next)
    clearTimeout(timer)
    timer = setTimeout(() => setState('idle'), options.resetAfter ?? 2000)
  }
  onCleanup(() => clearTimeout(timer))
  return {
    state,
    message: () => ({ idle: '', copied: 'Copied', error: 'Copy failed' })[state()],
    async copy() {
      try {
        await navigator.clipboard.writeText(text())
        settle('copied')
      } catch {
        settle('error')
      }
    },
  }
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" />
      <path d="M15 9V5H4v11h5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

function RetryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      aria-hidden="true"
    >
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </svg>
  )
}

const labels: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', error: 'Retry copy' }
const icons: Record<CopyState, () => JSX.Element> = {
  idle: CopyIcon,
  copied: CheckIcon,
  error: RetryIcon,
}

export type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'children'> &
  CreateCopyOptions & {
    /** Text written to the clipboard on click. */
    text: string
  }

/**
 * Icon button that copies `text`. The icon and accessible name follow the copy state,
 * and a status region announces success or failure without moving focus.
 */
export function CopyButton(props: CopyButtonProps): JSX.Element {
  const rest = omit(props, 'text', 'resetAfter', 'class', 'aria-label')
  const clipboard = createCopy(() => props.text, {
    get resetAfter() {
      return props.resetAfter
    },
  })
  return (
    <>
      <Button
        variant="outline"
        size="icon-sm"
        data-slot="copy-button"
        {...rest}
        aria-label={props['aria-label'] ?? labels[clipboard.state()]}
        data-state={clipboard.state()}
        class={cn('data-[state=error]:text-destructive', props.class)}
        onClick={() => void clipboard.copy()}
      >
        {icons[clipboard.state()]()}
      </Button>
      <span role="status" class="sr-only">
        {clipboard.message()}
      </span>
    </>
  )
}
