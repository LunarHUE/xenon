import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import type { ToggleOptions } from '@xenon-ui/core'
import { toggle } from '@xenon-ui/core'
import type { ToggleHost } from '@xenon-ui/core'
import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { gate } from '../internal/gate'
import { spread } from '../spread'

/** Library-owned pressed-state props, replacing matching host props. */
interface Own extends Pick<ToggleOptions, 'pressed' | 'onPressedChange' | 'disabled'> {
  /** Controlled pressed state when defined; undefined uses internal state. */
  pressed?: ToggleOptions['pressed']
  /** Initial uncontrolled pressed state, defaulting to false; later changes are ignored. */
  defaultPressed?: ToggleOptions['pressed']
  /**
   * Reports the next boolean after an accepted toggle. Uncontrolled state is updated
   * first; controlled callers must update pressed. Initialization and canceled or
   * disabled activations do not invoke it.
   */
  onPressedChange?: ToggleOptions['onPressedChange']
  /** Receives the rendered host; custom components must forward the supplied ref. */
  ref?: unknown
}

/** Polymorphic host props with controlled/uncontrolled pressed state; remaining attributes override core defaults. */
export type ToggleProps<T extends ValidComponent = 'button'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  NativeBooleanAttributes<Omit<Own, 'ref'>> & {
    /** Omitted or literal button uses button semantics; literal input uses input-button semantics. Remaining hosts use generic button semantics. */
    as?: T
  }

/** Choose semantics from the as value, without inspecting a custom component's actual DOM tag. */
function hostOf(as: ValidComponent | undefined): ToggleHost {
  if (as === undefined || as === 'button') return 'button'
  if (as === 'input') return 'input'
  return 'generic'
}

/**
 * Render a pressed button with aria-pressed and on/off data-state hooks.
 *
 * @remarks
 * Native button/input hosts retain native activation. Generic hosts synthesize
 * clicks on non-repeated Enter keydown and Space keyup through {@link toggle}.
 * {@link spread} runs author handlers before core behavior and respects cancellation;
 * {@link gate} suppresses selected author activation handlers while disabled.
 * Controlled mode is determined whenever pressed is read, not fixed at mount.
 *
 * No Field inheritance, hidden form mirror, or pressed-state form-reset handling
 * is installed. Custom components must forward props/ref. An anchor with href
 * receives generic button semantics and triggers a development warning after
 * settling; the component does not remove its href or prevent navigation by default.
 */
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

  /** Commit only uncontrolled state, then report the proposal to the current callback. */
  const change = (next: boolean) => {
    if (!untrack(controlled)) setInternal(next)
    own.onPressedChange?.(next)
  }

  const result = createMemo(() =>
    toggle({
      host: hostOf(own.as),
      pressed: current(),
      disabled: booleanAttribute(own.disabled),
      onPressedChange: change,
    })
  )

  /** Gate selected author handlers on a fresh props copy before composing core events. */
  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    // eslint-disable-next-line solid/reactivity -- event handlers, re-applied by spread on change
    gate(out, () => result().state.interactive)
    return out
  }

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(own.ref, node)
  }

  onSettled(() => {
    if (!import.meta.env.DEV) return
    if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
      console.error(
        'Toggle: a link cannot be a toggle. This anchor now reports role="button", which hides its navigation from assistive technology. Use Button with as="a" for a link, or drop the href.'
      )
    }
  })

  const Host = dynamic(() => (own.as ?? 'button') as ValidComponent)
  return <Host ref={ref} {...spread(result().parts.root, merged())} />
}
