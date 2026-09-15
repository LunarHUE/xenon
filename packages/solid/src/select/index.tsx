import { select } from '@xenon/core/select'
import type { SelectItem } from '@xenon/core/select'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
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
import type { SelectionPopupProps } from '../internal/selection-popup'
import { spread } from '../spread'
import { OverlayPortal } from '../internal/overlay-portal'
import { serverAssociations } from '../field/server-associations'

/** Wrapper-free single-value select with metadata available before the popup mounts. */
export interface SelectProps {
  /** Unique string values and searchable labels in option order. */
  items: readonly SelectItem[]
  /** Compound parts. */
  children?: JSX.Element
  /** Controlled selection when defined. */
  value?: string
  /** Initial uncontrolled selection and native form reset fallback. */
  defaultValue?: string
  /** Called only for changed interaction requests. */
  onValueChange?: (value: string | undefined) => void
  /** Controlled visibility when defined. */
  open?: boolean
  /** Initial visibility, default false. */
  defaultOpen?: boolean
  /** Called for changed visibility requests. */
  onOpenChange?: (open: boolean) => void
  /** Disable interaction, combined with Field state. */
  disabled?: boolean
  /** Preserve focusability while blocking changes, combined with Field state. */
  readonly?: boolean
  /** Native required validation, combined with Field state. */
  required?: boolean
  /** Invalid presentation, combined with Field state. */
  invalid?: boolean
  /** Submission name, falling back to Field. */
  name?: string
  /** Explicit native form owner ID. */
  form?: string
  /** Trigger ID, falling back to Field or a generated ID. */
  id?: string
  /** Keep closed popup mounted and hidden after exit. */
  forceMount?: boolean
  /** Popup layout direction; otherwise inherited from the trigger after mount. */
  dir?: 'ltr' | 'rtl'
}
function createSelect(props: SelectProps) {
  const field = useFieldContext()
  const associations = isServer ? serverAssociations() : undefined
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => props.defaultValue))
  const [internalOpen, setInternalOpen] = createSignal(untrack(() => props.defaultOpen ?? false))
  const [active, setActive] = createSignal<string>()
  const [search, setSearch] = createSignal('')
  const [trigger, setTrigger] = createSignal<HTMLElement>()
  const [content, setContent] = createSignal<HTMLElement>()
  const [ambient, setAmbient] = createSignal<'ltr' | 'rtl'>('ltr')
  onSettled(() => {
    const node = trigger()
    if (node)
      setAmbient(
        node.closest('[dir]')?.getAttribute('dir') === 'rtl' || node.ownerDocument.dir === 'rtl'
          ? 'rtl'
          : 'ltr'
      )
  })
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let triggerRead: (() => string | undefined) | undefined
  let contentRead: (() => string | undefined) | undefined
  const registerId = (part: 'trigger' | 'content', read: () => string | undefined) => {
    if (part === 'trigger') triggerRead = read
    else contentRead = read
    setRevision((value) => value + 1)
    return () => {
      if (part === 'trigger' && triggerRead === read) triggerRead = undefined
      if (part === 'content' && contentRead === read) contentRead = undefined
      setRevision((value) => value + 1)
    }
  }
  const optionIds = new Map<string, () => string | undefined>()
  const optionId = (value: string) => {
    revision()
    return optionIds.get(value)?.() ?? (engine().parts.item(value).attrs.id as string)
  }
  const registerOptionId = (value: string, read: () => string | undefined) => {
    optionIds.set(value, read)
    setRevision((n) => n + 1)
    return () => {
      if (optionIds.get(value) === read) optionIds.delete(value)
      setRevision((n) => n + 1)
    }
  }
  const value = () => props.value ?? internal()
  const disabled = () => (props.disabled ?? false) || (field?.disabled() ?? false)
  const readonly = () => (props.readonly ?? false) || (field?.readonly() ?? false)
  const required = () => (props.required ?? false) || (field?.required() ?? false)
  const open = () => !disabled() && !readonly() && (props.open ?? internalOpen())
  const triggerId = () => {
    revision()
    return triggerRead?.() ?? props.id ?? field?.ids.control ?? `${base}-trigger`
  }
  const contentId = () => {
    revision()
    return contentRead?.() ?? `${base}-content`
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const change = (next: string | undefined) => {
    if (
      disabled() ||
      readonly() ||
      next === value() ||
      (next !== undefined && !props.items.some((item) => item.value === next && !item.disabled))
    )
      return
    if (props.value === undefined) setInternal(next)
    props.onValueChange?.(next)
  }
  const changeOpen = (next: boolean) => {
    if (next === open()) return
    if (!next) {
      clearTimeout(timer)
      setSearch('')
      setActive(undefined)
    }
    if (props.open === undefined) setInternalOpen(next)
    props.onOpenChange?.(next)
  }
  onCleanup(() => clearTimeout(timer))
  const life = createPresence({ open, forceMount: () => props.forceMount ?? false })
  const compute = () =>
    select({
      items: props.items,
      value: value(),
      open: open(),
      activeValue: active(),
      disabled: disabled(),
      readonly: readonly(),
      required: required(),
      invalid: props.invalid || field?.invalid(),
      ids: { trigger: triggerId(), content: contentId() },
      search: search(),
      onValueChange: change,
      onOpenChange: changeOpen,
      onActiveChange: setActive,
      onSearchChange(next) {
        setSearch(next)
        clearTimeout(timer)
        timer = setTimeout(() => setSearch(''), 700)
      },
    })
  const memo = createMemo(compute)
  const engine = isServer ? compute : memo
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
  return {
    props,
    associations,
    field,
    value,
    disabled,
    readonly,
    required,
    open,
    triggerId,
    contentId,
    trigger,
    content,
    setTrigger,
    setContent,
    registerId,
    optionId,
    registerOptionId,
    change,
    changeOpen,
    life,
    engine,
    reset() {
      if (props.value === undefined) setInternal(props.defaultValue)
    },
    dir: () => props.dir ?? ambient(),
  }
}
const Context = createContext<ReturnType<typeof createSelect>>()
function useSelect(part: string) {
  const context = useContext(Context)
  if (!context) throw new Error(`${part} must be rendered inside <Select>`)
  return context
}
/** Owns selection and a clipped native select for submission, validation, autofill, and reset. */
export function SelectRoot(props: SelectProps): JSX.Element {
  const context = createSelect(props)
  let native: HTMLSelectElement | undefined
  onSettled(() => {
    if (!native) return
    const doc = native.ownerDocument
    let disposed = false
    const reset = (event: Event) => {
      if (event.target !== native?.form) return
      // A microtask can run before native reset dispatch and its default action finish.
      setTimeout(() => {
        if (disposed || event.defaultPrevented) return
        context.reset()
        flush()
        if (native) native.value = context.value() ?? ''
      })
    }
    doc.addEventListener('reset', reset)
    return () => {
      disposed = true
      doc.removeEventListener('reset', reset)
    }
  })
  const element = (
    <Context value={context}>
      {props.children}
      <select
        ref={(el) => {
          native = el
        }}
        aria-hidden="true"
        tabindex={-1}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          'white-space': 'nowrap',
          border: '0',
        }}
        name={props.name ?? context.field?.name()}
        form={props.form}
        disabled={context.disabled()}
        required={context.required() && !context.readonly()}
        value={context.value() ?? ''}
        onChange={(event) => {
          context.change(event.currentTarget.value)
          event.currentTarget.value = context.value() ?? ''
        }}
        onInvalid={(event) => {
          event.preventDefault()
          context.trigger()?.focus()
        }}
        onFocus={() => context.trigger()?.focus()}
      >
        <option value="" hidden selected={context.value() === undefined} />
        <For each={props.items}>
          {(item) => (
            <option
              value={item.value}
              disabled={item.disabled}
              selected={context.value() === item.value}
            >
              {item.label}
            </option>
          )}
        </For>
      </select>
    </Context>
  )
  // eslint-disable-next-line solid/components-return-once -- isServer is fixed for this runtime.
  return isServer ? context.associations!.finish(element) : element
}
/** Polymorphic trigger props. Custom hosts must forward attributes and ref. */
export type SelectTriggerProps<T extends ValidComponent = 'button'> = ComponentProps<T> & {
  /** Host tag or forwarding component, defaulting to the native host. */
  as?: T
  /** Receives the rendered host after internal registration. */
  ref?: (el: HTMLElement) => void
}
/** Keeps DOM focus while aria-activedescendant identifies the highlighted option. */
export function SelectTrigger<T extends ValidComponent = 'button'>(
  props: SelectTriggerProps<T>
): JSX.Element {
  const context = useSelect('Select.Trigger')
  const own = props as SelectTriggerProps<'button'>
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'id',
    'aria-labelledby',
    'aria-describedby'
  )
  onCleanup(context.registerId('trigger', () => (typeof own.id === 'string' ? own.id : undefined)))
  const register = () => context.field?.registerControl(context.triggerId)
  if (isServer) register()
  else onSettled(register)
  const part = () => ({
    ...context.engine().parts.trigger,
    attrs: {
      ...context.engine().parts.trigger.attrs,
      'aria-activedescendant': context.associations
        ? context.associations.attribute('aria-activedescendant', () =>
            context.open() && context.engine().state.activeValue !== undefined
              ? context.optionId(context.engine().state.activeValue!)
              : undefined
          )
        : context.open() && context.engine().state.activeValue !== undefined
          ? context.optionId(context.engine().state.activeValue!)
          : undefined,
      'aria-controls': context.associations
        ? context.associations.attribute('aria-controls', () =>
            context.open() ? context.contentId() : undefined
          )
        : context.engine().parts.trigger.attrs['aria-controls'],
      'aria-labelledby': context.field
        ? fieldLabelledBy(context.field, own['aria-labelledby'], false)
        : typeof own['aria-labelledby'] === 'string'
          ? own['aria-labelledby']
          : undefined,
      'aria-describedby': context.field
        ? fieldDescribedBy(context.field, own['aria-describedby'])
        : typeof own['aria-describedby'] === 'string'
          ? own['aria-describedby']
          : undefined,
    },
    on: {
      ...context.engine().parts.trigger.on,
      keydown(event: KeyboardEvent & { currentTarget: HTMLButtonElement }) {
        context.engine().parts.trigger.on.keydown?.(event)
        if (event.key === 'Tab') flush()
      },
    },
  })
  return (
    <Dynamic
      component={own.as ?? 'button'}
      {...spread(part(), rest)}
      ref={(el: HTMLElement) => {
        context.setTrigger(el)
        own.ref?.(el)
      }}
    >
      {own.children}
    </Dynamic>
  )
}
/** Displayed selection; placeholder defaults to empty text. */
export type SelectValueProps = ComponentProps<'span'> & {
  /** Content shown when no matching selected metadata exists. */
  placeholder?: JSX.Element
}
/** Renders the metadata label even when options have never mounted. */
export function SelectValue(props: SelectValueProps): JSX.Element {
  const context = useSelect('Select.Value')
  const rest = omit(props, 'placeholder', 'children')
  return (
    <span {...rest} data-placeholder={context.value() === undefined ? '' : undefined}>
      {props.children ?? context.engine().state.selectedItem?.label ?? props.placeholder}
    </span>
  )
}
/** Geometry options and native wrapper attributes. */
export type SelectPositionerProps = Omit<SelectionPopupProps, 'source'>
/** Positions and dismisses a nonmodal listbox without moving focus off the trigger. */
export function SelectPositioner(props: SelectPositionerProps): JSX.Element {
  const context = useSelect('Select.Positioner')
  return (
    <SelectionPopup
      {...props}
      source={{
        ...context,
        initial: () => false,
        restore: () => false,
        onDismiss: () => context.changeOpen(false),
      }}
    />
  )
}
/** Polymorphic popup surface attributes. */
export type SelectContentProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  /** Host tag or forwarding component, defaulting to the native host. */
  as?: T
  /** Receives the rendered host after internal registration. */
  ref?: (el: HTMLElement) => void
}
/** Renders the listbox surface and presence/placement hooks inside Positioner. */
export function SelectContent<T extends ValidComponent = 'div'>(
  props: SelectContentProps<T>
): JSX.Element {
  const context = useSelect('Select.Content')
  const positioning = useSelectionPositioner()
  const own = props as SelectContentProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children', 'id')
  onCleanup(context.registerId('content', () => (typeof own.id === 'string' ? own.id : undefined)))
  return (
    <Dynamic
      component={own.as ?? 'div'}
      {...spread(
        {
          ...context.engine().parts.content,
          attrs: {
            ...context.engine().parts.content.attrs,
            ...context.life.part().attrs,
            'data-side': positioning.state().side,
            'data-align': positioning.state().align,
          },
        },
        rest
      )}
      ref={(el: HTMLElement) => {
        context.setContent(el)
        context.life.ref(el)
        own.ref?.(el)
      }}
    >
      {own.children}
    </Dynamic>
  )
}
/** Option identity must exist in the root metadata; children may contain custom presentation. */
export type SelectItemProps<T extends ValidComponent = 'div'> = ComponentProps<T> & {
  /** Host tag or forwarding component, defaulting to div. */
  as?: T
  /** Nonempty root metadata identity, stable for this option lifetime. */
  value: string
}
/** Option with explicit selection and disabled state; author handlers can cancel interaction. */
export function SelectOption<T extends ValidComponent = 'div'>(
  props: SelectItemProps<T>
): JSX.Element {
  const context = useSelect('Select.Item')
  const own = props as unknown as SelectItemProps<'div'>
  const rest = omit(props as Record<string, unknown>, 'as', 'value', 'children')
  onCleanup(
    context.registerOptionId(own.value, () => (typeof own.id === 'string' ? own.id : undefined))
  )
  return (
    <Dynamic component={own.as ?? 'div'} {...spread(context.engine().parts.item(own.value), rest)}>
      {own.children ?? context.props.items.find((item) => item.value === own.value)?.label}
    </Dynamic>
  )
}
/** Decorative arrow sized and positioned by the shared positioning controller. */
export function SelectArrow(props: ComponentProps<'div'>): JSX.Element {
  const rest = omit(props, 'ref')
  const positioning = useSelectionPositioner()
  onCleanup(() => positioning.setArrow(undefined))
  return (
    <div
      {...rest}
      {...positioning.arrowProps()}
      ref={(el) => {
        positioning.setArrow(el)
        if (typeof props.ref === 'function') props.ref(el)
      }}
      aria-hidden="true"
    />
  )
}
/** Native div attributes, including children, ref, role, and event handlers. */
export type SelectViewportProps = ComponentProps<'div'>
/**
 * Optional scrolling wrapper inside Content. Content retains its listbox role;
 * options remain descendants and focus stays on the owning control. CSS supplies
 * scrolling styles. This div adds no role or tab stop by default.
 */
export function SelectViewport(props: SelectViewportProps): JSX.Element {
  const context = useSelect('Select.Viewport')
  return <div data-part="viewport" data-state={context.open() ? 'open' : 'closed'} {...props} />
}

/** Select-only combobox with wrapper-free state and compound presentation parts. */
export const Select = Object.assign(SelectRoot, {
  /** Portal popup parts while the form mirror stays at Root. */
  Portal: OverlayPortal,
  /** Optional scrolling wrapper for options inside Content. */
  Viewport: SelectViewport,
  /** Alias of the wrapper-free state and native-form provider. */
  Root: SelectRoot,
  /** Select-only combobox focus anchor and opening button. */
  Trigger: SelectTrigger,
  /** Selected metadata label or placeholder. */
  Value: SelectValue,
  /** Native top-layer wrapper owning geometry and dismissal. */
  Positioner: SelectPositioner,
  /** Listbox surface with presence and placement hooks. */
  Content: SelectContent,
  /** Option presentation and pointer selection. */
  Item: SelectOption,
  /** Measured decorative arrow box. */
  Arrow: SelectArrow,
})
export type { SelectItem } from '@xenon/core/select'
