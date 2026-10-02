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
