import { checkbox, toggleSwitch } from '@kit/core'
import type { CheckboxHost, CheckboxOptions } from '@kit/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { Show, createEffect, createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { gate } from './gate'
import { fieldDescribedBy, fieldLabelledBy, useFieldContext } from '../field/context'
import type { FieldContextValue } from '../field/context'
import { spread } from '../spread'

export interface CheckedOwn {
  checked?: CheckboxOptions['checked']
  defaultChecked?: boolean
  onCheckedChange?: CheckboxOptions['onCheckedChange']
  disabled?: CheckboxOptions['disabled']
  readonly?: CheckboxOptions['readonly']
  required?: CheckboxOptions['required']
  invalid?: CheckboxOptions['invalid']
  name?: CheckboxOptions['name']
  value?: CheckboxOptions['value']
  form?: CheckboxOptions['form']
  autofocus?: CheckboxOptions['autofocus']
  ref?: (el: HTMLElement) => void
}

type Own = CheckedOwn & {
  as?: ValidComponent
  indeterminate?: boolean
  id?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

type Handler = (event: Event) => void

const hiddenStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  border: '0',
  overflow: 'hidden',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
  opacity: '0',
  'pointer-events': 'none',
}

function hostOf(as: ValidComponent | undefined): CheckboxHost {
  if (as === undefined || as === 'input') return 'input'
  if (as === 'button') return 'button'
  return 'generic'
}

function withoutBlankValue(attrs: Record<string, unknown>): Record<string, unknown> {
  if ('value' in attrs && attrs['value'] === undefined) delete attrs['value']
  return attrs
}

function write(props: Record<string, unknown>, key: string, value: string | undefined): void {
  if (value === undefined) delete props[key]
  else props[key] = value
}

function changeKey(props: Record<string, unknown>): string {
  for (const key of Object.keys(props)) {
    if (key.toLowerCase() === 'onchange') return key
  }
  return 'onChange'
}

export function createChecked(props: object, kind: 'checkbox' | 'switch'): JSX.Element {
  const own = props as Own
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'checked',
    'defaultChecked',
    'onCheckedChange',
    'disabled',
    'readonly',
    'required',
    'invalid',
    'name',
    'value',
    'form',
    'autofocus',
    'indeterminate',
    'ref',
    'aria-labelledby',
    'aria-describedby'
  )

  const context = useFieldContext()
  if (isServer) context?.registerControl(() => own.id ?? context.ids.control)
  onSettled(() => context?.registerControl(() => own.id ?? context.ids.control))
  const flag = (value: boolean | undefined, read: (field: FieldContextValue) => boolean) =>
    context === null ? value : (value ?? false) || read(context)
  const name = () => own.name ?? context?.name()

  const [internal, setInternal] = createSignal(untrack(() => own.defaultChecked ?? false))
  const controlled = () => own.checked !== undefined
  const current = () => own.checked ?? internal()
  const indeterminate = createMemo(() =>
    kind === 'checkbox' ? (own.indeterminate ?? false) : undefined
  )

  const change = (next: boolean) => {
    if (!untrack(controlled)) setInternal(next)
    own.onCheckedChange?.(next)
  }

  const result = createMemo(() => {
    const options: CheckboxOptions = {
      host: hostOf(own.as),
      checked: current(),
      disabled: flag(own.disabled, (field) => field.disabled()),
      readonly: flag(own.readonly, (field) => field.readonly()),
      required: flag(own.required, (field) => field.required()),
      invalid: flag(own.invalid, (field) => field.invalid()),
      name: name(),
      value: own.value,
      form: own.form,
      autofocus: own.autofocus,
      onCheckedChange: change,
    }
    if (kind === 'switch') return toggleSwitch(options)
    return checkbox({ ...options, indeterminate: indeterminate() })
  })

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    own.ref?.(node)
  }

  let mirror: HTMLInputElement | undefined
  const mirrorRef = (node: HTMLInputElement) => {
    mirror = node
  }

  const sibling = () => (mirror?.isConnected ? mirror : undefined)

  const writeIndeterminate = (value = untrack(indeterminate)) => {
    if (value === undefined) return
    if (el instanceof HTMLInputElement) el.indeterminate = value
  }

  const resync = () => {
    onSettled(() => {
      const checked = result().state.checked
      if (el instanceof HTMLInputElement) el.checked = checked
      const input = sibling()
      if (input) input.checked = checked
      writeIndeterminate()
    })
  }

  const labelledBy = (host: CheckboxHost) =>
    context === null
      ? own['aria-labelledby']
      : fieldLabelledBy(
          context,
          own['aria-labelledby'],
          host !== 'generic',
          typeof own.as !== 'function'
        )

  const describedBy = () =>
    context === null
      ? own['aria-describedby']
      : fieldDescribedBy(context, own['aria-describedby'], typeof own.as !== 'function')

  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    const { state } = result()
    // eslint-disable-next-line solid/reactivity -- event handlers, re-applied by spread on change
    gate(out, () => result().state.interactive)
    write(out, 'aria-labelledby', labelledBy(state.host))
    write(out, 'aria-describedby', describedBy())
    if (context && out['id'] === undefined) out['id'] = context.ids.control
    if (state.host === 'input') {
      const key = changeKey(out)
      const user = out[key]
      out[key] = (event: Event) => {
        if (typeof user === 'function') (user as Handler)(event)
        resync()
      }
    }
    return out
  }

  const owningForm = (): HTMLFormElement | null => {
    const node = sibling() ?? el
    if (node instanceof HTMLInputElement || node instanceof HTMLButtonElement) return node.form
    return null
  }

  const fallback = () => own.defaultChecked ?? own.checked ?? false

  createEffect(
    () => indeterminate(),
    (value) => writeIndeterminate(value)
  )

  createEffect(
    () => fallback(),
    (value) => {
      if (el instanceof HTMLInputElement) el.defaultChecked = value
      const input = sibling()
      if (input) input.defaultChecked = value
    }
  )

  onSettled(() => {
    if (own.autofocus) el?.focus()
    writeIndeterminate()

    const node = el
    if (!node) return
    const doc = node.ownerDocument
    const restore = (event: Event) => {
      const form = owningForm()
      if (!form || event.target !== form || event.defaultPrevented) return
      if (own.checked === undefined) setInternal(fallback())
      resync()
    }
    doc.addEventListener('reset', restore)
    return () => doc.removeEventListener('reset', restore)
  })

  const mirrored = () => result().state.host !== 'input' && name() !== undefined

  return (
    <>
      <Dynamic
        component={(own.as ?? 'input') as ValidComponent}
        ref={ref}
        {...withoutBlankValue(spread(result().parts.root, merged()))}
      />
      <Show when={mirrored()}>
        <input
          type="checkbox"
          aria-hidden="true"
          tabindex={-1}
          style={hiddenStyle}
          ref={mirrorRef}
          checked={result().state.checked}
          disabled={result().state.disabled}
          required={result().state.required}
          name={name()}
          {...(own.value === undefined ? null : { value: own.value })}
          form={own.form}
        />
      </Show>
    </>
  )
}
