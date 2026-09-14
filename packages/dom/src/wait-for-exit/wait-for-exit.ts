/**
 * Wait for the element's unfinished animations, including replacements observed
 * after their finished promises settle, before reporting exit completion.
 *
 * @remarks
 * Without getAnimations, calls done synchronously. Otherwise the first query runs
 * on the next global animation frame so newly applied exit styles can take effect.
 * Queries use getAnimations() without subtree inclusion and exclude only finished
 * play states. Paused or infinite animations can therefore delay completion
 * indefinitely; there is no timeout or filtering by animation/transition name.
 *
 * Resolving or rejecting all current finished promises triggers another query.
 * Promise identity prevents waiting again on settled promises while allowing a
 * restarted animation's new promise to extend the wait. New animations created
 * after the final empty query are not observed. No animation is started or canceled
 * and no element is removed by this helper.
 *
 * @param el - Element whose own getAnimations method supplies the animations.
 * @param done - Called once when a query has no unseen unfinished animations; not
 * called after cancellation, unless it already ran synchronously or completed.
 * @returns Cancel the initial frame and suppress later completion callbacks.
 * Cancellation is repeatable and does not cancel the underlying animations or promises.
 */
export function waitForExit(el: Element, done: () => void): () => void {
  if (typeof el.getAnimations !== 'function') {
    done()
    return () => {}
  }

  let cancelled = false

  /** Settled promise identities, including rejections from canceled animations. */
  const completed = new Set<Promise<Animation>>()
  /** Requery only after the previous batch settles, unless this wait was canceled. */
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
