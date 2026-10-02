import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'

import { createChecked } from '../internal/checked'
import type { CheckedOwn } from '../internal/checked'

/** Shared checked-control props plus checkbox-only mixed presentation. */
interface Own extends CheckedOwn {
  /**
   * Mixed presentation, independent of checked and defaulting to false. Applied
   * to a visible native input's indeterminate property on the client and restored
   * after interaction; custom hosts receive aria-checked=mixed. Activation does
   * not clear this prop, and form mirrors retain ordinary boolean checkedness.
   */
  indeterminate?: boolean
}

/**
 * Polymorphic host props with checkbox state/form behavior from {@link CheckedOwn}.
 * Shared library props replace matching host props; other props target the visible
 * control rather than any hidden form mirror.
 */
export type CheckboxProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  Omit<Own, 'ref'> & {
    /** Host to render, defaulting to input. Literal input/button use native host semantics; custom components must forward props/ref. */
    as?: T
  }

/**
 * Render a checkbox with controlled or uncontrolled checked state and optional mixed presentation.
 *
 * @remarks
 * Defaults to a native checkbox input; checked selects controlled mode and
 * defaultChecked seeds uncontrolled state. {@link createChecked} handles Field
 * inheritance, author-event cancellation, native checked-state resynchronization,
 * and form reset. A defined name on a non-input host creates a clipped native
 * checkbox sibling for submission/validation; the ref still identifies the visible control.
 *
 * Native inputs keep browser keyboard behavior. Button/generic hosts expose
 * checkbox ARIA, activate through click or Space release, and suppress Enter
 * activation. Mixed state is a client DOM property for native inputs, not an SSR
 * attribute. The component works without a Field; custom hosts must forward the
 * supplied props/ref and callers provide an accessible label.
 */
export function Checkbox<T extends ValidComponent = 'input'>(props: CheckboxProps<T>): JSX.Element {
  return createChecked(props, 'checkbox')
}
