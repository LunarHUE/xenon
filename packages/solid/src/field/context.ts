import type { GlobalAttrs } from '@kit/core'
import { createContext, useContext } from 'solid-js'

import type { Association } from './server-associations'

export interface FieldContextValue {
  ids: { control: string; label: string; description: string; error: string }
  disabled(): boolean
  required(): boolean
  readonly(): boolean
  invalid(): boolean
  name(): string | undefined
  labelledBy(): string | undefined
  describedBy(): string | undefined
  association(name: Association, read: () => string | undefined): string | undefined
  labelIds(): string | undefined
  registerLabel(id: string | (() => string), element?: HTMLElement): () => void
  controlId(): string
  registerControl(id: string | (() => string), element?: HTMLElement): () => void
  registerDescription(id: string | (() => string), element?: HTMLElement): () => void
  registerError(id: string | (() => string), element?: HTMLElement): () => void
}

export const FieldContext = createContext<FieldContextValue | null>(null)

export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext)
}

export function useField(name: string): FieldContextValue {
  const context = useContext(FieldContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Field>`)
  return context
}

const labelable = new Set(['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'])

export function isLabelable(tag: unknown): boolean {
  return typeof tag === 'string' && labelable.has(tag)
}

export function tokens(...values: unknown[]): string | undefined {
  const present = values.filter(
    (value): value is string => typeof value === 'string' && value !== ''
  )
  return present.length > 0 ? present.join(' ') : undefined
}

export function fieldFlags(context: FieldContextValue): GlobalAttrs {
  return {
    'data-disabled': context.disabled() ? '' : undefined,
    'data-required': context.required() ? '' : undefined,
    'data-readonly': context.readonly() ? '' : undefined,
    'data-invalid': context.invalid() ? '' : undefined,
  }
}

export function fieldLabelledBy(
  context: FieldContextValue,
  own: unknown,
  labelable: boolean,
  defer = true
): string | undefined {
  const read = () => tokens(own, labelable ? context.labelledBy() : context.labelIds())
  return defer ? context.association('aria-labelledby', read) : read()
}

export function fieldDescribedBy(
  context: FieldContextValue,
  own: unknown,
  defer = true
): string | undefined {
  const read = () => tokens(own, context.describedBy())
  return defer ? context.association('aria-describedby', read) : read()
}
