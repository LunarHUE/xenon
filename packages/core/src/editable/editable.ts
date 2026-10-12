import type { PartProps } from '../part'

/** Pure inline editor state inputs. */
export interface EditableOptions {
  /** Last committed text. Defaults to empty. */
  value?: string
  /** Current uncommitted text; omitted draft uses value. */
  draft?: string
  /** Whether the input is shown. */
  editing?: boolean
  /** Prevents activation and editing. */
  disabled?: boolean
  /** Prevents activation and editing while keeping the preview focusable. */
  readonly?: boolean
  /** Requires nonempty submitted text. */
  required?: boolean
  /** Consumer validation state. */
  invalid?: boolean
  /** Requests an edit session. */
  onEdit?: () => void
  /** Receives text to commit; core does not change the snapshot. */
  onSubmit?: (value: string) => void
  /** Requests abandoning the current draft. */
  onCancel?: () => void
}

/** Inline editor actions and native part attributes. */
export interface EditableResult {
  /** Current editor state. */
  state: {
    /** Last committed text. */
    value: string
    /** Current draft. */
    draft: string
    /** Whether the input is visible. */
    editing: boolean
    /** Whether changes are allowed. */
    interactive: boolean
  }
  /** Enters editing when interactive and currently in preview. */
  edit(): void
  /** Submits only while editing and interactive. */
  submit(): void
  /** Cancels an active session, including one disabled during editing. */
  cancel(): void
  /** Parts retain both input and preview in the DOM. */
  parts: {
    /** Root styling. */
    root: PartProps<'div'>
    /** Focusable, button-like preview with state-dependent visibility. */
    preview: PartProps<'span'>
    /** Native textbox flags and state-dependent visibility. */
    input: PartProps<'input'>
    /** Native edit button. */
    editTrigger: PartProps<'button'>
    /** Native commit button. */
    submitTrigger: PartProps<'button'>
    /** Native cancel button. */
    cancelTrigger: PartProps<'button'>
  }
}

/** Builds an inline edit session without storing drafts or touching focus. */
export function editable(options: EditableOptions = {}): EditableResult {
  const value = options.value ?? ''
  const draft = options.draft ?? value
  const editing = options.editing ?? false
  const interactive = !options.disabled && !options.readonly
  const edit = () => {
    if (interactive && !editing) options.onEdit?.()
  }
  const submit = () => {
    if (interactive && editing) options.onSubmit?.(draft)
  }
  const cancel = () => {
    if (editing) options.onCancel?.()
  }
  const flags = {
    'data-state': editing ? 'editing' : 'preview',
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-required': options.required ? '' : undefined,
    'data-invalid': options.invalid ? '' : undefined,
    'data-empty': value === '' ? '' : undefined,
  }
  return {
    state: { value, draft, editing, interactive },
    edit,
    submit,
    cancel,
    parts: {
      root: { attrs: flags, on: {} },
      preview: {
        attrs: {
          ...flags,
          role: 'button',
          tabindex: options.disabled ? -1 : 0,
          hidden: editing || undefined,
          'aria-disabled': !interactive ? 'true' : undefined,
        },
        on: {},
      },
      input: {
        attrs: {
          ...flags,
          type: 'text',
          value: draft,
          hidden: !editing || undefined,
          disabled: options.disabled || undefined,
          readonly: options.readonly || undefined,
          required: options.required || undefined,
          'aria-invalid': options.invalid ? 'true' : undefined,
        },
        on: {},
      },
      editTrigger: {
        attrs: {
          ...flags,
          type: 'button',
          hidden: editing || undefined,
          disabled: !interactive || undefined,
          'aria-label': 'Edit',
        },
        on: { click: edit },
      },
      submitTrigger: {
        attrs: {
          ...flags,
          type: 'button',
          hidden: !editing || undefined,
          disabled: !interactive || undefined,
          'aria-label': 'Save',
        },
        on: { click: submit },
      },
      cancelTrigger: {
        attrs: { ...flags, type: 'button', hidden: !editing || undefined, 'aria-label': 'Cancel' },
        on: { click: cancel },
      },
    },
  }
}
