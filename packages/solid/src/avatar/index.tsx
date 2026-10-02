import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  omit,
  onCleanup,
  Show,
  useContext,
  untrack,
} from 'solid-js'
import { spread } from '../spread'

/** Lifecycle of the current avatar image request. */
export type AvatarState = 'idle' | 'loading' | 'loaded' | 'error'

/** Root host props shared by one image and its fallback. */
export type AvatarProps<T extends ValidComponent = 'span'> = Omit<ComponentProps<T>, 'as'> & {
  /** Root host, defaulting to span. */
  as?: T
  /** Milliseconds before showing fallback; defaults to zero. Invalid delays use zero. */
  fallbackDelay?: number
}

/** Native image props; supply meaningful alt text or an empty decorative alt. */
export type AvatarImageProps = Omit<ComponentProps<'img'>, 'alt'> & {
  /** Accessible image name, required from the consumer. */
  alt: string
}

/** Fallback text or artwork, optionally named with author ARIA attributes. */
export type AvatarFallbackProps<T extends ValidComponent = 'span'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Fallback host, defaulting to span. */
  as?: T
}

/** Adapter-local state; native image requests and timers have no core engine. */
interface AvatarContextValue {
  /** Current image lifecycle. */
  state: () => AvatarState
  /** Update image lifecycle. */
  setState: (state: AvatarState) => void
  /** Requested fallback delay. */
  delay: () => number
}

/** Context shared by the root's image and fallback. */
const AvatarContext = createContext<AvatarContextValue>()

/** Require a root for image and fallback coordination. */
function useAvatar(): AvatarContextValue {
  const context = useContext(AvatarContext)
  if (!context) throw new Error('Avatar parts must be rendered inside <Avatar>')
  return context
}

/** Coordinate one image and fallback. No network work or timers run during SSR. */
function AvatarRoot<T extends ValidComponent = 'span'>(props: AvatarProps<T>): JSX.Element {
  const [state, setState] = createSignal<AvatarState>('idle')
  const context: AvatarContextValue = {
    state,
    setState,
    delay: () => (Number.isFinite(props.fallbackDelay) ? Math.max(0, props.fallbackDelay ?? 0) : 0),
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'fallbackDelay', 'children')
  const content = createMemo(() => <AvatarContext value={context}>{props.children}</AvatarContext>)
  return (
    <Dynamic
      component={props.as ?? 'span'}
      {...spread({ attrs: { 'data-state': state() }, on: {} }, { ...rest })}
    >
      {content()}
    </Dynamic>
  )
}

/**
 * Load the current source in a client-only native image probe, then render an img.
 * Request configuration changes start a fresh probe. Cleanup invalidates stale
 * callbacks and releases listeners. Cached success requires a positive natural
 * width. No source stays idle. Only one Image per Avatar is supported.
 */
function AvatarImage(props: AvatarImageProps): JSX.Element {
  const context = useAvatar()
  const rest = omit(props as Record<string, unknown>, 'children')
  createEffect(
    () => [props.src, props.srcset, props.sizes, props.crossorigin, props.referrerpolicy] as const,
    ([src, srcset, sizes, crossorigin, referrerpolicy]) => {
      if (!src && !srcset) {
        context.setState('idle')
        return
      }
      const probe = new Image()
      let active = true
      const finish = (success: boolean) => {
        if (active) context.setState(success && probe.naturalWidth > 0 ? 'loaded' : 'error')
      }
      probe.onload = () => finish(true)
      probe.onerror = () => finish(false)
      context.setState('loading')
      if (typeof crossorigin === 'string') probe.crossOrigin = crossorigin
      if (typeof referrerpolicy === 'string') probe.referrerPolicy = referrerpolicy
      if (sizes) probe.sizes = sizes
      if (srcset) probe.srcset = srcset
      if (src) probe.src = src
      if (probe.complete) finish(probe.naturalWidth > 0)
      return () => {
        active = false
        probe.onload = null
        probe.onerror = null
      }
    }
  )
  onCleanup(() => {
    if (!isServer) context.setState('idle')
  })
  return (
    <Show when={context.state() === 'loaded'}>
      <img
        {...spread(
          {
            attrs: { 'data-state': context.state() },
            on: { error: () => context.setState('error') },
          },
          { ...rest }
        )}
      />
    </Show>
  )
}

/**
 * Render fallback content while the image is absent, loading, or broken.
 * Plain text remains readable; use aria-label for initials that need a full name.
 * Delay starts when fallback is needed and resets after a loaded image.
 */
function AvatarFallback<T extends ValidComponent = 'span'>(
  props: AvatarFallbackProps<T>
): JSX.Element {
  const context = useAvatar()
  const [ready, setReady] = createSignal(untrack(context.delay) === 0)
  createEffect(
    () => [context.state() === 'loaded', context.delay()] as const,
    ([loaded, delay]) => {
      if (loaded) {
        setReady(false)
        return
      }
      if (delay === 0) {
        setReady(true)
        return
      }
      const timer = setTimeout(() => setReady(true), delay)
      return () => clearTimeout(timer)
    }
  )
  const rest = omit(props as Record<string, unknown>, 'as', 'children')
  return (
    <Show when={context.state() !== 'loaded' && ready()}>
      <Dynamic
        component={props.as ?? 'span'}
        {...spread({ attrs: { 'data-state': context.state() }, on: {} }, { ...rest })}
      >
        {props.children}
      </Dynamic>
    </Show>
  )
}

/** Compound avatar with a native loaded image and delayed fallback content. */
export const Avatar = Object.assign(AvatarRoot, {
  /** Image content rendered only after successful loading. */
  Image: AvatarImage,
  /** Content shown when the image is not loaded. */
  Fallback: AvatarFallback,
})
