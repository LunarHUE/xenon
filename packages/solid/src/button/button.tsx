import { button } from '@tenon/core'
import type { ButtonHost, ButtonOptions } from '@tenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit, onSettled } from 'solid-js'

import { gate } from '../internal/gate'
import { spread } from '../spread'

/** Library-owned button props, replacing matching inherited host props. */
interface Own {
  /** Blocks core activation and gated author handlers; defaults to false. See {@link ButtonOptions.disabled}. */
  disabled?: ButtonOptions['disabled']
  /** Blocks activation while retaining normal focusability; defaults to false. See {@link ButtonOptions.pending}. */
  pending?: ButtonOptions['pending']
  /** Retains disabled native/generic tab stops, defaulting to false. Link focusability follows href removal. */
  focusableWhenDisabled?: ButtonOptions['focusableWhenDisabled']
  /** Native button/input type, defaulting to 'button'; ignored for link/generic semantics. */
  type?: ButtonOptions['type']
  /** Emits autofocus and requests focus through the forwarded ref after settling when true. */
  autofocus?: ButtonOptions['autofocus']
  /** Receives the rendered element. A custom component must forward this ref to its actual host. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic host props with library-owned button behavior; see {@link ButtonOptions} for core semantics. */
export type ButtonProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Rendered host, defaulting to button. Custom components use generic semantics and must forward props/ref. */
    as?: T
  }

/** Selects native semantics only for literal hosts; anchors require a non-null href to count as links. */
function hostOf(as: ValidComponent | undefined, href: unknown): ButtonHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  if (as === 'a' && href != null) return 'link'
  return 'generic'
}

/** Recognizes native button/input/link DOM for development warnings about misclassified custom hosts. */
function nativeTag(el: HTMLElement): string | undefined {
  const tag = el.tagName.toLowerCase()
  if (tag === 'button' || tag === 'input') return tag
  if (tag === 'a' && el.hasAttribute('href')) return 'a'
  return undefined
}

/**
 * Renders a reactive button using the selected host and {@link button} behavior.
 *
 * @remarks
 * Remaining host props pass through {@link spread}: author attributes win and
 * author handlers run before core handlers, with preventDefault canceling core
 * behavior. {@link gate} suppresses selected author activation handlers while
 * disabled or pending, while nonactivation keyboard handlers remain available.
 * Noninteractive links lose href. Generic hosts synthesize Enter/Space clicks.
 * Custom components must forward the supplied props and ref; development checks
 * report missing refs or native hosts rendered under generic semantics.
 */
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

  /** Rebuilds passthrough props with activation gates and removes navigation from noninteractive links. */
  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    const { state } = result()
    // eslint-disable-next-line solid/reactivity -- event handlers, re-applied by spread on change
    gate(out, () => result().state.interactive)
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
