export function waitForExit(el: Element, done: () => void): () => void {
  if (typeof el.getAnimations !== 'function') {
    done()
    return () => {}
  }

  let cancelled = false

  const completed = new Set<Promise<Animation>>()
  const wait = () => {
    if (cancelled) return
    const pending = el
      .getAnimations()
      .filter((animation) => animation.playState !== 'finished')
      .map((animation) => animation.finished)
      .filter((finished) => !completed.has(finished))
    if (pending.length === 0) {
      done()
      return
    }
    Promise.allSettled(pending).then(() => {
      for (const finished of pending) completed.add(finished)
      // A canceled or restarted animation can have a replacement by now.
      wait()
    })
  }
  const frame = requestAnimationFrame(wait)

  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
  }
}
