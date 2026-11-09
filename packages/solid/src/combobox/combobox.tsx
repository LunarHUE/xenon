import type { PartProps } from '@xenon-ui/core'
import { combobox } from '@xenon-ui/core/combobox'
import type {
  ComboboxActiveChangeDetails,
  ComboboxInputValueChangeDetails,
  ComboboxItem as Option,
  ComboboxOptions as CoreComboboxOptions,
} from '@xenon-ui/core/combobox'
import { isServer } from '@solidjs/web'
import type { ComponentProps, JSX } from '@solidjs/web'
import { serverAssociations } from '../field/server-associations'
import {
  For,
  createContext,
  createEffect,
  createMemo,
  createProjection,
  createSignal,
  createUniqueId,
  flush,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import type { NativeBooleanAttributes } from '../internal/host'
import { booleanAttribute, setRef } from '../internal/host'
import { useFieldContext, fieldDescribedBy, fieldLabelledBy } from '../field/context'
import { createPresence } from '../internal/presence'
import { SelectionPopup, useSelectionPositioner } from '../internal/selection-popup'
import type { SelectionPopupProps, SelectionPopupSource } from '../internal/selection-popup'
import { spread } from '../spread'
import { OverlayPortal } from '../internal/overlay-portal'
import { subscribeFormReset } from '../internal/form-reset'
import { VirtualList, useVirtualList } from '../virtual-list/virtual-list'
import type { VirtualItem, VirtualOptions, VirtualizerHandle } from '../virtual-list/virtual-list'

export type {
  ComboboxActivationMode,
  ComboboxActiveChangeDetails,
  ComboboxInputValueChangeDetails,
} from '@xenon-ui/core/combobox'

/** A virtualized Combobox.Viewport and the row index of each visible value. */
interface VirtualBinding {
  handle: VirtualizerHandle
  index(value: string): number
}

type ComboboxOptions = NativeBooleanAttributes<CoreComboboxOptions>

/**
 * Editable single-selection root options. Items remain available while the popup is closed.
 * Undefined controlled values release ownership to internal state. Typing retains the
 * committed selection. Disabled, readonly, required, and invalid state combine with Field.
 *
 * For a search-and-pick list that stays open, pass `open`, render Viewport and
 * Items without Positioner or Content, and set `activationMode="automatic"` so the
 * arrow keys select. The highlighted option scrolls into view there as it does in
 * Content. `onActiveChange` reports the highlight and whether the keyboard or the
 * pointer moved it; `onInputValueChange` says whether text was typed or written by
 * a selection, so a controlled search field can ignore the second.
 */
export interface ComboboxProps extends Omit<ComboboxOptions, 'id' | 'activeValue'> {
  /** Input outside the popup (default), or search inside a dialog opened by Trigger. Fixed for the root lifetime. */
  inputPlacement?: 'trigger' | 'popup'
  /** Initial uncontrolled selection and silent form-reset value. */
  defaultValue?: ComboboxOptions['value']
  /** Initial uncontrolled query; otherwise empty for popup search or the selected label for an outside input. */
  defaultInputValue?: ComboboxOptions['inputValue']
  /** Initial uncontrolled popup visibility. Defaults to false. */
  defaultOpen?: ComboboxOptions['open']
  /** Submitted option value name, inherited from Field when omitted. */
  name?: string
  /** Explicit owning form ID; omission uses ancestry. */
  form?: string
  /** Popup layout direction. Defaults to inherited document direction after mount. */
  dir?: 'ltr' | 'rtl'
  /** Keep popup markup mounted after exit. Defaults to false. */
  forceMount?: boolean
  /** Base for generated control and option IDs. */
  id?: ComboboxOptions['id']
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
  /** Whether the editable input lives inside a trigger-anchored dialog. */
  popupInput: boolean
  /** Attach the standalone button anchor. */
  setTrigger: (el: HTMLButtonElement) => void
  /** Resolved selected display label. */
  selectedLabel(): string
  /** Combined local and field readonly state. */
  readonly(): boolean
  /** Listbox ID, distinct from the dialog ID in popup-input mode. */
  listId(): string
  /** Register the popup-input viewport's listbox ID. */
  registerListId(read: () => string | undefined): () => void
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
  /** Virtualized viewport, when one is rendered. */
  virtual(): VirtualBinding | undefined
  setVirtual(binding: VirtualBinding | undefined): void
  /** Whether the highlighted option has a mounted row, so aria-activedescendant may name it. */
  activeMounted(): boolean
}
const Context = /* @__PURE__ */ createContext<Context>()
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
  const popupInput = untrack(() => props.inputPlacement === 'popup')
  const associations = isServer ? serverAssociations() : undefined
  const [idRevision, setIdRevision] = createSignal(0, { ownedWrite: true })
  let contentIdRead: (() => string | undefined) | undefined
  const contentId = () => {
    idRevision()
    return contentIdRead?.() ?? `${base}-${popupInput ? 'popup' : 'listbox'}`
  }
  const registerContentId = (read: () => string | undefined) => {
    contentIdRead = read
    setIdRevision((value) => value + 1)
    return () => {
      if (contentIdRead === read) contentIdRead = undefined
      setIdRevision((value) => value + 1)
    }
  }
  let listIdRead: (() => string | undefined) | undefined
  const listId = () => {
    idRevision()
    return popupInput ? (listIdRead?.() ?? `${base}-listbox`) : contentId()
  }
  const registerListId = (read: () => string | undefined) => {
    listIdRead = read
    setIdRevision((n) => n + 1)
    return () => {
      if (listIdRead === read) listIdRead = undefined
      setIdRevision((n) => n + 1)
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
  const base = untrack(() => props.id) ?? `xenon-combobox-${createUniqueId()}`
  const initial = untrack(() => props.defaultValue)
  const label = (value: string | undefined) =>
    props.items.find((item) => item.value === value)?.label ?? ''
  const [internal, setInternal] = createSignal<string | undefined>(initial)
  const value = () => props.value ?? internal()
  const [query, setQuery] = createSignal(
    untrack(() => props.defaultInputValue ?? (popupInput ? '' : label(value())))
  )
  const [expanded, setExpanded] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [active, setActive] = createSignal<string>()
  const [input, setInput] = createSignal<HTMLInputElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const [trigger, setTrigger] = createSignal<HTMLButtonElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const [content, setContent] = createSignal<HTMLElement | undefined>(undefined, {
    ownedWrite: true,
  })
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr', { ownedWrite: true })
  const [virtual, setVirtual] = createSignal<VirtualBinding | undefined>(undefined, {
    ownedWrite: true,
  })
  const disabled = () => booleanAttribute(props.disabled) || !!field?.disabled()
  const readonly = () => booleanAttribute(props.readonly) || !!field?.readonly()
  const required = () => booleanAttribute(props.required) || !!field?.required()
  const open = () => !disabled() && !readonly() && (props.open ?? expanded())
  const text = () => props.inputValue ?? query()
  const changeText = (next: string, details: ComboboxInputValueChangeDetails) => {
    if (next === untrack(text)) return
    if (props.inputValue === undefined) setQuery(next)
    props.onInputValueChange?.(next, details)
  }
  // The engine compares against its snapshot and closing clears the highlight too,
  // so one event can ask for the same move twice. Report each move once.
  let highlighted: string | undefined
  const changeActive = (next: string | undefined, details: ComboboxActiveChangeDetails) => {
    if (next === highlighted) return
    highlighted = next
    setActive(next)
    props.onActiveChange?.(next, details)
  }
  const clearActive = () => changeActive(undefined, { reason: 'reset' })
  const changeOpen = (next: boolean) => {
    if (next && (disabled() || readonly())) return
    if (next === untrack(open)) return
    if (props.open === undefined) setExpanded(next)
    if (!next) clearActive()
    props.onOpenChange?.(next)
  }
  // Reset only after visibility actually changes, including controlled or disabled closure.
  let wasOpen = untrack(open)
  createEffect(open, (next) => {
    if (popupInput && wasOpen && !next) {
      changeText('', { reason: 'reset' })
      clearActive()
    }
    wasOpen = next
  })
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
      activationMode: props.activationMode,
      onActiveChange: changeActive,
    })
  )
  // External selection changes update the display, but typing does not change selection.
  // With automatic activation the field is a search box: only an explicit choice writes it.
  let previousValue = untrack(value)
  let previousLabel = untrack(() => label(value()))
  createEffect(
    () => ({
      value: value(),
      label: label(value()),
      controlledText: props.inputValue !== undefined,
      search: props.activationMode === 'automatic',
    }),
    (next) => {
      if (
        !popupInput &&
        !next.controlledText &&
        !next.search &&
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
      const list = untrack(virtual)
      const activeValue = untrack(() => engine().state.activeValue)
      if (state.open && list && activeValue !== undefined) {
        const index = untrack(() => list.index(activeValue))
        if (index >= 0) list.handle.scrollToIndex(index)
        return
      }
      // An inline list has no Content, so the input supplies the document.
      if (state.open && state.id)
        (state.content ?? untrack(input))?.ownerDocument
          .getElementById(state.id)
          ?.scrollIntoView?.({ block: 'nearest' })
    }
  )
  const source: SelectionPopupSource = {
    trigger: () => (popupInput ? trigger() : input()),
    content,
    open,
    life,
    dir: () => props.dir ?? ambient(),
    initial: () => (popupInput ? input() : false),
    restore: () => popupInput,
    onDismiss: () => changeOpen(false),
  }
  const context: Context = {
    popupInput,
    setTrigger,
    readonly,
    selectedLabel: () => label(value()),
    listId,
    registerListId,
    associations,
    contentId,
    registerContentId,
    optionId,
    registerOptionId,
    virtual,
    setVirtual: (binding) => setVirtual(() => binding),
    activeMounted() {
      const list = virtual()
      const activeValue = engine().state.activeValue
      return !list || activeValue === undefined || list.handle.isRendered(list.index(activeValue))
    },
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
    const initialNode = source.trigger()
    if (!initialNode) return
    setAmbient(
      initialNode.closest('[dir]')?.getAttribute('dir') === 'rtl' ||
        initialNode.ownerDocument.dir === 'rtl'
        ? 'rtl'
        : 'ltr'
    )
    return subscribeFormReset(
      initialNode.ownerDocument,
      () => mirror?.form ?? null,
      () => {
        if (props.value === undefined) setInternal(props.defaultValue)
        if (props.inputValue === undefined)
          setQuery(props.defaultInputValue ?? (popupInput ? '' : label(value())))
        if (props.open === undefined) setExpanded(false)
        clearActive()
        flush()
        const node = input()
        if (node) node.value = text()
        if (mirror) mirror.value = value() ?? ''
      }
    )
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
          source.trigger()?.focus()
        }}
        onFocus={() => source.trigger()?.focus()}
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
          changeText(popupInput ? '' : label(next), { reason: 'selection' })
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
export type ComboboxInputProps = Omit<ComponentProps<'input'>, 'value' | 'name'>
/** Editable focus anchor; native editing and author-canceled events remain intact. */
function ComboboxInput(props: ComboboxInputProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props as Record<string, unknown>, 'ref', 'children')
  const id = () =>
    typeof props.id === 'string'
      ? props.id
      : ((context.popupInput ? undefined : context.field?.ids.control) ?? context.id)
  // eslint-disable-next-line solid/reactivity -- Field retains the live ID reader until this owner disposes.
  if (context.field && !context.popupInput) onCleanup(context.field.registerControl(id))
  const attributes = () => ({
    form: context.props.form,
    ...rest,
    id: id(),
    required: undefined,
    'aria-required': !context.popupInput && context.required() ? 'true' : undefined,
    'aria-activedescendant': context.associations
      ? context.associations.attribute('aria-activedescendant', () =>
          context.source.open() &&
          context.engine().state.activeValue !== undefined &&
          context.activeMounted()
            ? context.optionId(context.engine().state.activeValue!)
            : undefined
        )
      : context.source.open() &&
          context.engine().state.activeValue !== undefined &&
          context.activeMounted()
        ? context.optionId(context.engine().state.activeValue!)
        : undefined,
    'aria-controls': context.associations
      ? context.associations.attribute('aria-controls', () =>
          context.source.open() || context.props.forceMount ? context.listId() : undefined
        )
      : context.source.open() || context.props.forceMount
        ? context.listId()
        : undefined,
    'aria-labelledby': context.field
      ? fieldLabelledBy(context.field, props['aria-labelledby'], true)
      : props['aria-labelledby'],
    'aria-describedby': context.field
      ? fieldDescribedBy(context.field, props['aria-describedby'])
      : props['aria-describedby'],
  })
  // Writing the value mid-composition would cancel the IME session. WebKit's committing
  // input can arrive before compositionend, which then publishes and syncs the text,
  // or after it, when it must sync like any other input.
  let composing = false
  const part = (): PartProps<'input'> => ({
    ...context.engine().parts.input,
    on: {
      ...context.engine().parts.input.on,
      compositionstart() {
        composing = true
      },
      input(event) {
        context.engine().parts.input.on.input?.(event)
        if (event.isComposing) composing = true
        if (event.isComposing || (composing && event.inputType === 'insertFromComposition')) return
        event.currentTarget.value = context.engine().state.inputValue
      },
      compositionend(event) {
        composing = false
        context.engine().parts.input.on.compositionend?.(event)
        event.currentTarget.value = context.engine().state.inputValue
      },
    },
  })
  return (
    <input
      {...spread(part(), attributes())}
      ref={(el) => {
        context.setInput(el)
        setRef(() => props.ref, el)
      }}
    />
  )
}

/** Geometry and native wrapper options for a combobox listbox. */
export type ComboboxPositionerProps = Omit<SelectionPopupProps, 'source'>
/** Hosts the popup in the top layer; popup search moves focus from Trigger into Input. */
function ComboboxPositioner(props: ComboboxPositionerProps): JSX.Element {
  const context = useCombobox()
  return <SelectionPopup {...props} source={context.source} />
}

/** Popup surface props; omitted children render the filtered items' text labels. */
export type ComboboxContentProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Static parts or a callback receiving the live filtered collection. */
  children?: ComboboxCollectionChildren
  /** Receives the listbox surface. */
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
            id: context.contentId(),
            role: context.popupInput ? 'dialog' : 'listbox',
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
        setRef(() => props.ref, el)
      }}
    >
      {props.children === undefined ? (
        context.popupInput ? (
          <ComboboxViewport />
        ) : (
          <DefaultItems />
        )
      ) : (
        <CollectionChildren>{props.children}</CollectionChildren>
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

/** Native trigger props; custom artwork is supplied through children. */
export type ComboboxTriggerProps = ComponentProps<'button'>
/** Button anchor in popup-input mode, otherwise an input-adjacent pointer toggle. */
function ComboboxTrigger(props: ComboboxTriggerProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props, 'ref', 'children')
  const id = () =>
    typeof props.id === 'string'
      ? props.id
      : (context.field?.ids.control ?? `${context.id}-trigger`)
  if (context.field && context.popupInput) {
    onCleanup(
      // eslint-disable-next-line solid/reactivity -- Field retains the live ID reader until disposal.
      context.field.registerControl(id, undefined, (event, control) => {
        if (control !== context.source.trigger()) return
        event.preventDefault()
        if (!context.disabled()) control.focus()
      })
    )
  }
  const controls = () =>
    context.source.open() || context.props.forceMount ? context.contentId() : undefined
  return (
    <button
      {...spread(
        {
          attrs: {
            id: id(),
            type: 'button',
            role: context.popupInput ? 'combobox' : undefined,
            tabindex: context.popupInput ? 0 : -1,
            disabled: context.disabled() || undefined,
            'aria-label': context.popupInput ? undefined : 'Show suggestions',
            'aria-haspopup': context.popupInput ? 'dialog' : undefined,
            'aria-required': context.popupInput && context.required() ? 'true' : undefined,
            'aria-readonly': context.popupInput && context.readonly() ? 'true' : undefined,
            'aria-invalid':
              context.popupInput && (context.props.invalid || context.field?.invalid())
                ? 'true'
                : undefined,
            'aria-controls': context.associations
              ? context.associations.attribute('aria-controls', controls)
              : controls(),
            'aria-expanded': context.source.open() ? 'true' : 'false',
            'data-state': context.source.open() ? 'open' : 'closed',
            'data-disabled': context.disabled() ? '' : undefined,
          },
          on: {
            pointerdown(event: PointerEvent) {
              if (!context.popupInput && event.button === 0) event.preventDefault()
            },
            click() {
              if (!context.popupInput) context.source.trigger()?.focus()
              context.changeOpen(!context.source.open())
            },
            keydown(event: KeyboardEvent) {
              if (
                !context.popupInput ||
                context.disabled() ||
                context.readonly() ||
                event.isComposing ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey
              )
                return
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                context.changeOpen(true)
              }
            },
          },
        } as PartProps<'button'>,
        {
          ...rest,
          'aria-labelledby':
            context.field && context.popupInput
              ? fieldLabelledBy(context.field, props['aria-labelledby'], true)
              : props['aria-labelledby'],
          'aria-describedby':
            context.field && context.popupInput
              ? fieldDescribedBy(context.field, props['aria-describedby'])
              : props['aria-describedby'],
        }
      )}
      ref={(el) => {
        context.setTrigger(el)
        setRef(() => props.ref, el)
      }}
    >
      {props.children}
    </button>
  )
}

/** Native value display props. */
export type ComboboxValueProps = ComponentProps<'span'> & { placeholder?: JSX.Element }
/** Displays the committed label independently of the editable search query. */
function ComboboxValue(props: ComboboxValueProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props, 'placeholder', 'children')
  return <span {...rest}>{props.children ?? (context.selectedLabel() || props.placeholder)}</span>
}

/** Measured arrow box; children provide the arrow artwork. */
function ComboboxArrow(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'ref')
  const positioning = useSelectionPositioner()
  onCleanup(() => positioning.setArrow(undefined))
  return (
    <div
      {...positioning.arrowProps()}
      {...rest}
      ref={(el) => {
        positioning.setArrow(el)
        setRef(() => props.ref, el)
      }}
    />
  )
}

/** Native viewport attributes; CSS owns scrolling and dimensions. */
export type ComboboxViewportProps = Omit<ComponentProps<'div'>, 'children'> & {
  /** Static options or a callback receiving the live filtered collection. */
  children?: ComboboxCollectionChildren
  /**
   * Render only the options in view; the viewport becomes the scroll container.
   * Options come from the root's items. Read once.
   */
  virtual?: VirtualOptions
  /** With `virtual`, renders the contents of one option. Defaults to its label. */
  renderItem?: (item: Option) => JSX.Element
}
/** Scroll container; owns the listbox role when search lives inside Content's dialog. */
export function ComboboxViewport(props: ComboboxViewportProps): JSX.Element {
  // eslint-disable-next-line solid/components-return-once -- virtual is read once.
  if (untrack(() => props.virtual)) return <VirtualViewport {...props} />
  const context = useCombobox()
  const rest = omit(props, 'children', 'virtual', 'renderItem')
  if (context.popupInput)
    // eslint-disable-next-line solid/reactivity -- The registry retains this ID getter for the viewport lifetime.
    onCleanup(context.registerListId(() => (typeof props.id === 'string' ? props.id : undefined)))
  return (
    <div
      data-part="viewport"
      data-state={context.source.open() ? 'open' : 'closed'}
      id={context.popupInput ? context.listId() : undefined}
      role={context.popupInput ? 'listbox' : undefined}
      aria-label={context.popupInput ? 'Suggestions' : undefined}
      {...rest}
    >
      {props.children === undefined ? (
        context.popupInput ? (
          <DefaultItems />
        ) : undefined
      ) : (
        <CollectionChildren>{props.children}</CollectionChildren>
      )}
    </div>
  )
}

/** Combobox.Viewport over a virtualizer. Rows are keyed by value, so filtering keeps them mounted. */
function VirtualViewport(props: ComboboxViewportProps): JSX.Element {
  const context = useCombobox()
  const rest = omit(props, 'children', 'virtual', 'renderItem')
  const options = untrack(() => props.virtual)!
  const render = untrack(() => props.renderItem) ?? ((item: Option) => item.label)
  if (context.popupInput)
    // eslint-disable-next-line solid/reactivity -- The registry retains this ID getter for the viewport lifetime.
    onCleanup(context.registerListId(() => (typeof props.id === 'string' ? props.id : undefined)))
  const index = createMemo(
    () => new Map(context.engine().state.items.map((item, position) => [item.value, position]))
  )
  const byValue = createMemo(
    () => new Map(context.engine().state.items.map((item) => [item.value, item]))
  )
  // The virtualizer calls this outside tracking scopes, so it closes over one snapshot.
  const getKey = createMemo(() => {
    const items = context.engine().state.items
    return (position: number) => items[position]?.value ?? position
  })
  function Bind(): JSX.Element {
    const handle = useVirtualList()
    context.setVirtual({ handle, index: (value) => index().get(value) ?? -1 })
    onCleanup(() => context.setVirtual(undefined))
    return undefined
  }
  function Row(row: { item: VirtualItem }): JSX.Element {
    const value = String(untrack(() => row.item.key))
    const item = untrack(() => byValue().get(value)) ?? { value, label: value }
    return (
      <VirtualList.Item
        item={row.item}
        {...spread(context.engine().parts.item(value), {
          id: context.optionId(value),
          'aria-setsize': String(context.engine().state.items.length),
          'aria-posinset': String((index().get(value) ?? 0) + 1),
        })}
      >
        {render(item)}
      </VirtualList.Item>
    )
  }
  return (
    <VirtualList
      data-part="viewport"
      data-state={context.source.open() ? 'open' : 'closed'}
      id={context.popupInput ? context.listId() : undefined}
      role={context.popupInput ? 'listbox' : undefined}
      aria-label={context.popupInput ? 'Suggestions' : undefined}
      {...rest}
      {...options}
      count={context.engine().state.items.length}
      getKey={getKey()}
    >
      <Bind />
      <VirtualList.Viewport>{(item: VirtualItem) => <Row item={item} />}</VirtualList.Viewport>
    </VirtualList>
  )
}

/** Native empty-state attributes. */
export type ComboboxEmptyProps = ComponentProps<'div'>
/** Status content visible only when filtering leaves no options. */
function ComboboxEmpty(props: ComboboxEmptyProps): JSX.Element {
  const context = useCombobox()
  return (
    <div
      role="status"
      data-part="empty"
      {...props}
      hidden={context.engine().state.items.length > 0}
    />
  )
}

/** A live read-only collection; use it in tracked JSX such as For's each prop. */
export type ComboboxCollectionChildren = JSX.Element | ((items: readonly Option[]) => JSX.Element)

/** Keep the collection identity stable so filtering does not recreate sibling controls. */
function CollectionChildren(props: { children: ComboboxCollectionChildren }): JSX.Element {
  const context = useCombobox()
  const items = createProjection<Option[]>(() => [...context.engine().state.items], [], {
    key: 'value',
  })
  return <>{typeof props.children === 'function' ? props.children(items) : props.children}</>
}

/** Default option markup shared by Content and Viewport. */
function DefaultItems(): JSX.Element {
  const context = useCombobox()
  return (
    <For each={context.engine().state.items}>
      {(item) => <ComboboxItem value={item.value}>{item.label}</ComboboxItem>}
    </For>
  )
}

/** Editable single-selection root and its independently rendered compound parts. */
export const Combobox = /* @__PURE__ */ Object.assign(ComboboxRoot, {
  /** Portal popup parts while the form mirror stays at Root. */
  Portal: OverlayPortal,
  /** Current selection label, with optional placeholder or custom children. */
  Value: ComboboxValue,
  /** Status for an empty filtered collection. */
  Empty: ComboboxEmpty,
  /** Optional scrolling wrapper for options inside Content. */
  Viewport: ComboboxViewport,
  /** Text input retaining DOM focus. */
  Input: ComboboxInput,
  /** Popup-search button anchor, or an outside-input pointer toggle. */
  Trigger: ComboboxTrigger,
  /** Floating native popup wrapper. */
  Positioner: ComboboxPositioner,
  /** Popup surface: a dialog for popup search, otherwise the listbox. */
  Content: ComboboxContent,
  /** Customizable option. */
  Item: ComboboxItem,
  /** Arrow geometry host. */
  Arrow: ComboboxArrow,
})
