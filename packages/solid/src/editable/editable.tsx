import type { FieldContextValue } from '../field/context'
import { editable } from '@xenon/core/editable'
import type { EditableResult } from '@xenon/core/editable'
import { Dynamic } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
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
import { Field } from '../field/field'
import { useFieldContext, fieldDescribedBy, fieldLabelledBy } from '../field/context'
import { spread } from '../spread'

/** Inline editor root settings and native wrapper attributes. */
export type EditableProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onSubmit' | 'onCancel'> & {
  /** Committed text; undefined delegates ownership to internal state. */
  value?: string
  /** Initial committed text and silent form reset fallback. */
  defaultValue?: string
  /** Reports a changed committed value. Typing only updates the local draft. */
  onValueChange?: (value: string) => void
  /** Reports every successful explicit or blur commit, including unchanged text. */
  onValueCommit?: (value: string) => void
  /** Controlled editing state; undefined is uncontrolled. */
  editing?: boolean
  /** Initial editing state, default false. */
  defaultEditing?: boolean
  /** Requests an editing-state change. Initialization is silent. */
  onEditingChange?: (editing: boolean) => void
  /** Reports abandonment with the text held before editing. */
  onCancel?: (value: string) => void
  /** Preview pointer activation. Defaults to click; keyboard activation always works. */
  activationMode?: 'click' | 'dblclick'
  /** Commit gestures. Defaults to both; none requires SubmitTrigger. */
  submitMode?: 'enter' | 'blur' | 'both' | 'none'
  /** Selects all draft text on activation. Defaults to true. */
  selectOnFocus?: boolean
  /** Preview and input placeholder. */
  placeholder?: string
  /** Native submission name. */
  name?: string
  /** Explicit native form owner. */
  form?: string
  /** Disables activation and native input. */
  disabled?: boolean
  /** Blocks activation and edits while keeping the preview reachable. */
  readonly?: boolean
  /** Native required constraint. */
  required?: boolean
  /** Author invalid flag, merged with Field. */
  invalid?: boolean
  /** Maximum draft length in UTF-16 code units, matching native maxlength. */
  maxLength?: number
}

/** Internal shared editor state and focus targets. */
interface Context {
  /** Enclosing field retained for outer labels and descriptions. */
  outer: FieldContextValue | null

  /** Current core snapshot. */
  result(): EditableResult
  /** Root options read reactively by child parts. */
  props: EditableProps
  /** Visible input ID for native label association. */
  id: string
  /** Sets uncommitted text. */
  draft(value: string): void
  /** Native input or textarea. */
  input?: HTMLInputElement | HTMLTextAreaElement
  /** Preview used for focus restoration. */
  preview?: HTMLSpanElement
  /** Exit editor with committed draft and optional focus restoration. */
  submit(restore?: boolean): void
  /** Restore pre-edit text and exit. */
  cancel(): void
}
const Context = createContext<Context>()
/** Reads the enclosing inline editor. */
function useEditable(): Context {
  return useContext(Context)
}

/** Owns draft/commit separation, field propagation, and focus-safe blur submission. */
function EditableRoot(props: EditableProps): JSX.Element {
  const outer = useFieldContext()
  const [internal, setInternal] = createSignal(untrack(() => props.defaultValue) ?? '')
  const value = () => (props.value === undefined ? internal() : props.value)
  const [active, setActive] = createSignal(untrack(() => props.defaultEditing) ?? false)
  const editing = () => (props.editing === undefined ? active() : props.editing)
  const [draft, setDraft] = createSignal(untrack(value))
  const disabled = () => !!props.disabled || !!outer?.disabled()
  const readonly = () => !!props.readonly || !!outer?.readonly()
  let before = untrack(value)
  let restore = false
  const changeEditing = (next: boolean) => {
    if (next === untrack(editing)) return
    if (props.editing === undefined) setActive(next)
    props.onEditingChange?.(next)
  }
  const context: Context = {
    outer,
    props,
    id: createUniqueId(),
    draft: (text) => {
      if (!disabled() && !readonly()) setDraft(text.slice(0, props.maxLength))
    },
    result: () =>
      editable({
        value: value(),
        draft: draft(),
        editing: editing(),
        disabled: disabled(),
        readonly: readonly(),
        required: props.required || outer?.required(),
        invalid: props.invalid || outer?.invalid(),
        onEdit() {
          before = value()
          setDraft(before)
          changeEditing(true)
        },
        onSubmit: () => context.submit(),
        onCancel: () => context.cancel(),
      }),
    submit(focus = true) {
      if (!editing() || disabled() || readonly()) return
      if (context.input && !context.input.checkValidity()) {
        context.input.reportValidity()
        return
      }
      const next = draft()
      if (next !== value()) {
        if (props.value === undefined) setInternal(next)
        props.onValueChange?.(next)
      }
      props.onValueCommit?.(next)
      restore = focus
      changeEditing(false)
    },
    cancel() {
      if (!editing()) return
      setDraft(before)
      props.onCancel?.(before)
      restore = true
      changeEditing(false)
    },
  }
  createEffect(
    () => ({ editing: editing(), value: value() }),
    (next, previous) => {
      if (next.editing && !previous?.editing) {
        before = next.value
        setDraft(before)
      }
      if (!next.editing) setDraft(next.value)
      if (next.editing !== previous?.editing)
        onSettled(() => {
          if (next.editing) {
            context.input?.focus()
            if (props.selectOnFocus !== false) context.input?.select()
          } else if (restore) {
            restore = false
            context.preview?.focus()
          }
        })
    }
  )
  onSettled(() => {
    const document = context.input?.ownerDocument
    if (!document) return
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      if (event.target !== context.input?.form) return
      clearTimeout(resetTimer)
      // Restore after the browser reset default action, using current props.
      resetTimer = setTimeout(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(props.defaultValue ?? '')
        setDraft(props.value ?? props.defaultValue ?? '')
        if (props.editing === undefined) setActive(false)
        flush()
        if (context.input) context.input.value = editing() ? draft() : value()
      }, 0)
    }
    document.addEventListener('reset', reset, true)
    return () => {
      clearTimeout(resetTimer)
      document.removeEventListener('reset', reset, true)
    }
  })
  const rest = omit(
    props,
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'onValueCommit',
    'editing',
    'defaultEditing',
    'onEditingChange',
    'onCancel',
    'activationMode',
    'submitMode',
    'selectOnFocus',
    'placeholder',
    'name',
    'form',
    'disabled',
    'readonly',
    'required',
    'invalid',
    'maxLength'
  )
  const part = () => ({
    ...context.result().parts.root,
    on: {
      focusout(event: FocusEvent & { currentTarget: HTMLDivElement }) {
        if (event.target === context.preview || (event.target as HTMLElement).hidden) return
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return
        if (['both', 'blur'].includes(props.submitMode ?? 'both')) context.submit(false)
      },
    },
  })
  const content = createMemo(() => (
    <Context value={context}>
      <Field
        {...spread(part(), { ...rest })}
        name={props.name ?? outer?.name()}
        disabled={disabled()}
        readonly={readonly()}
        required={props.required || outer?.required()}
        invalid={props.invalid || outer?.invalid()}
      >
        {props.children}
      </Field>
    </Context>
  ))
  return <>{content()}</>
}

/** Preview attributes. Its default text is committed value or the placeholder. */
export type EditablePreviewProps = JSX.HTMLAttributes<HTMLSpanElement>
/** Renders the keyboard-activatable preview without entering editing on focus alone. */
export function EditablePreview(props: EditablePreviewProps): JSX.Element {
  const context = useEditable()
  const part = () => ({
    ...context.result().parts.preview,
    on: {
      click() {
        if ((context.props.activationMode ?? 'click') === 'click') context.result().edit()
      },
      dblclick() {
        if (context.props.activationMode === 'dblclick') context.result().edit()
      },
      keydown(event: KeyboardEvent) {
        if (!event.isComposing && ['Enter', ' '].includes(event.key)) {
          event.preventDefault()
          context.result().edit()
        }
      },
    },
  })
  const rest = omit(props, 'children', 'ref')
  return (
    <span
      {...spread(part(), { ...rest })}
      ref={(node) => {
        context.preview = node
        if (typeof props.ref === 'function') props.ref(node)
      }}
    >
      {props.children ?? (context.result().state.value || context.props.placeholder || 'Edit')}
    </span>
  )
}

/** Native editor attributes; textarea is selected with as. */
export type EditableInputProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'ref'> & {
  /** Native text input by default, or multiline textarea. */
  as?: 'input' | 'textarea'
  /** Receives the actual native input or textarea. */
  ref?: (node: HTMLInputElement | HTMLTextAreaElement) => void
}
/** Keeps a native textbox mounted in both modes, with field naming and form ownership. */
export function EditableInput(props: EditableInputProps): JSX.Element {
  const context = useEditable()
  const field = useFieldContext()!
  const id = () => props.id || context.id
  // eslint-disable-next-line solid/reactivity -- The field registry stores this live ID reader.
  onCleanup(field.registerControl(id))
  // eslint-disable-next-line solid/reactivity -- Preserve the enclosing field's native label target too.
  if (context.outer) onCleanup(context.outer.registerControl(id))
  const rest = omit(props, 'as', 'ref', 'id', 'aria-labelledby', 'aria-describedby')
  const part = () => ({
    attrs: {
      ...context.result().parts.input.attrs,
      id: id(),
      name: context.props.name ?? field.name(),
      form: context.props.form,
      maxlength: context.props.maxLength,
      placeholder: context.props.placeholder,
      'aria-labelledby': fieldLabelledBy(field, props['aria-labelledby'], true),
      'aria-describedby': fieldDescribedBy(
        field,
        context.outer
          ? fieldDescribedBy(context.outer, props['aria-describedby'])
          : props['aria-describedby']
      ),
    },
    on: {
      input(event: InputEvent & { currentTarget: HTMLInputElement }) {
        context.draft(event.currentTarget.value)
      },
      keydown(event: KeyboardEvent) {
        if (event.isComposing || event.keyCode === 229) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          context.cancel()
        } else if (
          event.key === 'Enter' &&
          props.as !== 'textarea' &&
          ['both', 'enter'].includes(context.props.submitMode ?? 'both')
        ) {
          event.preventDefault()
          context.submit()
        }
      },
      invalid(event: Event) {
        if (!context.result().state.editing) {
          event.preventDefault()
          context.result().edit()
        }
      },
    },
  })
  const ref = (node: HTMLInputElement | HTMLTextAreaElement) => {
    context.input = node
    props.ref?.(node)
  }
  return (
    <Dynamic
      component={props.as ?? 'input'}
      {...spread(part(), { ...rest })}
      ref={(node: HTMLInputElement | HTMLTextAreaElement) => ref(node)}
    />
  )
}
/** Native action button props; children supply visible labels. */
export type EditableTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>
/** Creates one of the editor's native action buttons. */
function trigger(kind: 'editTrigger' | 'submitTrigger' | 'cancelTrigger') {
  return (props: EditableTriggerProps): JSX.Element => {
    const context = useEditable()
    const rest = omit(props, 'children')
    return <button {...spread(context.result().parts[kind], { ...rest })}>{props.children}</button>
  }
}
/** Opens an edit session. */
export const EditableEditTrigger = trigger('editTrigger')
/** Validates and commits the current draft. */
export const EditableSubmitTrigger = trigger('submitTrigger')
/** Abandons the current draft. */
export const EditableCancelTrigger = trigger('cancelTrigger')
/** Inline text editor with native field parts and explicit commit/cancel controls. */
export const Editable = Object.assign(EditableRoot, {
  /** Committed text and activation target. */
  Preview: EditablePreview,
  /** Native draft editor. */
  Input: EditableInput,
  /** Native associated label. */
  Label: Field.Label,
  /** Registered helper text. */
  Description: Field.Description,
  /** Conditional registered error. */
  Error: Field.Error,
  /** Starts editing. */
  EditTrigger: EditableEditTrigger,
  /** Commits editing. */
  SubmitTrigger: EditableSubmitTrigger,
  /** Cancels editing. */
  CancelTrigger: EditableCancelTrigger,
})
