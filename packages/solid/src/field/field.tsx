import { field } from '@kit/core'
import type { PartProps } from '@kit/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, untrack } from 'solid-js'

import { FieldContext, tokens } from './context'
import type { FieldContextValue } from './context'
import { FieldControl, FieldDescription, FieldError, FieldLabel } from './parts'
import { spread } from '../spread'

interface Own {
  id?: string
  disabled?: boolean
  required?: boolean
  readonly?: boolean
  invalid?: boolean
  name?: string
  ref?: (el: HTMLElement) => void
}

export type FieldProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

interface Entry {
  id: string | (() => string)
  element?: HTMLElement
}

function registry(): [() => Entry[], (id: Entry['id'], element?: HTMLElement) => () => void] {
  const [entries, setEntries] = createSignal<Entry[]>([], { ownedWrite: true })
  let current: Entry[] = []
  const add = (id: Entry['id'], element?: HTMLElement) => {
    const entry = { id, element }
    current = [...current, entry]
    current.sort((a, b) => {
      if (!a.element || !b.element) return 0
      return a.element.compareDocumentPosition(b.element) & 4 ? -1 : 1
    })
    if (!isServer) setEntries(current)
    return () => {
      current = current.filter((other) => other !== entry)
      if (!isServer) setEntries(current)
    }
  }
  return [isServer ? () => current : entries, add]
}

function entryId(entry: Entry): string {
  return typeof entry.id === 'function' ? entry.id() : entry.id
}

function FieldRoot<T extends ValidComponent = 'div'>(props: FieldProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'id',
    'disabled',
    'required',
    'readonly',
    'invalid',
    'name',
    'ref',
    'children'
  )

  const base = untrack(() => own.id) ?? createUniqueId()
  const ids = {
    control: `${base}-control`,
    label: `${base}-label`,
    description: `${base}-description`,
    error: `${base}-error`,
  }

  const [labels, registerLabel] = registry()
  const [controls, registerControl] = registry()
  const [descriptions, registerDescription] = registry()
  const [errors, registerError] = registry()
  const described = () => tokens(...descriptions().map(entryId))
  const errored = () => tokens(...errors().map(entryId))

  const compute = () =>
    field({
      ids: { ...ids, description: described(), error: errored() },
      disabled: own.disabled,
      required: own.required,
      readonly: own.readonly,
      invalid: own.invalid,
      name: own.name,
      hasDescription: described() !== undefined,
      hasError: errored() !== undefined,
    })
  const memo = createMemo(compute)
  const result = isServer ? compute : memo

  const context: FieldContextValue = {
    ids,
    disabled: () => result().state.disabled,
    required: () => result().state.required,
    readonly: () => result().state.readonly,
    invalid: () => result().state.invalid,
    name: () => result().state.name,
    labelledBy: () => result().parts.control.attrs['aria-labelledby'],
    describedBy: () => result().parts.control.attrs['aria-describedby'],
    labelIds: () => tokens(...labels().map(entryId)),
    registerLabel,
    controlId: () => (controls().length ? entryId(controls().at(-1)!) : ids.control),
    registerControl,
    registerDescription,
    registerError,
  }

  const content = createMemo(() => (
    <FieldContext value={context}>{(props as { children?: JSX.Element }).children}</FieldContext>
  ))

  const part = (): PartProps<'fieldset'> => {
    const { attrs } = result().parts.root
    if (own.as !== 'fieldset') return { attrs, on: {} }
    return {
      attrs: { ...attrs, role: undefined, disabled: result().state.disabled || undefined },
      on: {},
    }
  }

  let previous: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    if (previous === node) return
    previous = node
    own.ref?.(node)
  }

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

export const Field = Object.assign(FieldRoot, {
  Label: FieldLabel,
  Description: FieldDescription,
  Error: FieldError,
  Control: FieldControl,
})
