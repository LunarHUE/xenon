import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

/** Caller-owned IDs for the rendered field parts; the core generates no IDs. */
export interface FieldIds {
  /** Control ID and the label's `for` target. */
  control?: string
  /** Label ID; also available for the control's ARIA naming fallback. */
  label?: string
  /** Description ID, referenced only when {@link FieldOptions.hasDescription} is true. */
  description?: string
  /** Error ID, referenced only when the field is invalid and has a rendered error. */
  error?: string
}

/**
 * Current field state and rendered-part associations.
 *
 * State flags produce data attributes on every part. The caller applies native
 * disabled, required, and readonly behavior to its chosen control.
 */
export interface FieldOptions {
  /** IDs to copy onto parts and use for label and description associations. */
  ids?: FieldIds
  /**
   * Publish disabled state without preventing interaction.
   * @defaultValue `false`
   */
  disabled?: boolean
  /**
   * Publish required state without adding native or ARIA required attributes.
   * @defaultValue `false`
   */
  required?: boolean
  /**
   * Publish readonly state without preventing edits.
   * @defaultValue `false`
   */
  readonly?: boolean
  /**
   * Publish invalid state, set `aria-invalid="true"`, and allow an error reference.
   * @defaultValue `false`
   */
  invalid?: boolean
  /** Form name copied to the returned state and control attributes. */
  name?: TagAttrs['input']['name']
  /**
   * Author description IDs, placed before rendered description and error IDs
   * in `aria-describedby`. Empty strings are excluded; IDs are not deduplicated.
   */
  describedBy?: GlobalAttrs['aria-describedby']
  /**
   * Author naming IDs, followed by the label ID in `aria-labelledby`.
   * When undefined and a control ID exists, `aria-labelledby` is undefined so
   * the native label association can name the control. Without a control ID,
   * the label ID supplies the ARIA fallback. An empty string is an explicit value.
   */
  labelledBy?: GlobalAttrs['aria-labelledby']
  /**
   * Whether the description part is rendered and its ID may be referenced.
   * Does not determine whether the description bundle is returned.
   * @defaultValue `false`
   */
  hasDescription?: boolean
  /**
   * Whether the error part is rendered. Its ID is referenced only while invalid;
   * this option does not hide the error or remove its returned bundle.
   * @defaultValue `false`
   */
  hasError?: boolean
}

/** Resolved state for an adapter to apply to its control; flags default to false. */
export interface FieldState {
  /** Whether every part receives `data-disabled`. */
  disabled: boolean
  /** Whether every part receives `data-required`. */
  required: boolean
  /** Whether every part receives `data-readonly`. */
  readonly: boolean
  /** Whether parts receive `data-invalid` and the control receives `aria-invalid`. */
  invalid: boolean
  /** Unmodified form name supplied by the caller, or undefined. */
  name: string | undefined
}

/** Host-independent attributes to merge onto the field's actual control. */
export interface FieldControlProps {
  /**
   * ID, name, state hooks, and ARIA associations. Native disabled, required,
   * and readonly attributes are the adapter's responsibility.
   */
  attrs: GlobalAttrs & {
    /** Form name copied from {@link FieldOptions.name}. */
    name?: TagAttrs['input']['name']
  }
  /** Always empty; the field supplies no interaction handlers. */
  on: Record<never, never>
}

/** A state snapshot and attribute bundles; every part has empty handlers. */
export interface FieldResult {
  /** Normalized flags and the caller's form name. */
  state: FieldState
  /** All five bundles are returned regardless of which parts the caller renders. */
  parts: {
    /** Group role and shared state hooks for the field wrapper. */
    root: PartProps<'div'>
    /** Label ID, native `for` association, and shared state hooks. */
    label: PartProps<'label'>
    /** Description ID and shared state hooks, with no imposed role. */
    description: PartProps<'p'>
    /** Error ID, shared state hooks, and an unconditional `alert` role. */
    error: PartProps<'p'>
    /** Associations and state attributes for the caller's control host. */
    control: FieldControlProps
  }
}

/**
 * Join nonempty association strings in order. Preserve whitespace and duplicate
 * IDs within supplied strings; return undefined when there are no entries.
 */
function tokens(...values: (string | undefined)[]): string | undefined {
  const present = values.filter((value): value is string => value !== undefined && value !== '')
  return present.length > 0 ? present.join(' ') : undefined
}

/**
 * Compute field state, styling hooks, and label/description associations.
 *
 * @remarks
 * This function creates no elements, generates no IDs, and installs no handlers.
 * The caller reports which descriptive parts exist and decides whether to render
 * errors. Error IDs join `aria-describedby` only while invalid; no
 * `aria-errormessage` attribute is produced. Recompute with new options when
 * state or rendered associations change.
 *
 * @returns A fresh snapshot with all part bundles, including unrendered parts.
 */
export function field(options: FieldOptions = {}): FieldResult {
  const ids = options.ids ?? {}
  const disabled = options.disabled ?? false
  const required = options.required ?? false
  const readonly = options.readonly ?? false
  const invalid = options.invalid ?? false

  const state: FieldState = { disabled, required, readonly, invalid, name: options.name }

  const flags: GlobalAttrs = {
    'data-disabled': disabled ? '' : undefined,
    'data-required': required ? '' : undefined,
    'data-readonly': readonly ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  const named = tokens(options.labelledBy, ids.label)
  const labelledBy =
    options.labelledBy === undefined && ids.control !== undefined ? undefined : named

  const describedBy = tokens(
    options.describedBy,
    options.hasDescription ? ids.description : undefined,
    invalid && options.hasError ? ids.error : undefined
  )

  return {
    state,
    parts: {
      root: { attrs: { ...flags, role: 'group' }, on: {} },
      label: { attrs: { ...flags, id: ids.label, for: ids.control }, on: {} },
      description: { attrs: { ...flags, id: ids.description }, on: {} },
      error: { attrs: { ...flags, id: ids.error, role: 'alert' }, on: {} },
      control: {
        attrs: {
          ...flags,
          id: ids.control,
          name: options.name,
          'aria-labelledby': labelledBy,
          'aria-describedby': describedBy,
          'aria-invalid': invalid ? 'true' : undefined,
        },
        on: {},
      },
    },
  }
}
