/** Browser hosts and current overlay state used by the viewport controller. */
export interface ViewportOptions {
  /** Host receiving transition attributes and size custom properties. */
  viewport: HTMLElement
  /** Live framework-owned children, which are never moved or cloned as components. */
  current: HTMLElement
  /** Current logical visibility. */
  open(): boolean
  /** Current activation anchor, used to calculate movement direction. */
  trigger(): HTMLElement | undefined
  /** Popup host receiving size custom properties for consumer CSS. */
  content(): HTMLElement | undefined
}

/** Lifecycle operations for a viewport owned by one mounted component. */
export interface ViewportController {
  /** Clone live DOM synchronously before changing an open overlay's content or trigger. */
  capture(): void
  /** Commit the captured switch after the framework has updated live DOM, or synchronize visibility. */
  sync(): void
  /** Remove snapshots and stop frame, animation completion, and resize work permanently. */
  dispose(): void
}

/** Copy visual DOM state without duplicate IDs or successful form controls. */
function snapshot(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement
  const originals = [source, ...source.querySelectorAll('*')]
  const copies = [clone, ...clone.querySelectorAll('*')]
  copies.forEach((copy, index) => {
    const original = originals[index]!
    for (const attr of ['id', 'for', 'form', 'name', 'autofocus']) copy.removeAttribute(attr)
    if (original.tagName === 'INPUT') {
      const input = original as HTMLInputElement
      const target = copy as HTMLInputElement
      if (input.type !== 'file') target.value = input.value
      target.checked = input.checked
      target.indeterminate = input.indeterminate
    } else if (original.tagName === 'TEXTAREA') {
      ;(copy as HTMLTextAreaElement).value = (original as HTMLTextAreaElement).value
    } else if (original.tagName === 'OPTION') {
      ;(copy as HTMLOptionElement).selected = (original as HTMLOptionElement).selected
    }
    if ('disabled' in copy) (copy as HTMLInputElement).disabled = true
    if (copy.hasAttribute('tabindex')) copy.setAttribute('tabindex', '-1')
  })
  clone.removeAttribute('data-current')
  clone.removeAttribute('data-starting-style')
  clone.setAttribute('data-previous', '')
  clone.setAttribute('aria-hidden', 'true')
  clone.setAttribute('inert', '')
  clone.style.position = 'absolute'
  clone.style.inset = '0 auto auto 0'
  clone.style.pointerEvents = 'none'
  return clone
}

/**
 * Animate changes through consumer CSS using inert DOM snapshots and measured size variables.
 * No animations are authored here. Both wrappers' finite animations must settle before
 * removal; cancellation counts as completion. Missing WAAPI settles immediately.
 */
export function createViewport(options: ViewportOptions): ViewportController {
  const { viewport, current } = options
  const view = viewport.ownerDocument.defaultView
  let previous: HTMLElement | undefined
  let from: DOMRect | undefined
  let pending = false
  let generation = 0
  let frame: number | undefined
  let disposed = false
  let observer: ResizeObserver | undefined
  const writes = new Map<HTMLElement, Map<string, string>>()
  const originals = new Map<HTMLElement, Map<string, string>>()

  function write(host: HTMLElement, name: string, value: string) {
    let saved = originals.get(host)
    if (!saved) originals.set(host, (saved = new Map()))
    if (!saved.has(name)) saved.set(name, host.style.getPropertyValue(name))
    if (host.style.getPropertyValue(name) !== value) host.style.setProperty(name, value)
    let values = writes.get(host)
    if (!values) writes.set(host, (values = new Map()))
    values.set(name, value)
  }

  function measure() {
    if (disposed || !options.open()) return
    const rect = current.getBoundingClientRect()
    for (const host of new Set(
      [viewport, options.content()].filter((el): el is HTMLElement => !!el)
    )) {
      for (const prefix of ['viewport', 'popup']) {
        write(host, `--${prefix}-width`, `${rect.width}px`)
        write(host, `--${prefix}-height`, `${rect.height}px`)
      }
    }
  }

  function clear() {
    generation++
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
    previous?.remove()
    previous = undefined
    pending = false
    current.removeAttribute('data-starting-style')
    viewport.removeAttribute('data-transitioning')
    viewport.removeAttribute('data-activation-direction')
    current.removeAttribute('data-activation-direction')
  }

  function sync() {
    if (disposed) return
    if (!options.open()) {
      clear()
      observer?.disconnect()
      observer = undefined
      return
    }
    if (!observer && view?.ResizeObserver) {
      observer = new view.ResizeObserver(measure)
      observer.observe(current)
    }
    if (!pending || !previous) {
      measure()
      return
    }
    pending = false
    const to = options.trigger()?.getBoundingClientRect()
    if (from && to) {
      const x = to.left + to.width / 2 - from.left - from.width / 2
      const y = to.top + to.height / 2 - from.top - from.height / 2
      const direction = [
        Math.abs(x) > 5 ? (x > 0 ? 'right' : 'left') : '',
        Math.abs(y) > 5 ? (y > 0 ? 'down' : 'up') : '',
      ]
        .filter(Boolean)
        .join(' ')
      if (direction)
        for (const host of [viewport, current, previous])
          host.setAttribute('data-activation-direction', direction)
    }
    viewport.setAttribute('data-transitioning', '')
    current.setAttribute('data-starting-style', '')
    viewport.appendChild(previous)
    // Flush starting styles and the previous dimensions before publishing the new size.
    current.getBoundingClientRect()
    const token = generation
    const old = previous
    const finish = () => {
      if (!disposed && token === generation) clear()
    }
    if (typeof current.getAnimations !== 'function' || !view?.requestAnimationFrame) {
      measure()
      finish()
      return
    }
    frame = view.requestAnimationFrame(() => {
      frame = undefined
      if (disposed || token !== generation) return
      current.removeAttribute('data-starting-style')
      old.setAttribute('data-ending-style', '')
      measure()
      const animations = [
        ...current.getAnimations({ subtree: true }),
        ...(old.getAnimations?.({ subtree: true }) ?? []),
      ].filter(
        (animation) =>
          animation.playState !== 'finished' &&
          animation.playState !== 'idle' &&
          animation.effect?.getComputedTiming().iterations !== Infinity
      )
      if (!animations.length) finish()
      else void Promise.allSettled(animations.map((animation) => animation.finished)).then(finish)
    })
  }

  return {
    capture() {
      if (disposed || !options.open()) return
      // Repeated writes in one framework batch still describe one outgoing DOM tree.
      if (pending) return
      clear()
      measure()
      from = options.trigger()?.getBoundingClientRect()
      previous = snapshot(current)
      const rect = current.getBoundingClientRect()
      previous.style.width = `${rect.width}px`
      previous.style.height = `${rect.height}px`
      pending = true
    },
    sync,
    dispose() {
      clear()
      disposed = true
      observer?.disconnect()
      for (const [host, values] of originals)
        for (const [name, value] of values) {
          if (host.style.getPropertyValue(name) !== writes.get(host)?.get(name)) continue
          if (value) host.style.setProperty(name, value)
          else host.style.removeProperty(name)
        }
      originals.clear()
      writes.clear()
    },
  }
}
