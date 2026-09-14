import type { JSX } from '@solidjs/web'

/**
 * Shared one-pixel clipped style for native form mirrors. Removes pointer hit
 * testing and visible artwork while preserving the input's form participation.
 * Callers supply aria-hidden and tabindex separately; treat this shared object as read-only.
 */
export const hiddenStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: '0',
  border: '0',
  overflow: 'hidden',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
  opacity: '0',
  'pointer-events': 'none',
}

/**
 * Returns the first own enumerable key matching onChange without regard to case,
 * or onChange when absent. Preserves spelling for handler replacement and does
 * not inspect the value's callability or mutate props.
 */
export function changeKey(props: Record<string, unknown>): string {
  for (const key of Object.keys(props)) {
    if (key.toLowerCase() === 'onchange') return key
  }
  return 'onChange'
}
