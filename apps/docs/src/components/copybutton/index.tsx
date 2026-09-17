import type { JSX } from '@solidjs/web'
import { createSignal, omit, onCleanup } from 'solid-js'
import { Check, Copy, RotateCw } from 'lucide'
import { Button, type ButtonProps } from '../ui/button'
import { Icon, type IconNode } from '../ui/icon'
import { cn } from '../../lib/utils'
import { toast } from '../../lib/toast'

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
    /** Write the text and resolve with the outcome, so callers can react per attempt. */
    async copy(): Promise<Exclude<CopyState, 'idle'>> {
      try {
        await navigator.clipboard.writeText(text())
        settle('copied')
        return 'copied'
      } catch {
        settle('error')
        return 'error'
      }
    },
  }
}

const labels: Record<CopyState, string> = { idle: 'Copy', copied: 'Copied', error: 'Retry copy' }
const icons: Record<CopyState, IconNode> = { idle: Copy, copied: Check, error: RotateCw }

/** One shared record: rapid copies restart it instead of stacking five of them. */
const TOAST_ID = 'clipboard'

function notify(outcome: Exclude<CopyState, 'idle'>): void {
  if (outcome === 'copied') toast.success('Copied to clipboard', { id: TOAST_ID })
  else
    toast.error('Copy failed', {
      id: TOAST_ID,
      description: 'The clipboard is not available here. Select the text and copy it instead.',
    })
}

export type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'children'> &
  CreateCopyOptions & {
    /** Text written to the clipboard on click. */
    text: string
  }

/**
 * Icon button that copies `text`. The icon and accessible name follow the copy
 * state, and each attempt reports its outcome through the shared toast manager,
 * whose region also announces it to assistive technology.
 */
export function CopyButton(props: CopyButtonProps): JSX.Element {
  const rest = omit(props, 'text', 'resetAfter', 'class', 'aria-label')
  const clipboard = createCopy(() => props.text, {
    get resetAfter() {
      return props.resetAfter
    },
  })
  return (
    <Button
      variant="outline"
      size="icon-sm"
      data-slot="copy-button"
      {...rest}
      aria-label={props['aria-label'] ?? labels[clipboard.state()]}
      data-state={clipboard.state()}
      class={cn('data-[state=error]:text-destructive', props.class)}
      onClick={() => void clipboard.copy().then(notify)}
    >
      <Icon icon={icons[clipboard.state()]} />
    </Button>
  )
}
