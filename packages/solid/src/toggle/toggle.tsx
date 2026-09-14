import { toggle } from '@kit/core'
import type { ToggleHost } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { gate } from '../internal/gate'
import { spread } from '../spread'

interface Own {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

export type ToggleProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function hostOf(as: ValidComponent | undefined): ToggleHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  return 'generic'
}

export function Toggle<T extends ValidComponent = 'button'>(props: ToggleProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'pressed',
    'defaultPressed',
    'onPressedChange',
    'disabled',
    'ref'
  )

  const [internal, setInternal] = createSignal(untrack(() => own.defaultPressed ?? false))
  const controlled = () => own.pressed !== undefined
  const current = () => own.pressed ?? internal()

  const change = (next: boolean) => {
    if (!untrack(controlled)) setInternal(next)
    own.onPressedChange?.(next)
  }

  const result = createMemo(() =>
    toggle({
      host: hostOf(own.as),
      pressed: current(),
      disabled: own.disabled,
      onPressedChange: change,
    })
  )

  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    // eslint-disable-next-line solid/reactivity -- event handlers, re-applied by spread on change
    gate(out, () => result().state.interactive)
    return out
  }

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  onSettled(() => {
    if (!import.meta.env.DEV) return
    if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
      console.error(
        'Toggle: a link cannot be a toggle. This anchor now reports role="button", which hides its navigation from assistive technology. Use Button with as="a" for a link, or drop the href.'
      )
    }
  })

  return (
    <Dynamic
      component={(own.as ?? 'button') as ValidComponent}
      ref={ref}
      {...spread(result().parts.root, merged())}
    />
  )
}
