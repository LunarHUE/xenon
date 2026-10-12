import type { PartProps } from '@xenon-ui/core'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, createMemo, omit, onSettled, untrack } from 'solid-js'

import { booleanAttribute, setRef } from '../internal/host'
import { fieldDescribedBy, fieldFlags, fieldLabelledBy, isLabelable, useField } from './context'
import { spread } from '../spread'

/** Owned ref contract for the native label host. */
interface LabelOwn {
  /** Receives the label once per distinct element. */
  ref?: unknown
}

/** Shared ref contract for polymorphic descriptive text. */
interface TextOwn {
  /** Receives the rendered text host once per distinct element; custom hosts must forward it. */
  ref?: unknown
}

/** Owned control props merged with the enclosing Field state. */
interface ControlOwn {
  /** OR-combined with Field disabled. Native supported hosts receive disabled; other hosts receive aria-disabled only. */
  disabled?: JSX.BooleanAttribute
  /** OR-combined with Field required. Input/select/textarea receive required; other hosts receive aria-required. */
  required?: JSX.BooleanAttribute
  /** OR-combined with Field readonly. Input/textarea receive readonly; other hosts receive aria-readonly. */
  readonly?: JSX.BooleanAttribute
  /** OR-combined with Field invalid and exposed as ARIA/data state; does not perform validation. */
  invalid?: boolean
  /** Overrides Field name for input/select/textarea. Other hosts receive no generated name or form mirror. */
  name?: string
  /** Receives the rendered control once per distinct element; custom hosts must forward it. */
  ref?: unknown
}

/** Native label props; author id overrides the fallback and author for overrides the generated association. */
export type FieldLabelProps = Omit<ComponentProps<'label'>, Exclude<keyof LabelOwn, 'ref'>> &
  LabelOwn

/** Polymorphic text props; author id overrides the shared description fallback. */
export type FieldDescriptionProps<T extends ValidComponent = 'p'> = Omit<
  ComponentProps<T>,
  Exclude<keyof TextOwn, 'ref'> | 'as'
> &
  Omit<TextOwn, 'ref'> & {
    /** Text host, defaulting to p; custom hosts must forward association props and refs. */
    as?: T
  }

/** Same host/ref props as {@link FieldDescriptionProps}, with the error ID fallback and invalid-only rendering. */
export type FieldErrorProps<T extends ValidComponent = 'p'> = FieldDescriptionProps<T>

/** Polymorphic control props with shared state and registered Field associations. */
export type FieldControlProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  Exclude<keyof ControlOwn, 'ref'> | 'as'
> &
  Omit<ControlOwn, 'ref'> & {
    /** Control host, defaulting to input. Native capabilities are inferred only from literal tag strings. */
    as?: T
  }

/** Literal hosts receiving generated form name and native required attributes. */
const nameable = new Set(['input', 'select', 'textarea'])
/** Literal hosts receiving native disabled instead of ARIA-only state. */
const disablable = new Set(['button', 'input', 'select', 'textarea'])
/** Literal hosts receiving native readonly instead of aria-readonly. */
const readable = new Set(['input', 'textarea'])

/**
 * Renders a label and registers its ID with the enclosing Field. For controls
 * without a native labels property, uncanceled clicks focus the registered control
 * unless the Field is disabled. Native label behavior is otherwise preserved.
 * Author for overrides the rendered association but not the fallback click target.
 * @throws If rendered outside a Field.
 */
export function FieldLabel(props: FieldLabelProps): JSX.Element {
  const own = props as LabelOwn & { id?: string }
  const rest = omit(props as Record<string, unknown>, 'ref', 'children', 'id')
  const content = createMemo(() => props.children)
  const context = useField('Field.Label')
  if (isServer) context.registerLabel(() => own.id ?? context.ids.label)
  onSettled(() => context.registerLabel(() => own.id ?? context.ids.label, previous))

  const part = (): PartProps<'label'> => ({
    attrs: {
      ...fieldFlags(context),
      'data-part': 'label',
      id: own.id ?? context.ids.label,
      for: context.association('for', context.controlId),
    },
    on: {
      click(event) {
        if (context.disabled()) return
        const label = event.currentTarget
        const target = event.target
        // Native labels do not activate their control through interactive descendants.
        if (label.control && target instanceof label.ownerDocument.defaultView!.Element) {
          const interactive = target.closest(
            'a[href],button,input,select,textarea,summary,details,audio[controls],video[controls],iframe,embed,img[usemap],object[usemap]'
          )
          if (interactive && label.contains(interactive)) return
        }
        if (label.control && context.activateLabel?.(label.control, event)) return
        const control = event.currentTarget.ownerDocument.getElementById(context.controlId())
        if (!control || 'labels' in control) return
        control.focus()
      },
    },
  })

  let previous: HTMLLabelElement | undefined
  const ref = (node: HTMLLabelElement) => {
    if (previous === node) return
    previous = node
    setRef(own.ref, node)
  }

  const Host = dynamic(() => 'label')
  // Defer serialization until flat siblings register their author control IDs.
  // Keep the same memo allocation on both sides of hydration.
  const view = () => (
    <Host ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Host>
  )
  const element = createMemo(() => untrack(view), { lazy: true })
  // eslint-disable-next-line solid/reactivity
  return <>{element}</>
}

/**
 * Renders and registers descriptive text for the enclosing Field. Its ID joins
 * control aria-describedby while this component is registered. Author attributes
 * pass through; assign distinct IDs to multiple descriptions.
 * @throws If rendered outside a Field.
 */
export function FieldDescription<T extends ValidComponent = 'p'>(
  props: FieldDescriptionProps<T>
): JSX.Element {
  const own = props as TextOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children', 'id')
  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  const context = useField('Field.Description')

  const id = () => own.id ?? context.ids.description
  if (isServer) context.registerDescription(id)
  onSettled(() => context.registerDescription(id, previous))

  const part = (): PartProps<'p'> => ({ attrs: { ...fieldFlags(context), id: id() }, on: {} })
  let previous: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    if (previous === node) return
    previous = node
    setRef(own.ref, node)
  }

  const Host = dynamic(() => (own.as ?? 'p') as ValidComponent)
  return (
    <Host ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Host>
  )
}

/**
 * Registers an error ID and renders an alert only while the enclosing Field is
 * invalid. Registration persists while its conditional host is absent; the Field
 * includes error references only while invalid. An author role can override alert.
 * @throws If rendered outside a Field.
 */
export function FieldError<T extends ValidComponent = 'p'>(props: FieldErrorProps<T>): JSX.Element {
  const own = props as TextOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children', 'id')
  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  const context = useField('Field.Error')

  const id = () => own.id ?? context.ids.error
  if (isServer) context.registerError(id)
  onSettled(() => context.registerError(id, previous))

  const part = (): PartProps<'p'> => ({
    attrs: { ...fieldFlags(context), id: id(), role: 'alert' },
    on: {},
  })
  let previous: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    if (previous === node) return
    previous = node
    setRef(own.ref, node)
  }

  const Host = dynamic(() => (own.as ?? 'p') as ValidComponent)
  return (
    <Show when={context.invalid()}>
      <Host ref={ref} {...spread(part(), { ...rest })}>
        {content()}
      </Host>
    </Show>
  )
}

/**
 * Renders a control with its Field's IDs, associations, and OR-combined state flags.
 *
 * @remarks
 * Author id overrides the generated control ID. Author naming/describing IDs are
 * combined with Field associations; remaining props use {@link spread} precedence.
 * Native capabilities are chosen from the literal as tag, not a custom component's
 * output. ARIA-only disabled/readonly states do not block events or edits; provide
 * behavior in a custom host. This component adds no form mirror or state tracking.
 * Labelable hosts use native label association; other hosts use label IDs for ARIA.
 * Server association serialization waits for sibling registration for literal hosts;
 * custom components receive associations read directly at their render time.
 * @throws If rendered outside a Field.
 */
export function FieldControl<T extends ValidComponent = 'input'>(
  props: FieldControlProps<T>
): JSX.Element {
  const own = props as ControlOwn & {
    id?: string
    as?: ValidComponent
    autofocus?: JSX.BooleanAttribute
    'aria-labelledby'?: string
    'aria-describedby'?: string
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'id',
    'disabled',
    'required',
    'readonly',
    'invalid',
    'name',
    'ref',
    'aria-labelledby',
    'aria-describedby'
  )
  const content = createMemo(() => (props as { children?: JSX.Element }).children)
  const context = useField('Field.Control')

  if (isServer) context.registerControl(() => own.id ?? context.ids.control)
  onSettled(() => context.registerControl(() => own.id ?? context.ids.control))

  const tag = () => {
    const as = own.as ?? 'input'
    return typeof as === 'string' ? as : ''
  }
  const disabled = () => booleanAttribute(own.disabled) || context.disabled()
  const required = () => booleanAttribute(own.required) || context.required()
  const readonly = () => booleanAttribute(own.readonly) || context.readonly()
  const invalid = () => (own.invalid ?? false) || context.invalid()

  const part = (): PartProps<'input'> => ({
    attrs: {
      'data-disabled': disabled() ? '' : undefined,
      'data-required': required() ? '' : undefined,
      'data-readonly': readonly() ? '' : undefined,
      'data-invalid': invalid() ? '' : undefined,
      id: own.id ?? context.ids.control,
      'aria-labelledby': fieldLabelledBy(
        context,
        own['aria-labelledby'],
        isLabelable(tag()),
        typeof own.as !== 'function'
      ),
      'aria-describedby': fieldDescribedBy(
        context,
        own['aria-describedby'],
        typeof own.as !== 'function'
      ),
      'aria-invalid': invalid() ? 'true' : undefined,
      ...(nameable.has(tag()) ? { name: own.name ?? context.name() } : null),
      ...(disablable.has(tag())
        ? { disabled: disabled() || undefined }
        : { 'aria-disabled': disabled() ? 'true' : undefined }),
      ...(nameable.has(tag())
        ? { required: required() || undefined }
        : { 'aria-required': required() ? 'true' : undefined }),
      ...(readable.has(tag())
        ? { readonly: readonly() || undefined }
        : { 'aria-readonly': readonly() ? 'true' : undefined }),
    },
    on: {},
  })

  let previous: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    if (previous === node) return
    previous = node
    setRef(own.ref, node)
  }

  onSettled(() => {
    if (booleanAttribute(own.autofocus)) previous?.focus()
  })

  const Host = dynamic(() => (own.as ?? 'input') as ValidComponent)
  const view = () => (
    <Host ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Host>
  )
  const element = createMemo(() => untrack(view), { lazy: true })
  // Resolving here would serialize before later sibling descriptions register on the server.
  // eslint-disable-next-line solid/reactivity
  return <>{element}</>
}
