import { activate } from '../internal/activate'
import { composite } from '../composite/composite'
import { selection } from '../selection/selection'
import type { CompositeDirection } from '../composite/composite'
import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

export type RadioValue = string | number

export type RadioItemHost = 'input' | 'button' | 'generic'

export type RadioGroupOrientation = 'horizontal' | 'vertical'

export interface RadioGroupOptions {
  items?: readonly RadioValue[]
  value?: RadioValue
  name?: TagAttrs['input']['name']
  form?: TagAttrs['input']['form']
  orientation?: RadioGroupOrientation
  direction?: CompositeDirection
  loop?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  describedBy?: GlobalAttrs['aria-describedby']
  itemDisabled?: (value: RadioValue) => boolean
  onValueChange?: (value: RadioValue) => void
  onActiveChange?: (value: RadioValue) => void
}

export interface RadioItemOptions {
  host?: RadioItemHost
  describedBy?: GlobalAttrs['aria-describedby']
}

export interface RadioGroupState {
  value: RadioValue | undefined
  active: RadioValue | undefined
  name: string | undefined
  orientation: RadioGroupOrientation
  disabled: boolean
  readonly: boolean
  required: boolean
  invalid: boolean
  interactive: boolean
}

export type RadioItemPart = PartProps<'input'> | PartProps<'button'> | PartProps<'div'>

export interface RadioGroupParts {
  root: PartProps<'div'>
  item(value: RadioValue, options?: RadioItemOptions & { host?: 'input' }): PartProps<'input'>
  item(value: RadioValue, options: RadioItemOptions & { host: 'button' }): PartProps<'button'>
  item(value: RadioValue, options: RadioItemOptions & { host: 'generic' }): PartProps<'div'>
  item(value: RadioValue, options: RadioItemOptions): RadioItemPart
}

export interface RadioGroupResult {
  state: RadioGroupState
  parts: RadioGroupParts
}

function tokens(...values: (string | undefined)[]): string | undefined {
  const present = values.filter((value): value is string => value !== undefined && value !== '')
  return present.length > 0 ? present.join(' ') : undefined
}

export function radioGroup(options: RadioGroupOptions = {}): RadioGroupResult {
  const items = options.items ?? []
  const orientation = options.orientation ?? 'vertical'
  const disabled = options.disabled ?? false
  const readonly = options.readonly ?? false
  const required = options.required ?? false
  const invalid = options.invalid ?? false
  const interactive = !disabled && !readonly

  const picked = selection<RadioValue>({ mode: 'single', value: options.value })
  const value = picked.values[0]

  const isDisabled = (item: RadioValue) => disabled || (options.itemDisabled?.(item) ?? false)

  const commit = (item: RadioValue) => {
    if (!interactive || isDisabled(item)) return
    const next = picked.select(item)
    if (next !== undefined && next !== value) options.onValueChange?.(next as RadioValue)
  }

  const navigation = (from: RadioValue | undefined, moved?: (item: RadioValue) => void) =>
    composite<RadioValue>({
      items,
      active: from,
      disabled: isDisabled,
      orientation,
      direction: options.direction,
      loop: options.loop ?? true,
      onActiveChange: moved,
    })

  const engine = navigation(value)

  const state: RadioGroupState = {
    value,
    active: engine.state.active,
    name: options.name,
    orientation,
    disabled,
    readonly,
    required,
    invalid,
    interactive,
  }

  const flags: GlobalAttrs = {
    'data-orientation': orientation,
    'data-disabled': disabled ? '' : undefined,
    'data-readonly': readonly ? '' : undefined,
    'data-required': required ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  const root: PartProps<'div'> = {
    attrs: {
      ...flags,
      role: 'radiogroup',
      dir: options.direction,
      'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
      'aria-disabled': disabled ? 'true' : undefined,
      'aria-readonly': readonly ? 'true' : undefined,
      'aria-required': required ? 'true' : undefined,
      'aria-invalid': invalid ? 'true' : undefined,
    },
    on: {},
  }

  function itemPart(
    item: RadioValue,
    itemOptions?: RadioItemOptions & { host?: 'input' }
  ): PartProps<'input'>
  function itemPart(
    item: RadioValue,
    itemOptions: RadioItemOptions & { host: 'button' }
  ): PartProps<'button'>
  function itemPart(
    item: RadioValue,
    itemOptions: RadioItemOptions & { host: 'generic' }
  ): PartProps<'div'>
  function itemPart(item: RadioValue, itemOptions: RadioItemOptions): RadioItemPart
  function itemPart(item: RadioValue, itemOptions: RadioItemOptions = {}): RadioItemPart {
    const host = itemOptions.host ?? 'input'
    const checked = picked.isSelected(item)
    const off = isDisabled(item)
    const stop = engine.parts.item(item).attrs.tabindex

    const common: GlobalAttrs = {
      ...flags,
      'data-state': checked ? 'checked' : 'unchecked',
      'data-checked': checked ? '' : undefined,
      'data-disabled': off ? '' : undefined,
      'aria-describedby': tokens(itemOptions.describedBy, options.describedBy),
      'aria-invalid': invalid ? 'true' : undefined,
      tabindex: off ? -1 : stop,
    }

    if (host === 'input') {
      const native: PartProps<'input'> = {
        attrs: {
          ...common,
          type: 'radio',
          name: options.name,
          value: item,
          form: options.form,
          checked,
          disabled: off || undefined,
          required: required || undefined,
        },
        on: {
          click(event) {
            if (!interactive) event.preventDefault()
          },
          change() {
            commit(item)
          },
        },
      }
      return native
    }

    const select = (event: Event) => {
      if (!interactive || off) {
        event.preventDefault()
        return
      }
      commit(item)
    }

    const keys = {
      keydown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault()
          return
        }
        const moves = navigation(item, (next) => {
          options.onActiveChange?.(next)
          commit(next)
        })
        moves.parts
          .item(item)
          .on.keydown?.(event as KeyboardEvent & { currentTarget: HTMLDivElement })
      },
      keyup(event: KeyboardEvent & { currentTarget: HTMLElement }) {
        if (event.key !== ' ') return
        event.preventDefault()
        if (interactive && !off) activate(event)
      },
    }

    const ariaChecked: GlobalAttrs['aria-checked'] = checked ? 'true' : 'false'

    if (host === 'button') {
      const pressable: PartProps<'button'> = {
        attrs: {
          ...common,
          role: 'radio',
          'aria-checked': ariaChecked,
          type: 'button',
          disabled: off || undefined,
        },
        on: { click: select, ...keys },
      }
      return pressable
    }

    const generic: PartProps<'div'> = {
      attrs: {
        ...common,
        role: 'radio',
        'aria-checked': ariaChecked,
        'aria-disabled': off ? 'true' : undefined,
      },
      on: { click: select, ...keys },
    }
    return generic
  }

  return { state, parts: { root, item: itemPart } }
}
