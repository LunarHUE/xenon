import type { JSX } from '@solidjs/web'

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

export function changeKey(props: Record<string, unknown>): string {
  for (const key of Object.keys(props)) {
    if (key.toLowerCase() === 'onchange') return key
  }
  return 'onChange'
}
