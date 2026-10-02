/** Observe owning-form resets before bubbling can be stopped, then restore after native reset completes. */
export function subscribeFormReset(
  document: Document,
  owningForm: () => HTMLFormElement | null,
  restore: () => void
): () => void {
  const pending = new Set<ReturnType<typeof setTimeout>>()
  let disposed = false
  const reset = (event: Event) => {
    const form = owningForm()
    if (!form || event.target !== form) return
    // Native dispatch can run microtasks between listeners; a task sees final
    // cancellation and runs after the browser's reset default action.
    const timer = setTimeout(() => {
      pending.delete(timer)
      if (!disposed && !event.defaultPrevented && owningForm() === form) restore()
    })
    pending.add(timer)
  }
  document.addEventListener('reset', reset, true)
  return () => {
    disposed = true
    document.removeEventListener('reset', reset, true)
    for (const timer of pending) clearTimeout(timer)
    pending.clear()
  }
}
