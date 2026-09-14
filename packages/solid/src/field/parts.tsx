import type { PartProps } from '@kit/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, createMemo, omit, onSettled, untrack } from 'solid-js'

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
  const own = props as LabelOwn & { id?: string }
  const rest = omit(props as Record<string, unknown>, 'ref', 'children', 'id')
  const content = createMemo(() => props.children)
  const context = useField('Field.Label')
  if (isServer) context.registerLabel(() => own.id ?? context.ids.label)
  onSettled(() => context.registerLabel(() => own.id ?? context.ids.label, previous))

  const part = (): PartProps<'label'> => ({
    attrs: {
      ...fieldFlags(context),
      id: own.id ?? context.ids.label,
      for: context.association('for', context.controlId),
    },
    on: {
      click(event) {
        if (context.disabled()) return
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
    own.ref?.(node)
  }

  // Defer serialization until flat siblings register their author control IDs.
  // Keep the same memo allocation on both sides of hydration.
  const view = () => (
    <Dynamic component="label" ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Dynamic>
  )
  const element = createMemo(() => untrack(view), { lazy: true })
  // eslint-disable-next-line solid/reactivity
  return <>{element}</>
}

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
    own.ref?.(node)
  }

  return (
    <Dynamic
      component={(own.as ?? 'p') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

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
    own.ref?.(node)
  }

  return (
    <Show when={context.invalid()}>
      <Dynamic
        component={(own.as ?? 'p') as ValidComponent}
        ref={ref}
        {...spread(part(), { ...rest })}
      >
        {content()}
      </Dynamic>
    </Show>
  )
}

export function FieldControl<T extends ValidComponent = 'input'>(
  props: FieldControlProps<T>
): JSX.Element {
  const own = props as ControlOwn & {
    id?: string
    as?: ValidComponent
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
    own.ref?.(node)
  }

  const view = () => (
    <Dynamic
      component={(own.as ?? 'input') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
  const element = createMemo(() => untrack(view), { lazy: true })
  // Resolving here would serialize before later sibling descriptions register on the server.
  // eslint-disable-next-line solid/reactivity
  return <>{element}</>
}
