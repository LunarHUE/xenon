import { checkbox, toggleSwitch } from '@xenon-ui/core'
import type { CheckboxHost, CheckboxOptions } from '@xenon-ui/core'
import { Dynamic, isServer } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { Show, createEffect, createMemo, createSignal, omit, onSettled, untrack } from 'solid-js'

import { callEventHandler } from './events'
import { booleanAttribute, setRef } from './host'
import { useCheckboxGroup } from '../checkbox-group/context'
import { tokens } from '../field/context'

import { gate } from './gate'
import { fieldDescribedBy, fieldLabelledBy, useFieldContext } from '../field/context'
import type { FieldContextValue } from '../field/context'
import { spread } from '../spread'
import { subscribeFormReset } from './form-reset'

/** Shared library-owned props inherited by Checkbox and Switch. */
export interface CheckedOwn {
  /** Controlled checked value when defined. Undefined uses internal state initialized from defaultChecked. */
  checked?: CheckboxOptions['checked']
  /** Initial uncontrolled value, defaulting to false. Later changes affect native defaultChecked and form-reset fallback. */
  defaultChecked?: boolean
  /** Reports each accepted next value after updating uncontrolled state. Controlled callers must update checked; initialization is silent. */
  onCheckedChange?: CheckboxOptions['onCheckedChange']
  /** Blocks changes and gated author activation handlers. OR-combined with Field disabled state; defaults to false. */
  disabled?: JSX.BooleanAttribute
  /** Blocks changes while retaining focusability. OR-combined with Field readonly state; defaults to false. */
  readonly?: JSX.BooleanAttribute
  /** Native input requirement or ARIA requirement for custom hosts. OR-combined with Field required state. */
  required?: JSX.BooleanAttribute
  /** Invalid ARIA/data state, OR-combined with Field invalid state; does not perform validation. */
  invalid?: CheckboxOptions['invalid']
  /** Form name, falling back to Field name. A defined name enables a hidden checkbox mirror for non-input hosts. */
  name?: CheckboxOptions['name']
  /** Native submission value. Omission preserves the browser checkbox default rather than writing an empty value. */
  value?: CheckboxOptions['value']
  /** Form ID for the native input or hidden mirror, including a form outside the rendered ancestry. */
  form?: CheckboxOptions['form']
  /** Emits autofocus and requests focus on the rendered control after settling when true. */
  autofocus?: JSX.BooleanAttribute
  /** Receives the rendered visible control, never the hidden form mirror; custom hosts must forward it. */
  ref?: unknown
}

/** Internal host and Field association inputs shared by the checked-control adapters. */
type Own = CheckedOwn & {
  /** Rendered host; defaults to input. Only literal input/button choose native host semantics. */
  as?: ValidComponent
  /** Checkbox-only mixed state written to native input properties; ignored for switches. */
  indeterminate?: boolean
  /** Control ID, falling back to the enclosing Field control ID. */
  id?: string
  /** Author naming association combined with Field naming rules. */
  'aria-labelledby'?: string
  /** Author description association combined with Field descriptions and visible errors. */
  'aria-describedby'?: string
}

/** Visually clips the form mirror while retaining its native checkbox/form behavior. */
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

/** Infers semantics from the as value, without inspecting a custom component's rendered tag. */
function hostOf(as: ValidComponent | undefined): CheckboxHost {
  if (as === undefined || as === 'input') return 'input'
  if (as === 'button') return 'button'
  return 'generic'
}

/** Removes only an undefined value property in place to preserve native default checkbox submission. */
function withoutBlankValue(attrs: Record<string, unknown>): Record<string, unknown> {
  if ('value' in attrs && attrs['value'] === undefined) delete attrs['value']
  return attrs
}

/** Adds a resolved association or deletes its key when no association should override core props. */
function write(props: Record<string, unknown>, key: string, value: string | undefined): void {
  if (value === undefined) delete props[key]
  else props[key] = value
}

/** Reuses the author's event spelling when wrapping a native handler. */
function eventKey(props: Record<string, unknown>, name: string, fallback: string): string {
  for (const key of Object.keys(props)) {
    if (key.toLowerCase() === name) return key
  }
  return fallback
}

/**
 * Renders shared Checkbox/Switch behavior, including Field inheritance and native
 * form mirroring for a named non-input host.
 *
 * @remarks
 * Call within the component's reactive owner. checked determines controlled mode
 * on each read; defaultChecked seeds internal state once. Author events are merged
 * before core events, so preventDefault can cancel a change. Selected activation
 * handlers are gated while noninteractive. Native changes settle back to the current
 * state, and an uncanceled owning-form reset resets uncontrolled state to the
 * current fallback without calling onCheckedChange.
 *
 * Field control association is registered during server rendering and after client
 * settling. Native indeterminate is a DOM property applied on the client, not an
 * HTML attribute. Custom components must forward the supplied ref and host props.
 */
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

  const inherited = useFieldContext()
  const candidate = useCheckboxGroup()
  const group = kind === 'checkbox' ? candidate : null
  const member = () => group !== null && typeof own.value === 'string'
  const context = inherited === group?.field ? null : inherited
  if (isServer) context?.registerControl(() => own.id ?? context.ids.control)
  onSettled(() => context?.registerControl(() => own.id ?? context.ids.control))
  /** Field truthy flags take precedence over a local false; absence of a Field preserves the local value. */
  const flag = (
    value: JSX.BooleanAttribute | undefined,
    read: (field: FieldContextValue) => boolean
  ) => booleanAttribute(value) || (context !== null ? read(context) : false)
  const name = () => own.name ?? group?.field.name() ?? context?.name()
  const form = () => own.form ?? group?.form()

  const [internal, setInternal] = createSignal(untrack(() => own.defaultChecked ?? false))
  const controlled = () => member() || own.checked !== undefined
  const current = () =>
    member() ? group!.current().includes(own.value as string) : (own.checked ?? internal())
  const indeterminate = createMemo(() =>
    kind === 'checkbox' ? (own.indeterminate ?? false) : undefined
  )

  /** Updates only uncontrolled state, then notifies the current callback. */
  const change = (next: boolean) => {
    if (!untrack(controlled)) setInternal(next)
    if (member()) group!.change(own.value as string, next)
    own.onCheckedChange?.(next)
  }

  const result = createMemo(() => {
    const options: CheckboxOptions = {
      host: hostOf(own.as),
      checked: current(),
      disabled: flag(own.disabled, (field) => field.disabled()) || group?.field.disabled(),
      readonly: flag(own.readonly, (field) => field.readonly()) || group?.field.readonly(),
      required:
        flag(own.required, (field) => field.required()) ||
        (group?.field.required() && group.current().length === 0),
      invalid: flag(own.invalid, (field) => field.invalid()) || group?.field.invalid(),
      name: name(),
      value: own.value,
      form: form(),
      autofocus: booleanAttribute(own.autofocus),
      onCheckedChange: change,
    }
    if (kind === 'switch') return toggleSwitch(options)
    return checkbox({ ...options, indeterminate: indeterminate() })
  })

  let el: HTMLElement | undefined
  const ref = (node: HTMLElement) => {
    el = node
    setRef(own.ref, node)
  }

  let mirror: HTMLInputElement | undefined
  const mirrorRef = (node: HTMLInputElement) => {
    mirror = node
  }

  /** Uses the mirror only after it is connected, avoiding stale detached form controls. */
  const sibling = () => (mirror?.isConnected ? mirror : undefined)

  /** Writes checkbox-only mixed state to a visible native input, without changing checkedness. */
  const writeIndeterminate = (value = untrack(indeterminate)) => {
    if (value === undefined) return
    if (el instanceof HTMLInputElement) el.indeterminate = value
  }

  /** Schedules checked/mixed DOM restoration after native changes and form resets finish. */
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

  /** Merge raw ID readers before allocating one SSR marker for the complete attribute. */
  const describedBy = () => {
    if (group) {
      const read = () =>
        tokens(own['aria-describedby'], context?.describedBy(), group.field.describedBy())
      return typeof own.as === 'function'
        ? read()
        : group.field.association('aria-describedby', read)
    }
    return context === null
      ? own['aria-describedby']
      : fieldDescribedBy(context, own['aria-describedby'], typeof own.as !== 'function')
  }

  /** Gates selected author handlers, resolves Field associations, and wraps native changes for resync. */
  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    const { state } = result()
    // eslint-disable-next-line solid/reactivity -- event handlers, re-applied by spread on change
    gate(out, () => result().state.interactive)
    write(out, 'aria-labelledby', labelledBy(state.host))
    write(out, 'aria-describedby', describedBy())
    if (context && out['id'] === undefined) out['id'] = context.ids.control
    if (state.host === 'input') {
      const key = eventKey(out, 'onchange', 'onChange')
      const user = out[key]
      out[key] = (event: Event) => {
        callEventHandler(user, event)
        resync()
      }
      if (kind === 'switch') {
        const key = eventKey(out, 'onkeydown', 'onKeyDown')
        const user = out[key]
        // eslint-disable-next-line solid/reactivity -- event handler reads current state on dispatch
        out[key] = (event: KeyboardEvent) => {
          callEventHandler(user, event)
          if (
            event.key !== 'Enter' ||
            event.defaultPrevented ||
            event.isComposing ||
            !result().state.interactive ||
            el?.matches(':disabled')
          )
            return
          const form = owningForm()
          if (!form) return
          event.preventDefault()
          // Native checkboxes do not implicitly submit on Enter. Preserve the
          // first associated submitter, including buttons outside the form.
          const submitter = Array.from(
            form.ownerDocument.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
              'input, button'
            )
          ).find((node) => node.form === form && (node.type === 'submit' || node.type === 'image'))
          if (submitter?.matches(':disabled')) return
          if (submitter) form.requestSubmit(submitter)
          else form.requestSubmit()
        }
      }
    }
    return out
  }

  /** Uses a connected mirror first; otherwise only native input/button controls expose form ownership. */
  const owningForm = (): HTMLFormElement | null => {
    const node = sibling() ?? el
    if (node instanceof HTMLInputElement || node instanceof HTMLButtonElement) return node.form
    return null
  }

  /** Reset/defaultChecked value; a supplied defaultChecked takes precedence over controlled checked. */
  const fallback = () =>
    member()
      ? group!.fallback().includes(own.value as string)
      : (own.defaultChecked ?? own.checked ?? false)

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
    if (booleanAttribute(own.autofocus)) el?.focus()
    writeIndeterminate()

    const node = el
    if (!node) return
    const doc = node.ownerDocument
    return subscribeFormReset(doc, owningForm, () => {
      if (member()) group!.reset()
      else if (own.checked === undefined) setInternal(fallback())
      resync()
    })
  })

  /** Named non-input hosts render a native checkbox sibling for forms and validation. */
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
          form={form()}
        />
      </Show>
    </>
  )
}
