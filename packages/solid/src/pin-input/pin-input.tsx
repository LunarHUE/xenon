import { pinInput } from '@tenon/core/pin-input'
import type { PinInputOptions } from '@tenon/core/pin-input'
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
import { fieldDescribedBy, fieldLabelledBy, tokens, useFieldContext } from '../field/context'
import { spread } from '../spread'

/** Segmented one-time code with one submitted scalar value. */
export interface PinInputProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue'> {
  /** Controlled code; rejected requests restore the visible DOM immediately. */
  value?: string
  /** Initial uncontrolled code and silent form reset value. */
  defaultValue?: string
  /** Called for edits that request a different normalized value. */
  onValueChange?: (value: string) => void
  /** Called after an accepted edit changes the code to a complete value. */
  onValueComplete?: (value: string) => void
  /** Number of slots; defaults to six. Render an Input for each index. */
  length?: number
  /** Accepted characters; defaults to numeric ASCII digits. */
  type?: PinInputOptions['type']
  /** Display slot characters as passwords. */
  mask?: boolean
  /** Form submission name, inherited from Field when omitted. */
  name?: string
  /** Explicit native form owner ID. */
  form?: string
  /** Disable all slots and form participation. */
  disabled?: boolean
  /** Prevent editing while retaining focus navigation. */
  readonly?: boolean
  /** Require every slot to be filled for native form validation. */
  required?: boolean
  /** Author invalid state, combined with Field state. */
  invalid?: boolean
  /** Localized accessible name for each zero-based slot index. */
  getSlotLabel?: PinInputOptions['getSlotLabel']
}

/** Shared slot bindings and native element registration. */
interface Context {
  /** Current pure controller. */
  engine: () => ReturnType<typeof pinInput>
  /** Restore DOM values after canceled or controlled edits. */
  sync: () => void
  /** Register one input and its Field association. */
  register: (index: number, el: HTMLInputElement) => () => void
  /** Generated slot ID. */
  id: (index: number) => string
}
const Context = createContext<Context>()
/** Read the required owning root. */
function usePinInput(): Context {
  const context = useContext(Context)
  if (!context) throw new Error('PinInput.Input must be rendered inside a <PinInput>')
  return context
}

/** Own code state, Field associations, and the native validation/submission proxy. */
function PinInputRoot(props: PinInputProps): JSX.Element {
  const field = useFieldContext()
  const base = untrack(() => props.id) ?? `tenon-pin-${createUniqueId()}`
  const initial = untrack(() => props.defaultValue ?? '')
  const [internal, setInternal] = createSignal(initial, { ownedWrite: true })
  const disabled = () => !!(props.disabled || field?.disabled())
  const readonly = () => !!(props.readonly || field?.readonly())
  const required = () => !!(props.required || field?.required())
  const inputs = new Map<number, HTMLInputElement>()
  let mirror: HTMLInputElement | undefined
  const sync = () => {
    for (const [index, input] of inputs) input.value = engine().state.value[index] ?? ''
    if (mirror) mirror.value = engine().state.value
  }
  const focus = (index: number) => {
    flush()
    const target = inputs.get(Math.min(index, engine().state.insertion))
    target?.focus()
    target?.select()
  }
  const change = (next: string) => {
    const previous = engine().state.value
    if (props.value === undefined) setInternal(next)
    props.onValueChange?.(next)
    flush()
    sync()
    const state = engine().state
    if (state.value !== previous && state.complete) props.onValueComplete?.(state.value)
  }
  const engine = createMemo(() =>
    pinInput({
      value: props.value ?? internal(),
      length: props.length,
      type: props.type,
      mask: props.mask,
      disabled: disabled(),
      readonly: readonly(),
      required: required(),
      invalid: props.invalid || field?.invalid(),
      getSlotLabel: props.getSlotLabel,
      onValueChange: change,
      onFocusChange: focus,
    })
  )
  createEffect(
    () => engine().state.value,
    () => untrack(sync)
  )
  const cleanups = new Map<number, () => void>()
  const context: Context = {
    engine,
    sync,
    id: (index) => (index === 0 && field ? field.ids.control : `${base}-input-${index}`),
    register(index, el) {
      inputs.set(index, el)
      if (index === 0 && field)
        cleanups.set(
          index,
          field.registerControl(() => el.id, el)
        )
      return () => {
        if (inputs.get(index) === el) inputs.delete(index)
        cleanups.get(index)?.()
        cleanups.delete(index)
      }
    },
  }
  onSettled(() => {
    const form = mirror?.form
    const reset = (event: Event) =>
      // eslint-disable-next-line solid/reactivity -- Native reset runs in this queued event callback.
      queueMicrotask(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(initial)
        flush()
        sync()
      })
    form?.addEventListener('reset', reset)
    return () => form?.removeEventListener('reset', reset)
  })
  const rest = omit(
    props,
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'onValueComplete',
    'length',
    'type',
    'mask',
    'name',
    'form',
    'disabled',
    'readonly',
    'required',
    'invalid',
    'getSlotLabel',
    'aria-labelledby',
    'aria-describedby'
  )
  const content = createMemo(() => <Context value={context}>{props.children}</Context>)
  const root = () => ({
    ...engine().parts.root,
    attrs: {
      ...engine().parts.root.attrs,
      'aria-labelledby': field
        ? fieldLabelledBy(field, props['aria-labelledby'], false)
        : tokens(props['aria-labelledby']),
      'aria-describedby': field
        ? fieldDescribedBy(field, props['aria-describedby'])
        : tokens(props['aria-describedby']),
    },
  })
  return (
    <div {...spread(root(), { ...rest })}>
      {content()}
      <input
        ref={(el) => {
          mirror = el
        }}
        type="text"
        tabindex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          overflow: 'hidden',
          'clip-path': 'inset(50%)',
        }}
        name={props.name ?? field?.name()}
        form={props.form}
        value={engine().state.value}
        disabled={disabled()}
        readonly={readonly()}
        required={required()}
        pattern={`.{${engine().state.length}}`}
        autocomplete="off"
        onInvalid={(event) => {
          event.preventDefault()
          focus(engine().state.insertion)
        }}
        onFocus={() => focus(engine().state.insertion)}
      />
    </div>
  )
}

/** Native slot props. Name and value are root-owned; per-slot type can override masking. */
export interface PinInputInputProps extends Omit<
  ComponentProps<'input'>,
  'value' | 'defaultValue' | 'name' | 'children'
> {
  /** Zero-based slot position, smaller than the root length. */
  index: number
}

/** Render a real input with replacement typing, paste distribution, and composition support. */
function PinInputInput(props: PinInputInputProps): JSX.Element {
  const context = usePinInput()
  let composing = false
  let unregister: (() => void) | undefined
  onCleanup(() => unregister?.())
  const rest = omit(props, 'index', 'ref')
  const part = () => {
    const core = context.engine().parts.input(props.index)
    return {
      attrs: { ...core.attrs, id: context.id(props.index) },
      on: {
        ...core.on,
        focus() {
          context.engine().focus(props.index)
        },
        click(event: MouseEvent & { currentTarget: HTMLInputElement }) {
          event.currentTarget.select()
        },
        input(event: InputEvent & { currentTarget: HTMLInputElement }) {
          if (composing || event.isComposing) return
          const text =
            event.data && event.data.length === 1 ? event.data : event.currentTarget.value
          context.engine().insert(props.index, text)
          context.sync()
        },
        paste(event: ClipboardEvent) {
          event.preventDefault()
          let text: string
          try {
            text = event.clipboardData?.getData('text') ?? ''
          } catch {
            return
          }
          context.engine().insert(props.index, text)
          context.sync()
        },
        compositionstart() {
          composing = true
        },
        compositionend(event: CompositionEvent & { currentTarget: HTMLInputElement }) {
          composing = false
          context.engine().insert(props.index, event.data || event.currentTarget.value)
          context.sync()
        },
      },
    }
  }
  const bindings = () => {
    const merged = spread(part(), { ...rest })
    const key = Object.keys(merged).find((name) => name.toLowerCase() === 'oninput')!
    const handler = merged[key] as (event: Event) => void
    merged[key] = (event: Event) => {
      handler(event)
      if (event.defaultPrevented) context.sync()
    }
    return merged
  }
  return (
    <input
      ref={(el) => {
        unregister?.()
        unregister = context.register(props.index, el)
        if (typeof props.ref === 'function') props.ref(el)
      }}
      {...bindings()}
    />
  )
}

/** Segmented code root with explicitly indexed native Input parts. Pair with Field.Label for a shared label. */
export const PinInput = Object.assign(PinInputRoot, {
  /** One focusable character slot. */
  Input: PinInputInput,
})
