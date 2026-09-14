import { presence } from '@tenon/core'
import type { PartProps, PresenceStatus } from '@tenon/core'
import { waitForExit } from '@tenon/dom'
import { createEffect, createMemo, createSignal } from 'solid-js'

export interface PresenceSource {
  open: () => boolean
  forceMount?: () => boolean
}

export interface Presence {
  present: () => boolean
  status: () => PresenceStatus
  part: () => PartProps<'div'>
  ref: (el: HTMLElement) => void
}

export function createPresence(source: PresenceSource): Presence {
  let el: HTMLElement | undefined
  let mounted = false

  const open = createMemo(() => source.open())

  const [finished, setFinished] = createSignal(() => {
    open()
    const first = !mounted
    mounted = true
    return first
  })

  const status = createMemo<PresenceStatus>(() => {
    if (open()) return finished() ? 'entered' : 'entering'
    return finished() ? 'exited' : 'exiting'
  })

  const result = createMemo(() =>
    presence({ open: open(), status: status(), forceMount: source.forceMount?.() })
  )

  createEffect(
    () => (finished() ? undefined : open()),
    (phase) => {
      if (phase === undefined) return
      const done = () => setFinished(true)
      if (phase || !el) {
        const frame = requestAnimationFrame(done)
        return () => cancelAnimationFrame(frame)
      }
      return waitForExit(el, done)
    }
  )

  return {
    present: () => result().state.present,
    status,
    part: () => result().parts.root,
    ref: (node: HTMLElement) => {
      el = node
    },
  }
}

export function measure(el: HTMLElement, name: string, status: PresenceStatus): void {
  if (status === 'exited') {
    el.style.removeProperty(`--${name}-height`)
    el.style.removeProperty(`--${name}-width`)
    return
  }
  const settled = status === 'entered'
  el.style.setProperty(`--${name}-height`, settled ? 'auto' : `${el.scrollHeight}px`)
  el.style.setProperty(`--${name}-width`, settled ? 'auto' : `${el.scrollWidth}px`)
}
