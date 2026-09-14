import type { RadioItemHost, RadioValue } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { Show, createEffect, omit, onSettled } from 'solid-js'

import { useRadioGroup } from './context'
import type { RadioGroupEntry } from './context'
import { gate } from '../internal/gate'
import { changeKey, hiddenStyle } from '../internal/native'
import { spread } from '../spread'

interface Own {
  value: RadioValue
  disabled?: boolean
  ref?: (el: HTMLElement) => void
}

type Handler = (event: Event) => void

export type RadioGroupItemProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

function hostOf(as: ValidComponent | undefined): RadioItemHost {
  if (as === undefined || as === 'input') return 'input'
  if (as === 'button') return 'button'
  return 'generic'
}

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

  const host = () => hostOf(own.as)
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
          context.part(own.value, { host: host(), describedBy: own['aria-describedby'] }),
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
