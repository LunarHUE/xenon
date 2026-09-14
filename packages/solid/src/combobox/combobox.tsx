import type { PartProps } from '@tenon/core'
import { combobox } from '@tenon/core/combobox'
import type { ComboboxItem as Option, ComboboxOptions } from '@tenon/core/combobox'
import { isServer } from '@solidjs/web'
import type { ComponentProps, JSX } from '@solidjs/web'
import { serverAssociations } from '../field/server-associations'
import {
  For,
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
import { useFieldContext, fieldDescribedBy, fieldLabelledBy } from '../field/context'
import { createPresence } from '../internal/presence'
import { SelectionPopup, useSelectionPositioner } from '../internal/selection-popup'
import type { SelectionPopupProps, SelectionPopupSource } from '../internal/selection-popup'
import { spread } from '../spread'

/** Editable single-selection root options. Items remain available while the popup is closed. */
export interface ComboboxProps {
  /** Unique string values with display labels and optional disabled state. */
  items: readonly Option[]
  /** Controlled committed selection; undefined releases control to internal state. */
  value?: string
  /** Initial uncontrolled selection and silent form-reset value. */
  defaultValue?: string
  /** Requests selection; typing alone retains the existing selection. */
  onValueChange?: (value: string | undefined) => void
  /** Controlled editable text, independent of the committed value. */
  inputValue?: string
  /** Initial uncontrolled query; otherwise the selected label is displayed. */
  defaultInputValue?: string
  /** Requests editable text after typing or accepting a suggestion. */
  onInputValueChange?: (value: string) => void
  /** Controlled popup visibility. */
  open?: boolean
  /** Initial uncontrolled popup visibility. Defaults to false. */
  defaultOpen?: boolean
  /** Requests changed visibility; initialization is silent. */
  onOpenChange?: (open: boolean) => void
  /** Submitted option value name, inherited from Field when omitted. */
  name?: string
  /** Explicit owning form ID; omission uses ancestry. */
  form?: string
  /** Disables input, popup opening, and form participation. */
  disabled?: boolean
  /** Blocks editing and opening while retaining input focus. */
  readonly?: boolean
  /** Requires a committed selection, regardless of typed search text. */
  required?: boolean
  /** Author-owned invalid state, combined with Field state. */
  invalid?: boolean
  /** False disables filtering; a predicate replaces default substring matching. */
  filter?: ComboboxOptions['filter']
  /** Wrap enabled option navigation. Defaults to true. */
  loop?: boolean
  /** Popup layout direction. Defaults to inherited document direction after mount. */
  dir?: 'ltr' | 'rtl'
  /** Keep popup markup mounted after exit. Defaults to false. */
  forceMount?: boolean
  /** Base for generated control and option IDs. */
  id?: string
  /** Compound parts rendered inside a context provider with no extra wrapper. */
  children?: JSX.Element
}

/** Internal shared accessors for one combobox instance. */
interface Context {
  /** Current root inputs. */
  props: ComboboxProps
  /** Resolved pure engine. */
  engine: () => ReturnType<typeof combobox>
  /** Stable generated control ID. */
  id: string
  /** Optional surrounding field. */
  field: ReturnType<typeof useFieldContext>
  /** Popup lifecycle and DOM readers. */
  source: SelectionPopupSource
  /** Attach the input anchor. */
  setInput: (el: HTMLInputElement) => void
  /** Attach the listbox surface. */
  setContent: (el: HTMLElement) => void
  /** Requests visibility while respecting disabled/readonly state. */
  changeOpen: (open: boolean) => void
  /** Combined local and field disabled state. */
  disabled: () => boolean
  /** Combined local and field required state. */
  required: () => boolean
  /** Deferred server ID associations. */
  associations?: ReturnType<typeof serverAssociations>
  /** Current popup ID. */
  contentId(): string
  /** Register a live popup ID. */
  registerContentId(read: () => string | undefined): () => void
  /** Resolve a custom option ID or its generated fallback. */
  optionId(value: string): string
  /** Register an option ID getter. */
  registerOptionId(value: string, read: () => string | undefined): () => void
}
const Context = createContext<Context>()
/** Read the owning combobox; parts cannot be rendered outside its root. */
function useCombobox(): Context {
  const context = useContext(Context)
  if (!context) throw new Error('Combobox parts must be rendered inside a <Combobox>')
  return context
}

/**
 * Owns query, selection, native form participation, and a nonmodal listbox popup.
 * Typed text is a search query, never a submitted free-form value. Only choosing
 * an option changes the submitted selection. Form reset is silent and respects
 * controlled values. Use Field.Label or an explicit input label for naming.
 */
function ComboboxRoot(props: ComboboxProps): JSX.Element {
  const field = useFieldContext()
  const associations = isServer ? serverAssociations() : undefined
  const [idRevision, setIdRevision] = createSignal(0, { ownedWrite: true })
  let contentIdRead: (() => string | undefined) | undefined
  const contentId = () => {
    idRevision()
    return contentIdRead?.() ?? `${base}-listbox`
  }
  const registerContentId = (read: () => string | undefined) => {
    contentIdRead = read
    setIdRevision((value) => value + 1)
    return () => {
      if (contentIdRead === read) contentIdRead = undefined
      setIdRevision((value) => value + 1)
    }
  }
  const optionIds = new Map<string, () => string | undefined>()
  const optionId = (value: string) => {
    idRevision()
    return optionIds.get(value)?.() ?? (engine().parts.item(value).attrs.id as string)
  }
  const registerOptionId = (value: string, read: () => string | undefined) => {
    optionIds.set(value, read)
    setIdRevision((n) => n + 1)
    return () => {
      if (optionIds.get(value) === read) optionIds.delete(value)
      setIdRevision((n) => n + 1)
    }
  }
  const base = untrack(() => props.id) ?? `tenon-combobox-${createUniqueId()}`
  const initial = untrack(() => props.defaultValue)
  const label = (value: string | undefined) =>
    props.items.find((item) => item.value === value)?.label ?? ''
  const [internal, setInternal] = createSignal<string | undefined>(initial)
  const value = () => props.value ?? internal()
  const [query, setQuery] = createSignal(untrack(() => props.defaultInputValue ?? label(value())))
  const [expanded, setExpanded] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [active, setActive] = createSignal<string>()
  const [input, setInput] = createSignal<HTMLInputElement>()
  const [content, setContent] = createSignal<HTMLElement>()
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr')
  const disabled = () => !!props.disabled || !!field?.disabled()
  const readonly = () => !!props.readonly || !!field?.readonly()
  const required = () => !!props.required || !!field?.required()
  const open = () => !disabled() && !readonly() && (props.open ?? expanded())
  const text = () => props.inputValue ?? query()
  const changeText = (next: string) => {
    if (next === untrack(text)) return
    if (props.inputValue === undefined) setQuery(next)
    props.onInputValueChange?.(next)
  }
  const changeOpen = (next: boolean) => {
    if (next && (disabled() || readonly())) return
    if (next === untrack(open)) return
    if (props.open === undefined) setExpanded(next)
    if (!next) setActive(undefined)
    props.onOpenChange?.(next)
  }
  const life = createPresence({ open, forceMount: () => props.forceMount ?? false })
  const engine = createMemo(() =>
    combobox({
      items: props.items,
      id: base,
      value: value(),
      inputValue: text(),
      open: open(),
      activeValue: active(),
      disabled: disabled(),
      readonly: readonly(),
      required: required(),
      invalid: props.invalid || field?.invalid(),
      filter: props.filter,
      loop: props.loop,
      onValueChange(next) {
        if (props.value === undefined) setInternal(next)
        props.onValueChange?.(next)
      },
      onInputValueChange: changeText,
      onOpenChange: changeOpen,
      onActiveChange: setActive,
    })
  )
  // External selection changes update the display, but typing does not change selection.
  let previousValue = untrack(value)
  let previousLabel = untrack(() => label(value()))
  createEffect(
    () => ({
      value: value(),
      label: label(value()),
      controlledText: props.inputValue !== undefined,
    }),
    (next) => {
      if (
        !next.controlledText &&
        (next.value !== previousValue ||
          (next.label !== previousLabel && untrack(query) === previousLabel))
      )
        setQuery(next.label)
      previousValue = next.value
      previousLabel = next.label
    }
  )
  createEffect(
    () => {
      const activeValue = engine().state.activeValue
      return {
        open: open(),
        content: content(),
        id: activeValue === undefined ? undefined : optionId(activeValue),
      }
    },
    (state) => {
      if (state.open && state.id)
        state.content?.ownerDocument
          .getElementById(state.id)
          ?.scrollIntoView?.({ block: 'nearest' })
    }
  )
  const source: SelectionPopupSource = {
    trigger: input,
    content,
    open,
    life,
    dir: () => props.dir ?? ambient(),
    initial: () => false,
    restore: () => false,
    onDismiss: () => changeOpen(false),
  }
  const context: Context = {
    associations,
    contentId,
    registerContentId,
    optionId,
    registerOptionId,
    props,
    engine,
    id: `${base}-input`,
    field,
    source,
    setInput,
    setContent,
    changeOpen,
    disabled,
    required,
  }
  let mirror: HTMLSelectElement | undefined
  onSettled(() => {
    const initialNode = input()
    if (!initialNode) return
    setAmbient(
      initialNode.closest('[dir]')?.getAttribute('dir') === 'rtl' ||
        initialNode.ownerDocument.dir === 'rtl'
        ? 'rtl'
        : 'ltr'
    )
    const reset = (event: Event) => {
      if (event.target !== mirror?.form) return
      // eslint-disable-next-line solid/reactivity -- reset reads the current form state after native reset completes.
      queueMicrotask(() => {
        if (event.defaultPrevented) return
        if (props.value === undefined) setInternal(props.defaultValue)
        if (props.inputValue === undefined) setQuery(props.defaultInputValue ?? label(value()))
        if (props.open === undefined) setExpanded(false)
        setActive(undefined)
        flush()
        if (mirror) mirror.value = value() ?? ''
      })
    }
    initialNode.ownerDocument.addEventListener('reset', reset)
    return () => initialNode.ownerDocument.removeEventListener('reset', reset)
  })
  const element = (
    <Context value={context}>
      {props.children}
      <select
        ref={(el) => {
          mirror = el
        }}
        tabindex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          border: '0',
          overflow: 'hidden',
          'clip-path': 'inset(50%)',
          'white-space': 'nowrap',
        }}
        name={props.name ?? field?.name()}
        form={props.form}
        disabled={disabled()}
        required={required() && !readonly()}
        value={value() ?? ''}
        onInvalid={(event) => {
          event.preventDefault()
          input()?.focus()
        }}
        onFocus={() => input()?.focus()}
        onChange={(event) => {
          if (disabled() || readonly()) {
            event.currentTarget.value = value() ?? ''
            return
          }
          const next = event.currentTarget.value || undefined
          if (
            next !== undefined &&
            !props.items.some((item) => item.value === next && !item.disabled)
          ) {
            event.currentTarget.value = value() ?? ''
            return
          }
          const previous = value()
          if (props.value === undefined) setInternal(next)
          if (next !== previous) props.onValueChange?.(next)
          changeText(label(next))
          event.currentTarget.value = value() ?? ''
        }}
      >
        <option value="" />
        <For each={props.items}>
          {(item) => (
            <option value={item.value} disabled={item.disabled}>
              {item.label}
            </option>
          )}
        </For>
      </select>
    </Context>
  )
  // eslint-disable-next-line solid/components-return-once -- isServer is fixed for this runtime.
  return isServer ? associations!.finish(element) : element
}

/** Native text-input props; root owns query, selection, required, and form name. */
export type ComboboxInputProps = Omit<ComponentProps<'input'>, 'value' | 'name' | 'ref'> & {
  /** Receives the focus and positioning anchor. */
  ref?: (el: HTMLInputElement) => void
}
/** Editable focus anchor; native editing and author-canceled events remain intact. */
function ComboboxInput(props: ComboboxInputProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props as Record<string, unknown>, 'ref', 'children')
  const id = () =>
    typeof props.id === 'string' ? props.id : (context.field?.ids.control ?? context.id)
  // eslint-disable-next-line solid/reactivity -- Field retains the live ID reader until this owner disposes.
  if (context.field) onCleanup(context.field.registerControl(id))
  const attributes = () => ({
    ...rest,
    id: id(),
    required: undefined,
    'aria-required': context.required() ? 'true' : undefined,
    'aria-activedescendant': context.associations
      ? context.associations.attribute('aria-activedescendant', () =>
          context.source.open() && context.engine().state.activeValue !== undefined
            ? context.optionId(context.engine().state.activeValue!)
            : undefined
        )
      : context.source.open() && context.engine().state.activeValue !== undefined
        ? context.optionId(context.engine().state.activeValue!)
        : undefined,
    'aria-controls': context.associations
      ? context.associations.attribute('aria-controls', () =>
          context.source.open() || context.props.forceMount ? context.contentId() : undefined
        )
      : context.source.open() || context.props.forceMount
        ? context.contentId()
        : undefined,
    'aria-labelledby': context.field
      ? fieldLabelledBy(context.field, props['aria-labelledby'], true)
      : props['aria-labelledby'],
    'aria-describedby': context.field
      ? fieldDescribedBy(context.field, props['aria-describedby'])
      : props['aria-describedby'],
  })
  const part = (): PartProps<'input'> => ({
    ...context.engine().parts.input,
    on: {
      ...context.engine().parts.input.on,
      input(event) {
        context.engine().parts.input.on.input?.(event)
        event.currentTarget.value = context.engine().state.inputValue
      },
    },
  })
  return (
    <input
      {...spread(part(), attributes())}
      ref={(el) => {
        context.setInput(el)
        props.ref?.(el)
      }}
    />
  )
}

/** Geometry and native wrapper options for a combobox listbox. */
export type ComboboxPositionerProps = Omit<SelectionPopupProps, 'source'>
/** Hosts the popup in the top layer while keeping focus on the input. */
function ComboboxPositioner(props: ComboboxPositionerProps): JSX.Element {
  const context = useCombobox()
  return <SelectionPopup {...props} source={context.source} />
}

/** Popup surface props; omitted children render the filtered items' text labels. */
export type ComboboxContentProps = Omit<ComponentProps<'div'>, 'ref'> & {
  /** Receives the listbox surface. */
  ref?: (el: HTMLDivElement) => void
}
/** Listbox surface. Supply Item children for custom markup; unmatched items become hidden. */
function ComboboxContent(props: ComboboxContentProps): JSX.Element {
  const context = useCombobox()
  const positioning = useSelectionPositioner()
  const rest = omit(props as Record<string, unknown>, 'children', 'ref')
  // eslint-disable-next-line solid/reactivity -- Registry retains the live author ID reader.
  onCleanup(context.registerContentId(() => (typeof props.id === 'string' ? props.id : undefined)))
  return (
    <div
      {...spread(
        {
          ...context.engine().parts.content,
          attrs: {
            ...context.engine().parts.content.attrs,
            ...context.source.life.part().attrs,
            'data-side': positioning.state().side,
            'data-align': positioning.state().align,
          },
        },
        { 'aria-label': 'Suggestions', ...rest }
      )}
      ref={(el) => {
        context.setContent(el)
        context.source.life.ref(el)
        props.ref?.(el)
      }}
    >
      {props.children ?? (
        <For each={context.engine().state.items}>
          {(item) => <ComboboxItem value={item.value}>{item.label}</ComboboxItem>}
        </For>
      )}
    </div>
  )
}

/** Option surface props; value must identify an item in the root collection. */
export type ComboboxItemProps = Omit<ComponentProps<'div'>, 'value'> & {
  /** Stable collection value. */
  value: string
}
/** Selects on click and highlights on pointer movement without taking input focus. */
function ComboboxItem(props: ComboboxItemProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props as Record<string, unknown>, 'children', 'value')
  onCleanup(
    // eslint-disable-next-line solid/reactivity -- Value identifies this option lifetime; the registry retains its live ID reader.
    context.registerOptionId(props.value, () =>
      typeof props.id === 'string' ? props.id : undefined
    )
  )
  return (
    <div {...spread(context.engine().parts.item(props.value), { ...rest })}>{props.children}</div>
  )
}

/** Input-adjacent popup toggle, excluded from the Tab sequence. */
function ComboboxTrigger(props: ComponentProps<'button'>): JSX.Element {
  const context = useCombobox()
  return (
    <button
      {...spread(
        {
          attrs: {
            type: 'button',
            tabindex: -1,
            disabled: context.disabled() || undefined,
            'aria-label': 'Show suggestions',
            'aria-controls':
              context.source.open() || context.props.forceMount ? context.contentId() : undefined,
            'aria-expanded': context.source.open() ? 'true' : 'false',
          },
          on: {
            pointerdown(event: PointerEvent) {
              if (event.button === 0) event.preventDefault()
            },
            click() {
              context.source.trigger()?.focus()
              context.changeOpen(!context.source.open())
            },
          },
        } as PartProps<'button'>,
        { ...props }
      )}
    />
  )
}

/** Measured arrow box; children provide the arrow artwork. */
function ComboboxArrow(props: ComponentProps<'div'>): JSX.Element {
  const positioning = useSelectionPositioner()
  onCleanup(() => positioning.setArrow(undefined))
  return <div {...positioning.arrowProps()} {...props} ref={(el) => positioning.setArrow(el)} />
}

/** Editable single-selection root and its independently rendered compound parts. */
export const Combobox = Object.assign(ComboboxRoot, {
  /** Text input retaining DOM focus. */
  Input: ComboboxInput,
  /** Optional pointer toggle. */
  Trigger: ComboboxTrigger,
  /** Floating native popup wrapper. */
  Positioner: ComboboxPositioner,
  /** Filtered listbox surface. */
  Content: ComboboxContent,
  /** Customizable option. */
  Item: ComboboxItem,
  /** Arrow geometry host. */
  Arrow: ComboboxArrow,
})
