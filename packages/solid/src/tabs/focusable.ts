const SELECTOR = [
  'a[href]',
  'audio[controls]',
  'button',
  'details',
  'embed',
  'iframe',
  'input:not([type="hidden"])',
  'object',
  'select',
  'summary',
  'textarea',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]',
].join(',')

export function hasFocusable(root: Element): boolean {
  for (const el of root.querySelectorAll(SELECTOR)) {
    if (el.hasAttribute('disabled')) continue
    if (el.getAttribute('contenteditable') === 'false') continue
    const index = el.getAttribute('tabindex')
    if (index !== null && Number(index) < 0) continue
    return true
  }
  return false
}
