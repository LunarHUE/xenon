export function waitForExit(el: Element, done: () => void): () => void {
  if (typeof el.getAnimations !== 'function') {
    done()
    return () => {}
  }

  let cancelled = false

  const frame = requestAnimationFrame(() => {
    const running = el.getAnimations().filter((animation) => animation.playState !== 'finished')
    if (running.length === 0) {
      done()
      return
    }
    Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (!cancelled) done()
    })
  })

  return () => {
    cancelled = true
    cancelAnimationFrame(frame)
  }
}
