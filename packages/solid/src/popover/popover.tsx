import { setRef } from '../internal/host'
import type { PopoverOptions } from '@xenon-ui/core/popover'
import type { AnyPart, PopoverResult } from '@xenon-ui/core'
import { popover } from '@xenon-ui/core/popover'
import { createPositioner } from '../positioning/positioning'
import type { Positioner, PositionerOptions } from '../positioning/positioning'
import { createFloatingLayer } from '@xenon-ui/dom/floating-layer'
import type { FloatingLayerOptions } from '@xenon-ui/dom/floating-layer'
import type { LayerPointerOutsideEvent } from '@xenon-ui/dom'
import { Dynamic, isServer } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import {
  Show,
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
import { Button } from '../button/button'
import type { ButtonProps } from '../button/button'
import { serverAssociations } from '../field/server-associations'
import { createPresence } from '../internal/presence'
import { spread } from '../spread'
import {
  attachOverlayHandle,
  createOverlayHandle,
  getOverlayHandleContext,
} from '../internal/overlay-handle'
import type { OverlayHandle } from '../internal/overlay-handle'
import { OverlayPortal } from '../internal/overlay-portal'
import { FloatingViewport } from '../internal/floating-viewport'
import type { FloatingViewportProps } from '../internal/floating-viewport'

/** A handle connecting detached triggers to one mounted popover root. */
export type PopoverHandle<Payload = unknown> = OverlayHandle<Payload, Context>
/** Live values passed to a popover root's render callback. Read properties within JSX. */
export interface PopoverRenderState<Payload = unknown> {
  /** Root-controlled logical visibility. */
  readonly open: boolean
  /** ID of the selected trigger, when one exists. */
  readonly triggerId: string | undefined
  /** Payload selected by a trigger or an imperative opening request. */
  readonly payload: Payload | undefined
}
/**
 * Create a typed handle for one mounted popover Root. Detached commands are ignored
 * without queuing. Opening needs a registered trigger host or explicit Anchor;
 * openWithPayload keeps that anchor and supplies data through the root render state.
 * The Root retains authority over controlled and uncontrolled visibility.
 */
export function createPopoverHandle<Payload = unknown>(): PopoverHandle<Payload> {
  return createOverlayHandle<Payload, Context>()
}

interface TriggerEntry {
  element?: HTMLElement
  id(): string
  payload(): unknown
}

/** Root-owned visibility, dismissal, focus, and association inputs. */
interface Own extends Omit<PopoverOptions, 'ids' | 'status'> {
  /** Controlled logical visibility when defined; undefined uses internal state. */
  open?: PopoverOptions['open']
  /** Initial uncontrolled visibility, defaulting to false; later changes are ignored. */
  defaultOpen?: PopoverOptions['open']
  /** Reports a changed visibility request after updating uncontrolled state. Requests equal to current visibility and initialization are silent. */
  onOpenChange?: PopoverOptions['onOpenChange']
  /** Isolate outside content, lock scrolling, and contain focus while active. Defaults to false; changing modality restarts DOM hosting. */
  modal?: PopoverOptions['modal']
  /** Keep closed content mounted. Closed non-exiting positioners remain hidden and inactive. Defaults to false. */
  forceMount?: PopoverOptions['forceMount']
  /** Allow Escape dismissal while open, defaulting to true. False still consumes Escape at the layer. */
  closeOnEscape?: boolean
  /** Allow eligible outside-pointer dismissal while open, defaulting to true. The active trigger counts as an inside branch. */
  closeOnOutside?: boolean
  /** Allow deferred outside-focus dismissal for a positioned nonmodal popover. Defaults to true; modal popovers ignore this policy. */
  closeOnFocusOutside?: boolean
  /** Deferred outside-focus hook; wrapper preventDefault vetoes dismissal. Only runs for eligible nonmodal focus changes. */
  onFocusOutside?: FloatingLayerOptions['onFocusOutside']
  /** Focus target inside content, or false to skip initial placement. Applied when the positioned session first creates its focus scope. */
  initialFocus?: HTMLElement | false
  /** Preferred focus return target. Unusable targets fall back to active trigger, opener, then ancestor openers; deliberate outside focus is preserved. */
  finalFocus?: HTMLElement
  /** Permit focus restoration when the floating session ends. Defaults to true; deliberate outside focus is preserved. */
  restoreFocus?: boolean
  /** Synchronous Escape hook; preventDefault vetoes dismissal. Not invoked when Escape dismissal is disabled or while exiting closed. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Deferred outside-pointer hook; wrapper preventDefault vetoes dismissal. See {@link LayerPointerOutsideEvent}. */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  /** Fallback content ID, otherwise generated. Registered content IDs take precedence in trigger associations. */
  contentId?: string
  /** Fallback title ID and explicit naming reference when no title is registered. Registered title IDs take precedence. */
  titleId?: string
  /** Fallback description ID and explicit description reference when no description is registered. Registered IDs take precedence. */
  descriptionId?: string
  /** Receives the root wrapper, separate from the positioner and content hosts. */
  ref?: unknown
}
/** Polymorphic root props with library-owned visibility and dismissal policies. */
export type PopoverProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  ComponentProps<T>,
  keyof Own | 'as' | 'children'
> &
  Omit<Own, 'ref'> & {
    ref?: ComponentProps<T>['ref']
    /** Root host, defaulting to div; custom components must forward props and refs. */
    as?: T
    /** Connect detached triggers and commands. Keep this handle stable for the mounted root. */
    handle?: PopoverHandle<Payload>
    /** Static parts or a callback receiving live open, triggerId, and payload getters. */
    children?: JSX.Element | ((state: PopoverRenderState<Payload>) => JSX.Element)
  }
/** Dialog content host props. Requires Popover.Positioner; author aria-label suppresses generated title naming. */
export type PopoverContentProps<T extends ValidComponent = 'div'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Rendered host, defaulting to div; custom components must forward props and refs. */
  as?: T
}
/** {@link ButtonProps} for a registered trigger; the active trigger controls expansion and default anchoring. */
export type PopoverTriggerProps<
  T extends ValidComponent = 'button',
  Payload = unknown,
> = ButtonProps<T> & {
  /** Use a mounted root outside the trigger's Solid ancestry. */
  handle?: PopoverHandle<Payload>
  /** Payload supplied to the root when this trigger opens or replaces content. */
  payload?: NoInfer<Payload>
}
/** {@link ButtonProps} for requesting closure; aria-label defaults to Close popover. */
export type PopoverCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
/** Title host props; author id overrides the fallback and contributes to content naming. */
export type PopoverTitleProps<T extends ValidComponent = 'h2'> = Omit<ComponentProps<T>, 'as'> & {
  /** Rendered host, defaulting to h2; custom components must forward props and refs. */
  as?: T
}
/** Description host props; author id contributes to content aria-describedby. */
export type PopoverDescriptionProps<T extends ValidComponent = 'p'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Rendered host, defaulting to p; custom components must forward props and refs. */
  as?: T
}
/** Root-owned live state and registries consumed by the popover parts. */
interface Context {
  /** Current root prop view supplying DOM dismissal and focus settings. */
  own: Own
  /** Current core state and parts; server reads recompute associations from registrations. */
  result(): PopoverResult
  /** Ignores equal visibility, updates uncontrolled state, then notifies the root callback. */
  change(open: boolean): void
  /** Most recently attached content host; retained until another content ref replaces it. */
  content(): HTMLElement | undefined
  /** Records content for both DOM hosting and presence animation observation. */
  setContent(el: HTMLElement): void
  /** Adds a live ID getter and returns removal. Joined IDs retain registration order; caller owns cleanup. */
  register(name: 'title' | 'description' | 'content', id: () => string | undefined): () => void
  /** Root-supplied ID or generated fallback for this part kind. */
  id(name: 'title' | 'description' | 'content'): string
  /** Reads directly on the client or records an SSR marker finalized after descendant serialization. */
  association(
    name: 'aria-labelledby' | 'aria-describedby' | 'aria-controls',
    read: () => string | undefined
  ): string | undefined
  /** Current trigger host used for default anchoring, dismissal branching, and focus return. */
  trigger(): HTMLElement | undefined
  /** Every mounted trigger is inside the dismissal boundary, even when inactive. */
  triggerElements(): HTMLElement[]
  /** Selects the trigger host without changing logical visibility. */
  setTrigger(el: HTMLElement | undefined): void
  /** Selected trigger identity for render state and viewport transitions. */
  triggerId(): string | undefined
  /** Payload selected by the latest opener. */
  payload(): unknown
  /** Observe existing content synchronously before an open popover switches items. */
  beforeChange(listener: () => void): () => void
  /** Select a registered trigger and request opening or toggling. */
  activate(entry: TriggerEntry, toggle: boolean): void
  /** Registers a trigger identity. Removal replaces an active removed trigger with the first remaining entry on the client. */
  registerTrigger(entry: TriggerEntry): () => void
  /** Tests the selected host, or the first registered entry when no host has been selected. */
  activeTrigger(entry: {
    /** Visible trigger host compared with the selected trigger. */
    element?: HTMLElement
  }): boolean
  /** Explicit anchor host, preferred over the active trigger for positioning. */
  anchor(): HTMLElement | undefined
  /** Replaces or clears the single explicit anchor; no stack of previous anchors is retained. */
  setAnchor(el: HTMLElement | undefined): void
}
/** Nearest popover root state; absent outside a provider. */
const PopoverContext = createContext<Context | null>(null)
/**
 * Reads the enclosing popover root in the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Popover context is available.
 */
export function usePopover(name: string): Context {
  const context = useContext(PopoverContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Popover>`)
  return context
}
/**
 * Owns controlled/uncontrolled visibility, shared part IDs, trigger choice, and presence.
 *
 * @remarks
 * Defined open selects controlled mode on each read. defaultOpen is read once;
 * equal requests are ignored. Title/description/content registrations retain live
 * ID readers and join their values in registration order. Without registered text,
 * only explicit root text IDs become references. SSR associations finalize after
 * descendants serialize; no DOM hosting or positioning runs here.
 * {@link createPresence} keeps exit content mounted and cancels stale exit waits on
 * reopening. The Positioner owns the native hosting session for that lifetime.
 */
function PopoverRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: PopoverProps<T, Payload>
): JSX.Element {
  const own = props as Own & { as?: ValidComponent }
  const rest = omit(
    props as Record<string, unknown>,
    'as',
    'ref',
    'children',
    'handle',
    'open',
    'defaultOpen',
    'onOpenChange',
    'modal',
    'forceMount',
    'closeOnEscape',
    'closeOnOutside',
    'closeOnFocusOutside',
    'onFocusOutside',
    'initialFocus',
    'finalFocus',
    'restoreFocus',
    'onEscapeKeyDown',
    'onPointerOutside',
    'contentId',
    'titleId',
    'descriptionId'
  )
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultOpen ?? false))
  const [content, setContent] = createSignal<HTMLElement>()
  const [trigger, setTrigger] = createSignal<HTMLElement | undefined>(undefined, {
    ownedWrite: true,
  })
  let triggers: TriggerEntry[] = []
  const [payload, setPayload] = createSignal<unknown>(undefined, { ownedWrite: true })
  const listeners = new Set<() => void>()
  const triggerId = () => {
    revision()
    const active = trigger()
    return triggers.find((entry) => entry.element === active)?.id()
  }
  const select = (entry: TriggerEntry | undefined, nextPayload: unknown) => {
    const nextTrigger = entry?.element ?? untrack(trigger)
    if (
      untrack(open) &&
      (nextTrigger !== untrack(trigger) || !Object.is(nextPayload, untrack(payload)))
    ) {
      for (const listener of listeners) listener()
    }
    setTrigger(nextTrigger)
    setPayload(() => nextPayload)
  }
  const activate = (entry: TriggerEntry, toggle: boolean) => {
    const same = untrack(trigger) === entry.element
    select(entry, entry.payload())
    change(toggle && same ? !untrack(open) : true)
  }
  const [anchor, setAnchor] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let version = 0
  const entries: Record<'title' | 'description' | 'content', (() => string | undefined)[]> = {
    title: [],
    description: [],
    content: [],
  }
  const id = (name: 'title' | 'description' | 'content') => own[`${name}Id`] ?? `${base}-${name}`
  /** Reads live IDs in registration order, with reactive revision tracking on the client. */
  const registered = (name: 'title' | 'description' | 'content') => {
    revision()
    return (
      entries[name]
        .map((read) => read())
        .filter(Boolean)
        .join(' ') || undefined
    )
  }
  const open = () => own.open ?? internal()
  /** Deduplicates against current visibility, updates uncontrolled state, then notifies. */
  const change = (next: boolean) => {
    if (untrack(open) === next) return
    if (own.open === undefined) setInternal(next)
    own.onOpenChange?.(next)
  }
  const life = createPresence({ open, forceMount: () => own.forceMount ?? false })
  const compute = () => {
    return popover({
      ids: {
        content: registered('content') ?? id('content'),
        title: registered('title') ?? own.titleId,
        description: registered('description') ?? own.descriptionId,
      },
      open: open(),
      modal: own.modal,
      status: life.status(),
      forceMount: own.forceMount,
      onOpenChange: change,
    })
  }
  const memo = createMemo(compute)
  const result = isServer ? compute : memo
  const associations = isServer ? serverAssociations() : undefined
  const context: Context = {
    own,
    result,
    change,
    content,
    trigger,
    triggerElements() {
      revision()
      return triggers.flatMap((entry) => (entry.element ? [entry.element] : []))
    },
    setTrigger,
    triggerId,
    payload,
    activate,
    beforeChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    registerTrigger(entry) {
      triggers.push(entry)
      if (!isServer) setRevision(++version)
      return () => {
        triggers = triggers.filter((item) => item !== entry)
        if (!isServer) setRevision(++version)
        if (!isServer && untrack(trigger) === entry.element) setTrigger(triggers[0]?.element)
      }
    },
    activeTrigger(entry) {
      return trigger() ? trigger() === entry.element : triggers[0] === entry
    },
    anchor,
    setAnchor,
    setContent: (el) => {
      life.ref(el)
      setContent(el)
    },
    id,
    register(name, read) {
      entries[name].push(read)
      if (!isServer) setRevision(++version)
      return () => {
        entries[name] = entries[name].filter((entry) => entry !== read)
        if (!isServer) setRevision(++version)
      }
    },
    association: (name, read) => (associations ? associations.attribute(name, read) : read()),
  }
  const handle = untrack(() => props.handle)
  if (handle) {
    onCleanup(
      attachOverlayHandle(handle, {
        context,
        readOpen: open,
        dispatch(command) {
          if (command.type === 'close') {
            change(false)
            return
          }
          const entry =
            command.type === 'open' && command.triggerId !== undefined
              ? triggers.find((candidate) => candidate.id() === command.triggerId)
              : (triggers.find((candidate) => candidate.element === untrack(trigger)) ??
                triggers[0])
          if (command.type === 'open' && command.triggerId !== undefined && !entry) return
          if (!entry?.element && !untrack(anchor)) return
          select(entry, command.type === 'payload' ? command.payload : entry?.payload())
          change(true)
        },
      })
    )
  }
  const state: PopoverRenderState<Payload> = {
    get open() {
      return open()
    },
    get triggerId() {
      return triggerId()
    },
    get payload() {
      return payload() as Payload | undefined
    },
  }
  const inner = createMemo(() => (
    <PopoverContext value={context}>
      {(() => {
        const children = props.children
        return typeof children === 'function' ? children(state) : children
      })()}
    </PopoverContext>
  ))
  const element = (
    <Dynamic
      component={own.as ?? 'div'}
      ref={props.ref}
      {...spread(result().parts.root, { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
  // eslint-disable-next-line solid/components-return-once -- Server associations finalize one synchronous render.
  return associations ? associations.finish(element) : element
}
/**
 * Merges author/core events, then canonicalizes click casing for Button's activation
 * gate. Returns a fresh props object; other event names retain spread's casing.
 */
function buttonProps(part: AnyPart, props: Record<string, unknown>) {
  const merged = spread(part, props)
  for (const key of Object.keys(merged)) {
    if (key.toLowerCase() !== 'onclick' || key === 'onClick') continue
    merged.onClick = merged[key]
    delete merged[key]
  }
  return merged
}

/**
 * Registers a Button as a possible opener, default geometry anchor, and focus-return target.
 *
 * @remarks
 * Clicking the current trigger toggles visibility; clicking a different trigger
 * selects it and requests open without remounting content. Only the active trigger
 * receives expanded=true and generated aria-controls while open. Before a host is
 * selected, the first registered trigger is active. Removing the selected trigger
 * selects the first remaining entry on the client.
 * Author handlers can cancel activation through Button/spread, and disabled/pending
 * Button policy gates it. Literal hosts defer SSR controls associations; custom
 * components receive the current association directly and must forward props/ref.
 * @throws If rendered outside Popover.
 */
export function PopoverTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: PopoverTriggerProps<T, Payload>
): JSX.Element {
  const inherited = useContext(PopoverContext)
  const handle = untrack(() => props.handle)
  const context = () => (handle ? getOverlayHandleContext(handle) : inherited)
  if (!handle && !inherited)
    throw new Error('Popover.Trigger must be rendered inside a <Popover> or receive a handle')
  const generatedId = createUniqueId()
  const own = props as PopoverTriggerProps<'button', Payload>
  const entry: TriggerEntry = {
    id: () => own.id || generatedId,
    payload: () => props.payload,
  }
  if (handle) {
    createEffect(context, (value) => {
      if (!value) return
      const release = value.registerTrigger(entry)
      if (entry.element && !untrack(value.trigger)) value.setTrigger(entry.element)
      return release
    })
  } else {
    onCleanup(inherited!.registerTrigger(entry))
    onSettled(() => {
      if (entry.element && !untrack(inherited!.trigger)) inherited!.setTrigger(entry.element)
    })
  }
  const rest = omit(props as Record<string, unknown>, 'ref', 'children', 'handle', 'payload', 'id')
  const part = () => {
    const root = context()
    const original = root?.result().parts.trigger
    const active = root?.activeTrigger(entry) ?? false
    return {
      attrs: {
        ...original?.attrs,
        id: entry.id(),
        'aria-haspopup': 'dialog',
        'aria-expanded': root?.result().state.open && active ? 'true' : 'false',
        'aria-controls':
          root && active
            ? typeof (props as { as?: ValidComponent }).as === 'function'
              ? original?.attrs['aria-controls']
              : root.association('aria-controls', () =>
                  root.activeTrigger(entry)
                    ? root.result().parts.trigger.attrs['aria-controls']
                    : undefined
                )
            : undefined,
      },
      on: { click: () => context()?.activate(entry, true) },
    } as AnyPart
  }
  return (
    <Button
      ref={(el: HTMLElement) => {
        entry.element = el
        setRef((props as { ref?: unknown }).ref, el)
      }}
      {...buttonProps(part(), { ...rest })}
    >
      {(props as { children?: JSX.Element }).children}
    </Button>
  )
}
/**
 * Renders a Button requesting closed state, with Close popover as the default label.
 * Button props, disabled/pending gating, and author-event cancellation are preserved.
 * The root ignores the request when already closed.
 * @throws If rendered outside Popover.
 */
export function PopoverClose<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = usePopover('Popover.Close')
  return (
    <Button
      {...buttonProps(context.result().parts.close, {
        ...props,
        ...(!('aria-label' in props) ? { 'aria-label': 'Close popover' } : {}),
      })}
    />
  )
}
/** Positioning state and the single arrow slot for one mounted positioner. */
const PositionerContext = createContext<
  Positioner & {
    /** Replaces or clears the measured arrow host; prior arrows are not stacked. */
    setArrow(el: HTMLElement | undefined): void
  }
>()
/**
 * Div host props and {@link PositionerOptions}, with strategy fixed to fixed.
 * Anchor, arrow, and enabled state come from popover context. Author styles override
 * the wrapper baseline, but controller visibility/pointer-events take precedence.
 */
export type PopoverPositionerProps = Omit<ComponentProps<'div'>, keyof PositionerOptions> &
  Omit<PositionerOptions, 'strategy'> & {}
/**
 * Hosts and positions content in a native manual-popover div while presence requires it.
 *
 * @remarks
 * Uses fixed positioning against the explicit Anchor, otherwise the active Trigger.
 * Native hosting is shown before measurement; visibility and pointer interaction
 * remain suppressed until positioning completes. The floating layer then creates
 * its content focus scope. Open and exiting phases keep hosting and modal locks
 * active; closed force-mounted wrappers stay mounted but hidden and inactive.
 *
 * The inner mounted owner creates the geometry and floating-layer controllers and
 * disposes them on unmount. Nested layers infer ancestry from DOM containment;
 * children and arrow artwork remain inside this top-layer wrapper. Animate Content
 * rather than the measured wrapper. External native hiding requests controlled
 * closure and may reopen hosting if the parent keeps the session active.
 * @throws If rendered outside Popover or delegated native/controller setup fails.
 */
export function PopoverPositioner(props: PopoverPositionerProps): JSX.Element {
  const context = usePopover('Popover.Positioner')
  const rest = omit(
    props as Record<string, unknown>,
    'children',
    'ref',
    'style',
    'pointerEvents',
    'side',
    'align',
    'sideOffset',
    'alignOffset',
    'collisionBoundary',
    'collisionPadding',
    'flip',
    'shift',
    'tether',
    'fallbackPlacements',
    'hideWhenDetached',
    'matchAnchorSize',
    'arrowPadding',
    'autoUpdate',
    'onPositioned',
    'onError'
  )
  /** Owns controllers only while the outer presence branch exists, including force-mounted closed state. */
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDivElement>()
    const [arrow, setArrow] = createSignal<HTMLElement | undefined>(undefined, { ownedWrite: true })
    const [shown, setShown] = createSignal(false)
    /** Keeps physical hosting alive through exit, independently of forceMount. */
    const active = () => context.result().state.open || context.result().state.status === 'exiting'
    const positioner = createPositioner({
      anchor: () => context.anchor() ?? context.trigger(),
      floating: element,
      arrow,
      enabled: () => active() && shown(),
      options: () => ({
        side: props.side,
        align: props.align,
        strategy: 'fixed',
        sideOffset: props.sideOffset,
        alignOffset: props.alignOffset,
        collisionBoundary: props.collisionBoundary,
        collisionPadding: props.collisionPadding,
        flip: props.flip,
        shift: props.shift,
        tether: props.tether,
        fallbackPlacements: props.fallbackPlacements,
        hideWhenDetached: props.hideWhenDetached,
        pointerEvents: props.pointerEvents,
        matchAnchorSize: props.matchAnchorSize,
        arrowPadding: props.arrowPadding,
        autoUpdate: props.autoUpdate,
        dir: props.dir,
        onPositioned: props.onPositioned,
        onError: props.onError,
      }),
    })
    let controller: ReturnType<typeof createFloatingLayer> | undefined
    /** Wrapper identity bound to the current floating-layer controller; content changes flow through update. */
    let attached: HTMLElement | undefined
    createEffect(
      () => ({
        element: element(),
        content: context.content(),
        options: {
          open: context.result().state.open,
          active: active(),
          positioned: positioner.state().positioned,
          trigger: context.trigger(),
          branches: context.triggerElements(),
          modal: context.result().state.modal,
          initialFocus: context.own.initialFocus,
          finalFocus: context.own.finalFocus,
          restoreFocus: context.own.restoreFocus,
          closeOnEscape: context.own.closeOnEscape,
          closeOnOutside: context.own.closeOnOutside,
          closeOnFocusOutside: context.own.closeOnFocusOutside,
          onEscapeKeyDown: context.own.onEscapeKeyDown,
          onPointerOutside: context.own.onPointerOutside,
          onFocusOutside: context.own.onFocusOutside,
          onDismiss: () => context.change(false),
        },
      }),
      (value) => {
        if (!value.element || !value.content) return
        const options = { ...value.options, content: value.content }
        if (attached !== value.element) {
          controller?.dispose()
          attached = value.element
          controller = createFloatingLayer(value.element, options)
        } else controller?.update(options)
        setShown(controller?.isShown() ?? false)
      }
    )
    onCleanup(() => controller?.dispose())
    /** Combines baseline and author styles, giving controlled visibility/pointer-events final precedence. */
    const wrapperStyle = () => {
      const baseline = {
        margin: '0',
        inset: 'auto',
        border: '0',
        padding: '0',
        background: 'transparent',
        color: 'inherit',
        width: 'max-content',
        overflow: 'visible',
      }
      const visibility = positioner.positionerProps().style
      const pointerEvents =
        visibility['pointer-events'] === 'none' ? 'none' : (props.pointerEvents ?? 'auto')
      const author = props.style
      if (typeof author === 'string')
        return `margin:0;inset:auto;border:0;padding:0;background:transparent;color:inherit;width:max-content;overflow:visible;${author};visibility:${visibility.visibility};pointer-events:${pointerEvents}`
      return {
        ...baseline,
        ...author,
        ...visibility,
        'pointer-events': pointerEvents,
      } as JSX.CSSProperties
    }
    const inner = createMemo(() => (
      <PositionerContext value={{ ...positioner, setArrow }}>{props.children}</PositionerContext>
    ))
    return (
      <div
        ref={(el) => {
          setElement(el)
          setRef(props.ref, el)
        }}
        {...rest}
        popover="manual"
        hidden={!active()}
        data-state={context.result().state.open ? 'open' : 'closed'}
        data-part="positioner"
        style={wrapperStyle()}
      >
        {inner()}
      </div>
    )
  }
  return (
    <Show when={context.result().state.present}>
      <Mounted />
    </Show>
  )
}
/**
 * Renders dialog content inside a Positioner and registers its live ID for trigger associations.
 *
 * @remarks
 * The ref supplies the content focus region and exit-animation target before the
 * author ref runs. Title/description associations use server finalization where
 * needed. A truthy aria-label suppresses generated aria-labelledby; explicit author
 * attributes still take precedence. Current placement is exposed through data-side,
 * data-align, and data-placement. Unmounting removes its ID registration, while the
 * last content element reference remains stored until another ref replaces it.
 * @throws If rendered outside Popover or Popover.Positioner.
 */
export function PopoverContent<T extends ValidComponent = 'div'>(
  props: PopoverContentProps<T>
): JSX.Element {
  const context = usePopover('Popover.Content')
  const positioner = useContext(PositionerContext)
  if (!positioner) throw new Error('Popover.Content must be rendered inside Popover.Positioner')
  const own = props as {
    as?: ValidComponent
    id?: string
    ref?: unknown
    children?: JSX.Element
    'aria-label'?: string
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'id', 'children')
  onCleanup(context.register('content', () => own.id ?? context.id('content')))
  const children = createMemo(() => own.children)
  const attributes = () =>
    spread(context.result().parts.content, {
      'aria-labelledby': own['aria-label']
        ? undefined
        : context.association(
            'aria-labelledby',
            () => context.result().parts.content.attrs['aria-labelledby']
          ),
      'aria-describedby': context.association(
        'aria-describedby',
        () => context.result().parts.content.attrs['aria-describedby']
      ),
      'data-side': positioner.state().side,
      'data-align': positioner.state().align,
      'data-placement': positioner.state().placement,
      ...rest,
      id: own.id ?? context.id('content'),
    })
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        context.setContent(el)
        setRef(own.ref, el)
      }}
      {...attributes()}
    >
      {children()}
    </Dynamic>
  )
}
/** Explicit geometry-anchor host props. The registered anchor takes priority over the active trigger. */
export type PopoverAnchorProps<T extends ValidComponent = 'div'> = Omit<ComponentProps<T>, 'as'> & {
  /** Rendered host, defaulting to div; custom components must forward props and refs. */
  as?: T
}
/**
 * Registers an explicit geometry anchor, overriding trigger-based positioning.
 * The forwarded ref replaces the single anchor slot before calling the author ref.
 * Client cleanup clears that slot unconditionally; multiple anchors are not stacked.
 * This part adds no role, event behavior, or dismissal containment branch.
 * @throws If rendered outside Popover.
 */
export function PopoverAnchor<T extends ValidComponent = 'div'>(
  props: PopoverAnchorProps<T>
): JSX.Element {
  const context = usePopover('Popover.Anchor')
  onCleanup(() => {
    if (!isServer) context.setAnchor(undefined)
  })
  const own = props as {
    as?: ValidComponent
    ref?: unknown
    children?: JSX.Element
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        context.setAnchor(el)
        setRef(own.ref, el)
      }}
      {...rest}
    >
      {own.children}
    </Dynamic>
  )
}
/**
 * Polymorphic arrow host props, sharing the shape of {@link PopoverAnchorProps}.
 * Its ref identifies the measured arrow, not the geometry anchor. Requires a
 * Positioner ancestor; provide artwork inside a square layout box.
 */
export type PopoverArrowProps<T extends ValidComponent = 'div'> = PopoverAnchorProps<T>
/**
 * Registers the positioner's measured arrow box and applies presentation-only props.
 * Supply arrow artwork inside the box. Controller placement/visibility styles and
 * data-side describe the resolved edge. Uncenterable arrows are hidden, as are
 * arrows whose reference is clipped when hideWhenDetached is enabled.
 * Author JSX props follow arrowProps and can override its initial attributes.
 * Client cleanup clears the single arrow slot without restoring a previous arrow.
 * @throws If rendered outside Popover.Positioner.
 */
export function PopoverArrow<T extends ValidComponent = 'div'>(
  props: PopoverArrowProps<T>
): JSX.Element {
  const positioner = useContext(PositionerContext)
  if (!positioner) throw new Error('Popover.Arrow must be rendered inside Popover.Positioner')
  onCleanup(() => {
    if (!isServer) positioner.setArrow(undefined)
  })
  const own = props as {
    as?: ValidComponent
    ref?: unknown
    children?: JSX.Element
  }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  return (
    <Dynamic
      component={own.as ?? 'div'}
      ref={(el: HTMLElement) => {
        positioner.setArrow(el)
        setRef(own.ref, el)
      }}
      {...positioner.arrowProps()}
      {...rest}
    >
      {own.children}
    </Dynamic>
  )
}
/**
 * Renders and registers a live title ID for content naming. Author IDs override
 * the fallback; cleanup removes this registration. Multiple titles share the fallback
 * unless distinct IDs are supplied. The default host is h2.
 * @throws If rendered outside Popover.
 */
export function PopoverTitle<T extends ValidComponent = 'h2'>(
  props: PopoverTitleProps<T>
): JSX.Element {
  const context = usePopover('Popover.Title')
  const own = props as { as?: ValidComponent; id?: string; ref?: unknown }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  onCleanup(context.register('title', () => ('id' in props ? own.id : context.id('title'))))
  return (
    <Dynamic component={own.as ?? 'h2'} ref={props.ref} {...{ id: context.id('title'), ...rest }}>
      {(props as { children?: JSX.Element }).children}
    </Dynamic>
  )
}
/**
 * Renders and registers a live description ID for content aria-describedby.
 * Author IDs override the fallback; cleanup removes this registration. Supply
 * distinct IDs for multiple descriptions. The default host is p.
 * @throws If rendered outside Popover.
 */
export function PopoverDescription<T extends ValidComponent = 'p'>(
  props: PopoverDescriptionProps<T>
): JSX.Element {
  const context = usePopover('Popover.Description')
  const own = props as { as?: ValidComponent; id?: string; ref?: unknown }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref', 'children')
  onCleanup(
    context.register('description', () => ('id' in props ? own.id : context.id('description')))
  )
  return (
    <Dynamic
      component={own.as ?? 'p'}
      ref={props.ref}
      {...{ id: context.id('description'), ...rest }}
    >
      {(props as { children?: JSX.Element }).children}
    </Dynamic>
  )
}

/** Native div attributes for the optional popup transition viewport. */
export type PopoverViewportProps = Omit<FloatingViewportProps, 'source'>
/**
 * Place inside Content to retain inert previous content during trigger or payload
 * transitions. CSS supplies animation and scrolling; this wrapper adds no tab stop.
 * See {@link FloatingViewport} for dimension variables and the intrinsic-sizing
 * CSS recipe. Previous content is a sanitized DOM clone with no Solid ownership.
 */
export function PopoverViewport(props: PopoverViewportProps): JSX.Element {
  const context = usePopover('Popover.Viewport')
  return (
    <FloatingViewport
      {...props}
      data-part="viewport"
      data-state={context.result().state.open ? 'open' : 'closed'}
      source={{
        open: () => context.result().state.open,
        trigger: context.trigger,
        content: context.content,
        beforeChange: context.beforeChange,
      }}
    />
  )
}

/**
 * Popover root and associated parts. Place Content and Arrow inside Positioner;
 * other parts require the root context. Root is also available as Popover.Root.
 */
export const Popover = Object.assign(PopoverRoot, {
  /** Root state, associations, and presence provider. */
  Root: PopoverRoot,
  /** Create a typed handle for detached triggers and imperative commands. */
  createHandle: createPopoverHandle,
  /** Move popup content while preserving Solid context and native modal ancestry. */
  Portal: OverlayPortal,
  /** Optional content transition and scrolling wrapper inside Content. */
  Viewport: PopoverViewport,
  /** Registered opener with shared active-trigger selection. */
  Trigger: PopoverTrigger,
  /** Named dialog and focus/exit region inside Positioner. */
  Content: PopoverContent,
  /** Native hosting wrapper with fixed geometry and dismissal lifecycle. */
  Positioner: PopoverPositioner,
  /** Explicit geometry reference preferred over the active trigger. */
  Anchor: PopoverAnchor,
  /** Measured presentation box for arrow artwork inside Positioner. */
  Arrow: PopoverArrow,
  /** Registered content title, defaulting to h2. */
  Title: PopoverTitle,
  /** Registered descriptive text, defaulting to p. */
  Description: PopoverDescription,
  /** Button requesting logical closure. */
  Close: PopoverClose,
})
