/** A keyboard event whose current listener target is the HTML host to activate. */
export type Activation = KeyboardEvent & { currentTarget: HTMLElement }

/**
 * Synchronously dispatches a synthetic click on the keyboard event's current target.
 * The click bubbles, is cancelable and composed, and copies all four modifier keys.
 *
 * @remarks
 * Call during keyboard event dispatch while `currentTarget` is available. Callers
 * decide which keys and states activate and whether to prevent the keyboard default.
 * Click cancellation is not returned or copied back to the keyboard event.
 * The target document's `MouseEvent` constructor is used when available, with the
 * global constructor as a fallback.
 */
export function activate(event: Activation) {
  const { currentTarget, shiftKey, ctrlKey, altKey, metaKey } = event
  const view = currentTarget.ownerDocument.defaultView
  const Ctor = view?.MouseEvent ?? MouseEvent
  currentTarget.dispatchEvent(
    new Ctor('click', {
      bubbles: true,
      cancelable: true,
      composed: true,
      shiftKey,
      ctrlKey,
      altKey,
      metaKey,
    })
  )
}
