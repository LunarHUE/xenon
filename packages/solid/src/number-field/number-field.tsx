import {
  createNumberFieldFormat,
  numberField,
  type NumberFieldOptions,
} from '@xenon-ui/core/number-field'
import { isServer, type ComponentProps, type JSX } from '@solidjs/web'
import { serverAssociations } from '../field/server-associations'
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
  defaultValue?: NumberFieldOptions['value']
  /** Native form entry name; inherits Field.name. */
  name?: string
  /** Explicit form owner ID. */
  form?: string
  /** Compound parts rendered within a semantic group. */
  children?: JSX.Element
  /** Group CSS class. */
  class?: string
}
/** Shared number-field state, element identity, and optional Field integration. */
interface Context {
  /** Deferred server label and control associations. */
  associations?: ReturnType<typeof serverAssociations>
  /** Current root props. */
  props: NumberFieldProps
  /** Reactive core result. */
  engine: () => ReturnType<typeof numberField>
  /** Optional enclosing Field. */
  field: ReturnType<typeof useFieldContext>
  /** Current input ID, including author overrides. */
  id: () => string
  /** Register a live input ID getter and return its cleanup. */
  registerId: (read: () => string | undefined) => () => void
  /** Record the native text input for form reset and validity synchronization. */
  setInput: (input: HTMLInputElement) => void
}
const Context = createContext<Context>()
/** Read the required owning NumberField context. */
function useNumberField() {
  const context = useContext(Context)
  if (!context) throw new Error('NumberField parts must be inside a <NumberField>')
  return context
}
/** Locale-aware numeric editing with a canonical hidden form value and silent native reset. */
function NumberFieldRoot(props: NumberFieldProps): JSX.Element {
  const field = useFieldContext()
  const associations = isServer ? serverAssociations() : undefined
  const base = `xenon-number-field-${createUniqueId()}`
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
  createEffect(
    () => engine().state.invalid,
    (invalid) =>
      input?.setCustomValidity(invalid ? 'Enter a valid number within the allowed range.' : '')
  )
  let previous = untrack(value)
  createEffect(
    () => value(),
    (next) => {
      if (next !== previous) setDraft(undefined)
      previous = next
    }
  )
  const formatting = createMemo(() => ({
    locale: props.locale ?? 'en-US',
    options: { ...props.formatOptions },
  }))
  let previousFormatting = untrack(formatting)
  createEffect(formatting, (next) => {
    const previous = previousFormatting
    previousFormatting = next
    const keys = new Set([...Object.keys(previous.options), ...Object.keys(next.options)])
    if (
      previous.locale === next.locale &&
      [...keys].every((key) => {
        const option = key as keyof Intl.NumberFormatOptions
        return previous.options[option] === next.options[option]
      })
    )
      return
    const text = draft()
    if (text === undefined) return
    // Interpret the draft with its original locale and tokens before changing display.
    // Formatting alone must not commit it or replace it with the older numeric value.
    const parsed = createNumberFieldFormat(previous.locale, previous.options).parse(text)
    if (parsed === null || Number.isFinite(parsed))
      setDraft(createNumberFieldFormat(next.locale, next.options).format(parsed))
  })
  onSettled(() => {
    if (!input) return
    const element = input
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      if (event.target !== element.form) return
      // Restore after the browser has completed the native reset default action.
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(props.defaultValue ?? null)
        setDraft(undefined)
        flush()
        element.value = engine().state.inputValue
      })
    }
    element.ownerDocument.addEventListener('reset', reset)
    return () => {
      clearTimeout(resetTimer)
      element.ownerDocument.removeEventListener('reset', reset)
    }
  })
  const context: Context = {
    associations,
    props,
    field,
    engine,
    id,
    setInput(el) {
      input = el
    },
    registerId(read) {
      idReader = read
      if (!isServer) setIdRevision(++revision)
      return () => {
        if (idReader === read) idReader = undefined
        if (!isServer) setIdRevision(++revision)
      }
    },
  }
  const content = createMemo(() => <Context value={context}>{props.children}</Context>)
  const element = (
    <div {...spread(engine().parts.root, { id: props.id, class: props.class })}>
      {content()}
      <input
        type="hidden"
        name={props.name ?? field?.name()}
        form={props.form}
        disabled={props.disabled || field?.disabled()}
        value={engine().state.value ?? ''}
      />
    </div>
  )
  // eslint-disable-next-line solid/components-return-once -- The server runtime is fixed.
  return isServer ? associations!.finish(element) : element
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
  // eslint-disable-next-line solid/reactivity -- Registry retains the live ID reader.
  onCleanup(context.registerId(() => (typeof props.id === 'string' ? props.id : undefined)))
  if (context.field) onCleanup(context.field.registerControl(context.id))
  const bindings = () => {
    const merged = spread(context.engine().parts.input, {
      ...rest,
      id: context.id(),
      form: context.props.form,
      'aria-labelledby': context.field
        ? fieldLabelledBy(context.field, props['aria-labelledby'], true)
        : props['aria-labelledby'],
      'aria-describedby': context.field
        ? fieldDescribedBy(context.field, props['aria-describedby'])
        : props['aria-describedby'],
    })
    const key = Object.keys(merged).find((name) => name.toLowerCase() === 'oninput')!
    const handler = merged[key] as (event: InputEvent & { currentTarget: HTMLInputElement }) => void
    merged[key] = (event: InputEvent & { currentTarget: HTMLInputElement }) => {
      handler(event)
      event.currentTarget.value = context.engine().state.inputValue
    }
    return merged
  }
  return (
    <input
      {...bindings()}
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
    <button
      {...spread(context.engine().parts.incrementTrigger, {
        ...rest,
        'aria-controls':
          context.associations?.attribute('aria-controls', context.id) ?? context.id(),
      })}
    >
      {props.children}
    </button>
  )
}
/** Decreases the current draft by one step. */
function NumberFieldDecrementTrigger(props: NumberFieldTriggerProps): JSX.Element {
  const context = useNumberField()
  const rest = omit(props as Record<string, unknown>, 'children')
  return (
    <button
      {...spread(context.engine().parts.decrementTrigger, {
        ...rest,
        'aria-controls':
          context.associations?.attribute('aria-controls', context.id) ?? context.id(),
      })}
    >
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
    <label {...rest} for={context.associations?.attribute('for', context.id) ?? context.id()}>
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
  /** Native text spinbutton with locale parsing and Field associations. */
  Input: NumberFieldInput,
  /** Layout wrapper for the input and step controls. */
  Control: NumberFieldControl,
  /** Native label targeting the current input ID. */
  Label: NumberFieldLabel,
  /** Formatted editable text rendered outside the input. */
  ValueText: NumberFieldValueText,
  /** Native button requesting the next greater step. */
  IncrementTrigger: NumberFieldIncrementTrigger,
  /** Native button requesting the next smaller step. */
  DecrementTrigger: NumberFieldDecrementTrigger,
})
