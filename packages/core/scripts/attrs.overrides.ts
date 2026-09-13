/**
 * Hand-maintained facts the attribute data does not carry. The generator
 * reads this file; nothing at runtime does.
 */

/** Boolean attributes: presence is true, absence is false. WHATWG list. */
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

/** Attributes that are plain strings, never numbers. Everything else unlisted is `string | number`. */
export const strings = new Set(['class', 'id', 'lang', 'role', 'style', 'title', 'name', 'form'])

/**
 * Enumerated attributes: the generated type becomes a union of these strings.
 * `'*'` applies to every tag; a tag key applies to that tag only and wins.
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
 * booleans are the strings 'true' | 'false', never JS booleans.
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
