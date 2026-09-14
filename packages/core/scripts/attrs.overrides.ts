/**
 * HTML names generated as JavaScript boolean attributes before other overrides
 * are considered. Adapters serialize true as presence and false as absence.
 */
export const booleans = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'inert',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
  'shadowrootclonable',
  'shadowrootdelegatesfocus',
  'shadowrootserializable',
])

/** HTML names forced to string after boolean lookup, before enumerated overrides. */
export const strings = new Set(['class', 'id', 'lang', 'role', 'style', 'title', 'name', 'form'])

/**
 * Literal-value overrides keyed by HTML tag, then attribute name. The `*` entry
 * supplies fallback values when a tag-specific entry is absent. Only names in
 * the upstream attribute lists are emitted; an override does not add an attribute.
 * Values must be safe inside unescaped single-quoted TypeScript string literals.
 */
export const enumerated: Record<string, Record<string, readonly string[]>> = {
  '*': {
    autocapitalize: ['off', 'none', 'on', 'sentences', 'words', 'characters'],
    contenteditable: ['true', 'false', 'plaintext-only'],
    dir: ['ltr', 'rtl', 'auto'],
    draggable: ['true', 'false'],
    enterkeyhint: ['enter', 'done', 'go', 'next', 'previous', 'search', 'send'],
    inputmode: ['none', 'text', 'decimal', 'numeric', 'tel', 'search', 'email', 'url'],
    popover: ['auto', 'manual', 'hint'],
    spellcheck: ['true', 'false'],
    translate: ['yes', 'no'],
    writingsuggestions: ['true', 'false'],
  },
  a: {
    target: ['_self', '_blank', '_parent', '_top'],
  },
  button: {
    type: ['button', 'submit', 'reset'],
    formmethod: ['get', 'post', 'dialog'],
    popovertargetaction: ['toggle', 'show', 'hide'],
  },
  form: {
    method: ['get', 'post', 'dialog'],
    autocomplete: ['on', 'off'],
  },
  input: {
    type: [
      'button',
      'checkbox',
      'color',
      'date',
      'datetime-local',
      'email',
      'file',
      'hidden',
      'image',
      'month',
      'number',
      'password',
      'radio',
      'range',
      'reset',
      'search',
      'submit',
      'tel',
      'text',
      'time',
      'url',
      'week',
    ],
    formmethod: ['get', 'post', 'dialog'],
    popovertargetaction: ['toggle', 'show', 'hide'],
  },
  ol: {
    type: ['1', 'a', 'A', 'i', 'I'],
  },
  th: {
    scope: ['row', 'col', 'rowgroup', 'colgroup'],
  },
  textarea: {
    wrap: ['soft', 'hard'],
  },
}

/**
 * ARIA attributes with token values. Unlisted ones are `string`. ARIA
 * booleans are the strings 'true' | 'false', never JS booleans. Only names in
 * the upstream ARIA list are emitted. Tokens must be safe inside unescaped
 * single-quoted TypeScript string literals.
 */
export const aria: Record<string, readonly string[]> = {
  'aria-atomic': ['true', 'false'],
  'aria-autocomplete': ['inline', 'list', 'both', 'none'],
  'aria-busy': ['true', 'false'],
  'aria-checked': ['true', 'false', 'mixed'],
  'aria-current': ['page', 'step', 'location', 'date', 'time', 'true', 'false'],
  'aria-disabled': ['true', 'false'],
  'aria-dropeffect': ['copy', 'execute', 'link', 'move', 'none', 'popup'],
  'aria-expanded': ['true', 'false'],
  'aria-grabbed': ['true', 'false'],
  'aria-haspopup': ['true', 'false', 'menu', 'listbox', 'tree', 'grid', 'dialog'],
  'aria-hidden': ['true', 'false'],
  'aria-invalid': ['true', 'false', 'grammar', 'spelling'],
  'aria-live': ['off', 'polite', 'assertive'],
  'aria-modal': ['true', 'false'],
  'aria-multiline': ['true', 'false'],
  'aria-multiselectable': ['true', 'false'],
  'aria-orientation': ['horizontal', 'vertical'],
  'aria-pressed': ['true', 'false', 'mixed'],
  'aria-readonly': ['true', 'false'],
  'aria-relevant': ['additions', 'additions text', 'all', 'removals', 'text'],
  'aria-required': ['true', 'false'],
  'aria-selected': ['true', 'false'],
  'aria-sort': ['ascending', 'descending', 'none', 'other'],
}
