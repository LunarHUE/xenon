import { activate } from '../internal/activate'
import { composite } from '../composite/composite'
import { selection } from '../selection/selection'
import type { CompositeDirection } from '../composite/composite'
import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

/** Item identity and selection payload, retained without string coercion by the core. */
export type RadioValue = string | number

/**
 * Actual item host: native radio input, native button with a radio role, or a
 * generic element whose radio semantics and activation are supplied by the core.
 */
export type RadioItemHost = 'input' | 'button' | 'generic'

/** Axis used by custom-host arrow navigation and group orientation attributes. */
export type RadioGroupOrientation = 'horizontal' | 'vertical'

/** Current selection, navigation order, state, and native form associations. */
export interface RadioGroupOptions {
  /**
   * Ordered item identities for roving tabindex and custom-host navigation.
   * Supply distinct values in rendered order; the array is not copied or validated.
   * @defaultValue An empty array
   */
  items?: readonly RadioValue[]
  /** Current selection; undefined means none. Membership in `items` is not enforced. */
  value?: RadioValue
  /** Native input name. Also returned in state; custom hosts receive no form name. */
  name?: TagAttrs['input']['name']
  /** Form ID copied only to native input hosts. */
  form?: TagAttrs['input']['form']
  /**
   * Group axis. Only horizontal adds an explicit `aria-orientation` to the root.
   * Native input arrow handling remains the browser's responsibility.
   * @defaultValue `'vertical'`
   */
  orientation?: RadioGroupOrientation
  /**
   * Direction for custom-host horizontal arrows and the root's `dir` attribute.
   * Omission uses LTR navigation but leaves the root attribute undefined.
   */
  direction?: CompositeDirection
  /**
   * Wrap custom-host arrow navigation at the first and last enabled items.
   * @defaultValue `true`
   */
  loop?: boolean
  /**
   * Disable every item, remove item tab stops, and block selection commits.
   * @defaultValue `false`
   */
  disabled?: boolean
  /**
   * Block selection commits and click defaults while retaining enabled tab stops.
   * Custom-host arrow navigation may still request focus changes.
   * @defaultValue `false`
   */
  readonly?: boolean
  /**
   * Mark the root required and add native `required` to input hosts.
   * Does not initialize a selection or validate custom hosts.
   * @defaultValue `false`
   */
  required?: boolean
  /**
   * Add invalid state hooks and `aria-invalid` to the root and items.
   * @defaultValue `false`
   */
  invalid?: boolean
  /** Description IDs appended after each item's own IDs; not added to the root. */
  describedBy?: GlobalAttrs['aria-describedby']
  /**
   * Per-item disabled predicate, combined with the group flag. Disabled items
   * have tabindex -1, cannot commit selection, and are skipped by custom navigation.
   */
  itemDisabled?: (value: RadioValue) => boolean
  /**
   * Synchronous selection request with the original string or number value.
   * Runs for permitted activation or custom navigation when the proposed value
   * is strictly unequal to this snapshot's selection. Initialization is silent;
   * the caller stores the value and recomputes rather than mutating this result.
   */
  onValueChange?: (value: RadioValue) => void
  /**
   * Synchronous focus request when custom-host navigation finds a different item,
   * called before the selection request. The caller moves DOM focus. Native
   * input changes and clicks do not invoke it; readonly navigation can invoke it.
   */
  onActiveChange?: (value: RadioValue) => void
}

/** Host semantics and description IDs for one rendered item. */
export interface RadioItemOptions {
  /**
   * Match this to the actual rendered element; no host detection occurs.
   * @defaultValue `'input'`
   */
  host?: RadioItemHost
  /** Item description IDs placed before the group's IDs in `aria-describedby`. */
  describedBy?: GlobalAttrs['aria-describedby']
}

/** Resolved selection, navigation candidate, and group state flags. */
export interface RadioGroupState {
  /** Supplied selection, including values missing from the item order. */
  value: RadioValue | undefined
  /**
   * Enabled selected item, otherwise the first enabled item. Falls back to the
   * first item when all are disabled, though every disabled item keeps tabindex -1.
   * Undefined when the item order is empty; not a measurement of DOM focus.
   */
  active: RadioValue | undefined
  /** Unmodified native input name, or undefined. */
  name: string | undefined
  /** Resolved axis, defaulting to vertical. */
  orientation: RadioGroupOrientation
  /** Group-wide disabled flag, independent of individual item predicates. */
  disabled: boolean
  /** Whether selection commits are blocked while navigation remains available. */
  readonly: boolean
  /** Whether required semantics are requested; not a validation result. */
  required: boolean
  /** Caller-supplied invalid state, not computed from selection or requiredness. */
  invalid: boolean
  /** True only when neither group-disabled nor readonly; individual items may still be disabled. */
  interactive: boolean
}

/** Attribute and listener bundle for one of the supported actual item hosts. */
export type RadioItemPart = PartProps<'input'> | PartProps<'button'> | PartProps<'div'>

/** Group attributes and host-specific item factories for the current snapshot. */
export interface RadioGroupParts {
  /** Radiogroup role, orientation and group state attributes, with no handlers. */
  root: PartProps<'div'>
  /**
   * Native radio attributes, form association, and change-driven selection.
   * The browser owns keyboard behavior; no key handlers, role, or `aria-checked`
   * are supplied. The change listener requests this item's value without reading
   * the event target's checked state.
   */
  item(value: RadioValue, options?: RadioItemOptions & { host?: 'input' }): PartProps<'input'>
  /**
   * A type=button radio with native disabled state and custom keyboard handlers.
   * The adapter supplies form participation separately if needed.
   */
  item(value: RadioValue, options: RadioItemOptions & { host: 'button' }): PartProps<'button'>
  /** Radio role, checked/disabled ARIA, tabindex, and custom handlers for a generic host. */
  item(value: RadioValue, options: RadioItemOptions & { host: 'generic' }): PartProps<'div'>
  /** Select a host bundle at runtime; item membership in the group is not checked. */
  item(value: RadioValue, options: RadioItemOptions): RadioItemPart
}

/** Selection snapshot and renderable bundles; handlers do not update this state. */
export interface RadioGroupResult {
  /** Resolved values and flags for the supplied options. */
  state: RadioGroupState
  /** Group and item attributes/listeners to bind to matching hosts. */
  parts: RadioGroupParts
}

/** Join nonempty ID strings in order without trimming whitespace or removing duplicates. */
function tokens(...values: (string | undefined)[]): string | undefined {
  const present = values.filter((value): value is string => value !== undefined && value !== '')
  return present.length > 0 ? present.join(' ') : undefined
}

/**
 * Compute single-selection radio semantics for native or custom hosts.
 *
 * @remarks
 * Bind returned handlers and attributes, store requested selection changes, and
 * recompute after updates. No DOM focus, hidden inputs, validation, or form-reset
 * handling is installed by the core. Keep the options and item order unchanged
 * while using a result; callbacks and some options are read by its closures.
 *
 * Native inputs delegate keys and grouping to the browser. Custom hosts handle
 * arrows on the configured axis, Home, and End from the receiving item, skipping
 * disabled entries; modifier-key navigation is ignored. Enter and Space keydown
 * defaults are prevented. Enter does not select; a permitted Space keyup dispatches
 * a synthetic click. Selection occurs through the click handler, which does not
 * inspect `defaultPrevented`; an adapter honoring author cancellation must skip
 * that handler when canceled.
 */
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

  /** Request an allowed, strictly different value without changing the captured selection. */
  const commit = (item: RadioValue) => {
    if (!interactive || isDisabled(item)) return
    const next = picked.select(item)
    if (next !== undefined && next !== value) options.onValueChange?.(next as RadioValue)
  }

  /** Rebase keyboard movement on the event's item, independently of the selected tab stop. */
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

  /** Build a native input bundle, which leaves keyboard interaction to the browser. */
  function itemPart(
    item: RadioValue,
    itemOptions?: RadioItemOptions & { host?: 'input' }
  ): PartProps<'input'>
  /** Build a native button bundle with custom radio keyboard interaction. */
  function itemPart(
    item: RadioValue,
    itemOptions: RadioItemOptions & { host: 'button' }
  ): PartProps<'button'>
  /** Build a generic host bundle with ARIA disabled state and custom interaction. */
  function itemPart(
    item: RadioValue,
    itemOptions: RadioItemOptions & { host: 'generic' }
  ): PartProps<'div'>
  /** Preserve the host union when the requested host is only known at runtime. */
  function itemPart(item: RadioValue, itemOptions: RadioItemOptions): RadioItemPart
  /** Merge per-item disabled/description state and choose the actual host's attributes and listeners. */
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
