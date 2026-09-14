import { button } from '@kit/core'
import type { ButtonHost, ButtonOptions } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit, onSettled } from 'solid-js'

import { spread } from '../spread'

interface Own {
  disabled?: ButtonOptions['disabled']
  pending?: ButtonOptions['pending']
  focusableWhenDisabled?: ButtonOptions['focusableWhenDisabled']
  type?: ButtonOptions['type']
  autofocus?: ButtonOptions['autofocus']
  ref?: (el: HTMLElement) => void
}

export type ButtonProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

const gated = [
  'onClick',
  'onAuxClick',
  'onDblClick',
  'onKeyDown',
  'onKeyUp',
  'onPointerDown',
  'onMouseDown',
] as const

function hostOf(as: ValidComponent | undefined, href: unknown): ButtonHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  if (as === 'a' && href != null) return 'link'
  return 'generic'
}

function nativeTag(el: HTMLElement): string | undefined {
  const tag = el.tagName.toLowerCase()
  if (tag === 'button' || tag === 'input') return tag
  if (tag === 'a' && el.hasAttribute('href')) return 'a'
  return undefined
}

export function Button<T extends ValidComponent = 'button'>(props: ButtonProps<T>): JSX.Element {
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'disabled',
    'pending',
    'focusableWhenDisabled',
    'type',
    'autofocus',
    'ref'
  )
  const own = props as Own & { as?: ValidComponent; href?: unknown }
  const result = createMemo(() =>
    button({
      host: hostOf(own.as, own.href),
      disabled: own.disabled,
      pending: own.pending,
      focusableWhenDisabled: own.focusableWhenDisabled,
      type: own.type,
      autofocus: own.autofocus,
    })
  )

  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    const { state } = result()
    for (const name of gated) {
      const user = out[name]
      if (typeof user !== 'function') continue
      // eslint-disable-next-line solid/reactivity -- event handler, re-applied by spread on change
      out[name] = (event: Event) => {
        if (result().state.interactive) (user as (e: Event) => void)(event)
      }
    }
    if (state.host === 'link' && !state.interactive) out.href = undefined
    return out
  }

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  onSettled(() => {
    if (own.autofocus) el?.focus()
    if (!import.meta.env.DEV) return
    if (!el) {
      console.error(
        'Button: the `as` component did not forward its ref, so nothing can attach to it'
      )
      return
    }
    const tag = nativeTag(el)
    if (result().state.host === 'generic' && tag) {
      console.error(
        `Button: the \`as\` component rendered a <${tag}>; pass as="${tag}" so it gets native ${tag} attributes instead of role="button"`
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
