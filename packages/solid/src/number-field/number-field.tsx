import { numberField, type NumberFieldOptions } from '@tenon/core/number-field'
import type { ComponentProps, JSX } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  flush,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { fieldDescribedBy, fieldLabelledBy, useFieldContext } from '../field/context'
import { spread } from '../spread'

/** Numeric root options. Undefined is uncontrolled; null is a controlled empty value. */
export interface NumberFieldProps extends Omit<
  NumberFieldOptions,
  'inputValue' | 'onInputValueChange'
> {
  /** Initial uncontrolled value and silent reset value. Defaults to null. */
  defaultValue?: number | null
  /** Native form entry name; inherits Field.name. */
  name?: string
  /** Explicit form owner ID. */
  form?: string
  /** Compound parts rendered within a semantic group. */
  children?: JSX.Element
  /** Group CSS class. */
  class?: string
}
interface Context {
  props: NumberFieldProps
  engine: () => ReturnType<typeof numberField>
  field: ReturnType<typeof useFieldContext>
  id: () => string
  registerId: (read: () => string | undefined) => () => void
  setInput: (input: HTMLInputElement) => void
}
const Context = createContext<Context>()
function useNumberField() {
  const context = useContext(Context)
  if (!context) throw new Error('NumberField parts must be inside a <NumberField>')
  return context
}
/** Locale-aware numeric editing with a canonical hidden form value and silent native reset. */
function NumberFieldRoot(props: NumberFieldProps): JSX.Element {
  const field = useFieldContext()
  const base = `tenon-number-field-${createUniqueId()}`
  const [internal, setInternal] = createSignal<number | null>(
    untrack(() => props.defaultValue ?? null)
  )
  const value = () => (props.value === undefined ? internal() : props.value)
  const [draft, setDraft] = createSignal<string>()
  let input: HTMLInputElement | undefined
  let idReader: (() => string | undefined) | undefined
  let revision = 0
  const [idRevision, setIdRevision] = createSignal(0, { ownedWrite: true })
  const id = () => {
    idRevision()
    return idReader?.() ?? field?.ids.control ?? `${props.id ?? base}-input`
  }
  const options = omit(props, 'children')
  const engine = createMemo(() =>
    numberField({
      ...options,
      id: id(),
      value: value(),
      inputValue: draft(),
      disabled: props.disabled || field?.disabled(),
      readonly: props.readonly || field?.readonly(),
      required: props.required || field?.required(),
      invalid: props.invalid || field?.invalid(),
      onInputValueChange: setDraft,
      onValueChange(next) {
        if (props.value === undefined) setInternal(next)
        props.onValueChange?.(next)
      },
    })
  )
  onSettled(() => {
    input?.setCustomValidity(
      engine().state.invalid ? 'Enter a valid number within the allowed range.' : ''
    )
  })
  let previous = untrack(value)
  createEffect(
    () => value(),
    (next) => {
      if (next !== previous) setDraft(undefined)
      previous = next
    }
  )
  onSettled(() => {
    if (!input) return
    const element = input
    const reset = (event: Event) => {
      if (event.target !== element.form) return
      // eslint-disable-next-line solid/reactivity -- Reads current props after the cancelable reset dispatch completes.
      queueMicrotask(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(props.defaultValue ?? null)
        setDraft(undefined)
        flush()
        element.value = engine().state.inputValue
      })
    }
    element.ownerDocument.addEventListener('reset', reset)
    return () => element.ownerDocument.removeEventListener('reset', reset)
  })
  const context: Context = {
    props,
    field,
    engine,
    id,
    setInput(el) {
      input = el
    },
    registerId(read) {
      idReader = read
      setIdRevision(++revision)
      return () => {
        if (idReader === read) idReader = undefined
        setIdRevision(++revision)
      }
    },
  }
  const content = createMemo(() => <Context value={context}>{props.children}</Context>)
  return (
    <div {...spread(engine().parts.root, { id: props.id, class: props.class })}>
      {content()}
      <input
        type="hidden"
        name={props.name ?? field?.name()}
        form={props.form}
        disabled={props.disabled || field?.disabled()}
        value={value() ?? ''}
      />
    </div>
  )
}
/** Native input attributes, with numeric state and form name owned by Root. */
export type NumberFieldInputProps = Omit<ComponentProps<'input'>, 'value' | 'name' | 'ref'> & {
  /** Receives the native editable input. */
  ref?: (input: HTMLInputElement) => void
}
/** Text-host spinbutton. Draft text is preserved until blur, Enter, or stepping. */
function NumberFieldInput(props: NumberFieldInputProps): JSX.Element {
  const context = useNumberField()
  const rest = omit(props as Record<string, unknown>, 'ref', 'children')
  onCleanup(context.registerId(() => (typeof props.id === 'string' ? props.id : undefined)))
  // eslint-disable-next-line solid/reactivity -- Field retains the ID accessor.
  if (context.field) onCleanup(context.field.registerControl(context.id))
  return (
    <input
      {...spread(context.engine().parts.input, {
        ...rest,
        id: context.id(),
        form: context.props.form,
        'aria-labelledby': context.field
          ? fieldLabelledBy(context.field, props['aria-labelledby'], true)
          : props['aria-labelledby'],
        'aria-describedby': context.field
          ? fieldDescribedBy(context.field, props['aria-describedby'])
          : props['aria-describedby'],
      })}
      ref={(el) => {
        context.setInput(el)
        props.ref?.(el)
      }}
    />
  )
}
/** Native increment/decrement button attributes. Provide an aria-label to override its default name. */
export type NumberFieldTriggerProps = ComponentProps<'button'>
/** Increases the current draft by one step. */
function NumberFieldIncrementTrigger(props: NumberFieldTriggerProps): JSX.Element {
  const context = useNumberField()
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <button {...spread(context.engine().parts.incrementTrigger, { ...rest })}>
      {props.children}
    </button>
  )
}
/** Decreases the current draft by one step. */
function NumberFieldDecrementTrigger(props: NumberFieldTriggerProps): JSX.Element {
  const context = useNumberField()
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <button {...spread(context.engine().parts.decrementTrigger, { ...rest })}>
      {props.children}
    </button>
  )
}
/** Native layout wrapper attributes. */
export type NumberFieldControlProps = ComponentProps<'div'>
/** Optional layout wrapper around the input and steppers. */
function NumberFieldControl(props: NumberFieldControlProps): JSX.Element {
  return <div {...props} />
}
/** Native label attributes. */
export type NumberFieldLabelProps = ComponentProps<'label'>
/** Label associated with this NumberField's input. Field.Label can also be used. */
function NumberFieldLabel(props: NumberFieldLabelProps): JSX.Element {
  const context = useNumberField()
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <label {...rest} for={context.id()}>
      {props.children}
    </label>
  )
}
/** Native display attributes. */
export type NumberFieldValueTextProps = ComponentProps<'span'>
/** Displays the editable value as plain text without a duplicate live announcement. */
function NumberFieldValueText(props: NumberFieldValueTextProps): JSX.Element {
  const context = useNumberField()
  return <span {...props}>{props.children ?? context.engine().state.inputValue}</span>
}
/** Numeric form input and its independently styled parts. */
export const NumberField = Object.assign(NumberFieldRoot, {
  Input: NumberFieldInput,
  Control: NumberFieldControl,
  Label: NumberFieldLabel,
  ValueText: NumberFieldValueText,
  IncrementTrigger: NumberFieldIncrementTrigger,
  DecrementTrigger: NumberFieldDecrementTrigger,
})
