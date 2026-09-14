import { radioGroup } from '@tenon/core'
import type { AnyPart, CompositeDirection } from '@tenon/core'
import type { RadioGroupOrientation, RadioValue } from '@tenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, createUniqueId, omit, onSettled, untrack } from 'solid-js'

import { RadioGroupContext } from './context'
import type { RadioGroupContextValue, RadioGroupEntry } from './context'
import { RadioGroupItem } from './item'
import { spread } from '../spread'

/** Selection, navigation, and form options owned by the group adapter. */
interface Own {
  /** Controlled selection while defined; undefined uses internal state. Values retain their string or number type. */
  value?: RadioValue
  /** Initial uncontrolled selection, read once at setup; its current value is used again on form reset. */
  defaultValue?: RadioValue
  /** Synchronous request for a different selection, after updating uncontrolled state. Initialization and reset are silent. */
  onValueChange?: (value: RadioValue) => void
  /** Shared native radio name. Omission generates a name for native items but creates no custom-host mirrors. */
  name?: string
  /** Explicit form ID for native items and custom-host mirrors; omission uses form ancestry. */
  form?: string
  /** Custom-host navigation axis and group orientation. Defaults to vertical. */
  orientation?: RadioGroupOrientation
  /** Horizontal navigation direction. Omission uses LTR initially, then reads ancestor/document dir on settlement. */
  dir?: CompositeDirection
  /** Whether custom-host arrow navigation wraps. Defaults to true. */
  loop?: boolean
  /** Disables every item and removes their tab stops. Defaults to false. */
  disabled?: boolean
  /** Blocks selection while retaining custom-host arrow focus movement. Defaults to false. */
  readonly?: boolean
  /** Adds required group semantics and native validation attributes to radios/mirrors. Defaults to false. */
  required?: boolean
  /** Author-supplied invalid state for the group and items; no validation is performed. Defaults to false. */
  invalid?: boolean
  /** Receives the rendered group element. */
  ref?: (el: HTMLElement) => void
}

/** Group options combined with the selected host's props; owned options take precedence in the type. */
export type RadioGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Rendered group host; defaults to div. */
    as?: T
  }

/** Compare mounted hosts for registration order; missing hosts compare equally. */
function byDomOrder(a: RadioGroupEntry, b: RadioGroupEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Provides selection and item registration around a radiogroup host.
 *
 * @remarks
 * Item registration is sorted by DOM order when added; later DOM moves are not
 * observed. Custom-host navigation schedules focus on settlement; selection
 * callbacks run synchronously. Native input keys remain browser-owned.
 *
 * A document reset listener uses the first registered input's owning form. If
 * its reset has not been canceled when observed, uncontrolled state returns to
 * the current defaultValue and native checked state is repaired on settlement.
 * Controlled state remains authoritative. Listener cleanup follows the owner.
 *
 * Supply the accessible group name and any Field associations explicitly; this
 * adapter does not consume Field context. Group aria-describedby is also appended
 * to each item's description IDs. Author host attributes override core attributes.
 */
function RadioGroupRoot<T extends ValidComponent = 'div'>(props: RadioGroupProps<T>): JSX.Element {
  const own = props as Own & { as?: ValidComponent; 'aria-describedby'?: string }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'defaultValue',
    'onValueChange',
    'name',
    'form',
    'orientation',
    'dir',
    'loop',
    'disabled',
    'readonly',
    'required',
    'invalid',
    'ref',
    'children'
  )

  // Keyed children unregister while Solid disposes an owned computation.
  const [entries, setEntries] = createSignal<RadioGroupEntry[]>([], { ownedWrite: true })
  const [ambient, setAmbient] = createSignal<CompositeDirection>('ltr')
  const [internal, setInternal] = createSignal<RadioValue | undefined>(
    untrack(() => own.defaultValue)
  )

  const generated = createUniqueId()
  const controlled = () => own.value !== undefined
  const current = () => own.value ?? internal()
  const entryFor = (value: RadioValue) => entries().find((entry) => entry.value() === value)

  /** Store an uncontrolled request before notifying the author. */
  const change = (next: RadioValue) => {
    if (!untrack(controlled)) setInternal(next)
    own.onValueChange?.(next)
  }

  const result = createMemo(() =>
    radioGroup({
      items: entries().map((entry) => entry.value()),
      value: current(),
      name: own.name ?? generated,
      form: own.form,
      orientation: own.orientation ?? 'vertical',
      direction: own.dir ?? ambient(),
      loop: own.loop,
      disabled: own.disabled,
      readonly: own.readonly,
      required: own.required,
      invalid: own.invalid,
      describedBy: own['aria-describedby'],
      itemDisabled: (value) => entryFor(value)?.disabled() ?? false,
      onValueChange: change,
      onActiveChange: (value) => {
        onSettled(() => entryFor(value)?.el?.focus())
      },
    })
  )

  /** Repair browser-mutated checked properties after controlled or canceled changes. */
  const resync = () => {
    onSettled(() => {
      const value = result().state.value
      for (const entry of entries()) {
        if (entry.input) entry.input.checked = entry.value() === value
      }
    })
  }

  let registered: RadioGroupEntry[] = []
  const register = (entry: RadioGroupEntry) => {
    registered = [...registered, entry].sort(byDomOrder)
    setEntries(registered)
    return () => {
      registered = registered.filter((other) => other !== entry)
      setEntries(registered)
    }
  }

  const context: RadioGroupContextValue = {
    register,
    part: (value, request) => result().parts.item(value, request) as AnyPart,
    selected: () => result().state.value,
    fallback: () => own.defaultValue ?? own.value,
    name: () => own.name,
    form: () => own.form,
    required: () => result().state.required,
    disabled: () => result().state.disabled,
    interactive: () => result().state.interactive,
    resync,
  }

  const content = createMemo(() => (
    <RadioGroupContext value={context}>
      {(props as { children?: JSX.Element }).children}
    </RadioGroupContext>
  ))

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  /** Use the first registered native radio or mirror, including a null form owner. */
  const owningForm = (): HTMLFormElement | null => {
    for (const entry of entries()) if (entry.input) return entry.input.form
    return null
  }

  onSettled(() => {
    if (!el) return
    // The root reflects the engine's direction; read inheritance above it.
    const nearest = el.parentElement?.closest('[dir]')
    const value = nearest?.getAttribute('dir') ?? el.ownerDocument.dir
    setAmbient(value === 'rtl' ? 'rtl' : 'ltr')

    const doc = el.ownerDocument
    const restore = (event: Event) => {
      const form = owningForm()
      if (!form || event.target !== form || event.defaultPrevented) return
      if (own.value === undefined) setInternal(own.defaultValue)
      resync()
    }
    doc.addEventListener('reset', restore)
    return () => doc.removeEventListener('reset', restore)
  })

  return (
    <Dynamic
      component={(own.as ?? 'div') as ValidComponent}
      ref={ref}
      {...spread(result().parts.root, { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

/** Radio group root with a required-context Item component. See {@link RadioGroupProps}. */
export const RadioGroup = Object.assign(RadioGroupRoot, {
  /** Native radio by default, or a custom host with radio semantics and optional form mirror. */
  Item: RadioGroupItem,
})
