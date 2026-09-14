import type { PartProps } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, omit, onSettled, untrack } from 'solid-js'

import { fieldDescribedBy, fieldFlags, fieldLabelledBy, isLabelable, useField } from './context'
import { spread } from '../spread'

interface LabelOwn {
  ref?: (el: HTMLLabelElement) => void
}

interface TextOwn {
  ref?: (el: HTMLElement) => void
}

interface ControlOwn {
  disabled?: boolean
  required?: boolean
  readonly?: boolean
  invalid?: boolean
  name?: string
  ref?: (el: HTMLElement) => void
}

export type FieldLabelProps = Omit<ComponentProps<'label'>, keyof LabelOwn> & LabelOwn

export type FieldDescriptionProps<T extends ValidComponent = 'p'> = Omit<
  ComponentProps<T>,
  keyof TextOwn | 'as'
> &
  TextOwn & { as?: T }

export type FieldErrorProps<T extends ValidComponent = 'p'> = FieldDescriptionProps<T>

export type FieldControlProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  keyof ControlOwn | 'as'
> &
  ControlOwn & { as?: T }

const nameable = new Set(['input', 'select', 'textarea'])
const disablable = new Set(['button', 'input', 'select', 'textarea'])
const readable = new Set(['input', 'textarea'])

export function FieldLabel(props: FieldLabelProps): JSX.Element {
  const own = props as LabelOwn
  const rest = omit(props as Record<string, unknown>, 'ref')
  const context = useField('Field.Label')

  const part = (): PartProps<'label'> => ({
    attrs: { ...fieldFlags(context), id: context.ids.label, for: context.ids.control },
    on: {
      click(event) {
        if (context.disabled()) return
        const control = event.currentTarget.ownerDocument.getElementById(context.ids.control)
        if (!control || 'labels' in control) return
        control.focus()
      },
    },
  })

  const ref = (node: HTMLLabelElement) => own.ref?.(node)

  return <label ref={ref} {...spread(part(), { ...rest })} />
}

export function FieldDescription<T extends ValidComponent = 'p'>(
  props: FieldDescriptionProps<T>
): JSX.Element {
  const own = props as TextOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  const context = useField('Field.Description')

  const id = untrack(() => own.id) ?? context.ids.description
  onSettled(() => context.registerDescription(id))

  const part = (): PartProps<'p'> => ({ attrs: { ...fieldFlags(context), id }, on: {} })
  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Dynamic
      component={(own.as ?? 'p') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    />
  )
}

export function FieldError<T extends ValidComponent = 'p'>(props: FieldErrorProps<T>): JSX.Element {
  const own = props as TextOwn & { as?: ValidComponent; id?: string }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  const context = useField('Field.Error')

  const id = untrack(() => own.id) ?? context.ids.error
  onSettled(() => context.registerError(id))

  const part = (): PartProps<'p'> => ({
    attrs: { ...fieldFlags(context), id, role: 'alert' },
    on: {},
  })
  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Show when={context.invalid()}>
      <Dynamic
        component={(own.as ?? 'p') as ValidComponent}
        ref={ref}
        {...spread(part(), { ...rest })}
      />
    </Show>
  )
}

export function FieldControl<T extends ValidComponent = 'input'>(
  props: FieldControlProps<T>
): JSX.Element {
  const own = props as ControlOwn & {
    as?: ValidComponent
    'aria-labelledby'?: string
    'aria-describedby'?: string
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'disabled',
    'required',
    'readonly',
    'invalid',
    'name',
    'ref',
    'aria-labelledby',
    'aria-describedby'
  )
  const context = useField('Field.Control')

  const tag = () => {
    const as = own.as ?? 'input'
    return typeof as === 'string' ? as : ''
  }
  const disabled = () => (own.disabled ?? false) || context.disabled()
  const required = () => (own.required ?? false) || context.required()
  const readonly = () => (own.readonly ?? false) || context.readonly()
  const invalid = () => (own.invalid ?? false) || context.invalid()

  const part = (): PartProps<'input'> => ({
    attrs: {
      'data-disabled': disabled() ? '' : undefined,
      'data-required': required() ? '' : undefined,
      'data-readonly': readonly() ? '' : undefined,
      'data-invalid': invalid() ? '' : undefined,
      id: context.ids.control,
      'aria-labelledby': fieldLabelledBy(context, own['aria-labelledby'], isLabelable(tag())),
      'aria-describedby': fieldDescribedBy(context, own['aria-describedby']),
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

  const ref = (node: HTMLElement) => own.ref?.(node)

  return (
    <Dynamic
      component={(own.as ?? 'input') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    />
  )
}
