type Handler = (event: Event) => void

const pointerHandlers = [
  'onClick',
  'onAuxClick',
  'onDblClick',
  'onPointerDown',
  'onMouseDown',
] as const

const keyHandlers = ['onKeyDown', 'onKeyUp'] as const

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

export function gate(props: Record<string, unknown>, interactive: () => boolean): void {
  for (const name of pointerHandlers) {
    const user = props[name]
    if (typeof user !== 'function') continue
    const run = user as Handler
    props[name] = (event: Event) => {
      if (interactive()) run(event)
    }
  }
  for (const name of keyHandlers) {
    const user = props[name]
    if (typeof user !== 'function') continue
    const run = user as Handler
    props[name] = (event: Event) => {
      if (interactive() || !isActivationKey((event as KeyboardEvent).key)) run(event)
    }
  }
}
