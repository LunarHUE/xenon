import { booleanAttribute, setRef } from '../internal/host'
import { tooltip, resolveTooltipBehavior, tooltipOpenDelay } from '@xenon-ui/core/tooltip'
import type { TooltipBehaviorOptions, TooltipBehavior } from '@xenon-ui/core/tooltip'
import { createHoverIntent } from '@xenon-ui/dom/hover-intent'
import type { HoverIntent } from '@xenon-ui/dom/hover-intent'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { Popover, HoverPositioner, usePopover, createPopoverHandle } from '../popover/popover'
import type {
  PopoverHandle,
  PopoverProps,
  PopoverContentProps,
  PopoverRenderState,
  PopoverPositionerProps,
  PopoverArrowProps,
  PopoverViewportProps,
} from '../popover/popover'
import { getOverlayHandleContext } from '../internal/overlay-handle'
import { tokens } from '../field/context'
import { spread } from '../spread'
import { TooltipProvider, createTooltipGroup, useTooltipProvider } from './provider'

type PopupContext = ReturnType<typeof usePopover>
/** A stable handle connecting detached triggers to one tooltip root. */
export type TooltipHandle<Payload = unknown> = PopoverHandle<Payload>
/** Reactive payload/trigger getters supplied to a tooltip root child callback. */
export type TooltipRenderState<Payload = unknown> = PopoverRenderState<Payload>
/** Create a tooltip handle. Commands without a mounted root are ignored; opening requires a mounted anchor. */
export function createTooltipHandle<Payload = unknown>(): TooltipHandle<Payload> {
  return createPopoverHandle<Payload>()
}
/** Headless tooltip root props. Interaction settings inherit from the nearest Tooltip.Provider. */
export type TooltipProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  PopoverProps<T, Payload>,
  | 'modal'
  | 'initialFocus'
  | 'finalFocus'
  | 'restoreFocus'
  | 'closeOnOutside'
  | 'closeOnFocusOutside'
  | 'onFocusOutside'
  | 'titleId'
  | 'descriptionId'
> &
  TooltipBehaviorOptions & {
    /** Disables tooltip display without disabling the trigger's native action. */
    disabled?: JSX.BooleanAttribute
  }
/** Native trigger props. Default button; custom hosts retain author role and tab order. */
export type TooltipTriggerProps<T extends ValidComponent = 'button', Payload = unknown> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Native or custom host. Default button never submits a form. */
  as?: T
  /** Connect to a tooltip outside the current Solid ancestry. */
  handle?: TooltipHandle<Payload>
  /** Data supplied when this trigger opens a shared tooltip. */
  payload?: NoInfer<Payload>
}
/** Descriptive content attributes. Author aria-label is retained without changing the tooltip role. */
export type TooltipContentProps<T extends ValidComponent = 'div'> = PopoverContentProps<T>
/** Existing anchor placement options, with hoverability inherited by the tooltip Content. */
export type TooltipPositionerProps = Omit<PopoverPositionerProps, 'pointerEvents'>
/** Existing decorative arrow options. */
export type TooltipArrowProps = PopoverArrowProps
/** Shared-payload transition viewport options. */
export type TooltipViewportProps = PopoverViewportProps
/** Provider policy and root browser intent, associated with the reusable popup controller. */
interface Context {
  /** Current root interaction settings. */
  behavior(): TooltipBehavior
  /** Effective logical visibility. */
  open(): boolean
  /** Root display gate. */
  disabled(): boolean
  /** Shared reusable popup controller after bridge creation. */
  popup?: PopupContext
  /** Timer and corridor controller. */
  intent: HoverIntent
  /** Last opening bypassed the configured hover delay. */
  instant(): boolean
  /** Publish the latest instant marker. */
  setInstant(value: boolean): void
}
const Context = createContext<Context | null>(null)
const roots = new WeakMap<PopupContext, Context>()
/** Read required local tooltip context for non-trigger parts. */
function useTooltip(): Context {
  const value = useContext(Context)
  if (!value) throw new Error('Tooltip parts must be rendered inside <Tooltip>')
  return value
}
/** Registers the popup context while preserving deferred children inside both providers. */
function Bridge(props: {
  /** Owning tooltip settings and timers. */
  context: Context
  /** Popup descendants. */
  children?: JSX.Element
}): JSX.Element {
  const popup = usePopover('Tooltip')
  const context = untrack(() => props.context)
  context.popup = popup
  roots.set(popup, context)
  onCleanup(() => roots.delete(popup))
  return <>{props.children}</>
}
/** Owns tooltip state and resolves local overrides without adding visual defaults or taking focus. */
function TooltipRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: TooltipProps<T, Payload>
): JSX.Element {
  const provider = useTooltipProvider(),
    group = provider?.group ?? createTooltipGroup(),
    identity = {}
  const [internal, setInternal] = createSignal(untrack(() => props.defaultOpen) ?? false)
  const [instant, setInstant] = createSignal(false)
  let rootElement: HTMLElement | undefined
  const open = () => !booleanAttribute(props.disabled) && (props.open ?? internal())
  const behavior = () => resolveTooltipBehavior(props, provider?.behavior())
  const change = (next: boolean) => {
    if (next && booleanAttribute(props.disabled)) return
    if (!next) context.intent.cancel()
    if (untrack(open) === next) return
    if (props.open === undefined) setInternal(next)
    props.onOpenChange?.(next)
  }
  const context: Context = {
    behavior,
    open,
    disabled: () => booleanAttribute(props.disabled),
    instant,
    setInstant,
    intent: undefined!,
  }
  context.intent = createHoverIntent({
    trigger: () => context.popup?.trigger(),
    content: () => context.popup?.content(),
    open,
    disabled: context.disabled,
    openDelay: () =>
      tooltipOpenDelay({
        behavior: behavior(),
        now: performance.now(),
        closedAt: group.closedAt(),
        active: group.active(),
      }),
    closeDelay: () => behavior().closeDelay,
    hoverable: () => behavior().hoverable,
    closeOnPress: () => behavior().closeOnPress,
    onOpen(node, reason) {
      if (!context.popup) return
      setInstant(
        reason === 'focus' ||
          tooltipOpenDelay({
            behavior: behavior(),
            now: performance.now(),
            closedAt: group.closedAt(),
            active: group.active(),
          }) === 0
      )
      const entry = entries.get(node)
      if (entry) context.popup.activate(entry, false)
    },
    onClose: () => change(false),
  })
  createEffect(
    () => [booleanAttribute(props.disabled), behavior()],
    () => context.intent.refresh()
  )
  createEffect(open, (visible) => {
    if (visible)
      group.claim(
        identity,
        untrack(() => () => change(false))
      )
    else group.release(identity)
  })
  onCleanup(() => {
    context.intent.dispose()
    group.release(identity)
  })
  onSettled(() => {
    const document = rootElement?.ownerDocument
    if (!document) return
    const scroll = (event: Event) => {
      const trigger = context.popup?.trigger()
      if (!trigger) return
      const target = event.target
      if (target === document || (target instanceof Element && target.contains(trigger)))
        context.intent.dismiss()
    }
    document.addEventListener('scroll', scroll, true)
    return () => document.removeEventListener('scroll', scroll, true)
  })
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'openDelay',
    'closeDelay',
    'skipDelay',
    'hoverable',
    'closeOnPress',
    'closeOnEscape'
  )
  const content = createMemo(() => (
    <Context value={context}>
      <Popover
        {...rest}
        ref={(node: HTMLElement) => {
          rootElement = node
          setRef((props as { ref?: unknown }).ref, node)
        }}
        open={open()}
        onOpenChange={change}
        initialFocus={false}
        restoreFocus={false}
        closeOnOutside={false}
        closeOnFocusOutside={false}
        closeOnEscape={behavior().closeOnEscape}
      >
        {(state: PopoverRenderState<Payload>) => (
          <Bridge context={context}>
            {(() => {
              const children = props.children
              return typeof children === 'function' ? children(state) : children
            })()}
          </Bridge>
        )}
      </Popover>
    </Context>
  ))
  return <>{content()}</>
}
/** The registry stores only mounted trigger elements and their popup identity. */
interface Entry {
  /** Actual host, absent before ref attachment. */
  element?: HTMLElement
  /** Live author or generated ID. */
  id(): string
  /** Live payload supplied on activation. */
  payload(): unknown
}
const entries = new WeakMap<HTMLElement, Entry>()
/** Observes hover and keyboard focus while preserving the host's action, label, and native disabled behavior. */
export function TooltipTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: TooltipTriggerProps<T, Payload>
): JSX.Element {
  const inherited = useContext(Context),
    handle = untrack(() => props.handle)
  if (!inherited && !handle)
    throw new Error('Tooltip.Trigger must be inside <Tooltip> or receive a handle')
  const popup = () =>
    handle ? getOverlayHandleContext<Payload, PopupContext>(handle) : inherited?.popup
  const context = () => {
    const current = popup()
    return current ? roots.get(current) : (inherited ?? undefined)
  }
  const id = createUniqueId()
  const own = props as {
    id?: string
    as?: ValidComponent
    children?: JSX.Element
    ref?: unknown
    disabled?: JSX.BooleanAttribute
    'aria-describedby'?: string
  }
  const entry: Entry = { id: () => own.id ?? id, payload: () => props.payload }
  const register = (value: PopupContext) => {
    const release = value.registerTrigger(entry)
    if (entry.element && !untrack(value.trigger)) value.setTrigger(entry.element)
    return () => {
      if (!isServer && value.activeTrigger(entry)) {
        context()?.intent.cancel()
        value.change(false)
      }
      release()
    }
  }
  if (handle) createEffect(popup, (value) => (value ? register(value) : undefined))
  else if (inherited?.popup) onCleanup(register(inherited.popup))
  onSettled(() => {
    const value = popup()
    if (entry.element && value && !untrack(value.trigger)) value.setTrigger(entry.element)
  })
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'handle',
    'payload',
    'aria-describedby',
    'id'
  )
  const result = () => {
    const root = popup(),
      policy = context()
    const active = !!root?.activeTrigger(entry)
    return tooltip({
      contentId: root?.result().parts.content.attrs.id ?? '',
      open: active && !!root?.result().state.open,
      disabled: policy?.disabled(),
      instant: policy?.instant(),
    })
  }
  const part = () => ({
    attrs: {
      ...result().parts.trigger.attrs,
      id: entry.id(),
      type: (own.as ?? 'button') === 'button' ? ('button' as const) : undefined,
      'aria-describedby':
        popup()?.association('aria-describedby', () =>
          tokens(own['aria-describedby'], result().parts.trigger.attrs['aria-describedby'])
        ) ?? own['aria-describedby'],
    },
    on: {
      pointerenter(event: PointerEvent) {
        context()?.intent.triggerEnter(event)
      },
      pointerleave(event: PointerEvent) {
        context()?.intent.triggerLeave(event)
      },
      pointerdown(event: PointerEvent) {
        context()?.intent.press(event)
      },
      focusin(event: FocusEvent) {
        context()?.intent.focusIn(event)
      },
      focusout(event: FocusEvent) {
        context()?.intent.focusOut(event)
      },
      click() {
        if (context()?.behavior().closeOnPress) context()?.intent.dismiss()
      },
    },
  })
  createEffect(
    () => booleanAttribute(own.disabled),
    (disabled) => {
      if (disabled && popup()?.activeTrigger(entry)) context()?.intent.dismiss()
    }
  )
  onCleanup(() => {
    if (entry.element) entries.delete(entry.element)
  })
  return (
    <Dynamic
      component={own.as ?? 'button'}
      {...spread(part(), { ...rest })}
      ref={(node: HTMLElement) => {
        entry.element = node
        entries.set(node, entry)
        setRef(own.ref, node)
      }}
    >
      {own.children}
    </Dynamic>
  )
}
/** Positions the tooltip while allowing pointer input through a non-hoverable surface. */
export function TooltipPositioner(props: TooltipPositionerProps): JSX.Element {
  const context = useTooltip()
  return (
    <HoverPositioner {...props} pointerEvents={context.behavior().hoverable ? 'auto' : 'none'} />
  )
}
/** Renders nonfocusable tooltip semantics inside the existing positioning and presence host. */
export function TooltipContent<T extends ValidComponent = 'div'>(
  props: TooltipContentProps<T>
): JSX.Element {
  const context = useTooltip()
  const own = props as { children?: JSX.Element; style?: JSX.CSSProperties | string }
  const rest = omit(props as Record<string, unknown>, 'children', 'style')
  const part = () => ({
    attrs: {
      role: 'tooltip',
      tabindex: undefined,
      'aria-modal': undefined,
      'aria-labelledby': undefined,
      'aria-describedby': undefined,
      'data-instant': context.instant() ? '' : undefined,
    },
    on: {
      pointerenter(event: PointerEvent) {
        context.intent.contentEnter(event)
      },
      pointerleave(event: PointerEvent) {
        context.intent.contentLeave(event)
      },
      focusin(event: FocusEvent) {
        context.intent.focusIn(event)
      },
      focusout(event: FocusEvent) {
        context.intent.focusOut(event)
      },
    },
  })
  const style = () =>
    typeof own.style === 'string'
      ? `${own.style};${context.behavior().hoverable ? '' : 'pointer-events:none;'}`
      : {
          ...own.style,
          ...(context.behavior().hoverable ? {} : { 'pointer-events': 'none' as const }),
        }
  return (
    <Popover.Content {...spread(part(), { ...rest })} style={style()}>
      {own.children}
    </Popover.Content>
  )
}
/** Tooltip interaction root with inherited policy, detached handles, and the standard overlay anatomy. */
export const Tooltip = Object.assign(TooltipRoot, {
  /** Scoped defaults and shared delay coordination. */
  Provider: TooltipProvider,
  /** Typed detached-trigger connection. */
  createHandle: createTooltipHandle,
  /** Native trigger without an expanded state. */
  Trigger: TooltipTrigger,
  /** Portal preserving native modal ancestry. */
  Portal: Popover.Portal,
  /** Anchor positioning and top-layer hosting. */
  Positioner: TooltipPositioner,
  /** Nonfocusable descriptive content. */
  Content: TooltipContent,
  /** Inert previous-content transitions for a shared tooltip. */
  Viewport: Popover.Viewport,
  /** Decorative positioning arrow. */
  Arrow: Popover.Arrow,
  /** Optional explicit positioning anchor. */
  Anchor: Popover.Anchor,
})
