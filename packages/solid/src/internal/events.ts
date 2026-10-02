/** Invoke native Solid handler forms while preserving their receiver and bound data. */
export function callEventHandler(handler: unknown, event: Event): void {
  if (typeof handler === 'function') {
    handler.call(event.currentTarget, event)
  } else if (Array.isArray(handler)) {
    handler[0].call(event.currentTarget, handler[1], event)
  } else if (handler && typeof (handler as EventListenerObject).handleEvent === 'function') {
    ;(handler as EventListenerObject).handleEvent(event)
  }
}

/** Preserve listener-object options when composing handlers for native event attachment. */
export function wrapEventHandler(handler: unknown, run: (event: Event) => void): unknown {
  if (handler && typeof handler === 'object' && 'handleEvent' in handler) {
    const options = handler as EventListenerObject & AddEventListenerOptions
    return {
      handleEvent: run,
      capture: options.capture,
      once: options.once,
      passive: options.passive,
      signal: options.signal,
    }
  }
  return run
}
