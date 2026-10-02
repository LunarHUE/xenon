/** Resolves each description reference separately, preserving the author's order. */
export function assertDescriptionReferences(control: HTMLElement): HTMLElement[] {
  const ids = control.getAttribute('aria-describedby')?.trim().split(/\s+/).filter(Boolean)
  if (!ids?.length) throw new Error('Expected description references')
  return ids.map((id) => {
    const node = control.ownerDocument.getElementById(id)
    if (!node) throw new Error(`Description reference does not resolve: ${id}`)
    if (!node.textContent?.trim()) throw new Error(`Description reference has empty text: ${id}`)
    return node
  })
}

/** Checks real container focus as well as the mounted virtual focus target. */
export function assertVirtualFocus(container: HTMLElement, target: HTMLElement): void {
  if (container.ownerDocument.activeElement !== container)
    throw new Error('Virtual focus container does not have DOM focus')
  if (!target.id || container.getAttribute('aria-activedescendant') !== target.id)
    throw new Error('Virtual focus target does not match aria-activedescendant')
  if (container.ownerDocument.getElementById(target.id) !== target)
    throw new Error('Virtual focus target does not resolve to the mounted element')
}
