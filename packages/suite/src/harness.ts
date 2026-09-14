import type { ButtonProps as SolidButtonProps } from '@tenon/solid'
import type { JSX, ValidComponent } from '@solidjs/web'

/** Allows arbitrary test attributes and widens the production polymorphic host type. */
type Loose<P> = Omit<P, 'as'> & {
  /** Host override forwarded to the component under test. */
  as?: ValidComponent
} & Record<string, unknown>

/** Button test inputs with permissive host and extra-attribute typing. */
export type ButtonProps = Loose<SolidButtonProps>

/** Shared test inputs forwarded to checkbox and switch; not their full production prop types. */
interface CheckedProps {
  /** Host override forwarded to the component under test. */
  as?: ValidComponent
  /** Controlled checked input. */
  checked?: boolean
  /** Initial uncontrolled checked input. */
  defaultChecked?: boolean
  /** Receives checked changes requested by the component. */
  onCheckedChange?: (checked: boolean) => void
  /** Disabled input forwarded to the component. */
  disabled?: boolean
  /** Read-only input forwarded to the component. */
  readonly?: boolean
  /** Required input forwarded to the component. */
  required?: boolean
  /** Invalid-state input forwarded to the component. */
  invalid?: boolean
  /** Form field name forwarded to the component. */
  name?: string
  /** Form submission value forwarded to the component. */
  value?: string
  /** Explicit form owner ID forwarded to the component. */
  form?: string
  /** Autofocus input forwarded to the component. */
  autofocus?: boolean
  /** Receives the rendered host element. */
  ref?: (el: HTMLElement) => void
}

/** Permissive checkbox test inputs, including arbitrary host attributes. */
export type CheckboxProps = CheckedProps & {
  /** Indeterminate-state input forwarded to the checkbox. */
  indeterminate?: boolean
} & Record<string, unknown>

/** Permissive switch test inputs, including arbitrary host attributes. */
export type SwitchProps = CheckedProps & Record<string, unknown>

/** Toolbar test inputs; extra keys are accepted without production prop validation. */
export interface ToolbarProps extends Record<string, unknown> {
  /** Host override forwarded to the component under test. */
  as?: ValidComponent
  /** Toolbar navigation orientation input. */
  orientation?: 'horizontal' | 'vertical'
  /** Toolbar text direction input. */
  dir?: 'ltr' | 'rtl'
  /** Whether toolbar navigation wraps at an end. */
  loop?: boolean
  /** Disabled input forwarded to the component. */
  disabled?: boolean
  /** Child content or a zero-argument factory evaluated by the harness. */
  children?: JSX.Element | (() => JSX.Element)
  /** Receives the rendered host element. */
  ref?: (el: HTMLElement) => void
}

/** Loose compound-root test inputs; component-specific props remain unchecked extra keys. */
export type CompoundProps = Record<string, unknown> & {
  /** Host override forwarded to the component under test. */
  as?: ValidComponent
  /** Child content or a zero-argument factory evaluated by the harness. */
  children?: JSX.Element | (() => JSX.Element)
  /** Receives the rendered host element. */
  ref?: (el: HTMLElement) => void
}

/** Supported harness names and their deliberately permissive test input types. */
export interface Components {
  /** Loose inputs for the root that associates controls with field labels and messages. */
  field: CompoundProps
  /** Loose inputs for a standalone pressed-state control. */
  toggle: CompoundProps
  /** Loose inputs for grouped pressed-state selection and navigation. */
  'toggle-group': CompoundProps
  /** Loose inputs for a single-choice group and its keyboard navigation. */
  'radio-group': CompoundProps
  /** Loose inputs for an open-state root coordinating a trigger and content. */
  collapsible: CompoundProps
  /** Loose inputs for the root coordinating expandable items. */
  accordion: CompoundProps
  /** Loose inputs for the root coordinating tab selection and panels. */
  tabs: CompoundProps
  /** Loose inputs for a progress range and its rendered value. */
  progress: CompoundProps
  /** Loose inputs for an oriented visual or semantic separator. */
  separator: CompoundProps
  /** Inputs for a button action with native or custom host behavior. */
  button: ButtonProps
  /** Inputs for a checked control with an optional indeterminate state. */
  checkbox: CheckboxProps
  /** Inputs for a binary checked control with switch semantics. */
  switch: SwitchProps
  /** Inputs for a toolbar root coordinating item focus and navigation. */
  toolbar: ToolbarProps
}

/** Component names accepted by the test harness. */
export type ComponentName = keyof Components

/** A mounted test fixture; stop updating it after unmounting. */
export interface Mounted<P> {
  /** Wrapper containing the rendered component, initially appended to document.body. */
  container: HTMLElement
  /** Shallow-merges inputs and flushes Solid updates; omitted keys retain their previous values. */
  setProps(next: Partial<P>): void
  /** Disposes the render and removes its wrapper; repeated calls do nothing. */
  unmount(): void
  /**
   * Flushes Solid, yields a microtask, waits two animation frames, then yields another microtask.
   * Requires animation frames to advance; does not wait for all timers or asynchronous work.
   */
  settle(): Promise<void>
}

/** Adapter used by component tests to create disposable fixtures. */
export interface Harness {
  /** Mounts a supported component from a shallow copy of its initial inputs. */
  mount<N extends ComponentName>(name: N, props: Components[N]): Mounted<Components[N]>
}
