import type { GlobalAttrs } from '@xenon-ui/core'
import { createContext, useContext } from 'solid-js'

import type { Association } from './server-associations'

/** Field-owned state readers and part registries shared by descendant adapters. */
export interface FieldContextValue {
  /** Stable fallback IDs derived once from the Field's initial ID or generated base. */
  ids: {
    /** Default control ID, also used when no controls are registered. */
    control: string
    /** Default label ID; registered labels may supply their own IDs. */
    label: string
    /** Default description ID. */
    description: string
    /** Default error ID. */
    error: string
  }
  /** Current Field disabled flag; controls combine it with local disabled using OR. */
  disabled(): boolean
  /** Current Field required flag; controls combine it with local required using OR. */
  required(): boolean
  /** Current Field readonly flag; controls combine it with local readonly using OR. */
  readonly(): boolean
  /** Current Field invalid flag, also gating error IDs in describedBy. */
  invalid(): boolean
  /** Field form name, used when a descendant's own name is undefined. */
  name(): string | undefined
  /** Core naming fallback for labelable controls; normally undefined because Field supplies a control ID. */
  labelledBy(): string | undefined
  /** Registered description IDs followed by registered error IDs while Field is invalid. */
  describedBy(): string | undefined
  /** Read immediately on the client; on the server, return a marker finalized after child serialization. */
  association(name: Association, read: () => string | undefined): string | undefined
  /** Registered label IDs in registry order, or undefined when none contribute a nonempty string. */
  labelIds(): string | undefined
  /**
   * Register a label ID or live ID reader. A supplied element sorts entries by DOM
   * position at registration; otherwise registration order is retained. The returned
   * cleanup removes only this entry and is safe to repeat. The caller owns cleanup.
   */
  registerLabel(id: string | (() => string), element?: HTMLElement): () => void
  /** Last registered control in registry order, with ids.control as the empty-registry fallback. */
  controlId(): string
  /** Register a control candidate with the same ordering and cleanup contract as registerLabel. ID readers are evaluated on access. */
  registerControl(
    id: string | (() => string),
    element?: HTMLElement,
    onLabelClick?: (event: MouseEvent, control: HTMLElement) => void
  ): () => void
  /** Runs an opted-in handler only for the current registered control targeted by this label. */
  activateLabel?(control: HTMLElement, event: MouseEvent): boolean
  /** Register a description using the shared ordering/cleanup contract; its ID contributes to describedBy. */
  registerDescription(id: string | (() => string), element?: HTMLElement): () => void
  /** Register an error using the shared ordering/cleanup contract; its ID contributes only while Field is invalid. */
  registerError(id: string | (() => string), element?: HTMLElement): () => void
}

/** Nearest Field's context, defaulting to null outside a provider. */
export const FieldContext = /* @__PURE__ */ createContext<FieldContextValue | null>(null)

/** Reads the optional enclosing Field in the current Solid owner without requiring one. */
export function useFieldContext(): FieldContextValue | null {
  return useContext(FieldContext)
}

/**
 * Reads the enclosing Field for a part that requires one.
 * @param name - Component name included in the missing-provider error.
 * @throws If the current owner has no Field context.
 */
export function useField(name: string): FieldContextValue {
  const context = useContext(FieldContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Field>`)
  return context
}

/** Literal HTML tags treated as native label targets, without checking input type or custom-element internals. */
const labelable = new Set(['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'])

/** Checks an exact lowercase host tag against the native label-target set; custom components return false. */
export function isLabelable(tag: unknown): boolean {
  return typeof tag === 'string' && labelable.has(tag)
}

/** Joins nonempty strings with spaces, preserving internal whitespace and duplicate IDs; ignores other values. */
export function tokens(...values: unknown[]): string | undefined {
  const present = values.filter(
    (value): value is string => typeof value === 'string' && value !== ''
  )
  return present.length > 0 ? present.join(' ') : undefined
}

/** Reads current Field flags into data attributes only, without adding native control behavior. */
export function fieldFlags(context: FieldContextValue): GlobalAttrs {
  return {
    'data-disabled': context.disabled() ? '' : undefined,
    'data-required': context.required() ? '' : undefined,
    'data-readonly': context.readonly() ? '' : undefined,
    'data-invalid': context.invalid() ? '' : undefined,
  }
}

/**
 * Places author naming IDs before the Field's naming fallback. Labelable hosts use
 * the core fallback; other hosts reference registered labels directly.
 *
 * @param own - Author value, included only when it is a nonempty string.
 * @param labelable - Whether native label association can name this host.
 * @param defer - Route through server association finalization when true, the default.
 * False reads immediately, as used when passing props through custom components.
 */
export function fieldLabelledBy(
  context: FieldContextValue,
  own: unknown,
  labelable: boolean,
  defer = true
): string | undefined {
  const read = () => tokens(own, labelable ? context.labelledBy() : context.labelIds())
  return defer ? context.association('aria-labelledby', read) : read()
}

/**
 * Places author description IDs before Field descriptions and currently eligible errors.
 * @param own - Author value, included only when it is a nonempty string.
 * @param defer - Use association finalization when true, the default; false reads immediately.
 */
export function fieldDescribedBy(
  context: FieldContextValue,
  own: unknown,
  defer = true
): string | undefined {
  const read = () => tokens(own, context.describedBy())
  return defer ? context.association('aria-describedby', read) : read()
}
