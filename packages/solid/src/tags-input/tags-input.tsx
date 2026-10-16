import type { FieldContextValue } from '../field/context'
import { tagsInput } from '@xenon-ui/core/tags-input'
import type {
  TagsInputOptions as CoreTagsInputOptions,
  TagsInputResult,
} from '@xenon-ui/core/tags-input'
import type { ComponentProps, JSX } from '@solidjs/web'
import {
  For,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import { Field } from '../field/field'
import { FieldDescription, FieldError, FieldLabel } from '../field/parts'
import { useFieldContext, fieldDescribedBy, fieldLabelledBy } from '../field/context'
import { hiddenStyle } from '../internal/native'
import { spread } from '../spread'
import { subscribeFormReset } from '../internal/form-reset'

type TagsInputOptions = NativeBooleanAttributes<CoreTagsInputOptions>

/** Reactive render state for mapping tags into Item parts. */
export interface TagsInputRenderState {
  /** Current tags in source order, including duplicates when permitted. */
  readonly value: readonly string[]
}
/** Native wrapper attributes and string tag collection settings. */
export type TagsInputProps = Omit<ComponentProps<'div'>, 'children'> &
  TagsInputOptions & {
    /** Initial uncontrolled tags and silent form reset fallback. */
    defaultValue?: TagsInputOptions['value']
    /** Native submission name. Each tag contributes a separate entry. */
    name?: string
    /** Explicit native form owner ID. */
    form?: string
    /** Literal delimiter used while typing and pasting. Defaults to comma; empty disables splitting. */
    delimiter?: string
    /** Splits a delimited paste into tags. Defaults to true. */
    addOnPaste?: boolean
    /** Converts the remaining draft on leaving the widget. Defaults to false. */
    addOnBlur?: boolean
    /** Converts the remaining draft on Tab, without preventing focus movement. */
    addOnTab?: boolean
    /** Direction for horizontal tag navigation. Defaults to ltr. */
    dir?: 'ltr' | 'rtl'
    /** Tag anatomy, optionally rendered from reactive collection getters. */
    children?: JSX.Element | ((state: TagsInputRenderState) => JSX.Element)
  }
/** Internal tag registry entry for DOM focus and per-item edit exclusion. */
interface Entry {
  /** Tag host. */
  element?: HTMLDivElement
  /** Item-specific removal/edit gate. */
  disabled(): boolean
}
/** Shared tag state, draft and native editing targets. */
interface Context {
  /** Enclosing field retained for outer labels and descriptions. */
  outer: FieldContextValue | null

  /** Options read reactively by parts. */
  props: TagsInputProps
  /** Current pure collection result. */
  result(): TagsInputResult
  /** Main input identity for native labels. */
  id: string
  /** Current draft text. */
  draft(): string
  /** Changes uncommitted text. */
  setDraft(value: string): void
  /** Current DOM input. */
  input(): HTMLInputElement | undefined
  /** Records main input. */
  setInput(value: HTMLInputElement): void
  /** Focused tag index; -1 means the input. */
  active(): number
  /** Focuses the indexed tag, or main input for -1. */
  focus(index: number): void
  /** Registered tag hosts, indexed by source order. */
  entries: Map<number, Entry>
  /** Inserts one or more strings, retaining rejected draft text. */
  add(text: string, split?: boolean): boolean
  /** Removes one tag and restores predictable focus. */
  remove(index: number, next?: number): void
  /** Index being edited, or -1. */
  editing(): number
  /** Enters or leaves the per-tag editor. */
  setEditing(index: number): void
  /** Shared keyboard navigation for tag hosts and main input. */
  key(event: KeyboardEvent, index: number): void
}
const Context = /* @__PURE__ */ createContext<Context>()
const ItemContext = /* @__PURE__ */ createContext<() => number>()
/** Reads required root context. */
function useTags(): Context {
  return useContext(Context)
}

/** Provides a form-associated tag collection, native draft input, and ordinary removable tag elements. */
function TagsInputRoot(props: TagsInputProps): JSX.Element {
  const outer = useFieldContext()
  const [internal, setInternal] = createSignal<readonly string[]>(
    untrack(() => props.defaultValue) ?? []
  )
  const value = () => (props.value === undefined ? internal() : props.value)
  const [draft, setDraft] = createSignal('')
  const [input, setInput] = createSignal<HTMLInputElement>()
  const [active, setActive] = createSignal(-1)
  // Item registration cleanup can end an edit during collection reconciliation.
  const [editing, setEditing] = createSignal(-1, { ownedWrite: true })
  const [announcement, announce] = createSignal('')
  const disabled = () => booleanAttribute(props.disabled) || !!outer?.disabled()
  const readonly = () => booleanAttribute(props.readonly) || !!outer?.readonly()
  const required = () => booleanAttribute(props.required) || !!outer?.required()
  const name = () => props.name ?? outer?.name()
  const entries = new Map<number, Entry>()
  const context: Context = {
    outer,
    props,
    id: createUniqueId(),
    draft,
    setDraft,
    input,
    setInput,
    active,
    entries,
    editing,
    setEditing,
    result: () =>
      tagsInput({
        value: value(),
        disabled: disabled(),
        readonly: readonly(),
        required: required(),
        invalid: props.invalid || outer?.invalid(),
        allowDuplicates: props.allowDuplicates,
        trim: props.trim,
        max: props.max,
        validate: props.validate,
        onValueChange(next) {
          if (props.value === undefined) setInternal(next)
          props.onValueChange?.(next)
        },
      }),
    focus(index) {
      const target = entries.get(index)?.element
      if (index < 0 || !target) {
        setActive(-1)
        input()?.focus()
      } else {
        setActive(index)
        target.focus()
      }
    },
    add(text, split = false) {
      const delimiter = props.delimiter ?? ','
      const candidates = split && delimiter ? text.split(delimiter) : [text]
      const accepted = context.result().add(candidates)
      if (!accepted.length) return false
      const remaining = [...accepted]
      const rejected = candidates.filter((raw) => {
        const normalized = props.trim === false ? raw : raw.trim()
        if (!normalized) return false
        const index = remaining.indexOf(normalized)
        if (index < 0) return true
        remaining.splice(index, 1)
        return false
      })
      setDraft(rejected.join(delimiter))
      announce(`Added ${accepted.join(', ')}`)
      return true
    },
    remove(index, next = -1) {
      const removed = value()[index]
      if (entries.get(index)?.disabled() || !context.result().remove(index)) return
      announce(`Removed ${removed ?? 'tag'}`)
      queueMicrotask(() => context.focus(next))
    },
    key(event, index) {
      if (
        event.isComposing ||
        event.keyCode === 229 ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey
      )
        return
      const backwards = props.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
      const forwards = props.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      const node = input()
      if (index < 0) {
        if (event.key === 'Enter' && draft()) {
          event.preventDefault()
          context.add(draft())
          return
        }
        if (event.key === 'Tab' && props.addOnTab && draft()) {
          context.add(draft())
          return
        }
        if (
          draft() &&
          !(event.key === backwards && node?.selectionStart === 0 && node.selectionEnd === 0)
        )
          return
        if ((event.key === backwards || event.key === 'Backspace') && value().length) {
          event.preventDefault()
          context.focus(value().length - 1)
        }
        return
      }
      if (event.key === backwards) {
        event.preventDefault()
        context.focus(Math.max(0, index - 1))
      } else if (event.key === forwards) {
        event.preventDefault()
        context.focus(index + 1 < value().length ? index + 1 : -1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        context.focus(0)
      } else if (event.key === 'End' || event.key === 'Escape') {
        event.preventDefault()
        context.focus(-1)
        if (event.key === 'End') node?.select()
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        context.remove(index, event.key === 'Backspace' ? index - 1 : -1)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (context.result().state.interactive && !entries.get(index)?.disabled()) setEditing(index)
      } else if (event.key.length === 1 && context.result().state.interactive) {
        event.preventDefault()
        setDraft(draft() + event.key)
        context.focus(-1)
      }
    },
  }
  createEffect(
    () => ({ node: input(), required: required(), count: value().length }),
    ({ node, required, count }) => {
      node?.setCustomValidity(required && !count ? 'Add at least one tag.' : '')
    }
  )
  onSettled(() => {
    const initialDocument = input()?.ownerDocument
    if (!initialDocument) return
    return subscribeFormReset(
      initialDocument,
      () => input()?.form ?? null,
      () => {
        if (props.value === undefined) setInternal(props.defaultValue ?? [])
        setDraft('')
        setActive(-1)
        setEditing(-1)
      }
    )
  })
  const rest = omit(
    props,
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'name',
    'form',
    'delimiter',
    'addOnPaste',
    'addOnBlur',
    'addOnTab',
    'disabled',
    'readonly',
    'required',
    'invalid',
    'allowDuplicates',
    'trim',
    'max',
    'validate'
  )
  const state: TagsInputRenderState = {
    get value() {
      return value()
    },
  }
  const part = () => ({
    ...context.result().parts.root,
    on: {
      focusout(event: FocusEvent & { currentTarget: HTMLDivElement }) {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) return
        setActive(-1)
        if (props.addOnBlur && draft()) context.add(draft())
      },
    },
  })
  const content = createMemo(() => (
    <Context value={context}>
      <Field
        {...spread(part(), { ...rest })}
        name={name()}
        disabled={disabled()}
        readonly={readonly()}
        required={required()}
        invalid={props.invalid || outer?.invalid()}
      >
        {(() => {
          const children = props.children
          return typeof children === 'function' ? children(state) : children
        })()}
        <For each={value()}>
          {(tag) => (
            <input
              type="hidden"
              name={name()}
              form={props.form}
              disabled={disabled()}
              value={tag}
            />
          )}
        </For>
        <span role="status" aria-live="polite" aria-atomic="true" style={hiddenStyle}>
          {announcement()}
        </span>
      </Field>
    </Context>
  ))
  return <>{content()}</>
}

/** Native main textbox props. Name belongs to the root's submitted tags. */
export type TagsInputInputProps = Omit<ComponentProps<'input'>, 'name' | 'value' | 'defaultValue'>
/** Text entry with literal delimiter splitting, IME protection, and field associations. */
export function TagsInputInput(props: TagsInputInputProps): JSX.Element {
  const context = useTags(),
    field = useFieldContext()!
  const id = () => props.id || context.id
  // eslint-disable-next-line solid/reactivity -- The field registry stores this live ID reader.
  onCleanup(field.registerControl(id))
  // eslint-disable-next-line solid/reactivity -- Preserve the enclosing field's native label target too.
  if (context.outer) onCleanup(context.outer.registerControl(id))
  let composing = false
  const rest = omit(props, 'ref', 'id', 'aria-labelledby', 'aria-describedby')
  const process = (node: HTMLInputElement, compose = false) => {
    if (!context.result().state.interactive) {
      node.value = context.draft()
      return
    }
    context.setDraft(node.value)
    const delimiter = context.props.delimiter ?? ','
    if (!compose && delimiter && node.value.includes(delimiter)) context.add(node.value, true)
  }
  const part = () => ({
    attrs: {
      ...context.result().parts.input.attrs,
      id: id(),
      value: context.draft(),
      form: context.props.form,
      required: (field.required() && !context.result().state.value.length) || undefined,
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
        process(
          event.currentTarget,
          composing ||
            event.isComposing ||
            (event.inputType === 'insertFromPaste' && context.props.addOnPaste === false)
        )
      },
      compositionstart() {
        composing = true
      },
      compositionend(event: CompositionEvent & { currentTarget: HTMLInputElement }) {
        composing = false
        process(event.currentTarget)
      },
      keydown(event: KeyboardEvent) {
        context.key(event, -1)
      },
      paste(event: ClipboardEvent) {
        const delimiter = context.props.delimiter ?? ','
        const text = event.clipboardData?.getData('text')
        if (
          !composing &&
          context.props.addOnPaste !== false &&
          delimiter &&
          text?.includes(delimiter)
        ) {
          event.preventDefault()
          if (!context.result().state.interactive) return
          const node = context.input()!
          const combined =
            context.draft().slice(0, node.selectionStart ?? 0) +
            text +
            context.draft().slice(node.selectionEnd ?? context.draft().length)
          context.setDraft(combined)
          context.add(combined, true)
        }
      },
      focus() {
        context.focus(-1)
      },
    },
  })
  return (
    <input
      {...spread(part(), { ...rest })}
      ref={(node) => {
        context.setInput(node)
        setRef(() => props.ref, node)
      }}
    />
  )
}
/** Native control wrapper props. */
export type TagsInputControlProps = ComponentProps<'div'>
/** Groups tags and textbox visually; clicking its padding focuses the textbox. */
export function TagsInputControl(props: TagsInputControlProps): JSX.Element {
  const context = useTags()
  const rest = omit(props, 'children')
  return (
    <div
      {...spread(
        {
          attrs: {},
          on: {
            click(event: MouseEvent & { currentTarget: HTMLDivElement }) {
              if (event.target === event.currentTarget && !context.props.disabled) context.focus(-1)
            },
          },
        },
        { ...rest }
      )}
    >
      {props.children}
    </div>
  )
}
/** Indexed tag wrapper. Source order is retained when values repeat. */
export type TagsInputItemProps = ComponentProps<'div'> & {
  /** Current index in the root value array. */
  index: number
  /** Excludes this item from editing and removal. */
  disabled?: JSX.BooleanAttribute
}
/** Focusable tag host. Arrow keys move actual DOM focus without introducing listbox roles. */
export function TagsInputItem(props: TagsInputItemProps): JSX.Element {
  const context = useTags()
  const entry: Entry = { disabled: () => booleanAttribute(props.disabled) }
  createEffect(
    () => props.index,
    (index) => {
      context.entries.set(index, entry)
      return () => {
        if (context.entries.get(index) === entry) {
          context.entries.delete(index)
          if (untrack(context.editing) === index) context.setEditing(-1)
        }
      }
    }
  )
  const rest = omit(props, 'children', 'index', 'disabled', 'ref')
  const itemIndex = () => props.index
  const children = createMemo(() => <ItemContext value={itemIndex}>{props.children}</ItemContext>)
  const part = () => ({
    ...context.result().parts.item(props.index, context.active() === props.index),
    on: {
      keydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
        if (event.target === event.currentTarget) context.key(event, props.index)
      },
      click(event: MouseEvent & { currentTarget: HTMLDivElement }) {
        const target = event.target as HTMLElement
        const text = target.closest('[data-part="item-text"]')
        const control = target.closest(
          'button, input, select, textarea, a[href], summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [tabindex]'
        )
        if (
          target === event.currentTarget ||
          (text?.closest('[data-part="item"]') === event.currentTarget &&
            (!control || control === event.currentTarget))
        )
          context.focus(props.index)
      },
      dblclick() {
        if (context.result().state.interactive && !props.disabled) context.setEditing(props.index)
      },
    },
  })
  return (
    <div
      {...spread(part(), { ...rest })}
      ref={(node) => {
        entry.element = node
        setRef(() => props.ref, node)
      }}
    >
      {children()}
    </div>
  )
}
/** Tag text props. Default content is the indexed value. */
export type TagsInputItemTextProps = ComponentProps<'span'>
/** Renders a tag's text and hides it while its inline editor is active. */
export function TagsInputItemText(props: TagsInputItemTextProps): JSX.Element {
  const context = useTags(),
    index = useContext(ItemContext)
  return (
    <span {...props} data-part="item-text" hidden={context.editing() === index()}>
      {props.children ?? context.result().state.value[index()]}
    </span>
  )
}
/** Native per-tag removal button attributes. */
export type TagsInputItemDeleteTriggerProps = ComponentProps<'button'>
/** Removes exactly one indexed occurrence and focuses the main input. */
export function TagsInputItemDeleteTrigger(props: TagsInputItemDeleteTriggerProps): JSX.Element {
  const context = useTags(),
    index = useContext(ItemContext)
  const rest = omit(props, 'children')
  const part = () => ({
    ...context.result().parts.remove(index()),
    attrs: {
      ...context.result().parts.remove(index()).attrs,
      disabled:
        !context.result().state.interactive ||
        context.entries.get(index())?.disabled() ||
        undefined,
    },
    on: {
      click() {
        context.remove(index())
      },
    },
  })
  return <button {...spread(part(), { ...rest })}>{props.children}</button>
}
/** Native tag editor attributes. */
export type TagsInputItemInputProps = ComponentProps<'input'>
/** Optional per-tag editor. Enter commits, Escape cancels, and blur leaves the original tag unchanged. */
export function TagsInputItemInput(props: TagsInputItemInputProps): JSX.Element {
  const context = useTags(),
    index = useContext(ItemContext)
  let node: HTMLInputElement | undefined
  createEffect(
    () => context.editing() === index(),
    (editing) => {
      if (editing)
        onSettled(() => {
          if (!node || context.editing() !== index()) return
          node.value = context.result().state.value[index()] ?? ''
          node.focus()
          node.select()
        })
    }
  )
  const rest = omit(props, 'ref')
  const part = () => ({
    attrs: {
      type: 'text' as const,
      tabindex: -1,
      disabled:
        context.result().parts.input.attrs.disabled ||
        context.entries.get(index())?.disabled() ||
        undefined,
      readonly: context.result().parts.input.attrs.readonly,
      hidden: context.editing() !== index(),
      'aria-label': `Edit ${context.result().state.value[index()] ?? 'tag'}`,
    },
    on: {
      keydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
        if (event.isComposing || event.keyCode === 229) return
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          context.setEditing(-1)
          context.focus(-1)
        } else if (event.key === 'Enter') {
          event.preventDefault()
          if (
            !context.entries.get(index())?.disabled() &&
            context.result().replace(index(), event.currentTarget.value)
          ) {
            context.setEditing(-1)
            context.focus(-1)
          }
        }
      },
      blur() {
        context.setEditing(-1)
      },
    },
  })
  return (
    <input
      {...spread(part(), { ...rest })}
      ref={(el) => {
        node = el
        setRef(() => props.ref, el)
      }}
    />
  )
}
/** Native collection-clear button props. */
export type TagsInputClearTriggerProps = ComponentProps<'button'>
/** Clears every tag and the draft while preserving the main input's focus. */
export function TagsInputClearTrigger(props: TagsInputClearTriggerProps): JSX.Element {
  const context = useTags(),
    rest = omit(props, 'children')
  const part = () => ({
    attrs: {
      type: 'button' as const,
      disabled: !context.result().state.interactive || undefined,
      'aria-label': 'Clear tags',
    },
    on: {
      click() {
        if (!context.result().state.interactive) return
        context.result().clear()
        context.setDraft('')
        context.focus(-1)
      },
    },
  })
  return <button {...spread(part(), { ...rest })}>{props.children}</button>
}
/** String tag entry with explicit rendering, native fields, optional inline editing, and removal. */
export const TagsInput = /* @__PURE__ */ Object.assign(TagsInputRoot, {
  /** Visual grouping and padding click target. */
  Control: TagsInputControl,
  /** Native tag draft textbox. */
  Input: TagsInputInput,
  /** Indexed tag container. */
  Item: TagsInputItem,
  /** Current tag text. */
  ItemText: TagsInputItemText,
  /** Optional inline tag editor. */
  ItemInput: TagsInputItemInput,
  /** Per-tag remove button. */
  ItemDeleteTrigger: TagsInputItemDeleteTrigger,
  /** Clears the collection. */
  ClearTrigger: TagsInputClearTrigger,
  /** Native label targeting the visible input. */
  Label: FieldLabel,
  /** Registered helper text. */
  Description: FieldDescription,
  /** Conditional registered error text. */
  Error: FieldError,
})
