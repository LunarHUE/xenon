import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'

import { createChecked } from '../internal/checked'
import type { CheckedOwn } from '../internal/checked'

/**
 * Polymorphic host props with checked state, Field inheritance, and form behavior
 * from {@link CheckedOwn}. Remaining props apply to the visible switch, not its form mirror.
 */
export type SwitchProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  Exclude<keyof CheckedOwn, 'ref'> | 'as'
> &
  Omit<CheckedOwn, 'ref'> & {
    /** Host to render, defaulting to input. Only literal input/button choose native semantics; custom components must forward props/ref. */
    as?: T
  }

/**
 * Render a boolean switch, defaulting to a native checkbox input with role=switch.
 *
 * @remarks
 * Uses {@link createChecked} for controlled checked or uncontrolled defaultChecked
 * state, author-event cancellation, Field inheritance, resynchronization, and form
 * reset. A defined name on a non-input host adds a clipped native checkbox sibling
 * for forms. The mirror has no switch role, and the ref receives the visible host.
 *
 * Native inputs retain browser Space handling; Enter requests owning-form
 * submission without toggling. Button/generic hosts expose
 * switch role and boolean aria-checked; click or Space release changes state,
 * while Enter activation is suppressed. There is no mixed/indeterminate switch
 * state. No Field is required; callers supply an accessible name and custom
 * components forward the provided props/ref.
 */
export function Switch<T extends ValidComponent = 'input'>(props: SwitchProps<T>): JSX.Element {
  return createChecked(props, 'switch')
}
