import type { RadioItemHost, RadioValue } from '@xenon/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, createEffect, omit, onSettled } from 'solid-js'

import { useRadioGroup } from './context'
import type { RadioGroupEntry } from './context'
import { gate } from '../internal/gate'
import { changeKey, hiddenStyle } from '../internal/native'
import { spread } from '../spread'
import { toolbarHost } from '../internal/toolbar-host'

/** Identity and local state owned by one radio item. */
interface Own {
  /** Unique group identity; string and number values are not coerced into one another. */
  value: RadioValue
  /** Combine with group disabled state; disabled items cannot select and leave the navigation ring. Defaults to false. */
  disabled?: boolean
  /** Receives the visible host, not its optional native form mirror. */
  ref?: (el: HTMLElement) => void
}

/** Author change callback with its event type erased during prop merging. */
type Handler = (event: Event) => void

/** Item options and selected host props. Group name/form defaults may be overridden on the visible host; form mirrors use group values. */
export type RadioGroupItemProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Rendered host; defaults to a native radio input. */
    as?: T
  }

/** Classify literal input/button hosts; custom components use generic radio semantics. */
function hostOf(as: ValidComponent | undefined): RadioItemHost {
  if (as === undefined || as === 'input') return 'input'
  if (as === 'button') return 'button'
  return 'generic'
}

/**
 * Renders a radio item inside a radio group.
 *
 * @remarks
 * Native inputs select on change and leave keyboard behavior to the browser.
 * Buttons and generic hosts use axis arrows, Home, and End for focus/selection;
 * Space keyup activates, while Enter does not select. Readonly groups retain
 * custom-host navigation but suppress selection. Enabled author handlers run
 * before core handlers and can cancel them; {@link gate} suppresses supported
 * author activation handlers when the item is disabled or the group is readonly.
 *
 * Non-input hosts add an inaccessible, untabbable radio mirror only when the
 * group has an explicit name. Native inputs and mirrors carry group form and
 * required options. Their defaultChecked follows the current group defaultValue,
 * falling back to its controlled value; native change events schedule checked
 * repair even when the author cancels selection.
 *
 * Registration occurs on settlement and unregisters with the owner. Item
 * description IDs precede group IDs. Other author host attributes override core
 * attributes. This component does not independently consume Field context.
 * Toolbar.Button composition delegates tab stops, toolbar-axis arrows, Home, and
 * End to the toolbar without changing selection. Cross-axis keys retain group behavior.
 */
export function RadioGroupItem<T extends ValidComponent = 'input'>(
  props: RadioGroupItemProps<T>
): JSX.Element {
  const own = props as Own & { as?: ValidComponent; 'aria-describedby'?: string }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'value',
    'disabled',
    'ref',
    'aria-describedby'
  )
  const context = useRadioGroup('RadioGroup.Item')

  const composed = toolbarHost(() => own.as)
  const host = () => (composed.matches() ? 'button' : hostOf(own.as))
  const disabled = () => own.disabled ?? false
  const interactive = () => context.interactive() && !disabled()
  const checked = () => context.selected() === own.value

  const entry: RadioGroupEntry = {
    el: null,
    input: null,
    value: () => own.value,
    disabled,
  }

  const ref = (node: HTMLElement) => {
    entry.el = node
    if (node instanceof HTMLInputElement) entry.input = node
    own.ref?.(node)
  }

  const mirrorRef = (node: HTMLInputElement) => {
    entry.input = node
  }

  onSettled(() => context.register(entry))

  createEffect(
    () => context.fallback() === own.value,
    (value) => {
      if (entry.input) entry.input.defaultChecked = value
    }
  )

  /** Gate author activation and wrap native change before composing core handlers. */
  const merged = () => {
    const out: Record<string, unknown> = { ...rest }
    gate(out, interactive)
    if (host() === 'input') {
      const key = changeKey(out)
      const user = out[key]
      out[key] = (event: Event) => {
        if (typeof user === 'function') (user as Handler)(event)
        context.resync()
      }
    }
    return out
  }

  const mirrored = () => host() !== 'input' && context.name() !== undefined

  return (
    <>
      <Dynamic
        component={(own.as ?? 'input') as ValidComponent}
        ref={ref}
        {...spread(
          composed.part(
            context.part(own.value, { host: host(), describedBy: own['aria-describedby'] })
          ),
          merged()
        )}
      />
      <Show when={mirrored()}>
        <input
          type="radio"
          aria-hidden="true"
          tabindex={-1}
          style={hiddenStyle}
          ref={mirrorRef}
          name={context.name()}
          value={own.value}
          checked={checked()}
          disabled={context.disabled() || disabled()}
          required={context.required()}
          form={context.form()}
        />
      </Show>
    </>
  )
}
