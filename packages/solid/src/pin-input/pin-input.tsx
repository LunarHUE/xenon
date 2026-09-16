import { pinInput } from '@xenon/core/pin-input'
import type { PinInputOptions } from '@xenon/core/pin-input'
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
export interface PinInputProps
  extends
    Omit<ComponentProps<'div'>, keyof PinInputOptions | 'onChange' | 'defaultValue'>,
    Omit<PinInputOptions, 'onFocusChange'> {
  /** Controlled code; rejected requests restore the visible DOM immediately. */
  value?: PinInputOptions['value']
  /** Initial uncontrolled code and silent form reset value. */
  defaultValue?: PinInputOptions['value']
  /** Called for edits that request a different normalized value. */
  onValueChange?: PinInputOptions['onValueChange']
  /** Called after an accepted edit changes the code to a complete value. */
  onValueComplete?: (value: string) => void
  /** Form submission name, inherited from Field when omitted. */
  name?: string
  /** Explicit native form owner ID. */
  form?: string
  /** Number of slots; defaults to six. Render an Input for each index. */
  length?: PinInputOptions['length']
  /** Require every slot to be filled for native form validation. */
  required?: PinInputOptions['required']
  /** Author invalid state, combined with Field state. */
  invalid?: PinInputOptions['invalid']
}

/** Shared slot bindings and native element registration. */
interface Context {
  /** Surrounding field metadata inherited by every slot. */
  field: ReturnType<typeof useFieldContext>
  /** Native slot form owner. */
  form: () => string | undefined
  /** Current pure controller. */
  engine: () => ReturnType<typeof pinInput>
  /** Restore DOM values after canceled or controlled edits. */
  sync: () => void
  /** Register one input and its Field association. */
  register: (index: number, el: HTMLInputElement) => () => void
  /** Generated slot ID. */
  id: (index: number) => string
}
const Context = createContext<Context | null>(null)
/** Read the required owning root. */
function usePinInput(): Context {
  const context = useContext(Context)
  if (!context) throw new Error('PinInput.Input must be rendered inside a <PinInput>')
  return context
}

/** Own code state, Field associations, and the native validation/submission proxy. */
function PinInputRoot(props: PinInputProps): JSX.Element {
  const field = useFieldContext()
  const base = untrack(() => props.id) ?? `xenon-pin-${createUniqueId()}`
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
  const context: Context = {
    field,
    form: () => props.form,
    engine,
    sync,
    id: (index) => (index === 0 && field ? field.ids.control : `${base}-input-${index}`),
    register(index, el) {
      inputs.set(index, el)
      return () => {
        if (inputs.get(index) === el) inputs.delete(index)
      }
    },
  }
  onSettled(() => {
    const element = mirror
    if (!element) return
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      if (event.target !== element.form) return
      // Restore after the browser has completed the native reset default action.
      clearTimeout(resetTimer)
      resetTimer = setTimeout(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(initial)
        flush()
        sync()
      })
    }
    element.ownerDocument.addEventListener('reset', reset)
    return () => {
      clearTimeout(resetTimer)
      element.ownerDocument.removeEventListener('reset', reset)
    }
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
        onInput={sync}
        onChange={sync}
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
  const rest = omit(props, 'index', 'ref', 'onMouseDown')
  const id = () => (typeof props.id === 'string' ? props.id : context.id(props.index))
  if (context.field && untrack(() => props.index) === 0) {
    // eslint-disable-next-line solid/reactivity -- Field retains the live ID reader through this owner's lifetime.
    onCleanup(context.field.registerControl(id))
  }
  const part = () => {
    const core = context.engine().parts.input(props.index)
    return {
      attrs: { ...core.attrs, id: id(), form: context.form() },
      on: {
        ...core.on,
        focus() {
          context.engine().focus(props.index)
        },
        mousedown(event: MouseEvent & { currentTarget: HTMLInputElement; target: Element }) {
          const handler = props.onMouseDown
          if (typeof handler === 'function') handler(event)
          else handler?.[0](handler[1], event)
          if (event.defaultPrevented || event.button !== 0 || event.currentTarget.disabled) return
          event.preventDefault()
          context.engine().focus(props.index)
        },
        click(event: MouseEvent & { currentTarget: HTMLInputElement }) {
          if (event.currentTarget !== event.currentTarget.ownerDocument.activeElement) return
          event.currentTarget.select()
        },
        input(event: InputEvent & { currentTarget: HTMLInputElement }) {
          if (composing || event.isComposing) return
          const text =
            event.data && event.data.length === 1 ? event.data : event.currentTarget.value
          context.engine().insert(props.index, text)
          context.sync()
          if (event.currentTarget === event.currentTarget.ownerDocument.activeElement) {
            event.currentTarget.select()
          }
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
    const merged = spread(part(), {
      ...rest,
      'aria-describedby': context.field
        ? fieldDescribedBy(context.field, props['aria-describedby'])
        : tokens(props['aria-describedby']),
    })
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
