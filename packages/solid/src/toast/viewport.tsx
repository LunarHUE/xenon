import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
} from 'solid-js'
import { createToastViewport } from '@xenon/dom/toast'
import { registerLayerPointerExclusion } from '@xenon/dom/layer'
import type { ToastRecord } from './manager'
import { useToastManager } from './provider'
import { ToastViewportContext } from './context'
import type { ToastViewportContext as ViewportContext } from './context'
import { spread } from '../spread'

/** Viewport geometry, keyboard access and optional controlled expansion. */
interface Own {
  /** Shortcut modifiers and physical key code, defaulting to ['altKey', 'KeyT']. An empty array disables it. */
  hotkey?: readonly string[]
  /** Override visual expansion. Pointer, focus and swipe still pause timing independently. */
  expanded?: boolean
  /** Reports interaction-driven expansion changes, independently of a controlled override. */
  onExpandedChange?: (expanded: boolean) => void
  /** Space between expanded notifications in CSS pixels, defaulting to 8. */
  gap?: number
  /** Receives the native region host. */
  ref?: (element: HTMLElement) => void
}
/** Polymorphic notification region props; custom hosts must forward their ref. */
export type ToastViewportProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & {
    /** Rendered region host, defaulting to div. */
    as?: T
  }
/** Exclude inactive and hidden controls while retaining ordinary native tab order. */
function tabStops(element: HTMLElement): HTMLElement[] {
  return Array.from(
    element.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]')
  ).filter((node) => {
    if (node.tabIndex < 0 || node.matches(':disabled') || node.closest('[hidden],[inert]'))
      return false
    let current: HTMLElement | null = node
    while (current) {
      const style = current.ownerDocument.defaultView?.getComputedStyle(current)
      if (style?.display === 'none' || style?.visibility === 'hidden') return false
      if (current === element) break
      current = current.parentElement
    }
    return true
  })
}
/** Match a shortcut without claiming modified variants the author did not request. */
function matchesHotkey(event: KeyboardEvent, keys: readonly string[]): boolean {
  if (!keys.length || event.defaultPrevented || event.isComposing) return false
  const modifiers = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const
  if (modifiers.some((key) => event[key] !== keys.includes(key))) return false
  return keys.every(
    (key) =>
      modifiers.includes(key as (typeof modifiers)[number]) ||
      key === event.code ||
      key === event.key
  )
}
/** Visually hide speech while keeping it available to assistive technology. */
const speechStyle: JSX.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  'white-space': 'nowrap',
  border: '0',
}
/**
 * Owns the native manual-popover region, stack measurements, pause reasons and
 * keyboard return path. New records never focus the region. Alt+T focuses the
 * region; Tab enters its newest visible controls and leaves normally unless a
 * hotkey session restores its previous outside focus at the boundary.
 *
 * Content measures an internal natural-size wrapper. CSS may collapse Content
 * to --toast-front-height without changing its measured --toast-height. This
 * region publishes --toast-gap, --toast-count and --viewport-height; CSS owns
 * placement, stack transforms and motion.
 */
export function ToastViewport<T extends ValidComponent = 'div'>(
  props: ToastViewportProps<T>
): JSX.Element {
  const own = props as ToastViewportProps<'div'>
  const manager = useToastManager()
  const [interactionExpanded, setInteractionExpanded] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string, number>>({}, { ownedWrite: true })
  const [ready, setReady] = createSignal(false)
  const [polite, setPolite] = createSignal('')
  const [assertive, setAssertive] = createSignal('')
  const hosts = new Map<string, HTMLElement>()
  const swipes = new Set<string>()
  const speechTimers = new Set<ReturnType<typeof setTimeout>>()
  const pendingSpeech = new Map<string, { record: ToastRecord<unknown>; text: string }>()
  const spoken = new Map<string, { record: ToastRecord<unknown>; text: string }>()
  let speechFlush: ReturnType<typeof setTimeout> | undefined
  let speechClear: ReturnType<typeof setTimeout> | undefined
  const publishSpeech = () => {
    const values = [...spoken.values()].filter(({ record }) => record.open && !record.limited)
    setPolite(
      values
        .filter(({ record }) => record.priority !== 'high')
        .map(({ text }) => text)
        .join('. ')
    )
    setAssertive(
      values
        .filter(({ record }) => record.priority === 'high')
        .map(({ text }) => text)
        .join('. ')
    )
  }
  const prefix = createUniqueId()
  let element!: HTMLElement
  let controller: ReturnType<typeof createToastViewport> | undefined
  let releaseExclusion: (() => void) | undefined
  let outside: HTMLElement | undefined
  let returnTarget: HTMLElement | undefined
  let hotkeySession = false
  let focusedId: string | undefined
  let shown = false
  let disposed = false
  const admitted = () => manager.toasts().filter((record) => record.open && !record.limited)
  const open = () => manager.toasts().some((record) => !record.limited)
  const expanded = () => own.expanded ?? interactionExpanded()
  const gap = () => Math.max(0, own.gap ?? 8)
  const layout = (id: string) => {
    const items = admitted()
    const index = items.findIndex((record) => record.id === id)
    const sizes = heights()
    return {
      index: Math.max(0, index),
      height: sizes[id] ?? 0,
      frontHeight: sizes[items[0]?.id ?? ''] ?? 0,
      offset: items
        .slice(0, Math.max(0, index))
        .reduce((sum, record) => sum + (sizes[record.id] ?? 0) + gap(), 0),
    }
  }
  const restore = () => {
    const target = returnTarget?.isConnected
      ? returnTarget
      : outside?.isConnected
        ? outside
        : undefined
    hotkeySession = false
    if (target && !target.closest('[hidden],[inert]')) target.focus()
  }
  const closing = (id: string) => {
    if (focusedId !== id || !element) return
    const host = hosts.get(id)
    const active = element.ownerDocument.activeElement
    if (active && active !== element.ownerDocument.body && !host?.contains(active)) return
    const order = manager.toasts().map((record) => record.id)
    const index = order.indexOf(id)
    const preferred = [...order.slice(index + 1), ...order.slice(0, index).reverse()]
    focusedId = undefined
    onSettled(() =>
      untrack(() => {
        if (disposed) return
        const current = element.ownerDocument.activeElement
        if (current && current !== element.ownerDocument.body && !element.contains(current)) return
        const records = manager.toasts()
        const next = preferred
          .map((key) => records.find((record) => record.id === key))
          .find((record) => record?.open && !record.limited && hosts.has(record.id))
        if (next) {
          focusedId = next.id
          hosts.get(next.id)?.focus()
        } else restore()
      })
    )
  }
  const context: ViewportContext = {
    manager,
    expanded,
    layout,
    closing,
    register(id, host) {
      hosts.set(id, host)
      return () => {
        hosts.delete(id)
        swipes.delete(id)
        controller?.setSwiping(swipes.size > 0)
        setHeights((current) => {
          const next = { ...current }
          delete next[id]
          return next
        })
      }
    },
    measure(id, height) {
      setHeights((current) => (current[id] === height ? current : { ...current, [id]: height }))
    },
    swiping(id, active) {
      if (active) swipes.add(id)
      else swipes.delete(id)
      controller?.setSwiping(swipes.size > 0)
    },
    announce(record: ToastRecord<unknown>, text: string) {
      if (!text || !record.open || record.limited || disposed) return
      pendingSpeech.set(record.id, { record, text })
      if (record.priority === 'high') setAssertive('')
      else setPolite('')
      if (speechFlush !== undefined) return
      speechFlush = setTimeout(() => {
        speechTimers.delete(speechFlush!)
        speechFlush = undefined
        if (disposed) return
        spoken.clear()
        pendingSpeech.forEach((value, id) => {
          if (value.record.open && !value.record.limited) spoken.set(id, value)
        })
        pendingSpeech.clear()
        untrack(publishSpeech)
        clearTimeout(speechClear)
        speechClear = setTimeout(() => {
          spoken.clear()
          setPolite('')
          setAssertive('')
          speechTimers.delete(speechClear!)
        }, 1000)
        speechTimers.add(speechClear)
      }, 0)
      speechTimers.add(speechFlush)
    },
  }
  const onFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    if (!element.contains(target)) {
      outside = target
      focusedId = undefined
      hotkeySession = false
      return
    }
    focusedId = [...hosts].find(([, host]) => host.contains(target))?.[0]
  }
  const onHotkey = (event: KeyboardEvent) => {
    if (
      !untrack(open) ||
      !matchesHotkey(
        event,
        untrack(() => own.hotkey ?? ['altKey', 'KeyT'])
      )
    )
      return
    event.preventDefault()
    const active = element.ownerDocument.activeElement
    if (
      active instanceof element.ownerDocument.defaultView!.HTMLElement &&
      !element.contains(active)
    ) {
      returnTarget = active
      outside = active
    }
    hotkeySession = true
    element.focus()
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey || event.isComposing)
      return
    const stops = tabStops(element)
    const active = element.ownerDocument.activeElement
    if (active === element && !event.shiftKey && stops[0]) {
      event.preventDefault()
      stops[0].focus()
      return
    }
    if (
      hotkeySession &&
      ((event.shiftKey && (active === element || active === stops[0])) ||
        (!event.shiftKey && active === stops.at(-1)))
    ) {
      event.preventDefault()
      restore()
    }
  }
  onSettled(() =>
    untrack(() => {
      const document = element.ownerDocument
      const active = document.activeElement
      if (
        active instanceof element.ownerDocument.defaultView!.HTMLElement &&
        !element.contains(active)
      )
        outside = active
      controller = createToastViewport(element, {
        pause: (reason) => manager.pause(`${prefix}:${reason}`),
        resume: (reason) => manager.resume(`${prefix}:${reason}`),
        onExpandedChange(value) {
          setInteractionExpanded(value)
          own.onExpandedChange?.(value)
        },
      })
      releaseExclusion = registerLayerPointerExclusion(element)
      document.addEventListener('keydown', onHotkey)
      document.addEventListener('focusin', onFocus)
      setReady(true)
    })
  )
  createEffect(
    () =>
      manager
        .toasts()
        .map((record) => ({ id: record.id, open: record.open, limited: record.limited })),
    (records) =>
      untrack(() => {
        const active = new Set(
          records.filter((record) => record.open && !record.limited).map((record) => record.id)
        )
        for (const id of spoken.keys()) if (!active.has(id)) spoken.delete(id)
        for (const id of pendingSpeech.keys()) if (!active.has(id)) pendingSpeech.delete(id)
        publishSpeech()
      })
  )
  createEffect(
    () => ({ ready: ready(), open: open() }),
    (state) => {
      if (!state.ready || shown === state.open) return
      if (typeof element.showPopover === 'function') {
        if (state.open) element.showPopover()
        else if (element.matches(':popover-open')) element.hidePopover()
      } else element.style.display = state.open ? 'block' : 'none'
      shown = state.open
    }
  )
  onCleanup(() => {
    disposed = true
    controller?.dispose()
    releaseExclusion?.()
    speechTimers.forEach(clearTimeout)
    if (!isServer && element) {
      element.ownerDocument.removeEventListener('keydown', onHotkey)
      element.ownerDocument.removeEventListener('focusin', onFocus)
      if (shown && typeof element.hidePopover === 'function' && element.matches(':popover-open'))
        element.hidePopover()
    }
  })
  const viewportStyle = () => {
    const items = admitted()
    const sizes = heights()
    const front = sizes[items[0]?.id ?? ''] ?? 0
    const height = expanded()
      ? items.reduce((sum, record) => sum + (sizes[record.id] ?? 0), 0) +
      Math.max(0, items.length - 1) * gap()
      : front + Math.max(0, items.length - 1) * gap()
    const variables = {
      '--toast-front-height': `${front}px`,
      '--toast-gap': `${gap()}px`,
      '--toast-count': items.length,
      '--viewport-height': `${height}px`,
      '--toast-viewport-height': `${height}px`,
    }
    if (typeof own.style === 'string')
      return `margin:0;padding:0;border:0;background:transparent;overflow:visible;${own.style};${Object.entries(
        variables
      )
        .map(([key, value]) => `${key}:${value}`)
        .join(';')}`
    return {
      margin: '0',
      padding: '0',
      border: '0',
      background: 'transparent',
      overflow: 'visible',
      ...own.style,
      ...variables,
    } as JSX.CSSProperties
  }
  const label = () => {
    const hotkey = (own.hotkey ?? ['altKey', 'KeyT'])
      .map(
        (key) =>
          ({ altKey: 'Alt', ctrlKey: 'Control', metaKey: 'Meta', shiftKey: 'Shift' })[key] ??
          key.replace(/^Key/, '')
      )
      .join('+')
    return own['aria-label'] === false
      ? undefined
      : (own['aria-label'] ?? 'Notifications ({hotkey})').replace('{hotkey}', hotkey)
  }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'children',
    'ref',
    'hotkey',
    'expanded',
    'onExpandedChange',
    'gap',
    'style',
    'aria-label'
  )
  const children = createMemo(() => (
    <ToastViewportContext value={context}>{own.children}</ToastViewportContext>
  ))
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(host: HTMLElement) => {
        element = host
        own.ref?.(host)
      }}
      {...spread({ attrs: { role: 'region', tabindex: -1 }, on: { keydown } }, rest)}
      aria-label={label()}
      popover="manual"
      data-toast-viewport=""
      data-expanded={expanded() ? '' : undefined}
      data-state={open() ? 'open' : 'closed'}
      style={viewportStyle()}
    >
      {children()}
      <div role="status" aria-live="polite" aria-atomic="true" style={speechStyle}>
        {polite()}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" style={speechStyle}>
        {assertive()}
      </div>
    </Dynamic>
  )
}
