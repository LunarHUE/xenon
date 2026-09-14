/** Light-DOM candidates for deciding whether the panel itself needs a tab stop. */
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

/**
 * Checks descendants for a candidate without disabled, contenteditable=false,
 * or a negative numeric tabindex. The root itself is excluded.
 *
 * @remarks
 * This is a structural panel heuristic. It does not measure visibility, inspect
 * hidden/inert ancestors, apply disabled-fieldset rules, or enter shadow roots.
 * A matching element may therefore be unavailable to actual keyboard navigation.
 * No focus is moved and no observers are installed by this function.
 */
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
