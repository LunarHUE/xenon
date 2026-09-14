import { field } from '@tenon/core'
import type { PartProps } from '@tenon/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, untrack } from 'solid-js'

import { FieldContext, tokens } from './context'
import type { FieldContextValue } from './context'
import { FieldControl, FieldDescription, FieldError, FieldLabel } from './parts'
import { spread } from '../spread'
import { serverAssociations } from './server-associations'

/** Field-owned state and ID inputs inherited by the public root props. */
interface Own {
  /** Initial base for generated part IDs, captured once; not forwarded as the root element ID. Omission generates a unique base. */
  id?: string
  /** Shared disabled flag inherited by controls and styling hooks. Defaults to false; literal fieldset roots are disabled natively. */
  disabled?: boolean
  /** Shared required flag inherited by controls; defaults to false. Does not set a root required attribute. */
  required?: boolean
  /** Shared readonly flag inherited by controls; defaults to false. */
  readonly?: boolean
  /** Shared invalid flag controlling error visibility and control ARIA state; defaults to false. */
  invalid?: boolean
  /** Default form name for controls that support it; a control name overrides it. */
  name?: string
  /** Receives the root host once per distinct element; custom hosts must forward the ref. */
  ref?: (el: HTMLElement) => void
}

/** Polymorphic root props; owned field settings replace matching inherited host props. */
export type FieldProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Root host, defaulting to div with group role. Literal fieldset uses native disabled semantics and omits that role. */
    as?: T
  }

/** One registered part association, with optional DOM order information. */
interface Entry {
  /** Stable ID or deferred getter read when associations are computed. */
  id: string | (() => string)
  /** Rendered element used to sort registrations in DOM order when both entries have elements. */
  element?: HTMLElement
}

/**
 * Stores registrations and returns an idempotent removal for each entry. Client
 * additions/removals publish a reactive list; server reads use the mutable list
 * directly. Entries with elements are sorted when added, not observed for DOM moves.
 */
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

/** Resolves a registered ID without caching deferred getters. */
function entryId(entry: Entry): string {
  return typeof entry.id === 'function' ? entry.id() : entry.id
}

/**
 * Provides field state and registered associations around the selected root host.
 * IDs use the initial id base with control/label/description/error suffixes.
 * The final control in registry order supplies label targeting. Description/error IDs
 * follow registry order, with error references enabled only while invalid.
 * Server associations are finalized after rendering descendants; client registries
 * update through part lifecycle registration. No validation is performed here.
 */
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

  /** Rebuilds core associations from currently registered description/error IDs and shared state. */
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

  const associations = isServer ? serverAssociations() : undefined

  const context: FieldContextValue = {
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
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

  /** Specializes only a literal fieldset host for native grouping and disabling. */
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

  const element = (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(part(), { ...rest })}
    >
      {content()}
    </Dynamic>
  )
  // eslint-disable-next-line solid/components-return-once -- server-only finalization; the environment never changes while mounted
  return associations ? associations.finish(element) : element
}

/**
 * Field root with label, description, conditional error, and associated control parts.
 * Parts require this context. Native host props pass through {@link spread}; custom
 * hosts must forward their props and refs. Supply unique part IDs when rendering
 * multiple parts of the same kind, since each kind otherwise shares one fallback ID.
 */
export const Field = Object.assign(FieldRoot, {
  /** Native label associated with the registered control; see {@link FieldLabel}. */
  Label: FieldLabel,
  /** Registered descriptive text; see {@link FieldDescription}. */
  Description: FieldDescription,
  /** Alert text rendered while invalid; see {@link FieldError}. */
  Error: FieldError,
  /** Control with merged field state and associations; see {@link FieldControl}. */
  Control: FieldControl,
})
