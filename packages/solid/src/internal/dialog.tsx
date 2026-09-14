import type { AnyPart, DialogOptions, DialogResult, DrawerSide } from '@tenon/core'
import { createDialogController } from '@tenon/dom'
import type { DrawerDragThreshold, LayerPointerOutsideEvent } from '@tenon/dom'
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
import { createPresence } from './presence'
import { spread } from '../spread'
import { OverlayPortal, OverlayPortalMountContext } from './overlay-portal'
import type { OverlayPortalProps } from './overlay-portal'
import { attachOverlayHandle, createOverlayHandle, getOverlayHandleContext } from './overlay-handle'
import type { OverlayHandle } from './overlay-handle'

/** A handle connecting one mounted dialog-family root to detached triggers and commands. */
export type DialogHandle<Payload = unknown> = OverlayHandle<Payload, Context>
/** Alert dialog handle with the same controlled command semantics as Dialog. */
export type AlertDialogHandle<Payload = unknown> = DialogHandle<Payload>
/** Drawer handle for detached triggers and imperative commands, separate from its drag Handle part. */
export type DrawerHandle<Payload = unknown> = DialogHandle<Payload>
/** Live root values supplied to a children callback. Read these getters inside JSX. */
export interface DialogRenderState<Payload = unknown> {
  /** Effective controlled or uncontrolled visibility. */
  readonly open: boolean
  /** Selected trigger ID, if a trigger is registered. */
  readonly triggerId: string | undefined
  /** Data selected by the most recent opening trigger or imperative payload request. */
  readonly payload: Payload | undefined
}
/** Live render callback state for AlertDialog. */
export type AlertDialogRenderState<Payload = unknown> = DialogRenderState<Payload>
/** Live render callback state for Drawer. */
export type DrawerRenderState<Payload = unknown> = DialogRenderState<Payload>
/**
 * Create a typed dialog-family handle for one mounted Root. Detached commands are
 * ignored without queuing. openWithPayload preserves the supplied data, including
 * undefined when allowed by Payload; visibility remains owned by the Root.
 */
export function createDialogHandle<Payload = unknown>(): DialogHandle<Payload> {
  return createOverlayHandle<Payload, Context>()
}
/** Registered opener with live authored identity and data. */
interface TriggerEntry {
  /** Physical opener, supplied by its ref. */
  element?: HTMLElement
  /** Authored ID or generated stable fallback. */
  id(): string
  /** Data read when this opener activates. */
  payload(): unknown
}
/** Shared root options consumed by the dialog, alert dialog, and drawer adapters. */
interface Own {
  /** Controlled visibility while defined; undefined uses internal state. */
  open?: boolean
  /** Initial uncontrolled visibility, read once at setup. Defaults to false. */
  defaultOpen?: boolean
  /** Reports a different visibility request after updating uncontrolled state. Same-state requests and initialization are silent. */
  onOpenChange?: (open: boolean) => void
  /** Use modal native presentation and focus containment by default. Alert dialogs always remain modal. */
  modal?: boolean
  /** Retain closed content, hidden after exit, without an active native session. Defaults to false. */
  forceMount?: boolean
  /** Allow Escape and native cancel dismissal requests. Defaults to true; native cancel is always prevented. */
  closeOnEscape?: boolean
  /** Allow outside-pointer dismissal. Defaults to true for dialogs/drawers; alert dialogs always disable it. */
  closeOnOutside?: boolean
  /** Focus target for each new native session; false skips scope placement, not native browser focus. Alerts otherwise prefer Cancel. */
  initialFocus?: HTMLElement | false
  /** Preferred eligible focus target when the session ends; updates affect the current session. Otherwise restoration uses captured openers. */
  finalFocus?: HTMLElement
  /** Cancelable layer Escape callback; preventDefault vetoes dismissal. Not called for native cancel or when Escape dismissal is disabled. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Deferred outside-pointer callback; wrapper preventDefault vetoes dismissal without canceling the native pointer event. */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  /** Fallback content ID, also used by trigger aria-controls. Registered content IDs take precedence in associations. */
  contentId?: string
  /** Fallback title association when no title is registered; also the default rendered Title ID. Omission generates an ID only for the part. */
  titleId?: string
  /** Fallback description association when none is registered; also the default Description ID. Omission generates an ID only for the part. */
  descriptionId?: string
  /** Receives the rendered root wrapper, not the native dialog. */
  ref?: (el: HTMLElement) => void
}
/** Shared dialog root options combined with the selected wrapper host props. */
export type DialogProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  ComponentProps<T>,
  keyof Own | 'as' | 'children'
> &
  Own & {
    /** Root wrapper host, defaulting to div; Viewport owns native dialog presentation. */
    as?: T
    /** Stable handle connecting detached triggers and imperative requests to this mounted root. */
    handle?: DialogHandle<Payload>
    /** Static parts or a callback receiving live open, triggerId, and payload getters. */
    children?: JSX.Element | ((state: DialogRenderState<Payload>) => JSX.Element)
  }
/** Dialog root props with modal and outside-dismissal options removed for alert policy. */
export type AlertDialogProps<T extends ValidComponent = 'div', Payload = unknown> = Omit<
  DialogProps<T, Payload>,
  'modal' | 'closeOnOutside'
>
/** Drawer placement and handle-drag options added to the shared root props. */
interface DrawerOwn {
  /** Physical edge used for state hooks and handle drag direction. Defaults to bottom. */
  side?: DrawerSide
  /** Percent of drag-axis size, pixels, or rem. Defaults to 25% of the drawer size, at least 40px. */
  dragThreshold?: DrawerDragThreshold
}
/** Shared dialog behavior plus drawer side and drag threshold options. */
export type DrawerProps<T extends ValidComponent = 'div', Payload = unknown> = DialogProps<
  T,
  Payload
> &
  DrawerOwn
/** Content props. Inside Viewport this renders a div; standalone usage retains a native dialog. */
export type DialogContentProps = Omit<ComponentProps<'dialog'>, 'ref' | 'open'> & {
  /** Receives the visual inner div inside Viewport, or the native dialog in standalone usage. Use Viewport.ref when native dialog methods are needed. */
  ref?: (el: HTMLElement) => void
}
/** Native scrolling/layout host props. The adapter owns native presentation. */
export type DialogViewportProps = Omit<ComponentProps<'dialog'>, 'ref' | 'open'> & {
  /** Receives the native dialog that enters the browser top layer. */
  ref?: (el: HTMLDialogElement) => void
}
/** Portal destination and children shared by all dialog families. */
export type DialogPortalProps = OverlayPortalProps
/** Portal with inherited native modal ancestry and client-only rendering. */
export const DialogPortal = OverlayPortal
/** Inner surface supplies authored semantics to its surrounding native host. */
const ViewportContext = createContext<{
  setProps(props: DialogContentProps | undefined): void
} | null>(null)
/** {@link ButtonProps} for an opening trigger, including native/generic activation and disabled/pending gates. */
export type DialogTriggerProps<
  T extends ValidComponent = 'button',
  Payload = unknown,
> = ButtonProps<T> & {
  /** Target a root outside this trigger's Solid ancestry. */
  handle?: DialogHandle<Payload>
  /** Payload selected when this trigger opens the root. */
  payload?: NoInfer<Payload>
}
/** {@link ButtonProps} for a closing action; an author handler can cancel dismissal. */
export type DialogCloseProps<T extends ValidComponent = 'button'> = ButtonProps<T>
/** Polymorphic title props; the rendered ID is registered for content naming. */
export type DialogTitleProps<T extends ValidComponent = 'h2'> = ComponentProps<T> & {
  /** Rendered text host, defaulting to h2. */
  as?: T
  /** Receives the rendered text element. */
  ref?: (el: HTMLElement) => void
}
/** Polymorphic description props; the rendered ID is registered for content description. */
export type DialogDescriptionProps<T extends ValidComponent = 'p'> = ComponentProps<T> & {
  /** Rendered text host, defaulting to p. */
  as?: T
  /** Receives the rendered text element. */
  ref?: (el: HTMLElement) => void
}
/** Family variant selecting alert focus/dismissal policy and drawer-specific consumers. */
type Kind = 'dialog' | 'alert' | 'drawer'
/** Root-owned reactive state, element refs, and cross-part ID registration. */
interface Context {
  /** Configured family variant, fixed when the root is created. */
  kind: Kind
  /** Live author options read by content and family-specific adapters. */
  own: Own & DrawerOwn
  /** Current core snapshot; server reads recompute to include registrations made during rendering. */
  result(): DialogResult
  /** Request different visibility, storing only uncontrolled state before notifying the author. */
  change(open: boolean): void
  /** Current opener for default focus restoration. */
  trigger(): HTMLElement | undefined
  /** Register a detached or descendant trigger for this root lifetime. */
  registerTrigger(entry: TriggerEntry): () => void
  /** Select this trigger and its data, then request opening. */
  activate(entry: TriggerEntry): void
  /** Whether this trigger represents the current shared dialog content. */
  activeTrigger(entry: TriggerEntry): boolean
  /** Surface used for exit observation and drawer gestures; native in legacy anatomy. */
  content(): HTMLElement | undefined
  /** Record the surface for presence observation and dependent adapters. */
  setContent(el: HTMLElement | undefined): void
  /** Append a live ID getter in registration order; return its removal callback for owner cleanup. */
  register(name: 'title' | 'description' | 'content', id: () => string): () => void
  /** Resolve an explicit root ID option or the generated fallback for this part. */
  id(name: 'title' | 'description' | 'content'): string
  /** Read a naming/description association now on the client, or defer its server attribute resolution. */
  association(
    name: 'aria-labelledby' | 'aria-describedby',
    read: () => string | undefined
  ): string | undefined
  /** Most recently attached alert Cancel target; undefined until registered and not cleared on detach. */
  cancel(): HTMLElement | undefined
  /** Record the alert Cancel element used as the default initial focus target. */
  setCancel(el: HTMLElement): void
}
/** Shared provider used by all three dialog families and their parts. */
const DialogContext = createContext<Context | null>(null)
/** Reads the nearest dialog-family context, throwing an error naming the consumer when absent. */
export function useDialog(name: string): Context {
  const context = useContext(DialogContext)
  if (!context)
    throw new Error(`${name} must be rendered inside a <Dialog>, <AlertDialog>, or <Drawer>`)
  return context
}
/**
 * Creates the shared wrapper, state, presence, and context for a dialog family.
 *
 * @remarks
 * The supplied core engine selects family semantics. Defined open controls state;
 * undefined releases control to the internal value initialized from defaultOpen.
 * {@link createPresence} keeps exiting content present until its animation wait
 * completes. The wrapper itself owns no native presentation or focus scope.
 *
 * Part IDs are live getters joined in registration order without deduplication.
 * Registered IDs win over explicit root association IDs; absent title/description
 * registrations produce no generated references. Content always has a fallback ID.
 * Client registrations invalidate the memo; server reads recompute and defer
 * naming/description attributes through {@link serverAssociations} until rendered
 * descendants have registered. Registry cleanup belongs to each registering part.
 *
 * @param props - Reactive author options and wrapper props; unconsumed props reach the wrapper.
 * @param config - Fixed family kind and core computation used for all parts.
 */
export function createDialogRoot<T extends ValidComponent, Payload = unknown>(
  props: DialogProps<T, Payload>,
  config: {
    /** Fixed family policy for content and specialized parts. */
    kind: Kind
    /** Core engine receiving resolved state and registered IDs; called again as reactive inputs change. */
    compute(
      options: DialogOptions & {
        /** Optional drawer edge passed through from root props. */
        side?: DrawerSide
      }
    ): DialogResult
  }
): JSX.Element {
  const { kind } = config
  const own = props as Own & DrawerOwn & { as?: ValidComponent }
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
    'initialFocus',
    'finalFocus',
    'onEscapeKeyDown',
    'onPointerOutside',
    'contentId',
    'titleId',
    'descriptionId',
    'side',
    'dragThreshold'
  )
  const base = createUniqueId()
  const [internal, setInternal] = createSignal(untrack(() => own.defaultOpen ?? false))
  const [content, setContent] = createSignal<HTMLElement>()
  const [cancel, setCancel] = createSignal<HTMLElement>()
  const [revision, setRevision] = createSignal(0, { ownedWrite: true })
  let version = 0
  let triggers: TriggerEntry[] = []
  const [selected, setSelected] = createSignal<TriggerEntry | undefined>(undefined, {
    ownedWrite: true,
  })
  const [payload, setPayload] = createSignal<unknown>(undefined, { ownedWrite: true })
  const activeEntry = () => {
    revision()
    return selected() ?? triggers[0]
  }
  const trigger = () => activeEntry()?.element
  const select = (entry: TriggerEntry | undefined, nextPayload: unknown) => {
    setSelected(entry)
    setPayload(() => nextPayload)
  }
  const entries: Record<'title' | 'description' | 'content', (() => string)[]> = {
    title: [],
    description: [],
    content: [],
  }
  const id = (name: 'title' | 'description' | 'content') => own[`${name}Id`] ?? `${base}-${name}`
  /** Read all currently registered IDs; an empty combined string yields no association. */
  const registered = (name: 'title' | 'description' | 'content') => {
    revision()
    return entries[name].map((read) => read()).join(' ') || undefined
  }
  const open = () => own.open ?? internal()
  /** Suppress duplicate requests before storing uncontrolled state and notifying the author. */
  const change = (next: boolean) => {
    if (untrack(open) === next) return
    if (own.open === undefined) setInternal(next)
    own.onOpenChange?.(next)
  }
  const life = createPresence({ open, forceMount: () => own.forceMount ?? false })
  const compute = () => {
    return config.compute({
      ids: {
        content: registered('content') ?? id('content'),
        title: registered('title') ?? own.titleId,
        description: registered('description') ?? own.descriptionId,
      },
      open: open(),
      modal: own.modal,
      side: own.side,
      status: life.status(),
      forceMount: own.forceMount,
      onOpenChange: change,
    })
  }
  const memo = createMemo(compute)
  const result = isServer ? compute : memo
  const associations = isServer ? serverAssociations() : undefined
  const context: Context = {
    kind,
    own,
    result,
    change,
    trigger,
    registerTrigger(entry) {
      triggers.push(entry)
      if (!isServer) setRevision(++version)
      return () => {
        triggers = triggers.filter((candidate) => candidate !== entry)
        if (untrack(selected) === entry) setSelected(undefined)
        if (!isServer) setRevision(++version)
      }
    },
    activate(entry) {
      select(entry, entry.payload())
      change(true)
    },
    activeTrigger: (entry) => activeEntry() === entry,
    content,
    cancel,
    setCancel,
    setContent: (el) => {
      if (el) life.ref(el)
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
  if (handle)
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
              : untrack(activeEntry)
          if (command.type === 'open' && command.triggerId !== undefined && !entry) return
          select(entry, command.type === 'payload' ? command.payload : entry?.payload())
          change(true)
        },
      })
    )
  const state: DialogRenderState<Payload> = {
    get open() {
      return open()
    },
    get triggerId() {
      return activeEntry()?.id()
    },
    get payload() {
      return payload() as Payload | undefined
    },
  }
  const inner = createMemo(() => (
    <DialogContext value={context}>
      <ViewportContext value={null}>
        {(() => {
          const children = props.children
          return typeof children === 'function' ? children(state) : children
        })()}
      </ViewportContext>
    </DialogContext>
  ))
  const element = (
    <Dynamic
      component={own.as ?? 'div'}
      ref={own.ref}
      {...spread(result().parts.root, { ...rest })}
    >
      {inner()}
    </Dynamic>
  )
  return associations ? associations.finish(element) : element
}
/**
 * Compose author/core handlers, then normalize click spelling for Button's gate.
 * Button consumes onClick specifically; leaving spread's alternate spelling would
 * bypass its disabled/pending activation gate. Mutates only the fresh merged props.
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
 * Registers a Button with the nearest dialog-family root or its explicit handle.
 * Activation selects this trigger and its live payload, then requests opening.
 * Detached triggers reconnect when their handle root mounts; earlier clicks are ignored.
 * Author handlers run before the core action and may cancel it. Button owns host
 * semantics, keyboard activation, and disabled/pending interaction gating.
 * @throws If rendered outside a dialog-family root without a handle.
 */
export function DialogTrigger<T extends ValidComponent = 'button', Payload = unknown>(
  props: DialogTriggerProps<T, Payload>
): JSX.Element {
  const inherited = useContext(DialogContext)
  const handle = untrack(() => props.handle)
  const context = () => (handle ? getOverlayHandleContext(handle) : inherited)
  if (!handle && !inherited)
    throw new Error('Dialog.Trigger must be rendered inside a dialog family or receive a handle')
  const generatedId = createUniqueId()
  const own = props as DialogTriggerProps<'button', Payload>
  const entry: TriggerEntry = { id: () => own.id || generatedId, payload: () => props.payload }
  if (handle) createEffect(context, (root) => root?.registerTrigger(entry))
  else onCleanup(inherited!.registerTrigger(entry))
  const rest = omit(props as Record<string, unknown>, 'ref', 'id', 'children', 'handle', 'payload')
  const part = (): AnyPart => {
    const root = context()
    return {
      attrs: {
        ...root?.result().parts.trigger.attrs,
        id: entry.id(),
        'aria-haspopup': 'dialog',
        'aria-expanded': root?.activeTrigger(entry) && root.result().state.open ? 'true' : 'false',
      },
      on: { click: () => context()?.activate(entry) },
    }
  }
  return (
    <Button
      {...buttonProps(part(), { ...rest })}
      ref={(el: HTMLElement) => {
        entry.element = el
        own.ref?.(el)
      }}
    >
      {(props as { children?: JSX.Element }).children}
    </Button>
  )
}
/**
 * Renders a {@link Button} that requests closing the nearest dialog-family root.
 * Author cancellation and Button's disabled/pending gates apply before dismissal.
 * Used by shared Close parts and alert actions; it does not perform application work.
 * @throws If rendered outside a dialog-family root.
 */
export function DialogClose<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Close')
  return <Button {...buttonProps(context.result().parts.close, { ...props })} />
}
/**
 * Renders the dialog surface. Inside Viewport this is a div; standalone Content
 * preserves the legacy native dialog host and controller.
 *
 * @remarks
 * Inside Viewport, Content supplies its ID, role, and ARIA naming to the native
 * viewport host. Its ref receives the visual div used for focus scope, outside
 * hit testing, exit observation, and drawer gestures. The Viewport owns the native
 * controller; standalone Content owns that controller itself. Content association
 * registration belongs to the host component's owner, including periods when its
 * physical native element is absent.
 * Logical closing retains the native session through exiting presence. Closed
 * force-mounted content remains rendered with an inactive controller.
 *
 * {@link createDialogController} owns native showing, dismissal, focus scopes, and
 * modal locks. Reactive policy updates reach it without recreating this component;
 * controller modality changes restart the session. Alerts disallow outside closure
 * and prefer the registered Cancel target when no initialFocus is supplied.
 *
 * Without Portal, server markup writes open on the native host from logical
 * state; client presentation uses the controller. Portal emits no server contents
 * and mounts its subtree fresh on the client. Author ARIA attributes override
 * generated associations. A truthy aria-label suppresses generated aria-labelledby, but an explicit authored
 * aria-labelledby still wins. Development settlement warns for a missing accessible
 * name, and for an alert without a description; it does not validate referenced IDs.
 * @throws If rendered outside a dialog-family root.
 */
export function DialogContent(props: DialogContentProps): JSX.Element {
  const viewport = useContext(ViewportContext)
  // The nearest provider is fixed for this component lifetime.
  // eslint-disable-next-line solid/components-return-once
  if (!viewport) return <DialogHost {...props} />
  const context = useDialog('Dialog.Content')
  viewport.setProps(props)
  onCleanup(() => {
    viewport.setProps(undefined)
    context.setContent(undefined)
  })
  const rest = omit(
    props as Record<string, unknown>,
    'ref',
    'id',
    'role',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-modal',
    'children',
    'open'
  )
  const attributes = () => {
    const attrs = { ...context.result().parts.content.attrs } as Record<string, unknown>
    for (const name of [
      'id',
      'role',
      'aria-label',
      'aria-labelledby',
      'aria-describedby',
      'aria-modal',
    ])
      delete attrs[name]
    return { ...attrs, ...rest }
  }
  return (
    <div
      {...attributes()}
      ref={(el) => {
        context.setContent(el)
        props.ref?.(el)
      }}
    >
      {props.children}
    </div>
  )
}
/**
 * Fullscreen native dialog host. Its Content supplies the visual surface and exit
 * animation; this host retains native modality until that exit finishes. Descendant
 * portals inherit its inner Content so native modal inertness and focus containment
 * both permit their content.
 * Author styles override the neutral fullscreen layout and scrolling defaults.
 */
export function DialogViewport(props: DialogViewportProps): JSX.Element {
  return <DialogHost {...props} viewport />
}
/** Shared native session host for explicit Viewport and legacy standalone Content. */
function DialogHost(
  props: Omit<DialogContentProps, 'ref'> & {
    viewport?: boolean
    ref?: (el: HTMLDialogElement) => void
  }
): JSX.Element {
  const context = useDialog('Dialog.Content')
  const viewport = untrack(() => props.viewport)
  const rest = omit(props as Record<string, unknown>, 'ref', 'id', 'children', 'viewport')
  const [surfaceProps, setSurfaceProps] = createSignal<DialogContentProps | undefined>(undefined, {
    ownedWrite: true,
  })
  const semantic = () => surfaceProps() ?? props
  const hostId = () => {
    const id = semantic().id
    return (
      (typeof id === 'string' ? id : typeof props.id === 'string' ? props.id : undefined) ??
      context.id('content')
    )
  }
  onCleanup(
    context.register(
      'content',
      // eslint-disable-next-line solid/reactivity -- The registry reads this getter from the root memo.
      () => hostId()
    )
  )
  /** Own one physical content lifetime, including memoized children and controller cleanup. */
  function Mounted(): JSX.Element {
    const [element, setElement] = createSignal<HTMLDialogElement>()
    const children = createMemo(() => (
      <OverlayPortalMountContext value={viewport ? context.content : element}>
        {viewport ? (
          <ViewportContext value={{ setProps: setSurfaceProps }}>{props.children}</ViewportContext>
        ) : (
          props.children
        )}
      </OverlayPortalMountContext>
    ))
    /** Keep native presentation active during exit while logical open gates dismissal. */
    const options = () => ({
      content: viewport ? context.content() : undefined,
      open: context.result().state.open,
      active: context.result().state.open || context.result().state.status === 'exiting',
      modal: context.result().state.modal,
      closeOnEscape: context.own.closeOnEscape,
      closeOnOutside: context.kind === 'alert' ? false : context.own.closeOnOutside,
      initialFocus:
        context.own.initialFocus ?? (context.kind === 'alert' ? context.cancel() : undefined),
      finalFocus: context.own.finalFocus ?? context.trigger(),
      onOpenChange: context.change,
      onEscapeKeyDown: context.own.onEscapeKeyDown,
      onPointerOutside: context.own.onPointerOutside,
    })
    let controller: ReturnType<typeof createDialogController> | undefined
    let attached: HTMLDialogElement | undefined
    createEffect(
      () => ({ element: element(), options: options() }),
      (value) => {
        if (
          !value.element ||
          (viewport && (!value.options.content || !value.element.contains(value.options.content)))
        )
          return
        if (attached !== value.element) {
          controller?.dispose()
          attached = value.element
          controller = createDialogController(value.element, value.options)
        } else controller?.update(value.options)
      }
    )
    onCleanup(() => controller?.dispose())
    onSettled(() => {
      if (!import.meta.env.DEV) return
      const el = element()
      if (!el) return
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
        console.warn(
          'Dialog.Content requires an accessible name. Render Dialog.Title or provide aria-label.'
        )
      if (context.kind === 'alert' && !el.getAttribute('aria-describedby'))
        console.warn(
          'AlertDialog.Content requires a description. Render AlertDialog.Description or provide aria-describedby.'
        )
    })
    /** Combine deferred server associations with author overrides and a concrete content ID. */
    const attributes = () =>
      spread(context.result().parts.content, {
        'aria-labelledby': semantic()['aria-label']
          ? undefined
          : context.association(
              'aria-labelledby',
              () => context.result().parts.content.attrs['aria-labelledby']
            ),
        'aria-describedby': context.association(
          'aria-describedby',
          () => context.result().parts.content.attrs['aria-describedby']
        ),
        ...rest,
        ...(viewport
          ? {
              'aria-label': semantic()['aria-label'] ?? props['aria-label'],
              'aria-labelledby':
                semantic()['aria-labelledby'] ??
                props['aria-labelledby'] ??
                (semantic()['aria-label'] || props['aria-label']
                  ? undefined
                  : context.association(
                      'aria-labelledby',
                      () => context.result().parts.content.attrs['aria-labelledby']
                    )),
              'aria-describedby':
                semantic()['aria-describedby'] ??
                props['aria-describedby'] ??
                context.association(
                  'aria-describedby',
                  () => context.result().parts.content.attrs['aria-describedby']
                ),
            }
          : {}),
        id: hostId(),
        ...(isServer ? { open: context.result().state.open || undefined } : {}),
      })
    // Register the surface props before serializing native semantic attributes.
    if (isServer) untrack(children)
    return (
      <dialog
        ref={(el) => {
          if (!viewport) context.setContent(el)
          setElement(el)
          props.ref?.(el)
        }}
        {...attributes()}
        style={
          viewport
            ? typeof props.style === 'string'
              ? `position:fixed;inset:0;margin:0;width:100%;height:100%;max-width:none;max-height:none;background:transparent;border:0;padding:0;overflow:auto;${props.style}${context.result().state.status === 'exited' ? ';display:none' : ''}`
              : {
                  position: 'fixed',
                  inset: '0',
                  margin: '0',
                  width: '100%',
                  height: '100%',
                  'max-width': 'none',
                  'max-height': 'none',
                  background: 'transparent',
                  border: '0',
                  padding: '0',
                  overflow: 'auto',
                  ...props.style,
                  ...(context.result().state.status === 'exited' ? { display: 'none' } : {}),
                }
            : props.style
        }
      >
        {children()}
      </dialog>
    )
  }
  return (
    <Show when={context.result().state.present}>
      <Mounted />
    </Show>
  )
}
/**
 * Renders title text and registers a live ID getter for content naming.
 * Defaults to h2. An author id overrides the root's titleId/generated fallback;
 * changes are observed by the registry, and owner cleanup removes the reference.
 * Multiple title registrations are joined in registration order. Supply distinct
 * IDs when rendering multiple titles because their generated fallback is shared.
 * @throws If rendered outside a dialog-family root.
 */
export function DialogTitle<T extends ValidComponent = 'h2'>(
  props: DialogTitleProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Title')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  onCleanup(context.register('title', () => own.id ?? context.id('title')))
  return (
    <Dynamic component={own.as ?? 'h2'} ref={own.ref} {...{ id: context.id('title'), ...rest }} />
  )
}
/**
 * Renders descriptive text and registers a live ID getter for content description.
 * Defaults to p. An author id overrides the root's descriptionId/generated fallback;
 * owner cleanup removes its reference. Multiple descriptions contribute IDs in
 * registration order and need distinct author IDs to avoid their shared fallback.
 * @throws If rendered outside a dialog-family root.
 */
export function DialogDescription<T extends ValidComponent = 'p'>(
  props: DialogDescriptionProps<T>
): JSX.Element {
  const context = useDialog('Dialog.Description')
  const own = props as { as?: ValidComponent; id?: string; ref?: (el: HTMLElement) => void }
  const rest = omit(props as Record<string, unknown>, 'as', 'ref')
  onCleanup(context.register('description', () => own.id ?? context.id('description')))
  return (
    <Dynamic
      component={own.as ?? 'p'}
      ref={own.ref}
      {...{ id: context.id('description'), ...rest }}
    />
  )
}

/** Shared compound parts attached to Dialog, AlertDialog, and Drawer roots. */
export const dialogParts = {
  /** Moves overlay content to its configured DOM destination. */
  Portal: DialogPortal,
  /** Native top-layer host for layout and scrolling around Content. */
  Viewport: DialogViewport,
  /** Opening Button with expanded and content-control associations. */
  Trigger: DialogTrigger,
  /** Visual surface inside Viewport, or a native dialog when used standalone. */
  Content: DialogContent,
  /** Heading registered as part of the content accessible name. */
  Title: DialogTitle,
  /** Text registered as part of the content description. */
  Description: DialogDescription,
  /** Closing Button whose author handler may veto dismissal. */
  Close: DialogClose,
}
