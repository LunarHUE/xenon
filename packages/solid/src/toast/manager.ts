import { createSignal, untrack } from 'solid-js'
import type { JSX } from '@solidjs/web'
import { toastDuration, toastLimit, visibleToastIds } from '@tenon/core/toast'
import type { ToastPriority, ToastType } from '@tenon/core/toast'

export type { ToastPriority, ToastType }
/** An optional notification action rendered by Toast.Action. */
export interface ToastAction {
  /** Action content. */
  label: JSX.Element
  /** Runs when the user activates the action. Dismiss explicitly if desired. */
  onClick: (event: MouseEvent) => void
}
/** Content and lifetime supplied when adding a notification. */
export interface ToastOptions<T = unknown> {
  /** Author ID. Existing open IDs update in place; exiting IDs reopen at the front. */
  id?: string
  /** Notification heading. */
  title?: JSX.Element
  /** Supporting content. */
  description?: JSX.Element
  /** Visual variant. Defaults to default. */
  type?: ToastType
  /** Milliseconds before dismissal; zero or Infinity persists. */
  duration?: number
  /** Live announcement urgency. Defaults to low. */
  priority?: ToastPriority
  /** Optional action control. */
  action?: ToastAction
  /** Application data passed through without interpretation. */
  data?: T
  /** Called once when this notification starts dismissal. */
  onDismiss?: () => void
  /** Called once after the notification leaves the collection. */
  onRemove?: () => void
}
/** Stable reactive notification object supplied to a keyed For loop. */
export interface ToastRecord<T = unknown> extends Omit<
  ToastOptions<T>,
  'id' | 'type' | 'duration' | 'priority'
> {
  /** Stable collection key. */
  readonly id: string
  /** Resolved visual variant. */
  readonly type: ToastType
  /** Resolved lifetime in milliseconds. */
  readonly duration: number
  /** Resolved announcement urgency. */
  readonly priority: ToastPriority
  /** False while the exit animation runs. */
  readonly open: boolean
  /** True while waiting for a slot. */
  readonly limited: boolean
  /** Increments on content updates so announcers can repeat changed messages. */
  readonly revision: number
}
/** Content updates cannot change identity or reopen a dismissed notification. */
export type ToastPatch<T = unknown> = Omit<ToastOptions<T>, 'id'>
/** Provider defaults. Configuration changes apply to subsequent additions. */
export interface ToastManagerOptions {
  /** Default duration in milliseconds. Defaults to 5000. */
  duration?: number
  /** Maximum admitted records, including exits. Defaults to 3. */
  limit?: number
}
/** A promise stage may be plain title content or full notification options. */
export type ToastMessage<T = unknown> = JSX.Element | ToastOptions<T>
/** Promise stages update one notification without resurrecting dismissed records. */
export interface ToastPromiseOptions<Value, T = unknown> {
  /** Initial persistent loading notification. */
  loading: ToastMessage<T>
  /** Resolved content or a function of the fulfilled value. */
  success: ToastMessage<T> | ((value: Value) => ToastMessage<T>)
  /** Rejected content or a function of the rejection reason. */
  error: ToastMessage<T> | ((error: unknown) => ToastMessage<T>)
}
/** Per-provider notification collection, also safe to create outside a reactive owner. */
export interface ToastManager<T = unknown> {
  /** Reactive collection including waiting and exiting notifications. */
  toasts: () => readonly ToastRecord<T>[]
  /** Add a notification and return its stable ID. */
  add: (options: ToastOptions<T>) => string
  /** Update an open notification, preserving elapsed time unless duration is supplied. */
  update: (id: string, patch: ToastPatch<T> | ((toast: ToastRecord<T>) => ToastPatch<T>)) => void
  /** Start one exit, or all current exits when no ID is supplied. */
  dismiss: (id?: string) => void
  /** Remove an exited notification after its animation. */
  remove: (id: string) => void
  /** Add a success notification. */
  success: (title: JSX.Element, options?: ToastPatch<T>) => string
  /** Add an error notification. */
  error: (title: JSX.Element, options?: ToastPatch<T>) => string
  /** Add an informational notification. */
  info: (title: JSX.Element, options?: ToastPatch<T>) => string
  /** Add a warning notification. */
  warning: (title: JSX.Element, options?: ToastPatch<T>) => string
  /** Add a persistent loading notification. */
  loading: (title: JSX.Element, options?: ToastPatch<T>) => string
  /** Follow a promise using one notification ID. */
  promise: <Value>(promise: PromiseLike<Value>, options: ToastPromiseOptions<Value, T>) => string
  /** Apply provider defaults. */
  configure: (options: ToastManagerOptions) => void
  /** Attach a provider and return its timer cleanup. Events before attachment remain queued. */
  attach: () => () => void
  /** Pause timers under an independent reason, such as hover or focus. */
  pause: (reason: string) => void
  /** Release one pause reason; others continue to hold timers. */
  resume: (reason: string) => void
}

/** Create an isolated manager. No global collection or owner is retained. */
export function createManager<T = unknown>(options: ToastManagerOptions = {}): ToastManager<T> {
  type Snapshot = ToastRecord<T>
  type Entry = {
    record: Snapshot
    read: () => Snapshot
    write: (value: Snapshot) => void
    remaining: number
    started?: number
    timer?: ReturnType<typeof setTimeout>
    generation: number
  }
  let defaults = { duration: toastDuration(options.duration), limit: toastLimit(options.limit) }
  let entries: Entry[] = []
  let serial = 0
  const prefix = `toast-${Math.random().toString(36).slice(2)}`
  let attached = 0
  const reasons = new Set<string>()
  const [trackToasts, setToasts] = createSignal<readonly Snapshot[]>([], { ownedWrite: true })
  let currentToasts: readonly Snapshot[] = []
  const toasts = () => {
    trackToasts()
    return currentToasts
  }
  const find = (id: string) => entries.find((entry) => entry.read().id === id)
  const stop = (entry: Entry) => {
    if (entry.timer !== undefined) clearTimeout(entry.timer)
    if (entry.started !== undefined)
      entry.remaining = Math.max(0, entry.remaining - (Date.now() - entry.started))
    entry.timer = undefined
    entry.started = undefined
  }
  const sync = () => {
    const visible = visibleToastIds(
      entries.map((entry) => entry.read()),
      defaults.limit
    )
    for (const entry of entries) {
      const state = entry.read()
      const limited = !visible.has(state.id)
      if (state.limited !== limited) entry.write({ ...state, limited })
      if (
        !attached ||
        reasons.size ||
        !state.open ||
        limited ||
        state.type === 'loading' ||
        state.duration === 0 ||
        state.duration === Infinity
      )
        stop(entry)
      else if (entry.timer === undefined) {
        entry.started = Date.now()
        entry.timer = setTimeout(() => manager.dismiss(state.id), entry.remaining)
      }
    }
    currentToasts = entries.map((entry) => entry.record).reverse()
    setToasts(currentToasts)
  }
  const message = (value: ToastMessage<T>): ToastOptions<T> => {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      [
        'id',
        'title',
        'description',
        'type',
        'duration',
        'priority',
        'action',
        'data',
        'onDismiss',
        'onRemove',
      ].some((key) => key in value)
    )
      return value as ToastOptions<T>
    return { title: value as JSX.Element }
  }
  const shortcut = (type: ToastType) => (title: JSX.Element, patch?: ToastPatch<T>) =>
    manager.add({ ...patch, title, type })
  const manager: ToastManager<T> = {
    toasts,
    add(input) {
      return untrack(() => {
        const id = input.id ?? `${prefix}-${++serial}`
        const existing = find(id)
        if (existing) {
          if (existing.read().open) manager.update(id, input)
          else {
            stop(existing)
            const state = existing.read()
            const duration = toastDuration(input.duration, defaults.duration)
            existing.generation++
            existing.remaining = duration
            existing.write({
              ...state,
              ...input,
              id,
              open: true,
              duration,
              revision: state.revision + 1,
            })
            entries = [...entries.filter((entry) => entry !== existing), existing]
            sync()
          }
          return id
        }
        const initial: Snapshot = {
          ...input,
          id,
          type: input.type ?? 'default',
          duration: toastDuration(input.duration, defaults.duration),
          priority: input.priority ?? 'low',
          open: true,
          limited: true,
          revision: 0,
        }
        let snapshot = initial
        const [track, setSnapshot] = createSignal(initial, { ownedWrite: true })
        const read = () => snapshot
        const write = (value: Snapshot) => {
          snapshot = value
          setSnapshot(value)
        }
        const record = {} as Snapshot
        for (const key of [
          'id',
          'title',
          'description',
          'type',
          'duration',
          'priority',
          'action',
          'data',
          'onDismiss',
          'onRemove',
          'open',
          'limited',
          'revision',
        ] as const)
          Object.defineProperty(record, key, {
            enumerable: true,
            get: () => {
              track()
              return snapshot[key]
            },
          })
        entries.push({ record, read, write, remaining: initial.duration, generation: 0 })
        sync()
        return id
      })
    },
    update(id, patch) {
      untrack(() => {
        const entry = find(id)
        if (!entry?.read().open) return
        const next = typeof patch === 'function' ? patch(entry.record) : patch
        if (find(id) !== entry || !entry.read().open) return
        stop(entry)
        const state = entry.read()
        const duration =
          next.duration === undefined
            ? state.duration
            : toastDuration(next.duration, defaults.duration)
        if (next.duration !== undefined) entry.remaining = duration
        entry.generation++
        entry.write({
          ...state,
          ...next,
          id,
          open: true,
          limited: state.limited,
          type: next.type ?? state.type,
          priority: next.priority ?? state.priority,
          duration,
          revision: state.revision + 1,
        })
        sync()
      })
    },
    dismiss(id) {
      untrack(() => {
        const targets =
          id === undefined ? [...entries] : entries.filter((entry) => entry.read().id === id)
        const callbacks: (() => void)[] = []
        for (const entry of targets) {
          const state = entry.read()
          if (!state.open) continue
          stop(entry)
          entry.generation++
          entry.write({ ...state, open: false })
          if (state.onDismiss) callbacks.push(state.onDismiss)
        }
        sync()
        for (const callback of callbacks) callback()
      })
    },
    remove(id) {
      untrack(() => {
        const entry = find(id)
        if (!entry) return
        manager.dismiss(id)
        if (find(id) !== entry) return
        stop(entry)
        entries = entries.filter((candidate) => candidate !== entry)
        sync()
        entry.read().onRemove?.()
      })
    },
    success: shortcut('success'),
    error: shortcut('error'),
    info: shortcut('info'),
    warning: shortcut('warning'),
    loading: shortcut('loading'),
    promise(promise, stages) {
      const id = manager.add({ ...message(stages.loading), type: 'loading' })
      const entry = find(id)!
      const generation = entry.generation
      const settle = (type: 'success' | 'error', value: unknown) => {
        if (find(id) !== entry || !entry.read().open || entry.generation !== generation) return
        const stage = stages[type]
        const resolved =
          typeof stage === 'function'
            ? (stage as (value: unknown) => ToastMessage<T>)(value)
            : stage
        if (find(id) !== entry || !entry.read().open || entry.generation !== generation) return
        manager.update(id, { duration: defaults.duration, ...message(resolved), type })
      }
      void Promise.resolve(promise)
        .then(
          (value) => settle('success', value),
          (error) => settle('error', error)
        )
        .catch(() => {
          /* User message functions must not create unhandled promise rejections. */
        })
      return id
    },
    configure(next) {
      untrack(() => {
        defaults = { duration: toastDuration(next.duration), limit: toastLimit(next.limit) }
        sync()
      })
    },
    attach() {
      attached++
      untrack(sync)
      let active = true
      return () => {
        if (!active) return
        active = false
        attached--
        untrack(sync)
      }
    },
    pause(reason) {
      reasons.add(reason)
      untrack(sync)
    },
    resume(reason) {
      reasons.delete(reason)
      untrack(sync)
    },
  }
  return manager
}
