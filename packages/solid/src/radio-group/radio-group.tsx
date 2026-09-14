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

interface Own {
  value?: RadioValue
  defaultValue?: RadioValue
  onValueChange?: (value: RadioValue) => void
  name?: string
  form?: string
  orientation?: RadioGroupOrientation
  dir?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  ref?: (el: HTMLElement) => void
}

export type RadioGroupProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function byDomOrder(a: RadioGroupEntry, b: RadioGroupEntry): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

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

export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem })
