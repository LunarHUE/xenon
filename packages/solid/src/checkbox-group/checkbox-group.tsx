import type { CheckboxGroupOptions as CoreCheckboxGroupOptions } from '@xenon-ui/core'
import { field, checkboxGroup } from '@xenon-ui/core'
import type { PartProps } from '@xenon-ui/core'
import { dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, untrack } from 'solid-js'

import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import { FieldContext, tokens, useFieldContext } from '../field/context'
import type { FieldContextValue } from '../field/context'
import { FieldDescription, FieldError } from '../field/parts'
import { spread } from '../spread'
import { serverAssociations } from '../field/server-associations'

import { CheckboxGroupContext } from './context'
import { CheckboxGroupItem } from './item'
import { CheckboxGroupLabel } from './label'

type CheckboxGroupOptions = NativeBooleanAttributes<CoreCheckboxGroupOptions>

/** Field-owned state and ID inputs inherited by the public root props. */
interface Own extends CheckboxGroupOptions {
  /** Controlled selected string values. Undefined uses internal state. */
  value?: CheckboxGroupOptions['value']
  /** Initial selection and reset fallback. Defaults to an empty array. */
  defaultValue?: CheckboxGroupOptions['value']
  /** Reports accepted selection changes once; mounting and reset are silent. */
  onValueChange?: CheckboxGroupOptions['onValueChange']
  /** Native form owner shared by child inputs and form mirrors. */
  form?: CheckboxGroupOptions['form']
  /** Initial base for generated part IDs, captured once; not forwarded as the root element ID. Omission generates a unique base. */
  id?: string
  /** Default form name for controls that support it; a control name overrides it. */
  name?: CheckboxGroupOptions['name']
  /** Receives the root host once per distinct element; custom hosts must forward the ref. */
  ref?: unknown
  /** Shared disabled flag inherited by controls and styling hooks. Defaults to false; literal fieldset roots are disabled natively. */
  disabled?: JSX.BooleanAttribute
  /** Requires at least one selected value, defaulting to false. An individually required child must still be checked. */
  required?: JSX.BooleanAttribute
  /** Shared invalid flag controlling error visibility and control ARIA state; defaults to false. */
  invalid?: CheckboxGroupOptions['invalid']
}

/** Polymorphic group root props with controlled or uncontrolled multiple selection. */
export type CheckboxGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  Exclude<keyof Own, 'ref'> | 'as'
> &
  Omit<Own, 'ref'> & {
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
function CheckboxGroupRoot<T extends ValidComponent = 'div'>(
  props: CheckboxGroupProps<T>
): JSX.Element {
  const own = props as Own & {
    as?: ValidComponent
    'aria-labelledby'?: string
    'aria-describedby'?: string
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'aria-labelledby',
    'aria-describedby',
    'value',
    'defaultValue',
    'onValueChange',
    'form',
    'id',
    'disabled',
    'required',
    'readonly',
    'invalid',
    'name',
    'ref',
    'children'
  )

  const outer = useFieldContext()
  const disabled = () => booleanAttribute(own.disabled) || (outer?.disabled() ?? false)
  const readonly = () => booleanAttribute(own.readonly) || (outer?.readonly() ?? false)
  const required = () => booleanAttribute(own.required) || (outer?.required() ?? false)
  const invalid = () => (own.invalid ?? false) || (outer?.invalid() ?? false)
  const name = () => own.name ?? outer?.name()

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
      disabled: disabled(),
      required: required(),
      readonly: readonly(),
      invalid: invalid(),
      name: name(),
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
    describedBy: () =>
      tokens(
        own['aria-describedby'],
        outer?.describedBy(),
        result().parts.control.attrs['aria-describedby']
      ),
    labelIds: () => tokens(...labels().map(entryId)),
    registerLabel,
    controlId: () => (controls().length ? entryId(controls().at(-1)!) : ids.control),
    registerControl,
    registerDescription,
    registerError,
  }

  const [internal, setInternal] = createSignal<readonly string[]>(
    untrack(() => own.defaultValue ?? [])
  )
  const current = () => own.value ?? internal()
  const selection = createMemo(() =>
    checkboxGroup({
      value: current(),
      disabled: disabled(),
      readonly: readonly(),
      required: required(),
      invalid: invalid(),
      name: name(),
      form: own.form,
      onValueChange: (next) => {
        if (own.value === undefined) setInternal(next)
        own.onValueChange?.(next)
      },
    })
  )
  const group = {
    field: context,
    current,
    fallback: () => own.defaultValue ?? own.value ?? [],
    form: () => own.form,
    change: (value: string, checked: boolean) => selection().change(value, checked),
    reset: () => {
      if (own.value === undefined) setInternal(own.defaultValue ?? [])
    },
  }

  const content = createMemo(() => (
    <CheckboxGroupContext value={group}>
      <FieldContext value={context}>{(props as { children?: JSX.Element }).children}</FieldContext>
    </CheckboxGroupContext>
  ))

  /** Specializes only a literal fieldset host for native grouping and disabling. */
  const part = (): PartProps<'fieldset'> => {
    const attrs = {
      ...selection().parts.root.attrs,
      'aria-labelledby': context.association('aria-labelledby', () =>
        tokens(own['aria-labelledby'], outer?.labelIds(), context.labelIds())
      ),
      'aria-describedby': context.association('aria-describedby', () => context.describedBy()),
    }
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
    setRef(() => own.ref, node)
  }

  const Host = dynamic(() => (own.as ?? 'div') as ValidComponent)
  const element = (
    <Host ref={ref} {...spread(part(), { ...rest })}>
      {content()}
    </Host>
  )
  // eslint-disable-next-line solid/components-return-once -- server-only finalization; the environment never changes while mounted
  return associations ? associations.finish(element) : element
}

/**
 * Checkbox group with registered naming, descriptive text and optional error parts.
 * Children with string values inherit group selection, name, form owner and flags.
 * Required means at least one selected value; individual required props remain native.
 * Every checkbox retains its own tab stop. Custom hosts must forward props and refs.
 */
export const CheckboxGroup = /* @__PURE__ */ Object.assign(CheckboxGroupRoot, {
  /** Group name, referenced by aria-labelledby. */
  Label: CheckboxGroupLabel,
  /** Registered group description, also described by every item. */
  Description: FieldDescription,
  /** Registered error displayed only while invalid. */
  Error: FieldError,
  /** Checkbox whose string value identifies its group selection. */
  Item: CheckboxGroupItem,
})
