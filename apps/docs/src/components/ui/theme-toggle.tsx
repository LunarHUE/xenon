import type { JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { Moon, Sun } from 'lucide'
import { Button, type ButtonProps } from './button'
import { Icon } from './icon'
import { cn } from '../../lib/utils'
import { toggleTheme } from '../../lib/theme'

/**
 * Light and dark switch. Both icons are in the markup and CSS shows the one for
 * the document's current theme, so the server-rendered button is right before
 * hydration and never flashes.
 */
export function ThemeToggle<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const rest = omit(props, 'class')
  return (
    <Button<T>
      variant="outline"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      {...(rest as ButtonProps<T>)}
      data-slot="theme-toggle"
      class={cn(props.class)}
    >
      <Icon icon={Sun} class="[:root[data-theme=dark]_&]:hidden" />
      <Icon icon={Moon} class="[:root[data-theme=light]_&]:hidden" />
    </Button>
  )
}
