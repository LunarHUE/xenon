import type { JSX } from '@solidjs/web'
import { createSignal, omit, onCleanup } from 'solid-js'
import { Check, Copy, RotateCw } from 'lucide'
import { Button, type ButtonProps } from '../ui/button'
import { Icon, type IconNode } from '../ui/icon'
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

const labels: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', error: 'Retry copy' }
const icons: Record<CopyState, IconNode> = { idle: Copy, copied: Check, error: RotateCw }

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
        <Icon icon={icons[clipboard.state()]} />
      </Button>
      <span role="status" class="sr-only">
        {clipboard.message()}
      </span>
    </>
  )
}
