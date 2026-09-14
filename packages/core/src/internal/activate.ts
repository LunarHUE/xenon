export type Activation = KeyboardEvent & { currentTarget: HTMLElement }

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
